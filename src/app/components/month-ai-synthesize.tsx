'use client'

import Api from '@/service/api'
import { Button, message } from 'antd'
import { LoadingOutlined, OpenAIOutlined } from '@ant-design/icons'
import { useState } from 'react'

export default function MonthAiSynthesize({
	periods,
	handleChange,
}: {
	periods: number[]
	handleChange: (data: string) => void
}) {
	const [loading, setLoading] = useState(false)
	const [messageApi, contextHolder] = message.useMessage()

	const onClick = () => {
		if (!periods.length || +periods[0] === 0) {
			messageApi.warning('请先选择周期')
			return
		}
		setLoading(true)
		Api.postMonthSynthesizeApi(periods.join(','))
			.then((res) => {
				handleChange(
					JSON.stringify({
						studyConclude: res.studyConclude,
						others: res.others,
					})
				)
				messageApi.success('已生成，可再手动编辑后保存')
			})
			.catch((e: { message?: string }) => {
				messageApi.error(e?.message || '生成失败')
			})
			.finally(() => setLoading(false))
	}

	return (
		<>
			{contextHolder}
			<Button
				type="text"
				color="purple"
				variant="filled"
				onClick={onClick}
				disabled={loading}
			>
				<OpenAIOutlined />
				生成阶段 AI 总结 {loading && <LoadingOutlined />}
			</Button>
		</>
	)
}
