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
	return s.length <= max ? s : `${s.slice(0, max)}…`
}

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

		const perSerialMetrics = await buildPerSerialMetrics(serials, userId)
		const weekList = await GetWeekInfo(serials, userId)

		const textDigest = weekList.map((w) => ({
			serialNumber: w.serialNumber,
			range: `${String(w.startTime).slice(0, 10)}~${String(w.endTime).slice(0, 10)}`,
			frontOverview: clip(w.frontOverview || '', 1200),
			sleepSportMovie: clip(
				`${w.sleep || ''}\n${w.sport || ''}\n${w.movie || ''}`,
				800
			),
			TEDRead: clip(`${w.ted || ''}\n${w.read || ''}`, 600),
			improveMethods: clip(w.improveMethods || '', 800),
		}))

		const payload = { perSerialMetrics, textDigest }

		const systemPrompt = `你是个人复盘助手。根据用户多个 LTN 周期的结构化统计数据与文字摘要，输出一个 JSON 对象，且仅包含两个字符串字段（键名必须完全一致，含空格与标点）：
1. 键名 "非短期决策 - 前端"：Markdown 列表字符串，概括工作/学习与技术相关现状与阶段变化，结合各周期指标差异。
2. 键名 "非短期决策 - 其他"：Markdown 字符串，必须依次包含以下小节标题（各占一行）：【保持】、【尝试】、【放弃】、【纠正】。每个标题下写若干条要点，结合睡眠/运动/娱乐/阅读/TED 与生活习惯的变化。
约束：不要编造输入中不存在的具体数字；结论尽量与 perSerialMetrics 中的 totalMinutes、sleepAvg 及 textDigest 一致；语言简洁中文。`

		const messages: MessageProp[] = [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: JSON.stringify(payload) },
		]

		const raw = await AIPOST(messages)
		if (!raw?.trim()) {
			return NextResponse.json({ error: 'AI 返回空' }, { status: 500 })
		}

		let parsed: Record<string, string>
		try {
			parsed = JSON.parse(raw) as Record<string, string>
		} catch {
			return NextResponse.json(
				{ error: 'AI 响应非合法 JSON', raw },
				{ status: 500 }
			)
		}

		return NextResponse.json({
			studyConclude: parsed['非短期决策 - 前端'] ?? '',
			others: parsed['非短期决策 - 其他'] ?? '',
		})
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export { POST }
