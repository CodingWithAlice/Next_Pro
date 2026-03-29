import {
	type MonthTableWeekRow,
	periodCaption,
	aggregateLearningTasks,
	splitLearningTask,
} from '@lib/month-learning-aggregate'

export type { MonthTableWeekRow }
export { splitLearningTask, periodCaption, aggregateLearningTasks }

function sortWeeks(weeks: MonthTableWeekRow[]) {
	return [...weeks].sort((a, b) => a.serialNumber - b.serialNumber)
}

function joinPeriodBlocks(
	weeks: MonthTableWeekRow[],
	pick: (w: MonthTableWeekRow) => string,
	title: string
): string {
	const sorted = sortWeeks(weeks)
	const blocks: string[] = []
	for (const w of sorted) {
		const body = (pick(w) || '').trim()
		if (body) blocks.push(`${periodCaption(w)}\n${body}`)
	}
	if (!blocks.length) return ''
	return `${title}\n${'—'.repeat(28)}\n\n${blocks.join('\n\n')}`
}

/** 运动+睡眠+电影：按睡眠 / 运动 / 影视 分块汇总 */
export function aggregateSleepSportMovie(weeks: MonthTableWeekRow[]): string {
	const a = joinPeriodBlocks(weeks, (w) => w.sleep, '【睡眠与作息】')
	const b = joinPeriodBlocks(weeks, (w) => w.sport, '【运动】')
	const c = joinPeriodBlocks(weeks, (w) => w.movie, '【影视与娱乐】')
	const parts = [a, b, c].filter(Boolean)
	return parts.join('\n\n') || '（暂无运动/睡眠/影视记录）'
}

/** 仅运动 + 影视（规则合并），与 AI 睡眠块拼接成一列时使用 */
export function aggregateSportAndMovieOnly(weeks: MonthTableWeekRow[]): string {
	const b = joinPeriodBlocks(weeks, (w) => w.sport, '【运动】')
	const c = joinPeriodBlocks(weeks, (w) => w.movie, '【影视与娱乐】')
	return [b, c].filter(Boolean).join('\n\n')
}

/** TED + 阅读 */
export function aggregateTedRead(weeks: MonthTableWeekRow[]): string {
	const a = joinPeriodBlocks(weeks, (w) => w.ted, '【TED】')
	const b = joinPeriodBlocks(weeks, (w) => w.read, '【阅读】')
	const parts = [a, b].filter(Boolean)
	return parts.join('\n\n') || '（暂无 TED/阅读记录）'
}

/** 学习/工作方法复盘和改进 */
export function aggregateImproveMethods(weeks: MonthTableWeekRow[]): string {
	const sorted = sortWeeks(weeks)
	const blocks: string[] = []
	for (const w of sorted) {
		const body = (w.improveMethods || '').trim()
		if (body) blocks.push(`${periodCaption(w)}\n${body}`)
	}
	if (!blocks.length) return '（暂无复盘记录）'
	return `学习/工作方法复盘和改进（各周期汇总）\n${'—'.repeat(28)}\n\n${blocks.join('\n\n')}`
}

/** 生成合并后的单行数据源（不含「时间」列） */
export function buildAggregatedMonthRow(
	weeks: MonthTableWeekRow[],
	studyTotalMinutes: number
) {
	return {
		key: 'aggregated',
		frontOverview: aggregateLearningTasks(weeks),
		sleepSportMovie: aggregateSleepSportMovie(weeks),
		TEDRead: aggregateTedRead(weeks),
		idea: aggregateImproveMethods(weeks),
		studyTotalMinutes,
	}
}
