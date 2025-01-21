import { IssueRecordProps } from '@/components/tool';
import request from '../../../lib/request';

const Api = {
  getRoutineApi(params?: { [key: string]: string | number | boolean }) {
    return request.get('routine', params)
  },
  postDailyApi(data: { [key: string]: string | number | boolean }[]) {
    return request.postList('daily', data)
  },
  postIssueApi(data: IssueRecordProps) {
    return request.postIssue('daily/issue', data)
  },
}

export default Api
