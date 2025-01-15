import axios, { AxiosResponse } from 'axios'

const url = process.env.API_URL || 'http://localhost:3000/api'

async function get(
  api: string,
  params?: { [key: string]: string | number | boolean }
) {
  try {
    const response: AxiosResponse = await axios.get(`${url}/${api}`, { params })
    return response.data
  } catch (error) {
    console.error('请求出错:', error)
    throw error
  }
}

async function post(
  api: string,
  data: { [key: string]: string | number | boolean }[]
) {
  return await axios.post(`${url}/${api}`, { data })
}

// function update(url: string, data: any) {
//   return axios.put(url, data)
// }

const request = {
  get,
  post,
  //   update,
}

export default request
