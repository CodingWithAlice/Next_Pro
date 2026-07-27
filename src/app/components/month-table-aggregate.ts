import type { PerSerialMetricRow } from '@lib/month-per-serial-metrics'
import type { SerialTimeRange } from '@lib/serial-display'
import {
	type MonthTableWeekRow,
	periodCaption,
	aggregateLearningTasks,
	splitLearningTask,
	aggregateImproveMethodsLastOnly,
	type LtnMetricSummary,
} from '@lib/month-learning-aggregate'

export type { MonthTableWeekRow }
export { splitLearningTask, periodCaption, aggregateLearningTasks }

function ltnMinutesFromRow(m: PerSerialMetricRow): number {
	return m.routineTotals.find((t) => t.typeId === 16)?.totalMinutes ?? 0
}

export function toLtnMetricSummaries(
	metrics?: PerSerialMetricRow[]
): LtnMetricSummary[] | undefined {
	if (!metrics?.length) return undefined
	return metrics.map((m) => ({
		serialNumber: m.serialNumber,
		startTime: m.startTime,
		endTime: m.endTime,
		ltnMinutes: ltnMinutesFromRow(m),
		ltnTopicCount: m.ltnTopicCount ?? 0,
	}))
}

function sortWeeks(weeks: MonthTableWeekRow[]) {
	return [...weeks].sort((a, b) => a.serialNumber - b.serialNumber)
}

function joinPeriodBlocks(
	weeks: MonthTableWeekRow[],
	pick: (w: MonthTableWeekRow) => string,
	title: string,
	catalog?: SerialTimeRange[]
): string {
	const sorted = sortWeeks(weeks)
	const blocks: string[] = []
	for (const w of sorted) {
		const body = (pick(w) || '').trim()
		if (body) blocks.push(`${periodCaption(w, catalog)}\n${body}`)
	}
	if (!blocks.length) return ''
	return `${title}\n${'—'.repeat(28)}\n\n${blocks.join('\n\n')}`
}

/** 运动+睡眠+电影：按睡眠 / 运动 / 影视 分块汇总 */
export function aggregateSleepSportMovie(
	weeks: MonthTableWeekRow[],
	catalog?: SerialTimeRange[]
): string {
	const a = joinPeriodBlocks(weeks, (w) => w.sleep, '【睡眠与作息】', catalog)
	const b = joinPeriodBlocks(weeks, (w) => w.sport, '【运动】', catalog)
	const c = joinPeriodBlocks(weeks, (w) => w.movie, '【影视与娱乐】', catalog)
	const parts = [a, b, c].filter(Boolean)
	return parts.join('\n\n') || '（暂无运动/睡眠/影视记录）'
}

/** 仅运动 + 影视（规则合并），与 AI 睡眠块拼接成一列时使用 */
export function aggregateSportAndMovieOnly(
	weeks: MonthTableWeekRow[],
	catalog?: SerialTimeRange[]
): string {
	const b = joinPeriodBlocks(weeks, (w) => w.sport, '【运动】', catalog)
	const c = joinPeriodBlocks(weeks, (w) => w.movie, '【影视与娱乐】', catalog)
	return [b, c].filter(Boolean).join('\n\n')
}

/** TED + 阅读 */
export function aggregateTedRead(
	weeks: MonthTableWeekRow[],
	catalog?: SerialTimeRange[]
): string {
	const a = joinPeriodBlocks(weeks, (w) => w.ted, '【TED】', catalog)
	const b = joinPeriodBlocks(weeks, (w) => w.read, '【阅读】', catalog)
	const parts = [a, b].filter(Boolean)
	return parts.join('\n\n') || '（暂无 TED/阅读记录）'
}

/** 学习/工作方法复盘和改进：仅保留最后一周期 */
export function aggregateImproveMethods(
	weeks: MonthTableWeekRow[],
	catalog?: SerialTimeRange[]
): string {
	return aggregateImproveMethodsLastOnly(weeks, catalog)
}

/** 生成合并后的单行数据源（不含「时间」列） */
export function buildAggregatedMonthRow(
	weeks: MonthTableWeekRow[],
	studyTotalMinutes: number,
	perSerialMetrics?: PerSerialMetricRow[],
	catalog?: SerialTimeRange[]
) {
	return {
		key: 'aggregated',
		frontOverview: aggregateLearningTasks(
			weeks,
			toLtnMetricSummaries(perSerialMetrics),
			catalog
		),
		sleepSportMovie: aggregateSleepSportMovie(weeks, catalog),
		TEDRead: aggregateTedRead(weeks, catalog),
		idea: aggregateImproveMethods(weeks, catalog),
		studyTotalMinutes,
	}
}
