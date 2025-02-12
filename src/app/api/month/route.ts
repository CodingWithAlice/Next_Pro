import { NextRequest, NextResponse } from 'next/server'
import { RoutineTypeModal, SerialModal, TimeModal } from 'db'
import { Op, Sequelize } from 'sequelize'
import { transTwoDateToWhereOptions } from 'utils'

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serialNumber')
		if (!serialNumber) return
		const serials = serialNumber
			.split(',')
			.map((it) => +it)
			.sort((a, b) => a - b)

		// 每周周报信息查询 - 查询多个周期
		const weekList = await SerialModal.findAll({
			where: {
				serialNumber: {
					[Op.or]: serials,
				},
			},
		})
		// 每个周期的时长信息查询 - 查询起始时间
		const serialData = await SerialModal.findAll()

		// 当前月报周期的起始时间
		const start = serialData.find(
			(it) => it.get('serialNumber') === serials[0]
		)
		const end = serialData.find(
			(it) => it.get('serialNumber') === serials[serials.length - 1]
		)
		// 根据周期查询 - 每日时长总计
		let timeTotalByRoutineType
		if (start && end) {
			timeTotalByRoutineType = await TimeModal.findAll({
				attributes: [
					'routine_type_id',
					[
						Sequelize.fn('SUM', Sequelize.col('duration')),
						'totalDuration',
					], // 按照 routine_type_id 分组，计算 duration 总时长
				],
				where: transTwoDateToWhereOptions(
					start.get('startTime') as string | Date,
					end.get('endTime') as string | Date
				),
				group: ['routine_type_id'],
                include: {
                    model: RoutineTypeModal,
                    attributes: ['des', 'type'],
                }
			})
		}

		return NextResponse.json({ weekList, timeTotalByRoutineType })
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export { GET }
