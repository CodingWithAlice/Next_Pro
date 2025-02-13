import axios, { AxiosResponse } from 'axios'
import { Dayjs } from 'dayjs'

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

async function post(api: string, data: { [key: string]: string | number | Dayjs | Date }) {
	return await axios.post(`${url}/${api}`, { data })
}

// function update(url: string, data: any) {
//   return axios.put(url, data)
// }

const request = {
	get,
	postList,
	post,
}

export default request
