import { NextRequest, NextResponse } from 'next/server'
import { AIPOST, type MessageProp } from '../../../../../lib/request'
import dayjs from 'dayjs'

type ParseIssueRequest = {
	text: string
	date?: string // YYYY-MM-DD，用于理解“今天/昨晚/下午”等语境
}

type ParseIssueResponse = {
	raw: string
	sport: string
	video: string
	front: string
	work: string
	ted: string
	reading: string
	good: string
	better: string
}

function normalizeString(input: unknown): string {
	if (typeof input !== 'string') return ''
	return input.trim()
}

function ensureTedPrefix(ted: string) {
	const s = (ted || '').trim()
	if (!s) return 'Round4: '
	return /^Round4\s*:/.test(s) ? s : `Round4: ${s}`
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as { data?: ParseIssueRequest } | ParseIssueRequest
		const payload = ('data' in body ? body.data : body) as ParseIssueRequest | undefined
		const text = payload?.text?.trim() || ''
		const date = payload?.date && /^\d{4}-\d{2}-\d{2}$/.test(payload.date)
			? payload.date
			: dayjs().format('YYYY-MM-DD')

		if (!text) {
			return NextResponse.json({ error: 'text 不能为空' }, { status: 400 })
		}

		const messages: MessageProp[] = [
			{
				role: 'system',
				content:
					'你是一个“事项统计语音转文本解析器”。用户会用中文口语（或输入法语音转文本）描述今天的复盘内容。\n' +
					'任务：把内容归类并填充到以下 8 个字段：sport, video, front, work, ted, reading, good, better。\n' +
					'额外规则：\n' +
					'1) front（学习）必须区分并按模板输出：\n' +
					'   1、LTN：<内容或空>\n' +
					'   2、BOX1：<内容或空>\n' +
					'   3、在线工具：<内容或空>\n' +
					'2) work（工作）必须区分并按模板输出：\n' +
					'   1、技术方向：<内容或空>\n' +
					'   2、业务方向：<内容或空>\n' +
					'3) ted 字段必须以 "Round4: " 开头（如果用户没说，也要输出 "Round4: "）。\n' +
					'4) 其它字段（sport/video/reading/good/better）尽量提取要点，允许多行；不确定就留空字符串。\n' +
					'请仅返回 JSON 对象，且所有字段必须是字符串（不要返回 null/数组/多余字段）。不要输出除 JSON 以外的任何内容。',
			},
			{
				role: 'user',
				content: JSON.stringify({ date, text }),
			},
		]

		const aiResponse = await AIPOST(messages)
		if (!aiResponse || aiResponse.trim() === '') {
			return NextResponse.json({ error: 'AI 返回空响应' }, { status: 500 })
		}

		let parsed: Partial<Record<keyof Omit<ParseIssueResponse, 'raw'>, unknown>>
		try {
			parsed = JSON.parse(aiResponse) as Partial<Record<keyof Omit<ParseIssueResponse, 'raw'>, unknown>>
		} catch {
			return NextResponse.json(
				{ error: '解析 AI 响应失败', rawResponse: aiResponse },
				{ status: 500 }
			)
		}

		const res: ParseIssueResponse = {
			raw: text,
			sport: normalizeString(parsed.sport),
			video: normalizeString(parsed.video),
			front: normalizeString(parsed.front),
			work: normalizeString(parsed.work),
			ted: ensureTedPrefix(normalizeString(parsed.ted)),
			reading: normalizeString(parsed.reading),
			good: normalizeString(parsed.good),
			better: normalizeString(parsed.better),
		}

		return NextResponse.json(res)
	} catch (error) {
		console.error(error)
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
	}
}

