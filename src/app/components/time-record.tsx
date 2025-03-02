import { FormatDateToMonthDayWeek, formatMinToHM, getYesterdayDate, formatTime, getCurrentBySub } from '@/components/tool';
import { Button, Space, message } from 'antd';
import Api from '@/service/api';
import { AntDesignOutlined } from '@ant-design/icons';
import { routineType } from '@/daily/page';
import CustomTimePickerList from './custom-time-picker-list';
import { type Issue } from '@/components/custom-time-picker';
import config from 'config';
import { useSearchParams } from 'next/navigation';

interface TimeRecordProps {
    total: number,
    read: number,
    study: number,
    ltnTotal: number,
    routineType: routineType[],
    issues: Issue[],
    setIssues: (issues: Issue[]) => void,
    onChange: (arr: Issue[]) => void
}

export default function TimeRecord({ total, ltnTotal, read, study, onChange, routineType, issues, setIssues }: TimeRecordProps) {
    const [messageApi, contextHolder] = message.useMessage();
    const urlParams = useSearchParams();
    const urlDate = urlParams?.get('date');

    const handleAddIssue = () => {
        const suggestTime = issues[issues.length - 1]?.endTime || getCurrentBySub();
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
        const addTotal = addTotalIssue(issues, total, study, ltnTotal);
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

    return (<div className='wrap'>
        {contextHolder}
        <b>一、时间统计</b>
        <p>总计：{formatMinToHM(total)}
            (阅读：{formatMinToHM(read)}
            <span className='front'>前端：{formatMinToHM(study)}</span>)
        </p>
        <FormatDateToMonthDayWeek />
        {!!issues.length && <CustomTimePickerList
            key={issues[issues.length - 1].daySort}
            list={issues}
            routineTypes={routineType}
            setList={setIssues}
            freshTime={onChange} />}
        <Space className='btn-group'>
            <Button onClick={handleAddIssue}>添加一项</Button>
            <Button onClick={handleSave} icon={<AntDesignOutlined />}>
                保存
            </Button>
        </Space>
    </div>)

}