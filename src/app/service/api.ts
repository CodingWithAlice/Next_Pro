import request from '../../../lib/request'

const Api = {
  getRoutineApi(params?: { [key: string]: string | number | boolean }) {
    return request.get('routine', params)
  },
  postDailyApi(data: { [key: string]: string | number | boolean }[]) {
    return request.post('daily', data)
  },
}

export default Api
