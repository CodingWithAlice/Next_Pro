import { Dayjs } from 'dayjs'
import request from '../../../lib/request'
import { SearchType } from '@/components/tool'

export interface TedRecordDTO {
	date: Date | string
	record: string
	tedId: number
	id?: number
}

const Api = {
	getRoutineApi(params?: { [key: string]: string | number | boolean }) {
		return request.get('routine', params)
	},

	postDailyApi(data: { [key: string]: string | number | boolean }[]) {
		return request.post('daily', data)
	},
	getDailyApi(date: string) {
		return request.get('daily', { date })
	},

	postIssueApi(data: { [key: string]: string | number | Dayjs | Date }) {
		return request.post('daily/issue', data)
	},
	getIssueListApi() {
		return request.get('daily/issue')
	},

	getSerial() {
		return request.get('serial')
	},
    postSerialApi(params: { [key: string]: string | number }) {        
        return request.post('serial', params)
    },

	getTedList() {
		return request.get('ted')
	},

	postTedRecord(data: TedRecordDTO) {
		return request.post('ted/record', data)
	},

	getMonthApi(monthId?: number, flag?: 'pre' | 'next') {
		if (monthId && flag) {
			return request.get('month', { monthId, flag })
		}
		return request.get('month', monthId ? { monthId } : undefined)
	},
	getMonthDetailApi(serialNumber: string) {
		return request.get('month/detail', { serialNumber })
	},
	getDeepSeekApi(serialNumber: string, searchType: SearchType) {
		return request.get('deepseek', { serialNumber, type: searchType, timeout: 300000 }) // 300秒
	},
	postMonthApi(data: { [key: string]: string | number }) {
		return request.post('month', data)
	},

	getWeekApi(serialNumber: number) {
		return request.get('week', { serialNumber })
	},
	postWeekApi(data: { [key: string]: string | number }) {
		return request.post('week', data)
	},

	getWeekPeriodApi(serialNumber: number) {
		return request.get('week/period', { serialNumber })
	},

	getReadApi() {
		return request.get('books')
	},
	postReadApi(readData: { [key: string]: string | number }) {
		return request.post('books', { readData })
	},
	uploadBookImage(file: File, title?: string) {
		const formData = new FormData()
		formData.append('file', file)
		if (title) {
			formData.append('title', title)
		}
		const url = process.env.NEXT_PUBLIC_API_HOST
		const authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('type') : null
		return fetch(`${url}/books/upload`, {
			method: 'POST',
			headers: authToken ? { 'Authorization': authToken } : {},
			body: formData
		}).then(res => res.json())
	},

	getSportApi(params?: { date?: string; type?: string }) {
		return request.get('sport', params)
	},
	postSportApi(sportData: { 
		type: 'running' | 'resistance' | 'hiking' | 'class';
		date: string;
		value: number;
		category: string;
		subInfo?: string;
		duration?: number;
		notes?: string;
	}) {
		return request.post('sport', sportData)
	},

	getRunningPlansApi() {
		return request.get('running-plans')
	},
}

export default Api
