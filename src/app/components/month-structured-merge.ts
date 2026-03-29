import {
	aggregateSportAndMovieOnly,
	type MonthTableWeekRow,
} from './month-table-aggregate'

/** AI 仅做汇聚集合（并列、归类、去重完全重复项），不做总结；运动/影视/TED 为规则合并 */
export type MonthStructuredMerge = {
	learning_task_merged: string
	sleep_objective_merged: string
	sleep_awareness_merged: string
	improve_methods_merged: string
}

export function formatSleepSportMovieColumn(
	ai: MonthStructuredMerge,
	weeks: MonthTableWeekRow[]
): string {
	const parts: string[] = []
	if (ai.sleep_objective_merged?.trim()) {
		parts.push(
			`【睡眠 · 客观数据（入睡/时长/起床等）】\n${ai.sleep_objective_merged.trim()}`
		)
	}
	if (ai.sleep_awareness_merged?.trim()) {
		parts.push(
			`【睡眠 · 提高质量与意识调整】\n${ai.sleep_awareness_merged.trim()}`
		)
	}
	const sportMovie = aggregateSportAndMovieOnly(weeks)
	if (sportMovie) {
		parts.push(sportMovie)
	}
	return parts.join('\n\n') || '（本列为空）'
}
