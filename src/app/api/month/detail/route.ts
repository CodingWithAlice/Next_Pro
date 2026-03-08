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
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

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

async function GetWeekInfo(serials: number[], userId: number): Promise<SerialAttributes[]> {
	const serialsData = await SerialModal.findAll({
		where: { userId, serialNumber: { [Op.in]: serials } },
	})
	return serialsData.map((serial) => serial.get({ plain: true }) as SerialAttributes)
}

async function GetSleepAvgTime(
	startDate: string | Date,
	endDate: string | Date,
	userId: number
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
			userId,
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

async function GetTimeTotalByRoutineType(serials: number[], userId: number) {
	const { start, end } = await transSerialsToStartAndEnd(serials, userId)
	if (!start || !end) {
		return { timeTotalByRoutineType: [], rawRecords: [] }
	}

	const startDate = start.get('startTime') as string | Date
	const endDate = end.get('endTime') as string | Date
	const whereTime = { ...transTwoDateToWhereOptions(startDate, endDate), userId }
	const timeTotalByRoutineType = (await TimeModal.findAll({
		attributes: [
			'routine_type_id',
			[Sequelize.fn('SUM', Sequelize.col('duration')), 'totalDuration'],
		],
		where: whereTime,
		group: ['routine_type_id'],
		include: { model: RoutineTypeModal, attributes: ['des', 'type'] },
		raw: true,
	})) as unknown as TimeTotalByRoutineType[]

	const rawRecords = await TimeModal.findAll({
		attributes: ['date', 'startTime', 'duration', 'routineTypeId', 'endTime'],
		where: {
			[Op.and]: [
				transTwoDateToWhereOptions(startDate, endDate),
				{ userId, routineTypeId: { [Op.not]: [14, 10] } },
			],
		},
		raw: true,
		include: { model: RoutineTypeModal, attributes: ['des', 'type'] },
	})

	const sleepTimes = await GetSleepAvgTime(startDate, endDate, userId)
	return { timeTotalByRoutineType, rawRecords, sleepTimes }
}

async function transSerialsToStartAndEnd(serials: number[], userId: number) {
	const serialData = await SerialModal.findAll({ where: { userId } })
	const start = serialData.find((it) => it.get('serialNumber') === serials[0])
	const end = serialData.find(
		(it) => it.get('serialNumber') === serials[serials.length - 1]
	)
	return { start, end }
}

const getLastSerialId = async (currentSerials: number[], userId: number) => {
	const whereBase = { userId }
	let currentMonth = await MonthModal.findOne({
		where: {
			...whereBase,
			periods: { [Op.substring]: currentSerials[0] + '' },
		},
		attributes: ['id', 'periods'],
	})

	const allMonths = await MonthModal.findAll({
		where: whereBase,
		attributes: ['id'],
		order: [['id', 'ASC']],
	})
	const ids = allMonths.map((m) => m.get('id'))
	const currentIdx = ids.indexOf(currentMonth?.get('id'))
	let lastMonthId = currentMonth?.get({ plain: true })?.id
	if (currentIdx > 0) {
		lastMonthId = ids[currentIdx - 1]
	}

	const monthData = await MonthModal.findOne({
		where: { ...whereBase, id: lastMonthId },
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

async function GetMetricDataCompareLastMonth(
	currentSerials: number[],
	currentGapTime: number,
	userId: number
) {
	const lastSerials = await getLastSerialId(currentSerials, userId)
	const { gapTime: lastGapTime } = await GetWeeListAndGapTime(lastSerials, userId)
	const {
		timeTotalByRoutineType: currentTimeTotalByRoutineType,
		rawRecords: currentRawRecords,
		sleepTimes: currentSleepTimes,
	} = await GetTimeTotalByRoutineType(currentSerials, userId)
	const {
		timeTotalByRoutineType: lastTimeTotalByRoutineType,
		rawRecords: lastRawRecords,
		sleepTimes: lastSleepTimes,
	} = await GetTimeTotalByRoutineType(lastSerials, userId)

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

async function GetWeeListAndGapTime(serials: number[], userId: number) {
	const weekList = await GetWeekInfo(serials, userId)
	const startTime = weekList?.[0]?.startTime
	const endTime = weekList?.[weekList?.length - 1]?.endTime
	const gapTime = dayjs(endTime).diff(dayjs(startTime), 'day')
	return { weekList, gapTime }
}

async function GetMonthWeekInfosAndTimeTotals(serialNumber: string, userId: number) {
	const serials = getSortedSerials(serialNumber)
	if (!serials?.length) return {}

	const { weekList, gapTime } = await GetWeeListAndGapTime(serials, userId)
	const result = await GetMetricDataCompareLastMonth(serials, gapTime, userId)
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
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serialNumber')
		if (!serialNumber)
			return NextResponse.json(
				{ error: '缺少 serialNumber' },
				{ status: 500 }
			)
		const result = await GetMonthWeekInfosAndTimeTotals(serialNumber, userId)

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
