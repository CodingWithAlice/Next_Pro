/** 每日复盘事项里，由入口记录回写的四栏。 */
export type DailyIssueField = 'sport' | 'video' | 'ted' | 'reading'

export interface DailyIssueSnippet {
	field: DailyIssueField
	/** 写入事项栏的一行 */
	line: string
	/** 同一条来源记录的稳定开头，用来替换而不是重复追加 */
	identity: string
}

function squash(value: unknown): string {
	if (value == null) return ''
	return String(value).replace(/[\r\n]+/g, ' / ').replace(/\s+/g, ' ').trim()
}

function formatQuantity(value: unknown): string | null {
	const n = typeof value === 'number' ? value : Number(value)
	if (!Number.isFinite(n)) return null
	return String(Math.round(n * 100) / 100)
}

/** 事项日期。字符串取前 10 位，Date 按本地日历日。 */
export function toIssueDateKey(value: unknown): string | null {
	if (value == null || value === '') return null
	if (typeof value === 'string') {
		const matched = value.trim().match(/^(\d{4}-\d{2}-\d{2})/)
		return matched ? matched[1] : null
	}
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		const month = String(value.getMonth() + 1).padStart(2, '0')
		const day = String(value.getDate()).padStart(2, '0')
		return `${value.getFullYear()}-${month}-${day}`
	}
	return null
}

export function withDailyIssueHint(message: string, synced: boolean, date: string | null): string {
	if (!synced || !date) return message
	return `${message}，已记入 ${date} 的每日复盘`
}

/**
 * 健身页一条记录 → 事项「运动情况」。
 * 项目和数字之间用中文冒号，避免隔天保存日报时被运动文本解析器当成新记录再写一遍。
 */
export function formatSportIssueLine(input: {
	type?: unknown
	value?: unknown
	category?: unknown
	subInfo?: unknown
	duration?: unknown
	notes?: unknown
}): DailyIssueSnippet | null {
	const category = squash(input.category)
	const quantity = formatQuantity(input.value)
	if (!category || quantity == null) return null

	let core = ''
	switch (input.type) {
		case 'running':
			core = `${category}：${quantity}km`
			break
		case 'resistance':
			core = `${category}：${quantity}kg`
			break
		case 'hiking':
			core = `${category}：${quantity}km`
			break
		case 'class':
			core = `${category}：${quantity}分钟`
			break
		default:
			return null
	}

	const extras: string[] = []
	const place = squash(input.subInfo)
	if (input.type === 'hiking' && place) extras.push(place)
	const duration = formatQuantity(input.duration)
	if (input.type !== 'class' && duration && Number(duration) > 0) {
		extras.push(`${duration}分钟`)
	}
	const notes = squash(input.notes)
	if (notes) extras.push(notes)

	return {
		field: 'sport',
		identity: core,
		line: extras.length ? `${core}，${extras.join('，')}` : core,
	}
}

/** 书/电影一条记录。阅读进「阅读情况」，其余进「电影」。没有类型或标题则不回写。 */
export function formatMediaIssueLine(tag: unknown, title: unknown, record: unknown): DailyIssueSnippet | null {
	const label = squash(tag)
	const name = squash(title)
	if (!label || !name) return null
	const detail = squash(record)
	if (label === '阅读') {
		const identity = `《${name}》`
		return {
			field: 'reading',
			identity,
			line: detail ? `${identity}：${detail}` : identity,
		}
	}
	const identity = `${label}《${name}》`
	return {
		field: 'video',
		identity,
		line: detail ? `${identity}：${detail}` : identity,
	}
}

/** TED 只回写「序号、标题」，不带回听后感。 */
export function formatTedIssueLine(id: unknown, title: unknown): DailyIssueSnippet | null {
	const tedId = typeof id === 'number' ? id : Number(id)
	const name = squash(title)
	if (!Number.isInteger(tedId) || tedId <= 0 || !name) return null
	const identity = `${tedId}、${name}`
	return {
		field: 'ted',
		identity,
		line: identity,
	}
}

function lineBody(line: string): string {
	return line.trim().replace(/^Round\d+\s*:\s*/, '')
}

export function lineMatchesIdentity(line: string, identity: string): boolean {
	if (!identity) return false
	const body = lineBody(line)
	return body === identity || body.startsWith(`${identity}：`) || body.startsWith(`${identity}，`) || body.startsWith(`${identity}（`)
}

function preserveRoundPrefix(line: string, block: string): string {
	const prefix = line.match(/^\s*Round\d+\s*:\s*/)
	return prefix ? `${prefix[0]}${block}` : block
}

/**
 * 把一行写入已有事项文本。
 * 同一 identity 替换整行；空栏或只有 Round 前缀时接在前缀后面；否则换行追加。
 */
export function mergeIssueField(existing: string, snippet: DailyIssueSnippet, tedPrefix = ''): string {
	const block = snippet.line.trim()
	if (!block || !snippet.identity) return existing || ''

	const raw = existing || ''
	const lines = raw.split('\n')
	const index = lines.findIndex((line) => lineMatchesIdentity(line, snippet.identity))
	if (index >= 0) {
		lines[index] = preserveRoundPrefix(lines[index], block)
		return lines.join('\n')
	}

	const trimmed = raw.trim()
	if (!trimmed) {
		const prefix = tedPrefix.trim()
		return prefix ? `${prefix} ${block}` : block
	}
	if (/^Round\d+\s*:\s*$/.test(trimmed)) {
		return `${trimmed.replace(/\s+$/, '')} ${block}`
	}
	if (trimmed.includes(block)) return raw
	return `${trimmed}\n${block}`
}

export function removeIssueLine(existing: string, identity: string): { text: string; removed: boolean } {
	const lines = (existing || '').split('\n')
	if (!identity) return { text: existing || '', removed: false }
	const kept = lines.filter((line) => !lineMatchesIdentity(line, identity))
	return {
		text: kept.join('\n').trim(),
		removed: kept.length !== lines.length,
	}
}
