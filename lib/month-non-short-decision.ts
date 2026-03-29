/**
 * 月报「非短期决策」字段在服务端为空时，前端会填入该占位，用于区分「未填写」与「已复盘」。
 * 与占位相同的内容视为未填写，仍会走汇聚集合（AI）请求。
 */
export const MONTH_NON_SHORT_DECISION_PLACEHOLDER = `【保持】已验证有效模式：
【尝试】方法论迁移场景：
【放弃】低ROI事项：
【纠正】偏离年度目标：`

/** 「非短期决策 - 前端 / 其他」是否视为用户已填写（非空且非默认占位） */
export function isNonShortDecisionFieldFilled(
	value: string | undefined | null
): boolean {
	const t = (value ?? '').trim()
	if (!t) return false
	return t !== MONTH_NON_SHORT_DECISION_PLACEHOLDER.trim()
}
