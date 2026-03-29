import { NextRequest, NextResponse } from 'next/server'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'
import { AIPOST, MessageProp } from '@lib/request'
import {
	buildPerSerialMetrics,
	getSortedSerials,
	GetWeekInfo,
} from '@lib/month-per-serial-metrics'

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

		// 仅传需推理的字段；运动/影视/TED 由前端规则合并，不占用模型
		const periodsPayload = weekList.map((w) => ({
			serialNumber: w.serialNumber,
			range: `${String(w.startTime).slice(0, 10)}~${String(w.endTime).slice(0, 10)}`,
			frontOverview: clip(w.frontOverview || '', MAX_FIELD),
			sleep: clip(w.sleep || '', MAX_FIELD),
			improveMethods: clip(w.improveMethods || '', MAX_FIELD),
		}))

		const userPayload = {
			perSerialMetrics,
			periods: periodsPayload,
		}

		const systemPrompt = `你是个人复盘助手。用户多个 LTN 周期周报中，只有以下部分需要借助归纳与推理；运动、影视、TED、阅读由系统另行规则合并，你**不要**输出这些板块。

你必须只输出一个 JSON 对象，且必须恰好包含以下 4 个键（键名完全一致，英文蛇形命名），每个值为一个中文字符串。可适当换行与列表，不要使用 Markdown 代码块。

1. learning_task_merged
   - 合并各周期「学习任务」正文（通常含「一、学习体验」「二、工作体验」下的技术方向与非技术方向）。
   - 把学习体验、工作技术向、工作非技术向**整合成一份连贯的复盘长文**，便于阶段总结；不要按周期重复套三层标题；重要事实、数字、项目名应保留。

2. sleep_objective_merged
   - **仅**客观数据与统计：入睡时间列表或描述、睡眠时长及占比、起床时间、满足若干小时睡眠的天数与比例等。
   - 多周期时按时间或列表汇总，**不要**写入「提高睡眠质量的一些意识调整」类主观段落。

3. sleep_awareness_merged
   - **仅**主观反思：通常对应「提高睡眠质量的一些意识调整」及类似内容（原因分析、可沿用方法、影响、调整方向等）。
   - 多周期去重合并相近表述，保留演进。

4. improve_methods_merged
   - 各周期「学习/工作方法复盘和改进」类文字；用户习惯累计沉淀，重复多。请**去重、合并要点**，保留脉络与阶段变化。

约束：不编造输入中不存在的数字或事件；可参考 perSerialMetrics 与正文对照；仅输出合法 JSON，不要输出 JSON 以外的文字。`

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
			'learning_task_merged',
			'sleep_objective_merged',
			'sleep_awareness_merged',
			'improve_methods_merged',
		] as const

		const out: Record<string, string> = {}
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
