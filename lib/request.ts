import axios, { AxiosResponse, AxiosRequestConfig } from 'axios'

const TOKEN_KEY = 'j-user-id'

/** 本地 next dev 不读 .env.production；未配置时走当前站点的 /api，避免拼出 /undefined/... */
export function apiBase(): string {
	const host = process.env.NEXT_PUBLIC_API_HOST
	if (typeof host === 'string' && host.trim() !== '') return host.replace(/\/$/, '')
	return '/api'
}

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
	const err = error as {
		response?: { status?: number; data?: { message?: string; error?: string } | string }
		message?: string
	}
	const data = err?.response?.data
	const fromBody =
		typeof data === 'string'
			? data
			: data?.message || data?.error
	const message = fromBody || err?.message || '未知错误'
	return { status: err?.response?.status || 500, message }
}

async function get(
	api: string,
	params?: { [key: string]: string | number | boolean },
	timeoutMs?: number
) {
	try {
		const response: AxiosResponse = await axios.get(`${apiBase()}/${api}`, {
			params,
			...getConfig(),
			...(timeoutMs != null ? { timeout: timeoutMs } : {}),
		})
		return response.data
	} catch (error) {
		const errorObj = handleAxiosError(error)
		throw errorObj
	}
}

async function post<T>(api: string, data: T, timeoutMs?: number) {
	try {
		const response = await axios.post(`${apiBase()}/${api}`, { data }, {
			...getConfig(),
			...(timeoutMs != null ? { timeout: timeoutMs } : {}),
		})
		return response.data
	} catch (error) {
		const errorObj = handleAxiosError(error)
		throw errorObj
	}
}

async function put<T>(api: string, data: T) {
	try {
		const response = await axios.put(`${apiBase()}/${api}`, { data }, getConfig())
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
		const response = await axios.delete(`${apiBase()}/${api}`, {
			params,
			...getConfig(),
		})
		return response.data
	} catch (error) {
		const errorObj = handleAxiosError(error)
		throw errorObj
	}
}

const request = {
	get,
	post,
	put,
	delete: del,
}

export default request
