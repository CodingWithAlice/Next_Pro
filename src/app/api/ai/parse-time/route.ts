import { NextRequest, NextResponse } from 'next/server'
import { AIPOST, type MessageProp } from '../../../../../lib/request'
import dayjs from 'dayjs'

type ParseTimeRequest = {
	text: string
	date?: string // YYYY-MM-DD，用于理解“今天/下午/凌晨”等语境
	routineTypes?: { id: number; des: string; type?: string }[] // 可选：用于从口语中选择类型
}

type ParseTimeResponse = {
	raw: string
	start: string | null // HH:mm
	end: string | null // HH:mm
	title: string | null
	isCrossDay: boolean
	routineTypeId: number | null
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
		const routineTypes = Array.isArray(payload?.routineTypes) ? payload?.routineTypes : []
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
					'你是一个“每日记录文本解析器”。用户会用中文口语（或输入法语音转文本）描述一个活动的开始/结束时间，并可能包含活动标题/事项类型。\n' +
					'请仅返回 JSON 对象，字段：start,end,title,routineTypeId。\n' +
					'- start/end 只能是 "HH:mm" 或 null（24 小时制，补齐两位）。\n' +
					'- 如果只说了一个时间（例如“7点开会”），start=该时间，end=null。\n' +
					'- 如果表达了时间范围（例如“7点到8点半”“19:10-20:05”“下午两点到四点”“晚上11点到凌晨1点”），请尽量给出 start/end。\n' +
					'- title 如果能抽取出事项名就填，否则为 null。\n' +
					'- routineTypeId：必须是用户提供的候选列表中的 id；如果无法判断就返回 null。\n' +
					'不要输出除 JSON 以外的任何内容。',
			},
			{
				role: 'user',
				content: JSON.stringify({
					date,
					text,
					routineTypes: routineTypes.map((t) => ({ id: t.id, des: t.des, type: t.type })),
				}),
			},
		]

		const aiResponse = await AIPOST(messages)
		if (!aiResponse || aiResponse.trim() === '') {
			return NextResponse.json({ error: 'AI 返回空响应' }, { status: 500 })
		}

		let parsed: { start?: unknown; end?: unknown; title?: unknown; routineTypeId?: unknown }
		try {
			parsed = JSON.parse(aiResponse) as {
				start?: unknown
				end?: unknown
				title?: unknown
				routineTypeId?: unknown
			}
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
		const allowedTypeIds = new Set(routineTypes.map((t) => t.id))
		const routineTypeIdRaw =
			typeof parsed.routineTypeId === 'number'
				? parsed.routineTypeId
				: (typeof parsed.routineTypeId === 'string' ? Number(parsed.routineTypeId) : NaN)
		const routineTypeId =
			Number.isFinite(routineTypeIdRaw) && allowedTypeIds.has(routineTypeIdRaw)
				? routineTypeIdRaw
				: null

		const res: ParseTimeResponse = {
			raw: text,
			start,
			end,
			title,
			isCrossDay,
			routineTypeId,
		}

		return NextResponse.json(res)
	} catch (error) {
		console.error(error)
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
	}
}

