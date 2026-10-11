/**
 * 力训部位词。每日记录的时段只有「运动」，部位写在正文里，例如「臀腿 10335」。
 * 解析后落到 sport_records.category，再按这里分成上肢 / 下肢容量。
 * 长词在前，避免「背」吃掉「背腿」「背部」。
 */
export const RESISTANCE_BODY_PARTS = [
	'肩部·全身',
	'胸肌·全身',
	'简单肩背',
	'下肢正面',
	'下肢背面',
	'胸肩背',
	'全身练',
	'胸背',
	'臀腿',
	'肩背',
	'腿臀',
	'背腿',
	'背部',
	'臀部',
	'胸肌',
	'上肢',
	'下肢',
	'背面',
	'全身',
	'胸',
	'背',
] as const

const UPPER = new Set([
	'胸肩背',
	'肩背',
	'胸',
	'背',
	'背部',
	'胸肌',
	'上肢',
	'胸背',
	'简单肩背',
	'背面',
])

const LOWER = new Set(['臀腿', '臀部', '腿臀', '下肢', '下肢正面', '下肢背面'])

/** 全身、背腿，以及名字里已经写明全身的混合部位，按上肢 3 : 下肢 7 */
const SPLIT = new Set(['全身', '背腿', '全身练', '肩部·全身', '胸肌·全身'])

export function resistanceBodyPartPattern(): string {
	return RESISTANCE_BODY_PARTS.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
}

export function splitResistanceVolume(
	category: string,
	value: number
): { upper: number; lower: number } | null {
	const kg = Math.round(value)
	if (!category || kg <= 0) return null
	if (UPPER.has(category)) return { upper: kg, lower: 0 }
	if (LOWER.has(category)) return { upper: 0, lower: kg }
	if (SPLIT.has(category)) {
		const upper = Math.round(kg * 0.3)
		return { upper, lower: kg - upper }
	}
	return null
}
