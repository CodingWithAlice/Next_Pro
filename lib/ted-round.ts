/** 当前 TED 轮次。只读 config.env 的 TED_ROUND，不在代码里写死数字。 */

export function parseTedRound(raw: string | undefined | null): number | null {
	if (raw == null) return null
	const text = String(raw).trim()
	if (!/^\d+$/.test(text)) return null
	const n = Number(text)
	return n > 0 ? n : null
}

export function readTedRound(): number | null {
	return parseTedRound(process.env.TED_ROUND)
}

export function tedRoundPrefixFrom(round: number | null): string {
	return round == null ? '' : `Round${round}: `
}
