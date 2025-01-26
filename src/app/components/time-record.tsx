import { FormatDateToMonthDayWeek, formatMinToHM, getYesterdayDate, useStyle } from '@/components/tool';
import { Button, Space, ConfigProvider, message } from 'antd';
import Api from '@/service/api';
import { AntDesignOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { routineType } from '@/daily/page';
import dayjs from 'dayjs';
import CustomTimePickerList from './custom-time-picker-list';
import { type Issue } from '@/components/custom-time-picker';

interface TimeRecordProps {
    total: number,
    read: number,
    study: number,
    onChange: (obj: { [key: string]: number }) => void
}

interface DailyDataProps {
    date: string,
    daySort: number,
    duration: number,
    endTime: string,
    id: number,
    interval: number,
    routineTypeId: number,
    startTime: string,
    weekday: string
}

export default function TimeRecord({ total, read, study, onChange }: TimeRecordProps) {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [routineType, setRoutineType] = useState<routineType[]>([]);
    const { styles } = useStyle();
    const [messageApi, contextHolder] = message.useMessage();

    const handleAddIssue = () => {
        const suggestTime = issues[issues.length - 1]?.endTime || dayjs()
        const newIssue = {
            startTime: suggestTime,
            endTime: suggestTime.add(1, 'minute'),
            type: '',
            id: issues.length,
            duration: 0,
            interval: 0
        };
        setIssues([...issues, newIssue]);
    }

    const handleSave = () => {
        const transIssues = issues.map((it, index) => {
            const { ...rest } = it;
            return {
                ...rest,
                ...getYesterdayDate(),
                routineTypeId: it.type,
                startTime: it.startTime.format('HH:mm:ss'),
                endTime: it.endTime.format('HH:mm:ss'),
                daySort: index,
            }
        });
        Api.postDailyApi(transIssues).then(() => {
            messageApi.open({
                type: 'success',
                content: '保存成功',
            });
        })
    }

    useEffect(() => {
        Api.getDailyApi(dayjs().subtract(1, 'day').format('YYYY-MM-DD')).then(({ routineData, dailyData }) => {
            const routine = routineData.filter((it: routineType) => !it.type.includes('total'));
            setRoutineType(routine);
            setIssues(dailyData.map((data: DailyDataProps) => ({
                ...data,
                startTime: dayjs(`${data.date} ${data.startTime}`),
                endTime: dayjs(`${data.date} ${data.endTime}`),
                type: data.routineTypeId
            })));
        })
    }, []);

    return (<div className='wrap'>
        {contextHolder}
        <b>一、时间统计</b>
        <p>总计：{formatMinToHM(total)}
            (阅读：{formatMinToHM(read)}
            <span className='front'>前端：{formatMinToHM(study)}</span>)
        </p>
        <FormatDateToMonthDayWeek />
        <CustomTimePickerList
            list={issues}
            routineTypes={routineType}
            setList={setIssues}
            freshTime={onChange} />
        <ConfigProvider
            button={{
                className: styles.linearGradientButton,
            }}
        >
            <Space className='btn-group'>
                <Button onClick={handleAddIssue}>添加一项</Button>
                <Button onClick={handleSave} type="primary" icon={<AntDesignOutlined />}>
                    保存
                </Button>
            </Space>
        </ConfigProvider>
    </div>)

}