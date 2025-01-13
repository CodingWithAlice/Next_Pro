import request from '../../../lib/request'

const Api = {
  getDailyApi(params?: { [key: string]: string | number | boolean }) {
    return request.get('daily', params)
  },
}

export default Api
