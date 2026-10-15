import { TimeModal, IssueModal, RoutineTypeModal, DayLogModal, sequelize } from 'db'
import { NextRequest, NextResponse } from 'next/server'
import { transOneDateToWhereOptions } from 'utils'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'
import { denyIfCapabilityOff } from '@lib/capabilities'
import { readTedRound, tedRoundPrefixFrom } from '@lib/ted-round'
import { deleteDayLogWhenArchived, ensureDayLogTable } from '@lib/day-log-db'
import { workWindowForDate } from '@lib/work-window'

async function POST(request: NextRequest) {
	try {
		const denied = await denyIfCapabilityOff(request)
		if (denied) return denied
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		if (!Array.isArray(body?.data)) {
			return NextResponse.json(
				{ success: false, message: '请求数据格式错误' },
				{ status: 400 }
			)
		}

		// 去掉 UI 字段 type / id：保存时 daySort 会重排，带 id 的 bulkCreate 会触发主键
		// ON DUPLICATE KEY UPDATE，覆盖掉同批次里无 id 新记录的写入（例如新增西班牙语）。
		const rows = body.data.map((row: Record<string, unknown>) => {
			const rest = { ...row }
			delete rest.id
			delete rest.type
			return { ...rest, userId }
		})

		const date = rows[0]?.date as string | undefined
		if (!date) {
			return NextResponse.json(
				{ success: false, message: '缺少 date 字段' },
				{ status: 400 }
			)
		}

		const dateWhere = transOneDateToWhereOptions(date)
		await sequelize.transaction(async (transaction) => {
			await TimeModal.destroy({
				where: { userId, ...dateWhere },
				transaction,
			})
			await TimeModal.bulkCreate(rows, { validate: true, transaction })
		})

		await deleteDayLogWhenArchived(userId, date).catch((error) => {
			console.error('删除当场记录失败:', error)
		})

		return NextResponse.json({ success: true, message: '操作成功' })
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{
				success: false,
				message: '操作失败',
				error: (error as Error).message,
			},
			{ status: 500 }
		)
	}
}

async function GET(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const { searchParams } = request.nextUrl
		const date = searchParams.get('date')
		const options = date ? transOneDateToWhereOptions(date) : {}
		const where = { ...options, userId }

		const dailyData = await TimeModal.findAll({ where })
		const routineData = await RoutineTypeModal.findAll({ where: { userId } })
		const IssueList = await IssueModal.findAll({ where })
		let dayLogs: unknown[] = []
		if (date) {
			await ensureDayLogTable()
			const rows = await DayLogModal.findAll({
				where: { userId, date },
				order: [['startedAt', 'ASC']],
			})
			dayLogs = rows.map((row) => row.get({ plain: true }))
		}
		return NextResponse.json({
			dailyData,
			routineData,
			IssueData: IssueList?.[0] || {},
			dayLogs,
			workWindow: date ? workWindowForDate(date) : null,
			// 轮次在请求时读 config.env。NEXT_PUBLIC_TED_ROUND 在 docker build 时就写进前端包，那时还没有挂载 config.env。
			tedPrefix: tedRoundPrefixFrom(readTedRound()),
			success: true,
			message: '操作成功',
		})
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{
				success: false,
				message: '操作失败',
				error: (error as Error).message,
			},
			{ status: 500 }
		)
	}
}

// 删除数据 - 该功能不导出，仅供内部使用
// eslint-disable-next-line
async function DELETE(request: NextRequest) {
	const userId = Number(getEffectiveUserIdFromRequest(request))
	const { searchParams } = request.nextUrl
	const id = searchParams.get('id')
	if (id) {
		await TimeModal.destroy({
			where: { id, userId },
		})
	} else {
		await TimeModal.destroy({
			where: { userId },
		})
	}
}

export { POST, GET }
