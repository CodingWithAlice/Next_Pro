import axios, { AxiosResponse, AxiosRequestConfig } from 'axios'
import OpenAI from 'openai'

const apiKey = process.env.DEEPSEEK_API_KEY || 'a'
const openai = new OpenAI({
	baseURL: 'https://api.deepseek.com',
	apiKey,
	dangerouslyAllowBrowser: true,
})

// 定义请求体的类型
export interface MessageProp {
	role: 'system' | 'user' | 'assistant'
	content: string
}

const url = process.env.NEXT_PUBLIC_API_HOST
// 解析 请求链接 / localstorage 的查询参数
const localStorageType = localStorage.getItem('type')

const postConfig: AxiosRequestConfig = {
	headers: {},
}
if (localStorageType === 'owner-alice') {
    postConfig.headers = { Authorization: 'owner' }
}

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
	return await axios.post(`${url}/${api}`, { data }, postConfig)
}

async function post<T>(api: string, data: T) {
	return await axios.post(`${url}/${api}`, { data }, postConfig)
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
