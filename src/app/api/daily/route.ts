import { DailyModal } from 'db'
import { NextRequest, NextResponse } from 'next/server'

async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		if (Array.isArray(body?.data)) {
			// 以 data 批量插入
			await DailyModal.bulkCreate(body?.data, {
				updateOnDuplicate: [
					'routineTypeId',
					'startTime',
					'endTime',
					'duration',
					'weekday',
					'interval',
				],
			})
			return NextResponse.json({ success: true })
		}
	} catch (e) {
		console.error(e)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
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
		await DailyModal.destroy({
			where: {
				id,
			},
		})
	} else {
		// 清空表
		await DailyModal.destroy({
			truncate: true,
		})
	}
}

export { POST }
