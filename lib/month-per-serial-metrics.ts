import {
	RoutineTypeModal,
	SerialAttributes,
	SerialModal,
	TimeModal,
} from 'db'
import { Op, Sequelize } from 'sequelize'
import { transTwoDateToWhereOptions } from 'utils'
import dayjs from 'dayjs'

export interface RoutineTypeLite {
	des: string
	type: string
}

export interface TimeTotalByRoutineTypeRow {
	routine_type_id: number
	totalDuration: number
	RoutineType?: RoutineTypeLite
}

interface TimeModalForSleep {
	routine_type_id: number
	startTime: string
	endTime: string
	duration: number
}

export type PerSerialMetricRow = {
	serialNumber: number
	startTime: string
	endTime: string
	gapDays: number
	routineTotals: { typeId: number; des: string; totalMinutes: number }[]
	sleepAvg: { startTime: string; endTime: string }
}

export async function GetWeekInfo(
	serials: number[],
	userId: number
): Promise<SerialAttributes[]> {
	if (!serials.length) return []
	const serialsData = await SerialModal.findAll({
		where: { userId, serialNumber: { [Op.in]: serials } },
	})
	const byNum = new Map(
		serialsData.map((serial) => {
			const p = serial.get({ plain: true }) as SerialAttributes
			return [p.serialNumber, p]
		})
	)
	return serials
		.map((sn) => byNum.get(sn))
		.filter((p): p is SerialAttributes => p !== undefined)
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

	function calculateCircularAverage(times: string[]) {
		if (!times.length) return '--:--'
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

	return {
		startTime: calculateCircularAverage(
			timeRecords.map((r) => r.startTime)
		),
		endTime: calculateCircularAverage(timeRecords.map((r) => r.endTime)),
	}
}

export async function GetTimeTotalByRoutineType(
	serials: number[],
	userId: number
) {
	const { start, end } = await transSerialsToStartAndEnd(serials, userId)
	if (!start || !end) {
		return {
			timeTotalByRoutineType: [] as TimeTotalByRoutineTypeRow[],
			rawRecords: [],
			sleepTimes: { startTime: '--:--', endTime: '--:--' },
		}
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
		include: {
			model: RoutineTypeModal,
			attributes: ['des', 'type'],
			where: { userId },
		},
		raw: true,
	})) as unknown as TimeTotalByRoutineTypeRow[]

	const rawRecords = await TimeModal.findAll({
		attributes: ['date', 'startTime', 'duration', 'routineTypeId', 'endTime'],
		where: {
			[Op.and]: [
				transTwoDateToWhereOptions(startDate, endDate),
				{ userId, routineTypeId: { [Op.not]: [14, 10] } },
			],
		},
		raw: true,
		include: {
			model: RoutineTypeModal,
			attributes: ['des', 'type'],
			where: { userId },
		},
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

export function getSortedSerials(serialNumber: string) {
	return serialNumber
		.split(',')
		.map((it) => +it)
		.filter((n) => !Number.isNaN(n))
		.sort((a, b) => a - b)
}

export async function GetWeeListAndGapTime(serials: number[], userId: number) {
	const weekList = await GetWeekInfo(serials, userId)
	const startTime = weekList?.[0]?.startTime
	const endTime = weekList?.[weekList?.length - 1]?.endTime
	const gapTime = dayjs(endTime).diff(dayjs(startTime), 'day')
	return { weekList, gapTime }
}

function rowDes(row: TimeTotalByRoutineTypeRow): string {
	const r = row as Record<string, unknown>
	return (
		row.RoutineType?.des ??
		(r['RoutineType.des'] as string) ??
		''
	)
}

export async function buildPerSerialMetrics(
	sortedSerials: number[],
	userId: number
): Promise<PerSerialMetricRow[]> {
	const result: PerSerialMetricRow[] = []
	for (const sn of sortedSerials) {
		const { weekList, gapTime } = await GetWeeListAndGapTime([sn], userId)
		const week = weekList[0]
		if (!week) continue
		const { timeTotalByRoutineType, sleepTimes } =
			await GetTimeTotalByRoutineType([sn], userId)
		const routineTotals = timeTotalByRoutineType.map((row) => ({
			typeId: Number(row.routine_type_id),
			des: rowDes(row),
			totalMinutes: Math.round(Number(row.totalDuration) || 0),
		}))
		result.push({
			serialNumber: sn,
			startTime: String(week.startTime),
			endTime: String(week.endTime),
			gapDays: gapTime,
			routineTotals,
			sleepAvg: sleepTimes,
		})
	}
	return result
}
