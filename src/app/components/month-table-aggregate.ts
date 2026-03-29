import { formatSerialNumber, getGapTime } from './tool'

/** 与月报 weekList 单项一致，单独声明避免与 month-detail-textarea 循环依赖 */
export type MonthTableWeekRow = {
	serialNumber: number
	startTime: string
	endTime: string
	frontOverview: string
	sleep: string
	sport: string
	movie: string
	ted: string
	read: string
	improveMethods: string
	id: number
}

/** 单行周期标签，用于合并视图下标注来源 */
export function periodCaption(it: MonthTableWeekRow): string {
	const sn = `LTN ${formatSerialNumber(it.serialNumber)}`
	const st = it.startTime.slice(5, 10)
	const en = it.endTime.slice(5, 10)
	const days = getGapTime(it.startTime, it.endTime)
	return `【${sn} · ${st}～${en} · ${days}天】`
}

function sortWeeks(weeks: MonthTableWeekRow[]) {
	return [...weeks].sort((a, b) => a.serialNumber - b.serialNumber)
}

/**
 * 将「学习任务」正文拆成：学习体验、工作·技术向、工作·非技术向。
 * 以「二、工作体验」「非技术方向」为锚点；缺失时整段归入学习体验。
 */
export function splitLearningTask(frontOverview: string): {
	study: string
	tech: string
	nonTech: string
} {
	const t = (frontOverview || '').trim()
	if (!t) return { study: '', tech: '', nonTech: '' }

	const w2 = '二、工作体验'
	const w2Idx = t.indexOf(w2)
	if (w2Idx === -1) {
		return { study: t, tech: '', nonTech: '' }
	}

	const study = t.slice(0, w2Idx).trim()
	const work = t.slice(w2Idx).trim()

	const nt = '非技术方向'
	const ntIdx = work.indexOf(nt)
	if (ntIdx === -1) {
		return { study, tech: work, nonTech: '' }
	}

	const tech = work.slice(0, ntIdx).trim()
	const nonTech = work.slice(ntIdx).trim()
	return { study, tech, nonTech }
}

/** 合并各周期学习任务，按「学习体验 / 技术 / 非技术」三块纵向罗列 */
export function aggregateLearningTasks(weeks: MonthTableWeekRow[]): string {
	const sorted = sortWeeks(weeks)
	const studyBlocks: string[] = []
	const techBlocks: string[] = []
	const nonTechBlocks: string[] = []

	for (const w of sorted) {
		const { study, tech, nonTech } = splitLearningTask(w.frontOverview || '')
		const cap = periodCaption(w)
		if (study) studyBlocks.push(`${cap}\n${study}`)
		if (tech) techBlocks.push(`${cap}\n${tech}`)
		if (nonTech) nonTechBlocks.push(`${cap}\n${nonTech}`)
	}

	const parts: string[] = []
	if (studyBlocks.length) {
		parts.push(
			`一、学习体验（各周期汇总）\n${'—'.repeat(28)}\n\n${studyBlocks.join('\n\n')}`
		)
	}
	if (techBlocks.length) {
		parts.push(
			`二、工作体验 · 技术方向（各周期汇总）\n${'—'.repeat(28)}\n\n${techBlocks.join('\n\n')}`
		)
	}
	if (nonTechBlocks.length) {
		parts.push(
			`二、工作体验 · 非技术方向（各周期汇总）\n${'—'.repeat(28)}\n\n${nonTechBlocks.join('\n\n')}`
		)
	}

	return parts.join('\n\n') || '（暂无学习任务正文）'
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

/** 仅运动 + 影视（规则合并），与 AI 睡眠块拼接时使用 */
export function aggregateSportAndMovieOnly(weeks: MonthTableWeekRow[]): string {
	const b = joinPeriodBlocks(weeks, (w) => w.sport, '【运动】')
	const c = joinPeriodBlocks(weeks, (w) => w.movie, '【影视与娱乐】')
	return [b, c].filter(Boolean).join('\n\n')
}

/** 仅运动 + 影视（规则合并），与 AI 睡眠块拼接成一列时使用 */
export function aggregateSportAndMovieOnly(weeks: MonthTableWeekRow[]): string {
	const b = joinPeriodBlocks(weeks, (w) => w.sport, '【运动】')
	const c = joinPeriodBlocks(weeks, (w) => w.movie, '【影视与娱乐】')
	const parts = [b, c].filter(Boolean)
	return parts.join('\n\n') || ''
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
