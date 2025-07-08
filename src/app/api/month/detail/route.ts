import { NextRequest, NextResponse } from 'next/server'
import {
	MonthModal,
	RoutineTypeModal,
	SerialAttributes,
	SerialModal,
	TimeModal,
} from 'db'
import { Op, Sequelize } from 'sequelize'
import { transTwoDateToWhereOptions } from 'utils'

// 每周周报信息查询 - 根据输入 serial 周期查询多个周期信息
async function GetWeekInfo(serials: number[]): Promise<SerialAttributes[]> {
	const serialsData = await SerialModal.findAll({
		where: {
			serialNumber: {
				[Op.or]: serials,
			},
		},
	})
	return serialsData.map((serial) => serial.get({ plain: true }))
}

async function GetTimeTotalByRoutineType(serials: number[]) {
	const { start, end } = await transSerialsToStartAndEnd(serials)
	if (!start || !end) {
		return { timeTotalByRoutineType: [], rawRecords: [] }
	}

	const startDate = start.get('startTime') as string | Date
	const endDate = end.get('endTime') as string | Date
	// 1. 获取分组聚合数据
	const timeTotalByRoutineType = await TimeModal.findAll({
		attributes: [
			'routine_type_id',
			[Sequelize.fn('SUM', Sequelize.col('duration')), 'totalDuration'], // 按照 routine_type_id 分组，计算 duration 总时长
		],
		where: transTwoDateToWhereOptions(startDate, endDate),
		group: ['routine_type_id'],
		include: {
			model: RoutineTypeModal,
			attributes: ['des', 'type'],
		},
	})

	// 2. 获取原始记录数据（热力图专用）
	const rawRecords = await TimeModal.findAll({
		attributes: [
			'date',
			'startTime',
			'duration',
			'routineTypeId',
			'endTime',
		],
		where: {
			[Op.and]: [
				transTwoDateToWhereOptions(startDate, endDate),
				{ routineTypeId: { [Op.not]: [14, 10] } },
			],
		},
		raw: true,
		include: {
			model: RoutineTypeModal,
			attributes: ['des', 'type'],
		},
	})
	return { timeTotalByRoutineType, rawRecords }
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

// 根据周期查询 - 每个周期环比数据
async function GetMetricDataCompareLastMonth(serials: number[]) {
	const currentSerials = serials
	// 根据最小的周数，查询对应的上一周期
	const currentMonth = await MonthModal.findOne({
		where: {
			periods: {
				[Op.substring]: serials[0] + '',
			},
		},
		attributes: ['id', 'periods'], // 只返回id字段
	})

    let lastSerials: number[] = []
    // 查得到就差，查不到就取
    const lastMonthId = currentMonth?.get({ plain: true })?.id - 1
	if (lastMonthId > 0) {
		const monthData = await MonthModal.findOne({
			where: { id: lastMonthId },
		})
        lastSerials = monthData?.get({ plain: true })?.periods.split(',').map((it: string) => +it)
	} else {
        const lastMonthData = await MonthModal.findOne({ order: ['id', 'periods'] })
        lastSerials = lastMonthData?.get({ plain: true })?.periods.split(',').map((it: string) => +it)
    }

	return { serials, currentMonth, currentSerials, lastSerials}
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
	const { timeTotalByRoutineType, rawRecords } =
		await GetTimeTotalByRoutineType(serials)

	// 根据周期查询 - 每个周期环比数据
	const metricData = GetMetricDataCompareLastMonth(serials)
	return { weekList, timeTotalByRoutineType, rawRecords, metricData }
}

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serialNumber')
		if (!serialNumber)
			return NextResponse.json(
				{ error: '缺少 serialNumber' },
				{ status: 500 }
			)
		const { weekList, timeTotalByRoutineType, rawRecords, metricData } =
			await GetMonthWeekInfosAndTimeTotals(serialNumber)

		return NextResponse.json({
			weekList,
			timeTotalByRoutineType,
			rawRecords,
			metricData,
		})
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export { GET }
