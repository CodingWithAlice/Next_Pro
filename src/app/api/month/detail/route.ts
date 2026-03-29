import { NextRequest, NextResponse } from 'next/server'
import { MonthModal, SerialModal } from 'db'
import { Op } from 'sequelize'
import dayjs from 'dayjs'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'
import {
	buildPerSerialMetrics,
	getSortedSerials,
	GetTimeTotalByRoutineType,
	GetWeeListAndGapTime,
	type TimeTotalByRoutineTypeRow,
} from '@lib/month-per-serial-metrics'

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

const getLastSerialId = async (currentSerials: number[], userId: number) => {
	const whereBase = { userId }
	const currentMonth = await MonthModal.findOne({
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
	const raw = monthData?.get({ plain: true })?.periods
	const lastSerials: number[] = raw
		? raw.split(',').map((it: string) => +it)
		: []
	return lastSerials
}

function GetMetricStatic() {
	const frontTime = 25000 / 365
	const reviewTime = 15960 / 365
	const artTime = 1825 / 365
	const sportTime = 7800 / 365
	const hourUnit = '分钟/天'
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
	currentData: TimeTotalByRoutineTypeRow[]
	lastData: TimeTotalByRoutineTypeRow[]
	currentGapTime: number
	lastGapTime: number
	currentSleep?: { [key: string]: string; startTime: string; endTime: string }
	lastSleep?: { [key: string]: string; startTime: string; endTime: string }
}) {
	const compareData: Record<string, MetricDataProps[]> = {}

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
							(r: TimeTotalByRoutineTypeRow) =>
								+r?.routine_type_id === item.typeId
						)?.totalDuration || ''
					) / currentGapTime
				data.lastMonth =
					+(
						lastData.find(
							(r: TimeTotalByRoutineTypeRow) =>
								+r?.routine_type_id === item.typeId
						)?.totalDuration || ''
					) / lastGapTime

				if (item.type === 'sleep' && item?.target && currentSleep) {
					data.current = currentSleep?.[item.target]
					data.lastMonth = lastSleep?.[item.target]
				}

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

	const metricType = GetMetricStatic()

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
		currentSerials,
		currentTimeTotalByRoutineType,
		currentRawRecords,
		currentSleepTimes,
		lastSerials,
		lastTimeTotalByRoutineType,
		lastRawRecords,
		lastSleepTimes,
		compareData,
	}
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

	const perSerialMetrics = await buildPerSerialMetrics(serials, userId)

	return {
		weekList,
		currentTimeTotalByRoutineType,
		currentRawRecords,
		metricData,
		gapTime,
		perSerialMetrics,
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
