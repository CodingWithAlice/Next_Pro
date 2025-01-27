import { Dayjs } from 'dayjs'
import request from '../../../lib/request'

const Api = {
	getRoutineApi(params?: { [key: string]: string | number | boolean }) {
		return request.get('routine', params)
	},

	postDailyApi(data: { [key: string]: string | number | boolean }[]) {
		return request.postList('daily', data)
	},
	getDailyApi(date: string) {
		return request.get('daily', { date })
	},

	postIssueApi(data: { [key: string]: string | number | Dayjs | Date }) {
		return request.post('daily/issue', data)
	},

	getWeekApi(serialNumber: number) {
		return request.get('week', { serialNumber })
	},
	postWeekApi(data: { [key: string]: string | number }) {
		return request.post('week', data)
	},
}

export default Api
