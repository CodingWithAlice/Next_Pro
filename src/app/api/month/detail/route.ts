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

interface TimeModalForSleep {
	routine_type_id: number
	startTime: string // 根据实际数据库类型定义
	endTime: string
	duration: number
}

interface MetricDataProps {
	name?: string
	current?: number | string
	lastMonth?: number | string
	threshold?: number[]
	annualTarget?: number
	unit?: 'string'
}

interface MetricTypeProps {
	metricDesc: string
	type: { desc: string; typeId: number; target?: string }[]
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

// 睡眠的 起始时间 在周期中的平均值
async function GetSleepAvgTime(
	startDate: string | Date,
	endDate: string | Date
) {
	const timeRecords = (await TimeModal.findAll({
		attributes: [
			'routine_type_id',
			[
				Sequelize.fn(
					'TIME_FORMAT',
					Sequelize.col('start_time'),
					'%H:%i'
				),
				'startTime',
			],
			[
				Sequelize.fn('TIME_FORMAT', Sequelize.col('end_time'), '%H:%i'),
				'endTime',
			],
		],
		where: {
			...transTwoDateToWhereOptions(startDate, endDate),
			routine_type_id: 10,
		},
		raw: true,
	})) as unknown as TimeModalForSleep[]

	// 圆形平均时间计算函数
	function calculateCircularAverage(times: string[]) {
		const totalMinutes = times.map((time) => {
			const [h, m] = time.split(':').map(Number)
			return h * 60 + m
		})

		const radians = totalMinutes.map((m) => (m / 1440) * 2 * Math.PI)

		const avgSin =
			radians.reduce((sum, r) => sum + Math.sin(r), 0) / radians.length
		const avgCos =
			radians.reduce((sum, r) => sum + Math.cos(r), 0) / radians.length

		let angle = Math.atan2(avgSin, avgCos)
		if (angle < 0) angle += 2 * Math.PI

		const avgMinutes = Math.round((angle / (2 * Math.PI)) * 1440) % 1440
		return `${String(Math.floor(avgMinutes / 60)).padStart(
			2,
			'0'
		)}:${String(avgMinutes % 60).padStart(2, '0')}`
	}

	// 计算并汇总结果
	const result = {
		startTime: calculateCircularAverage(
			timeRecords.map((r) => r.startTime)
		),
		endTime: calculateCircularAverage(timeRecords.map((r) => r.endTime)),
	}
	return result
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

	// 睡眠时间关注 入睡时间、起床时间
	const sleepTimes = await GetSleepAvgTime(startDate, endDate)
	return { timeTotalByRoutineType, rawRecords, sleepTimes }
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

// 拼接核心数据的需要数据
function GetMetricStatic() {
	// 核心数据的分配
	const frontTime = 25000 / 365
	const reviewTime = 15960 / 365
	const artTime = 1825 / 365
	const sportTime = 7800 / 365
	const hourUnit = '分钟/天'
	// const percentUnit = '%'
	return [
		{
			metricDesc: '前端维度',
			type: [
				{
					desc: '学习专注时长',
					typeId: 13,
					annualTarget: frontTime,
					unit: hourUnit,
				},
				{
					desc: 'LTN做题时长',
					typeId: 16,
					annualTarget: frontTime,
					unit: hourUnit,
				},
				{
					desc: '复盘时长',
					typeId: 7,
					annualTarget: reviewTime,
					unit: hourUnit,
				},
				// { desc: '技术任务占比', typeId: 18 }, // todo
			],
		},
		{
			metricDesc: '健康维度',
			type: [
				{
					desc: 'TED观看时长',
					typeId: 4,
					annualTarget: artTime,
					unit: hourUnit,
				},
				{
					desc: '阅读时长',
					typeId: 8,
					annualTarget: artTime,
					unit: hourUnit,
				},
				{
					desc: '平均入睡时间',
					typeId: 10,
					type: 'sleep',
					target: 'startTime',
					annualTarget: '24:00',
				},
				{
					desc: '平均起床时间',
					typeId: 10,
					type: 'sleep',
					target: 'endTime',
					annualTarget: '07:30',
				},
				{
					desc: '运动时长',
					typeId: 17,
					annualTarget: sportTime,
					unit: hourUnit,
				},
			],
		},
	]
}

async function CalcMetricFromTwoSerials({
	metricType,
	currentData,
	currentSleep,
	currentGapTime,
	lastData,
	lastGapTime,
	lastSleep,
}: {
	metricType: MetricTypeProps[]
	currentData: TimeTotalByRoutineType[]
	lastData: TimeTotalByRoutineType[]
	currentGapTime: number
	lastGapTime: number
	currentSleep?: { [key: string]: string; startTime: string; endTime: string }
	lastSleep?: { [key: string]: string; startTime: string; endTime: string }
}) {
	const compareData: Record<string, MetricDataProps[]> = {}

	// 遍历配置 - 组装数据
	metricType.forEach((it: MetricTypeProps) => {
		const currentType = it.type
		currentType.forEach(
			(item: {
				desc: string
				typeId: number
				target?: string
				type?: 'sleep'
			}) => {
				const data: MetricDataProps = {}
				data.name = item.desc
				data.current =
					+(
						currentData.find(
							(it: TimeTotalByRoutineType) =>
								+it?.routine_type_id === item.typeId
						)?.totalDuration || ''
					) / currentGapTime
				data.lastMonth =
					+(
						lastData.find(
							(it: TimeTotalByRoutineType) =>
								+it?.routine_type_id === item.typeId
						)?.totalDuration || ''
					) / lastGapTime

				if (item.type === 'sleep' && item?.target && currentSleep) {
					data.current = currentSleep?.[item.target]
					data.lastMonth = lastSleep?.[item.target]
				}

				// 塞进结果里
				if (!compareData?.[it.metricDesc]) {
					compareData[it.metricDesc] = []
				}
				compareData[it.metricDesc].push({ ...item, ...data })
			}
		)
	})
	return compareData
}

// 根据周期查询 - 每个周期环比数据
async function GetMetricDataCompareLastMonth(
	currentSerials: number[],
	currentGapTime: number
) {
	// 1、上个月的周期 ids
	const lastSerials = await getLastSerialId(currentSerials)
	const { gapTime: lastGapTime } = await GetWeeListAndGapTime(lastSerials)

	// 2、根据周期查询每周数据 - 每日时长总计【用于环比计算】
	const {
		timeTotalByRoutineType: currentTimeTotalByRoutineType,
		rawRecords: currentRawRecords,
		sleepTimes: currentSleepTimes,
	} = await GetTimeTotalByRoutineType(currentSerials)
	const {
		timeTotalByRoutineType: lastTimeTotalByRoutineType,
		rawRecords: lastRawRecords,
		sleepTimes: lastSleepTimes,
	} = await GetTimeTotalByRoutineType(lastSerials)

	// 3、组装核心数据需要的结构
	const metricType = GetMetricStatic()

	// 4、计算环比数据
	const compareData = await CalcMetricFromTwoSerials({
		metricType,
		currentData: currentTimeTotalByRoutineType,
		currentSleep: currentSleepTimes,
		currentGapTime,
		lastData: lastTimeTotalByRoutineType,
		lastGapTime,
		lastSleep: lastSleepTimes,
	})

	return {
		currentSerials, // 当前月周期 ids
		currentTimeTotalByRoutineType, // 当前月周期不同类型时间长度统计
		currentRawRecords,
		currentSleepTimes, // 当前月睡眠时间
		lastSerials,
		lastTimeTotalByRoutineType,
		lastRawRecords,
		lastSleepTimes,
		compareData, // 环比数据
	}
}

// 将输入的周期号转换为排序后的周期号数组
function getSortedSerials(serialNumber: string) {
	return serialNumber
		.split(',')
		.map((it) => +it)
		.sort((a, b) => a - b)
}

async function GetWeeListAndGapTime(serials: number[]) {
	// 每周周报信息查询 - 查询多个周期
	const weekList = await GetWeekInfo(serials)

	// 计算当前周期的时长
	const startTime = weekList?.[0]?.startTime
	const endTime = weekList?.[0]?.endTime
	const gapTime = dayjs(endTime).diff(dayjs(startTime), 'day')
	return { weekList, gapTime }
}

async function GetMonthWeekInfosAndTimeTotals(serialNumber: string) {
	const serials = getSortedSerials(serialNumber)

	const { weekList, gapTime } = await GetWeeListAndGapTime(serials)

	// 根据周期查询 - 每个周期环比数据
	const result = await GetMetricDataCompareLastMonth(serials, gapTime)
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
