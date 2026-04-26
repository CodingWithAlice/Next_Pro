import { NextRequest, NextResponse } from 'next/server'
import { AIPOST, type MessageProp } from '../../../../../lib/request'
import dayjs from 'dayjs'

type ParseTimeRequest = {
	text: string
	date?: string // YYYY-MM-DD，用于理解“今天/下午/凌晨”等语境
}

type ParseTimeResponse = {
	raw: string
	start: string | null // HH:mm
	end: string | null // HH:mm
	title: string | null
	isCrossDay: boolean
}

function normalizeHHmm(input: unknown): string | null {
	if (typeof input !== 'string') return null
	const s = input.trim()
	if (!/^\d{2}:\d{2}$/.test(s)) return null
	const [hh, mm] = s.split(':').map(Number)
	if (Number.isNaN(hh) || Number.isNaN(mm)) return null
	if (hh < 0 || hh > 23) return null
	if (mm < 0 || mm > 59) return null
	return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function calcIsCrossDay(date: string, start: string | null, end: string | null) {
	if (!start || !end) return false
	const s = dayjs(`${date} ${start}:00`)
	const e = dayjs(`${date} ${end}:00`)
	return e.isBefore(s)
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as { data?: ParseTimeRequest } | ParseTimeRequest
		const payload = ('data' in body ? body.data : body) as ParseTimeRequest | undefined
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
					'你是一个时间信息抽取器。用户会用中文口语描述一个活动的开始/结束时间（可能包含“上午/下午/晚上/凌晨/中午/半/一刻/三刻/点/分/到/至/从...到...”等），并可能带有活动标题。\n' +
					'请仅返回 JSON 对象，字段：start,end,title。\n' +
					'- start/end 只能是 "HH:mm" 或 null（24 小时制，补齐两位）。\n' +
					'- 如果只说了一个时间（例如“7点开会”），start=该时间，end=null。\n' +
					'- 如果表达了时间范围（例如“7点到8点半”“19:10-20:05”“下午两点到四点”“晚上11点到凌晨1点”），请尽量给出 start/end。\n' +
					'- title 如果能抽取出事项名就填，否则为 null。\n' +
					'不要输出除 JSON 以外的任何内容。',
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

		let parsed: { start?: unknown; end?: unknown; title?: unknown }
		try {
			parsed = JSON.parse(aiResponse) as { start?: unknown; end?: unknown; title?: unknown }
		} catch {
			return NextResponse.json(
				{ error: '解析 AI 响应失败', rawResponse: aiResponse },
				{ status: 500 }
			)
		}

		const start = normalizeHHmm(parsed.start)
		const end = normalizeHHmm(parsed.end)
		const title = typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : null
		const isCrossDay = calcIsCrossDay(date, start, end)

		const res: ParseTimeResponse = {
			raw: text,
			start,
			end,
			title,
			isCrossDay,
		}

		return NextResponse.json(res)
	} catch (error) {
		console.error(error)
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
	}
}

