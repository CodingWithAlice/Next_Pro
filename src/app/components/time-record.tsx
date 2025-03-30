import { FormatDateToMonthDayWeek, formatMinToHM } from '@/components/tool';
import { type Issue } from '@/components/custom-time-picker';
import { routineType } from '@/daily/page';
import { Radio, RadioChangeEvent, Tag } from 'antd';
import { useState } from 'react';
import TimeRecordDayPicker from './time-record-day-picker';
import { modeType } from 'config';

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
    const [mode, setMode] = useState<modeType>('allDay');
    const onRadioChange = ({ target: { value } }: RadioChangeEvent) => {
        setMode(value);
        setIssues(issues)
    }

    return (<div className='wrap-week'>
        <b>一、时间统计</b>
        <p>总计：{formatMinToHM(total)}
            (阅读：{formatMinToHM(read)}
            <span className='front-time'>前端：{formatMinToHM(study)}</span>)
        </p>
        <FormatDateToMonthDayWeek />
        <Radio.Group
            value={mode}
            options={[
                { value: 'allDay', label: <Tag color="green">自学模式</Tag> },
                { value: 'workDay', label: <Tag color="green">工作模式</Tag> },
            ]}
            onChange={onRadioChange}
        />
        <TimeRecordDayPicker issues={issues} setIssues={setIssues} routineType={routineType} total={total} study={study} ltnTotal={ltnTotal} onChange={onChange} mode={mode} />
    </div>)

}