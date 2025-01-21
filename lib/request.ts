import { IssueRecordProps } from '@/components/tool'
import axios, { AxiosResponse } from 'axios'

const url = process.env.API_URL || 'http://localhost:3000/api'

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

async function postIssue(api: string, data: IssueRecordProps) {
	return await axios.post(`${url}/${api}`, { ...data, date: new Date() })
}

// function update(url: string, data: any) {
//   return axios.put(url, data)
// }

const request = {
	get,
	postList,
	postIssue,
}

export default request
