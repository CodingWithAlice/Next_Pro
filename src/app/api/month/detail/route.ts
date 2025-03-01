import { NextRequest, NextResponse } from 'next/server'
import { RoutineTypeModal, SerialAttributes, SerialModal, TimeModal } from 'db'
import { Op, Sequelize } from 'sequelize'
import { transTwoDateToWhereOptions } from 'utils'

// 每周周报信息查询 - 根据输入 serial 周期查询多个周期信息
export async function GetWeekInfo(serials: number[]): Promise<SerialAttributes[]> {
	const serialsData = await SerialModal.findAll({
		where: {
			serialNumber: {
				[Op.or]: serials,
			},
		},
	})
	return serialsData.map(serial => serial.get({ plain: true }))
}

export async function GetTimeTotalByRoutineType(serials: number[]) {
	const { start, end } = await transSerialsToStartAndEnd(serials)
	if (!start || !end) {
		return []
	}
	return await TimeModal.findAll({
		attributes: [
			'routine_type_id',
			[Sequelize.fn('SUM', Sequelize.col('duration')), 'totalDuration'], // 按照 routine_type_id 分组，计算 duration 总时长
		],
		where: transTwoDateToWhereOptions(
			start.get('startTime') as string | Date,
			end.get('endTime') as string | Date
		),
		group: ['routine_type_id'],
		include: {
			model: RoutineTypeModal,
			attributes: ['des', 'type'],
		},
	})
}

// 每个周期的时长信息查询 - 查询起始时间
async function transSerialsToStartAndEnd(serials: number[]) {
	const serialData = await SerialModal.findAll()

	// 当前月报周期的起始时间
	const start = serialData.find((it) => it.get('serialNumber') === serials[0])
	const end = serialData.find(
		(it) => it.get('serialNumber') === serials[serials.length - 1]
	)
	return { start, end }
}

// 将输入的周期号转换为排序后的周期号数组
function getSortedSerials(serialNumber: string) {
	return serialNumber
		.split(',')
		.map((it) => +it)
		.sort((a, b) => a - b)
}

export async function GetMonthWeekInfosAndTimeTotals(serialNumber: string) {
	const serials = getSortedSerials(serialNumber)

	// 每周周报信息查询 - 查询多个周期
	const weekList = await GetWeekInfo(serials)

	// 根据周期查询 - 每日时长总计
	const timeTotalByRoutineType = await GetTimeTotalByRoutineType(serials)    
	return { weekList, timeTotalByRoutineType }
}

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serialNumber')
		if (!serialNumber) return NextResponse.json(
			{ error: '缺少 serialNumber' },
			{ status: 500 }
		)
		const { weekList, timeTotalByRoutineType } =
			await GetMonthWeekInfosAndTimeTotals(serialNumber)

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
