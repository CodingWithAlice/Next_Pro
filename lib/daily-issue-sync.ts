import { IssueModal } from 'db'
import { transOneDateToWhereOptions } from 'utils'
import { readTedRound, tedRoundPrefixFrom } from '@lib/ted-round'
import {
	type DailyIssueSnippet,
	mergeIssueField,
	removeIssueLine,
	toIssueDateKey,
} from '@lib/daily-issue-line'

async function loadIssue(userId: number, date: string) {
	const option = transOneDateToWhereOptions(date)
	return IssueModal.findOne({ where: { ...option, userId } })
}

async function dropSnippet(userId: number, date: string, snippet: DailyIssueSnippet) {
	const issue = await loadIssue(userId, date)
	if (!issue) return
	const current = String(issue.get(snippet.field) || '')
	const next = removeIssueLine(current, snippet.identity)
	if (!next.removed || next.text === current) return
	issue.set(snippet.field, next.text)
	await issue.save()
}

/**
 * 把入口里的一条记录写进对应日期的每日复盘。
 * 来源改了日期、栏目或标题时，先从旧位置删掉再写入新位置。
 * 失败只打日志，不打断入口本身的保存。
 */
export async function syncDailyIssueSnippet(opts: {
	userId: number
	date: unknown
	snippet: DailyIssueSnippet | null
	previous?: { date: unknown; snippet: DailyIssueSnippet | null } | null
}): Promise<boolean> {
	try {
		const nextDate = opts.snippet ? toIssueDateKey(opts.date) : null
		const prev = opts.previous
		const prevDate = prev?.snippet ? toIssueDateKey(prev.date) : null
		const sameSlot = Boolean(
			opts.snippet &&
			prev?.snippet &&
			nextDate &&
			prevDate === nextDate &&
			prev.snippet.field === opts.snippet.field &&
			prev.snippet.identity === opts.snippet.identity
		)

		if (prev?.snippet && prevDate && !sameSlot) {
			await dropSnippet(opts.userId, prevDate, prev.snippet)
		}

		if (!opts.snippet || !nextDate) return false

		const tedPrefix = opts.snippet.field === 'ted' ? tedRoundPrefixFrom(readTedRound()) : ''
		const issue = await loadIssue(opts.userId, nextDate)
		const current = issue ? String(issue.get(opts.snippet.field) || '') : ''
		const merged = mergeIssueField(current, opts.snippet, tedPrefix)
		if (!issue) {
			// 和日报保存一样写入 YYYY-MM-DD，查询用同一套日期范围。
			await IssueModal.create({
				userId: opts.userId,
				date: nextDate as unknown as Date,
				[opts.snippet.field]: merged,
			})
			return true
		}
		if (merged !== current) {
			issue.set(opts.snippet.field, merged)
			await issue.save()
		}
		return true
	} catch (error) {
		console.error('同步每日复盘失败:', error)
		return false
	}
}
