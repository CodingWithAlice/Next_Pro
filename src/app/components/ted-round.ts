import { parseTedRound, tedRoundPrefixFrom } from '@lib/ted-round'

/** 日报 TED 栏前缀。数字来自 next.config 透出的 TED_ROUND。 */
export function tedRoundPrefix(): string {
	return tedRoundPrefixFrom(parseTedRound(process.env.NEXT_PUBLIC_TED_ROUND))
}
