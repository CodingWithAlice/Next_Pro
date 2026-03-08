import axios, { AxiosResponse, AxiosRequestConfig, AxiosError } from 'axios'
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
const TOKEN_KEY = 'j-user-id'

function getToken(): string | null {
	if (typeof localStorage === 'undefined') return null
	return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('type')
}

function getConfig(): AxiosRequestConfig {
	const token = getToken()
	const headers: Record<string, string> = {}
	if (token) headers['j-user-id'] = token
	return { headers }
}

// 401 时跳转登录页（可选）
if (typeof window !== 'undefined') {
	axios.interceptors.response.use(
		(r) => r,
		(err) => {
			if (err.response?.status === 401) {
				window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname)
			}
			return Promise.reject(err)
		}
	)
}

function handleAxiosError(error: unknown): { status: number; message: string } {
	if (axios.isAxiosError(error)) {
		const axiosError = error as AxiosError
		const status = axiosError.response?.status || 500
		const message =
			(axiosError.response?.data as { message?: string })?.message ||
			axiosError.message
		return { status, message }
	}
	// 非 Axios 错误
	return { status: 500, message: '未知错误' }
}

async function get(
	api: string,
	params?: { [key: string]: string | number | boolean }
) {
	try {
		const response: AxiosResponse = await axios.get(`${url}/${api}`, {
			params,
			...getConfig(),
		})
		return response.data
	} catch (error) {
		const errorObj = handleAxiosError(error)
		throw errorObj
	}
}

async function post<T>(api: string, data: T) {
	try {
		const response = await axios.post(`${url}/${api}`, { data }, getConfig())
		return response.data
	} catch (error) {
		const errorObj = handleAxiosError(error)
		throw errorObj
	}
}

async function put<T>(api: string, data: T) {
	try {
		const response = await axios.put(`${url}/${api}`, { data }, getConfig())
		return response.data
	} catch (error) {
		const errorObj = handleAxiosError(error)
		throw errorObj
	}
}

async function del(
	api: string,
	params?: { [key: string]: string | number | boolean }
) {
	try {
		const response = await axios.delete(`${url}/${api}`, {
			params,
			...getConfig(),
		})
		return response.data
	} catch (error) {
		const errorObj = handleAxiosError(error)
		throw errorObj
	}
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
		return completion.choices[0].message?.content
	} catch (error) {
		console.error('Error calling DeepSeek API:', error)
	}
}

const request = {
	get,
	post,
	put,
	delete: del,
	AIPOST,
}

export default request
