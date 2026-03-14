import { TimeModal, IssueModal, RoutineTypeModal } from 'db'
import { NextRequest, NextResponse } from 'next/server'
import { transOneDateToWhereOptions } from 'utils'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

async function POST(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		if (Array.isArray(body?.data)) {
			const rows = body.data.map((row: Record<string, unknown>) => ({ ...row, userId }))
			await TimeModal.bulkCreate(rows, {
				validate: true,
				updateOnDuplicate: [
					'userId',
					'routineTypeId',
					'startTime',
					'endTime',
					'duration',
					'weekday',
					'interval',
				],
			})
			return NextResponse.json({ success: true, message: '操作成功' })
		}
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
		return NextResponse.json({
			dailyData,
			routineData,
			IssueData: IssueList?.[0] || {},
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
