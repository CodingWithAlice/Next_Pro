import { FormatDateToMonthDayWeek, formatMinToHM, getYesterdayDate, useStyle } from '@/components/tool';
import { Button, Space, ConfigProvider, message } from 'antd';
import Api from '@/service/api';
import { AntDesignOutlined } from '@ant-design/icons';
import { routineType } from '@/daily/page';
import dayjs from 'dayjs';
import CustomTimePickerList from './custom-time-picker-list';
import { type Issue } from '@/components/custom-time-picker';
import config from 'config';

interface TimeRecordProps {
    total: number,
    read: number,
    study: number,
    routineType: routineType[],
    issues: Issue[],
    setIssues: (issues: Issue[]) => void,
    onChange: (arr: Issue[]) => void
}

export default function TimeRecord({ total, read, study, onChange, routineType, issues, setIssues }: TimeRecordProps) {
    const { styles } = useStyle();
    const [messageApi, contextHolder] = message.useMessage();

    const handleAddIssue = () => {
        const suggestTime = issues[issues.length - 1]?.endTime || dayjs()
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

    function addTotalIssue(issues: Issue[], totalTime: number, studyTime: number): Issue[] {

        const length = issues.length;
        const totalIssue = {
            ...issues[0],
            startTime: dayjs(),
            endTime: dayjs(),
            interval: 0,
            id: null
        }
        return [...issues, {
            ...totalIssue,
            type: config.frontTotalId+ '',
            daySort: length + 1,
            duration: studyTime,
        }, {
            ...totalIssue,
            type: config.ltnTotalId + '',
            daySort: length + 2,
            duration: totalTime
        }]
    }

    const handleSave = () => {
        const addTotal = addTotalIssue(issues, total, study)
        const transIssues = addTotal.map((it, index) => {
            const { ...rest } = it;
            return {
                ...rest,
                ...getYesterdayDate(),
                routineTypeId: +it.type,
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