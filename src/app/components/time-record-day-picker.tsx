import { getYesterdayDate, formatTime, getCurrentBySub } from '@/components/tool';
import { Button, Space, message } from 'antd';
import config from 'config';
import { useSearchParams } from 'next/navigation';
import CustomTimePickerList from './custom-time-picker-list';
import Api from '@/service/api';
import { AntDesignOutlined } from '@ant-design/icons';
import { type Issue } from '@/components/custom-time-picker';
import { routineType } from '@/daily/page';

interface TimeRecordPickerProps {
    total: number,
    study: number,
    ltnTotal: number,
    routineType: routineType[],
    issues: Issue[],
    setIssues: (issues: Issue[]) => void,
    onChange: (arr: Issue[]) => void
}

export default function TimeRecordDayPicker({ issues, setIssues, routineType, total, study, ltnTotal, onChange }: TimeRecordPickerProps) {
    const [messageApi, contextHolder] = message.useMessage();
    const urlParams = useSearchParams();
    const urlDate = urlParams?.get('date');

    const handleAddIssue = () => {
        const lastIssue = issues[issues.length - 1];
        // 如果最后一项是工作类型，使用 startTime（因为 startTime === endTime）
        // 否则使用 endTime
        const suggestTime = lastIssue 
            ? (+lastIssue.type === +(config.workId) ? lastIssue.startTime : lastIssue.endTime)
            : getCurrentBySub();
        const newIssue = {
            startTime: suggestTime,
            endTime: suggestTime.add(1, 'minute'),
            type: '',
            daySort: issues.length,
            duration: 0,
            interval: 0
        };
        setIssues([...issues, newIssue]);
    }

    function addTotalIssue(issues: Issue[], totalTime: number, studyTime: number, ltnTotal: number): Issue[] {
        const length = issues.length;
        const totalIssue = {
            ...issues[0],
            startTime: getCurrentBySub(),
            endTime: getCurrentBySub(),
            interval: 0,
            id: null,
            ...getYesterdayDate(config.current, urlDate || ''),
        }
        return [...issues, {
            ...totalIssue,
            // 前端 total
            type: config.frontTotalId + '',
            daySort: length + 1,
            duration: formatTime(studyTime),
        }, {
            ...totalIssue,
            // 全部 total
            type: config.totalId + '',
            daySort: length + 2,
            duration: formatTime(totalTime)
        }, {
            ...totalIssue,
            // ltn total
            type: config.ltnTotalId + '',
            daySort: length + 3,
            duration: formatTime(ltnTotal)
        }]
    }

    const handleSave = () => {
        // 分离工作类型和其他类型
        const workIssues = issues.filter(it => +it.type === +(config.workId));
        const otherIssues = issues.filter(it => +it.type !== +(config.workId));
        
        // 处理工作类型：合并为一条记录（取最小开始时间和最大结束时间）
        let mergedWorkIssue: Issue | null = null;
        if (workIssues.length > 0) {
            const workTimes = workIssues.map(it => it.startTime).sort((a, b) => a.diff(b));
            const minTime = workTimes[0];
            const maxTime = workTimes[workTimes.length - 1];
            
            mergedWorkIssue = {
                ...workIssues[0],
                startTime: minTime,
                endTime: maxTime,
                duration: maxTime.diff(minTime, 'minute')
            };
        }

        // 合并所有项（工作项合并后 + 其他项）
        const mergedIssues = mergedWorkIssue 
            ? [...otherIssues, mergedWorkIssue]
            : otherIssues;

        const addTotal = addTotalIssue(mergedIssues, total, study, ltnTotal);
        const transIssues = addTotal.map((it, index) => {
            const { ...rest } = it;
            return {
                ...rest,
                ...getYesterdayDate(config.current, urlDate || ''),
                duration: formatTime(it.duration),
                routineTypeId: +it.type,
                startTime: it.startTime.format('HH:mm:ss'),
                endTime: it.endTime.format('HH:mm:ss'),
                daySort: index,
            }
        });
        Api.postDailyApi(transIssues).then(() => {
            messageApi.success('保存成功');
        }).catch((e) => {
            messageApi.error(e.message || '保存失败');
        })
    }

    return <>
        {contextHolder}
        {!!issues.length && <CustomTimePickerList
            key={issues[issues.length - 1].daySort}
            list={issues}
            routineTypes={routineType}
            setList={setIssues}
            freshTime={onChange} />}
        <Space className='btn-group'>
            <Button disabled={!routineType.length} onClick={handleAddIssue}>添加一项</Button>
            <Button disabled={!routineType.length} onClick={handleSave} icon={<AntDesignOutlined />}>
                保存
            </Button>
        </Space>
    </>
}