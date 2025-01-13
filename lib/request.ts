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

// function post(url: string, data: any) {
//     return axios.post(url, data);
// }

// function update(url: string, data: any) {
//     return axios.put(url, data);
// }

export default {
  get,
  // post,
  //  update
  //
}
