import { TimeModal, IssueModal, RoutineTypeModal } from 'db'
import { NextRequest, NextResponse } from 'next/server'
import { transOneDateToWhereOptions } from 'utils'

async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		if (Array.isArray(body?.data)) {
			// 以 data 批量插入
			await TimeModal.bulkCreate(body?.data, {
				validate: true,
				updateOnDuplicate: [
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
		const { searchParams } = request.nextUrl
		const date = searchParams.get('date')
		const options = date ? transOneDateToWhereOptions(date) : {}

		const dailyData = await TimeModal.findAll({ where: options })
		const routineData = await RoutineTypeModal.findAll()
		const IssueList = await IssueModal.findAll({ where: options })
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
	const { searchParams } = request.nextUrl
	const id = searchParams.get('id')
	if (id) {
		// 删除指定id的数据
		await TimeModal.destroy({
			where: {
				id,
			},
		})
	} else {
		// 清空表
		await TimeModal.destroy({
			truncate: true,
		})
	}
}

export { POST, GET }
