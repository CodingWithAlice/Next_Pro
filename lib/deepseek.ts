import OpenAI from 'openai'

export interface MessageProp {
	role: 'system' | 'user' | 'assistant'
	content: string
}

function getDeepSeekClient() {
	if (typeof window !== 'undefined') {
		throw new Error('DeepSeek 仅允许在服务端调用')
	}
	const apiKey = process.env.DEEPSEEK_API_KEY
	if (!apiKey) {
		throw new Error('缺少 DEEPSEEK_API_KEY')
	}
	return new OpenAI({
		baseURL: 'https://api.deepseek.com',
		apiKey,
	})
}

/** 仅供 API Route / 服务端使用，勿从客户端 import */
export async function AIPOST(messages: MessageProp[]) {
	try {
		const openai = getDeepSeekClient()
		const completion = await openai.chat.completions.create({
			messages,
			model: 'deepseek-v4-flash',
			response_format: {
				type: 'json_object',
			},
		})
		return completion.choices[0].message?.content
	} catch (error) {
		console.error('Error calling DeepSeek API:', error)
		throw error
	}
}
