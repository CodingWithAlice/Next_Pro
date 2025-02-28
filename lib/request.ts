import axios, { AxiosResponse } from 'axios'
import OpenAI from 'openai'
const openai = new OpenAI({
	baseURL: 'https://api.deepseek.com',
	apiKey: process.env.DEEPSEEK_API_KEY,
})

// 定义请求体的类型
interface MessageProp {
	role: 'system' | 'user' | 'assistant'
	content: string
}

const url = process.env.NEXT_PUBLIC_API_HOST

async function get(
	api: string,
	params?: { [key: string]: string | number | boolean }
) {
	try {
		const response: AxiosResponse = await axios.get(`${url}/${api}`, {
			params,
		})
		return response.data
	} catch (error) {
		console.error('请求出错:', error)
		throw error
	}
}

async function postList(
	api: string,
	data: { [key: string]: string | number | boolean }[]
) {
	return await axios.post(`${url}/${api}`, { data })
}

async function post<T>(api: string, data: T) {
	return await axios.post(`${url}/${api}`, { data })
}

export async function AIPOST(messages: MessageProp[]) {
	try {
		// 获取客户端发送的数据
		const completion = await openai.chat.completions.create({
			messages: messages,
			model: 'deepseek-chat',
			response_format: {
				type: 'json_object',
			},
		})
		console.log(completion.choices[0].message.content)

		// 返回 API 响应给客户端
		return completion.choices[0].message.content
	} catch (error) {
		console.error('Error calling DeepSeek API:', error)
	}
}

const request = {
	get,
	postList,
	post,
	AIPOST,
}

export default request
