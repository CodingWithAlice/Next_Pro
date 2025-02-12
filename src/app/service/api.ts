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

    getSerial() {return request.get('serial')},

    getMonthApi(monthId: number) {
		return request.get('month', { monthId })
	},
    getMonthDetailApi(serialNumber: string) {
		return request.get('month/detail', { serialNumber })
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
    }
}

export default Api
