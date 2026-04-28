import { Dayjs } from 'dayjs'
import request from '../../../lib/request'
import { SearchType } from '@/components/tool'
import type { MonthStructuredMerge } from '@/components/month-structured-merge'

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
	postAiParseTimeApi(
		text: string,
		date?: string,
		routineTypes?: { id: number; des: string; type?: string }[]
	) {
		return request.post('ai/parse-time', { text, date, routineTypes }) as Promise<{
			raw: string
			start: string | null
			end: string | null
			title: string | null
			isCrossDay: boolean
			routineTypeId: number | null
		}>
	},
	postMonthApi(data: { [key: string]: string | number }) {
		return request.post('month', data)
	},
	postMonthSynthesizeApi(serialNumber: string) {
		return request.post('month/synthesize', { serialNumber }) as Promise<{
			studyConclude: string
			others: string
		}>
	},
	/** AI 将多周期周报合并为固定 JSON 结构（耗时较长，5 分钟超时） */
	postMonthMergeStructuredApi(serialNumber: string) {
		return request.post(
			'month/merge-structured',
			{ serialNumber },
			300000
		) as Promise<MonthStructuredMerge>
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
	updateReadApi(readData: { id: number; [key: string]: string | number }) {
		return request.put('books', { readData })
	},
	uploadBookImage(file: File, title?: string) {
		const formData = new FormData()
		formData.append('file', file)
		if (title) {
			formData.append('title', title)
		}
		const url = process.env.NEXT_PUBLIC_API_HOST
		const token = typeof localStorage !== 'undefined'
			? (localStorage.getItem('j-user-id') || localStorage.getItem('type'))
			: null
		const headers: Record<string, string> = {}
		if (token) headers['j-user-id'] = token
		return fetch(`${url}/books/upload`, {
			method: 'POST',
			headers,
			body: formData
		}).then(res => res.json())
	},

	uploadPiggyJarImage(jarId: number, file: File, name?: string) {
		const formData = new FormData()
		formData.append('file', file)
		if (name) formData.append('name', name)
		const url = process.env.NEXT_PUBLIC_API_HOST
		const token = typeof localStorage !== 'undefined'
			? (localStorage.getItem('j-user-id') || localStorage.getItem('type'))
			: null
		const headers: Record<string, string> = {}
		if (token) headers['j-user-id'] = token
		return fetch(`${url}/piggy-bank/jar/${jarId}/images`, {
			method: 'POST',
			headers,
			body: formData
		}).then(res => res.json())
	},

	removePiggyJarImage(jarId: number) {
		return fetch(`${process.env.NEXT_PUBLIC_API_HOST}/piggy-bank/jar/${jarId}/images`, {
			method: 'DELETE',
			headers: (() => {
				const token = typeof localStorage !== 'undefined'
					? (localStorage.getItem('j-user-id') || localStorage.getItem('type'))
					: null
				const headers: Record<string, string> = { 'Content-Type': 'application/json' }
				if (token) headers['j-user-id'] = token
				return headers
			})(),
			body: JSON.stringify({})
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

	getPiggyBankApi() {
		return request.get('piggy-bank')
	},
	postPiggyBankJarApi(data: {
		name: string
		monthlyRepayment?: number
		targetAmount?: number
		monthlyRepaymentAmount?: number
		planMonths?: number
		totalAdvance?: number
	}) {
		return request.post('piggy-bank/jar', data)
	},
	putPiggyBankJarApi(id: number, data: { name?: string; monthlyRepayment?: number | null; targetAmount?: number | null; actualConsumption?: number }) {
		return request.put(`piggy-bank/jar/${id}`, data)
	},
	abandonPiggyBankJarApi(id: number) {
		return request.post(`piggy-bank/jar/${id}`, { action: 'abandon' })
	},
	getPiggyBankAllocateSuggestionApi(amount: number) {
		return request.post('piggy-bank/allocate', { amount, suggestOnly: true })
	},
	confirmPiggyBankAllocateApi(amount: number, allocations: { jarId: number; amount: number }[], remark?: string) {
		return request.post('piggy-bank/allocate', { amount, allocations, remark })
	},
	getPiggyBankAllocateRecordsApi() {
		return request.get('piggy-bank/records')
	},
	putPiggyBankToPoolApi(amount: number, remark?: string) {
		return request.post('piggy-bank/allocate', { amount, toPool: true, remark })
	},
	allocateFromPoolApi(allocations: { jarId: number; amount: number }[]) {
		return request.post('piggy-bank/pool', { allocations })
	},
}

export default Api
