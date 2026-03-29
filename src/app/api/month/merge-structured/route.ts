import { NextRequest, NextResponse } from 'next/server'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'
import { AIPOST, MessageProp } from '@lib/request'
import {
	buildPerSerialMetrics,
	getSortedSerials,
	GetWeekInfo,
} from '@lib/month-per-serial-metrics'
import type { SerialAttributes } from 'db'
import {
	aggregateLearningTasks,
	type MonthTableWeekRow,
} from '@lib/month-learning-aggregate'

function toWeekRows(weekList: SerialAttributes[]): MonthTableWeekRow[] {
	return weekList.map((w) => ({
		id: w.id,
		serialNumber: w.serialNumber,
		startTime: String(w.startTime),
		endTime: String(w.endTime),
		frontOverview: w.frontOverview || '',
		sleep: w.sleep || '',
		sport: w.sport || '',
		movie: w.movie || '',
		ted: w.ted || '',
		read: w.read || '',
		improveMethods: w.improveMethods || '',
	}))
}

function clip(s: string, max: number) {
	if (!s) return ''
	return s.length > max ? `${s.slice(0, max)}…（已截断）` : s
}

const MAX_FIELD = 12000

async function POST(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		const serialNumber = (body?.data?.serialNumber ?? body?.serialNumber) as string
		if (!serialNumber?.trim()) {
			return NextResponse.json({ error: '缺少 serialNumber' }, { status: 400 })
		}

		const serials = getSortedSerials(serialNumber)
		if (!serials.length) {
			return NextResponse.json({ error: '周期号无效' }, { status: 400 })
		}

		const weekList = await GetWeekInfo(serials, userId)
		const perSerialMetrics = await buildPerSerialMetrics(serials, userId)

		// 学习任务：与前端完全相同的规则拆分（二、工作体验 / 非技术方向），按三方向汇总，**不由模型自由发挥**，避免混淆板块
		const learning_task_merged = aggregateLearningTasks(toWeekRows(weekList))

		// 仅传睡眠与复盘给模型；学习任务已由规则生成
		const periodsPayload = weekList.map((w) => ({
			serialNumber: w.serialNumber,
			range: `${String(w.startTime).slice(0, 10)}~${String(w.endTime).slice(0, 10)}`,
			sleep: clip(w.sleep || '', MAX_FIELD),
			improveMethods: clip(w.improveMethods || '', MAX_FIELD),
		}))

		const userPayload = {
			perSerialMetrics,
			periods: periodsPayload,
		}

		const systemPrompt = `你的角色是**数据与文本的汇聚集合**（归类、并列、去重），**不是**写复盘总结、**不是**提炼观点、**不是**用新话概括原文。

**学习任务（学习体验 / 工作·技术向 / 工作·非技术向）已由系统按用户在每个周期内写好的板块拆分并汇总，你无需处理、不要输出。**

运动、影视、TED、阅读由系统规则合并，你**不要**输出这些板块。

你必须只输出一个 JSON 对象，且必须恰好包含以下 **3** 个键（键名完全一致，英文蛇形命名），每个值为一个中文字符串。可适当换行与编号，不要使用 Markdown 代码块。

**禁止**：「综上所述」「总之」「小结」「核心发现」等总结性段落；把多周期内容改写成一篇故事化长文；用更短的句子重写原文含义；评价优劣或给建议（除非原文已有）。

**允许**：按周期标注（如周期号+日期范围）后**并列**贴上原文或原文片段；把同类客观数据**汇总到同一张列表**（数字、比例、天数）；仅当两条文字**字面高度重复**时合并为一条并保留一处原文。

1. sleep_objective_merged
   - **仅**客观数据与统计：入睡时间、睡眠时长与占比、起床时间、满足若干小时的天数与比例等。
   - 把各周期出现的客观条目**汇总**到一处（可列表、可分周期小标题），**不要**写趋势解读或结论；**不要**混入「提高睡眠质量的一些意识调整」类主观段落。

2. sleep_awareness_merged
   - **仅**主观段落：如「提高睡眠质量的一些意识调整」及同类内容。
   - 按周期**并列聚合**（建议每周期一小节）；**不要**把多周期揉成一段「综合感悟」；**不要**「语义去重」后重写——仅可去掉**完全重复**的句子。

3. improve_methods_merged
   - 各周期「学习/工作方法复盘和改进」原文的**汇聚集合**：按周期顺序罗列；若不同周期出现**完全相同**的句子，保留一条即可。
   - **不要**提炼成新的「要点清单」或「方法论总结」；不要合并「意思相近」的条目为新表述。

约束：不编造数字与事实；perSerialMetrics 可作核对参考；仅输出合法 JSON，不要输出 JSON 以外的文字。`

		const messages: MessageProp[] = [
			{ role: 'system', content: systemPrompt },
			{
				role: 'user',
				content: JSON.stringify(userPayload),
			},
		]

		const raw = await AIPOST(messages)
		if (!raw?.trim()) {
			return NextResponse.json({ error: 'AI 返回空' }, { status: 500 })
		}

		let parsed: Record<string, unknown>
		try {
			parsed = JSON.parse(raw) as Record<string, unknown>
		} catch {
			return NextResponse.json(
				{ error: 'AI 响应非合法 JSON', raw: raw.slice(0, 500) },
				{ status: 500 }
			)
		}

		const keys = [
			'sleep_objective_merged',
			'sleep_awareness_merged',
			'improve_methods_merged',
		] as const

		const out: Record<string, string> = {
			learning_task_merged,
		}
		for (const k of keys) {
			const v = parsed[k]
			out[k] = typeof v === 'string' ? v : v == null ? '' : String(v)
		}

		return NextResponse.json(out)
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export { POST }
