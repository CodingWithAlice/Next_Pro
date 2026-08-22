import dayjs from 'dayjs'

/** 周期时间范围（展示用，不改存储） */
export type SerialTimeRange = {
	serialNumber: number
	startTime: string | Date
	endTime: string | Date
}

export type SerialDisplayMeta = {
	serialNumber: number
	belongYear: number
	/** 归属年内第几个周期（1-based） */
	yearIndex: number
	startTime: string
	endTime: string
	/** 含首尾的天数 */
	days: number
}

function toDateStr(v: string | Date): string {
	return dayjs(v).format('YYYY-MM-DD')
}

/** 周期与某自然年的重叠天数（含首尾） */
export function countInclusiveDaysInYear(
	startTime: string | Date,
	endTime: string | Date,
	year: number
): number {
	const start = dayjs(toDateStr(startTime))
	const end = dayjs(toDateStr(endTime))
	if (end.isBefore(start, 'day')) return 0
	const yStart = dayjs(`${year}-01-01`)
	const yEnd = dayjs(`${year}-12-31`)
	const a = start.isAfter(yStart, 'day') ? start : yStart
	const b = end.isBefore(yEnd, 'day') ? end : yEnd
	if (b.isBefore(a, 'day')) return 0
	return b.diff(a, 'day') + 1
}

/**
 * 归属年：跨年时按重叠天数多的那年；平局按 startTime 年份。
 */
export function getSerialBelongYear(
	startTime: string | Date,
	endTime: string | Date
): number {
	const startStr = toDateStr(startTime)
	const endStr = toDateStr(endTime)
	const start = dayjs(startStr)
	const end = dayjs(endStr)
	const y0 = start.year()
	const y1 = end.year()
	if (y0 === y1) return y0

	let bestYear = y0
	let bestDays = -1
	for (let y = y0; y <= y1; y++) {
		const d = countInclusiveDaysInYear(startStr, endStr, y)
		if (d > bestDays) {
			bestDays = d
			bestYear = y
		} else if (d === bestDays) {
			bestYear = y0
		}
	}
	return bestYear
}

/** 用全量周期表构建 serialNumber → 展示元数据 */
export function buildSerialDisplayCatalog(
	all: SerialTimeRange[]
): Map<number, SerialDisplayMeta> {
	const metas: Omit<SerialDisplayMeta, 'yearIndex'>[] = all.map((s) => {
		const startTime = toDateStr(s.startTime)
		const endTime = toDateStr(s.endTime)
		return {
			serialNumber: +s.serialNumber,
			belongYear: getSerialBelongYear(startTime, endTime),
			startTime,
			endTime,
			days: dayjs(endTime).diff(dayjs(startTime), 'day') + 1,
		}
	})

	const byYear = new Map<number, typeof metas>()
	for (const m of metas) {
		const list = byYear.get(m.belongYear) ?? []
		list.push(m)
		byYear.set(m.belongYear, list)
	}

	const map = new Map<number, SerialDisplayMeta>()
	for (const list of byYear.values()) {
		list.sort((a, b) => a.serialNumber - b.serialNumber)
		list.forEach((m, i) => {
			map.set(m.serialNumber, { ...m, yearIndex: i + 1 })
		})
	}
	return map
}

export function resolveSerialMeta(
	serial: SerialTimeRange,
	catalog?: SerialTimeRange[] | Map<number, SerialDisplayMeta>
): SerialDisplayMeta {
	const map =
		catalog instanceof Map
			? catalog
			: buildSerialDisplayCatalog(
					catalog?.length ? catalog : [serial]
				)
	const hit = map.get(+serial.serialNumber)
	if (hit) return hit
	return buildSerialDisplayCatalog([serial]).get(+serial.serialNumber)!
}

/** 月日紧凑：6.26（去前导零） */
export function formatCompactMd(ymd: string | Date): string {
	const parts = toDateStr(ymd).split('-')
	return `${+parts[1]}.${+parts[2]}`
}

/** 选择器主文案：NO.13[6.26-7.10]（年内序号） */
export function formatSerialPickerLabel(meta: SerialDisplayMeta): string {
	return `NO.${meta.yearIndex}[${formatCompactMd(meta.startTime)}-${formatCompactMd(meta.endTime)}]`
}

/**
 * 按归属年分组，保留传入顺序（通常新→旧），
 * 供选择器用灰色年份作分组标题。
 */
export function groupSerialsByBelongYear(
	serials: SerialTimeRange[],
	catalog: Map<number, SerialDisplayMeta>
): { year: number; items: SerialDisplayMeta[] }[] {
	const groups: { year: number; items: SerialDisplayMeta[] }[] = []
	const yearIndex = new Map<number, number>()
	for (const s of serials) {
		const meta = catalog.get(+s.serialNumber)
		if (!meta) continue
		let i = yearIndex.get(meta.belongYear)
		if (i === undefined) {
			i = groups.length
			yearIndex.set(meta.belongYear, i)
			groups.push({ year: meta.belongYear, items: [] })
		}
		groups[i].items.push(meta)
	}
	return groups
}

/** 正文块标题，如月报聚合 */
export function formatSerialCaption(meta: SerialDisplayMeta): string {
	const st = meta.startTime.slice(5)
	const en = meta.endTime.slice(5)
	return `【${meta.belongYear}.${st}～${en} · 第${meta.yearIndex}周期 · ${meta.days}天】`
}

/** 对比表列头（可含换行） */
export function formatSerialCompact(meta: SerialDisplayMeta): string {
	const st = meta.startTime.slice(5)
	const en = meta.endTime.slice(5)
	return `${meta.belongYear} 第${meta.yearIndex}\n${st}～${en}`
}

/** 页面标题：仅年 + 年内序号（日期可另列） */
export function formatSerialYearIndex(meta: SerialDisplayMeta): string {
	return `${meta.belongYear} 第${meta.yearIndex}周期`
}

/** 页面标题 / 副标题（含日期） */
export function formatSerialTitle(meta: SerialDisplayMeta): string {
	const st = meta.startTime.slice(5)
	const en = meta.endTime.slice(5)
	return `${meta.belongYear} 第${meta.yearIndex}周期 · ${st}～${en}`
}

/**
 * 阶段报所选周期摘要，如：
 * - `2026 第5–7周期`
 * - `2025 第12周期 · 2026 第1–2周期`（跨归属年）
 */
export function formatStagePeriodsSummary(
	periodNumbers: number[],
	catalog: SerialTimeRange[] | Map<number, SerialDisplayMeta>
): string | null {
	const nums = [...periodNumbers]
		.map(Number)
		.filter((n) => n > 0)
		.sort((a, b) => a - b)
	if (!nums.length) return null

	const map =
		catalog instanceof Map
			? catalog
			: buildSerialDisplayCatalog(catalog)

	const metas = nums
		.map((n) => map.get(n))
		.filter((m): m is SerialDisplayMeta => !!m)
	if (!metas.length) return null

	const byYear = new Map<number, number[]>()
	for (const m of metas) {
		const list = byYear.get(m.belongYear) ?? []
		list.push(m.yearIndex)
		byYear.set(m.belongYear, list)
	}

	const parts: string[] = []
	;[...byYear.entries()]
		.sort((a, b) => a[0] - b[0])
		.forEach(([year, indexes]) => {
			const sorted = [...indexes].sort((a, b) => a - b)
			const lo = sorted[0]
			const hi = sorted[sorted.length - 1]
			const range =
				lo === hi ? `第${lo}周期` : `第${lo}–${hi}周期`
			parts.push(`${year} ${range}`)
		})

	return parts.join(' · ')
}
