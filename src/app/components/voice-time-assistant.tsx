"use client"

import { Button, Modal, message } from 'antd'
import { AudioOutlined } from '@ant-design/icons'
import { useMemo, useRef, useState } from 'react'
import Api from '@/service/api'
import dayjs from 'dayjs'
import type { Issue } from '@/components/custom-time-picker'

type Parsed = {
	raw: string
	start: string | null
	end: string | null
	title: string | null
	isCrossDay: boolean
}

type WebkitSpeechRecognitionResultAlternative = { transcript: string }
type WebkitSpeechRecognitionResult = ArrayLike<WebkitSpeechRecognitionResultAlternative>
type WebkitSpeechRecognitionEventLike = {
	results: ArrayLike<WebkitSpeechRecognitionResult>
}
type WebkitSpeechRecognitionErrorEventLike = { error?: string }
type WebkitSpeechRecognitionLike = {
	lang: string
	continuous: boolean
	interimResults: boolean
	start: () => void
	stop: () => void
	onresult?: (event: WebkitSpeechRecognitionEventLike) => void
	onerror?: (event: WebkitSpeechRecognitionErrorEventLike) => void
	onend?: () => void
}

function hasWebkitSpeechRecognition(): boolean {
	return typeof window !== 'undefined' && 'webkitSpeechRecognition' in window
}

export default function VoiceTimeAssistant({
	currentDate,
	issues,
	onApply,
}: {
	currentDate: string
	issues: Issue[]
	onApply: (issue: Issue) => void
}) {
	const [open, setOpen] = useState(false)
	const [listening, setListening] = useState(false)
	const [loading, setLoading] = useState(false)
	const [text, setText] = useState<string>('')
	const [parsed, setParsed] = useState<Parsed | null>(null)
	const [messageApi, contextHolder] = message.useMessage()

	const recognitionRef = useRef<WebkitSpeechRecognitionLike | null>(null)

	const canSpeech = useMemo(() => hasWebkitSpeechRecognition(), [])

	const handleStart = async () => {
		setParsed(null)
		setText('')

		if (!canSpeech) {
			messageApi.warning('当前浏览器不支持语音识别（建议 Android Chrome）。可改用系统语音输入后粘贴文字。')
			return
		}

		try {
			const Rec = (window as unknown as { webkitSpeechRecognition?: new () => WebkitSpeechRecognitionLike })
				.webkitSpeechRecognition
			if (!Rec) throw new Error('webkitSpeechRecognition 不可用')
			const recognition = new Rec()
			recognition.lang = 'zh-CN'
			recognition.continuous = false
			recognition.interimResults = false

			recognition.onresult = (event: WebkitSpeechRecognitionEventLike) => {
				const t = event.results?.[0]?.[0]?.transcript || ''
				setText(String(t).trim())
			}
			recognition.onerror = (event: WebkitSpeechRecognitionErrorEventLike) => {
				setListening(false)
				messageApi.error(event?.error || '语音识别失败')
			}
			recognition.onend = () => {
				setListening(false)
			}

			recognitionRef.current = recognition
			setListening(true)
			recognition.start()
		} catch (e: unknown) {
			setListening(false)
			const errMsg = e instanceof Error ? e.message : '无法启动语音识别'
			messageApi.error(errMsg)
		}
	}

	const handleStop = () => {
		try {
			recognitionRef.current?.stop?.()
		} finally {
			setListening(false)
		}
	}

	const handleParse = async () => {
		const t = text.trim()
		if (!t) {
			messageApi.warning('没有识别到文本')
			return
		}
		setLoading(true)
		setParsed(null)
		try {
			const res = await Api.postAiParseTimeApi(t, currentDate)
			setParsed(res)
		} catch (e: unknown) {
			const errMsg =
				typeof e === 'object' && e && 'message' in e
					? String((e as { message?: unknown }).message || '解析失败')
					: '解析失败'
			messageApi.error(errMsg)
		} finally {
			setLoading(false)
		}
	}

	const handleApply = () => {
		if (!parsed?.start) {
			messageApi.warning('未解析到开始时间')
			return
		}

		const base = currentDate
		const start = dayjs(`${base} ${parsed.start}:00`)
		const endRaw = parsed.end ? dayjs(`${base} ${parsed.end}:00`) : null
		const end = endRaw
			? (parsed.isCrossDay ? endRaw.add(1, 'day') : endRaw)
			: start.add(1, 'minute')

		const newIssue: Issue = {
			startTime: start,
			endTime: end.isBefore(start) ? start.add(1, 'minute') : end,
			type: '',
			daySort: issues.length,
			duration: Math.max(0, end.diff(start, 'minute')),
			interval: 0,
		}

		onApply(newIssue)
		setOpen(false)
	}

	return (
		<>
			{contextHolder}
			<Button onClick={() => setOpen(true)} icon={<AudioOutlined />}>
				语音填时间
			</Button>
			<Modal
				title="语音填时间"
				open={open}
				onCancel={() => {
					handleStop()
					setOpen(false)
				}}
				okText="应用到列表"
				onOk={handleApply}
				okButtonProps={{ disabled: !parsed?.start }}
				confirmLoading={loading}
			>
				<div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
					<Button onClick={listening ? handleStop : handleStart} type={listening ? 'primary' : 'default'}>
						{listening ? '停止' : '开始说话'}
					</Button>
					<Button onClick={handleParse} loading={loading} disabled={!text.trim()}>
						解析
					</Button>
				</div>

				<div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
					示例： “晚上七点到八点半 普拉提” / “9:15 到 10:05 写周报” / “下午两点到四点”
				</div>

				<div style={{ padding: 10, border: '1px solid #eee', borderRadius: 6, minHeight: 44 }}>
					{text ? text : <span style={{ opacity: 0.5 }}>识别文本会显示在这里</span>}
				</div>

				{parsed && (
					<div style={{ marginTop: 12, padding: 10, border: '1px solid #f0f0f0', borderRadius: 6 }}>
						<div>开始：{parsed.start ?? '-'}</div>
						<div>结束：{parsed.end ?? '-'}</div>
						<div>跨天：{parsed.isCrossDay ? '是' : '否'}</div>
						{parsed.title && <div>标题：{parsed.title}</div>}
					</div>
				)}

				{!canSpeech && (
					<div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
						说明：DeepSeek 不提供语音转文字（ASR）。当前实现使用浏览器语音识别；如果你的手机浏览器不支持，可用系统语音输入把文字粘贴到这里再点解析。
					</div>
				)}
			</Modal>
		</>
	)
}

