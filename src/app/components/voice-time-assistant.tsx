"use client"

import { Button, Input, Modal, message } from 'antd'
import { AudioOutlined } from '@ant-design/icons'
import { useState } from 'react'
import Api from '@/service/api'
import dayjs from 'dayjs'
import type { Issue } from '@/components/custom-time-picker'
import type { routineType } from '@/daily/page'
import config from 'config'

type Parsed = {
	raw: string
	start: string | null
	end: string | null
	title: string | null
	isCrossDay: boolean
	routineTypeId: number | null
}

export default function VoiceTimeAssistant({
	currentDate,
	issues,
	routineTypes,
	onApply,
}: {
	currentDate: string
	issues: Issue[]
	routineTypes: routineType[]
	onApply: (issue: Issue) => void
}) {
	const [open, setOpen] = useState(false)
	const [loading, setLoading] = useState(false)
	const [text, setText] = useState<string>('')
	const [parsed, setParsed] = useState<Parsed | null>(null)
	const [messageApi, contextHolder] = message.useMessage()

	const getRoutineTypeLabel = (id: number | null) => {
		if (id == null) return '未选择'
		const hit = (routineTypes || []).find((rt) => rt.id === id)
		return hit?.des || `未匹配(${id})`
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
			const res = await Api.postAiParseTimeApi(
				t,
				currentDate,
				(routineTypes || []).map((rt) => ({ id: rt.id, des: rt.des, type: rt.type }))
			)
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
		const endMaybeCross = endRaw
			? (parsed.isCrossDay ? endRaw.add(1, 'day') : endRaw)
			: start.add(1, 'minute')

		const pickedTypeId = parsed.routineTypeId != null ? String(parsed.routineTypeId) : ''
		const isWorkType = pickedTypeId && +pickedTypeId === +config.workId
		const end = isWorkType ? start : endMaybeCross

		const newIssue: Issue = {
			startTime: start,
			endTime: end.isBefore(start) ? start.add(1, 'minute') : end,
			type: pickedTypeId,
			daySort: issues.length,
			duration: isWorkType ? 0 : Math.max(0, end.diff(start, 'minute')),
			interval: 0,
		}

		onApply(newIssue)
		setOpen(false)
	}

	return (
		<>
			{contextHolder}
			<Button onClick={() => setOpen(true)} icon={<AudioOutlined />}>
				AI 填时间
			</Button>
			<Modal
				title="AI 填时间（建议用输入法语音）"
				open={open}
				onCancel={() => setOpen(false)}
				okText="应用到列表"
				onOk={handleApply}
				okButtonProps={{ disabled: !parsed?.start }}
				confirmLoading={loading}
			>
				<div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
					用输入法自带语音把内容说出来即可（Chrome/Safari 都可用）。示例： “晚上七点到八点半 普拉提” / “9:15 到 10:05 写周报” / “下午两点到四点 工作”
				</div>

				<Input.TextArea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="把输入法语音转成的文本放这里（支持口语）"
					autoSize={{ minRows: 2, maxRows: 6 }}
				/>

				<div style={{ marginTop: 12 }}>
					<Button onClick={handleParse} loading={loading} disabled={!text.trim()}>
						解析并预览
					</Button>
				</div>

				{parsed && (
					<div style={{ marginTop: 12, padding: 10, border: '1px solid #f0f0f0', borderRadius: 6 }}>
						<div>开始：{parsed.start ?? '-'}</div>
						<div>结束：{parsed.end ?? '-'}</div>
						<div>跨天：{parsed.isCrossDay ? '是' : '否'}</div>
						{parsed.title && <div>标题：{parsed.title}</div>}
						<div>类型：{getRoutineTypeLabel(parsed.routineTypeId)}</div>
					</div>
				)}
			</Modal>
		</>
	)
}

