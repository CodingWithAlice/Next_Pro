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
import dayjs from 'dayjs'

interface RoutineType {
	des: string
	type: string
}

interface TimeTotalByRoutineType {
	routine_type_id: number
	totalDuration: number // 因为使用了 SUM 聚合函数
	RoutineType?: RoutineType // 来自 include 的关联模型
}

interface MetricDataProps {
	name?: string
	current?: number
	lastMonth?: number
	threshold?: number[]
	annualTarget?: number
	unit?: 'string'
}

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
	const timeTotalByRoutineType = (await TimeModal.findAll({
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
		raw: true,
	})) as unknown as TimeTotalByRoutineType[]

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

const getLastSerialId = async (currentSerials: number[]) => {
	// 根据最小的周数，查询对应的上一周期
	const currentMonth = await MonthModal.findOne({
		where: {
			periods: {
				[Op.substring]: currentSerials[0] + '',
			},
		},
		attributes: ['id', 'periods'], // 只返回id字段
	})

	const currentMonthId = currentMonth?.get({ plain: true })?.id
	const lastMonthId =
		currentMonthId > 0 ? currentMonthId - 1 : +currentMonthId
	// 查询上个月信息
	const monthData = await MonthModal.findOne({
		where: { id: lastMonthId },
	})
	// 上个月的 周期
	const lastSerials: number[] = monthData
		?.get({ plain: true })
		?.periods.split(',')
		.map((it: string) => +it)
	return lastSerials
}

// 根据周期查询 - 每个周期环比数据
async function GetMetricDataCompareLastMonth(
	currentSerials: number[],
	// gapTime: number
) {
	// 上个月的周期 ids
	const lastSerials = await getLastSerialId(currentSerials)

	// 根据周期查询 - 每日时长总计【本月 + 上个月】
	const {
		timeTotalByRoutineType: currentTimeTotalByRoutineType,
		rawRecords: currentRawRecords,
	} = await GetTimeTotalByRoutineType(currentSerials)
	const {
		timeTotalByRoutineType: lastTimeTotalByRoutineType,
		rawRecords: lastRawRecords,
	} = await GetTimeTotalByRoutineType(lastSerials)

	// 核心数据的分配
	const frontTime = 25000
	const reviewTime = 15960
	const artTime = 1825
	const sportTime = 7800
	const hourUnit = '分钟'
	// const percentUnit = '%'
	// 获取健康阈值
	// const getThreshold = (arr: number[], origin: number) =>
		// arr.map((percent) => ((origin * gapTime / 26) * percent).toFixed(0))
	const metricType = [
		{
			metricDesc: '前端维度',
			type: [
				{
					desc: '学习专注时长',
					typeId: 13,
					annualTarget: frontTime,
					// threshold: getThreshold([0.8, 1], frontTime),
					unit: hourUnit,
				},
				{
					desc: 'LTN做题时长',
					typeId: 16,
					annualTarget: frontTime,
					// threshold: getThreshold([0.6, 1], frontTime),
					unit: hourUnit,
				},
				{
					desc: '复盘时长',
					typeId: 7,
					annualTarget: reviewTime,
					// threshold: getThreshold([0.9, 1], reviewTime),
					unit: hourUnit,
				},
				{ desc: '技术任务占比', typeId: 18 }, // todo
			],
		},
		{
			metricDesc: '健康维度',
			type: [
				{
					desc: 'TED观看时长',
					typeId: 4,
					annualTarget: artTime,
					// threshold: getThreshold([0.6, 1], artTime),
					unit: hourUnit,
				},
				{
					desc: '阅读时长',
					typeId: 8,
					annualTarget: artTime,
					// threshold: getThreshold([0.6, 1], artTime),
					unit: hourUnit,
				},
				{
					desc: '平均入睡时间',
					typeId: 10,
					target: 'startTime',
					annualTarget: 24,
				}, // todo
				{
					desc: '平均起床时间',
					typeId: 10,
					target: 'endTime',
					annualTarget: 8,
				}, // todo
				{
					desc: '运动时长',
					typeId: 17,
					annualTarget: sportTime,
					// threshold: getThreshold([0.8, 1], sportTime),
					unit: hourUnit,
				},
			],
		},
	]

	const compareData: Record<string, MetricDataProps[]> = {}
	metricType.forEach(
		(it: {
			metricDesc: string
			type: { desc: string; typeId: number; target?: string }[]
		}) => {
			const currentType = it.type
			currentType.forEach(
				(item: { desc: string; typeId: number; target?: string }) => {
					const data: MetricDataProps = {}
					data.name = item.desc
					data.current = +(currentTimeTotalByRoutineType.find(
						(it: TimeTotalByRoutineType) =>
							+it?.routine_type_id === item.typeId
					)?.totalDuration || '')
					data.lastMonth = +(lastTimeTotalByRoutineType.find(
						(it: TimeTotalByRoutineType) =>
							+it?.routine_type_id === item.typeId
					)?.totalDuration || '')

					// 塞进结果里
					if (!compareData?.[it.metricDesc]) {
						compareData[it.metricDesc] = []
					}
					compareData[it.metricDesc].push({ ...item, ...data })
				}
			)
		}
	)

	return {
		currentSerials, // 当前月周期 ids
		lastSerials, // 上个月周期 ids
		currentTimeTotalByRoutineType, // 当前月周期不同类型时间长度统计
		currentRawRecords,
		lastTimeTotalByRoutineType, // 上个月周期不同类型时间长度统计
		lastRawRecords,
		compareData,
	}
}

// 将输入的周期号转换为排序后的周期号数组
function getSortedSerials(serialNumber: string) {
	return serialNumber
		.split(',')
		.map((it) => +it)
		.sort((a, b) => a - b)
}

async function GetMonthWeekInfosAndTimeTotals(serialNumber: string) {
	const serials = getSortedSerials(serialNumber)

	// 每周周报信息查询 - 查询多个周期
	const weekList = await GetWeekInfo(serials)

	// 计算当前周期的时长
	const startTime = weekList?.[0]?.startTime
	const endTime = weekList?.[0]?.endTime
	const gapTime = dayjs(endTime).diff(dayjs(startTime), 'day')
	// 根据周期查询 - 每个周期环比数据
	const result = await GetMetricDataCompareLastMonth(serials)
	const {
		currentTimeTotalByRoutineType,
		currentRawRecords,
		compareData: metricData,
	} = result || {}
	return {
		weekList,
		currentTimeTotalByRoutineType,
		currentRawRecords,
		metricData,
		gapTime,
	}
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
		const result = await GetMonthWeekInfosAndTimeTotals(serialNumber)

		return NextResponse.json(result)
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export { GET }
