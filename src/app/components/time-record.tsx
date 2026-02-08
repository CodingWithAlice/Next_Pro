import { FormatDateToMonthDayWeek, formatMinToHM } from '@/components/tool';
import { type Issue } from '@/components/custom-time-picker';
import { routineType } from '@/daily/page';
import TimeRecordDayPicker from './time-record-day-picker';
import { Switch } from 'antd';

interface TimeRecordProps {
    total: number,
    read: number,
    study: number,
    ltnTotal: number,
    routineType: routineType[],
    issues: Issue[],
    setIssues: (issues: Issue[]) => void,
    onChange: (arr: Issue[]) => void,
    workMode: boolean,
    onWorkModeChange: (v: boolean) => void
}

export default function TimeRecord({ total, ltnTotal, read, study, onChange, routineType, issues, setIssues, workMode, onWorkModeChange }: TimeRecordProps) {
    return (<div className='wrap-week'>
        <b>一、时间统计</b>
        <p>总计：{formatMinToHM(total)}
            (阅读：{formatMinToHM(read)}
            <span className='front-time'>前端：{formatMinToHM(study)}</span>)
        </p>
        <FormatDateToMonthDayWeek />
        <div className="work-mode-row">
            <span className="work-mode-label">工作模式</span>
            <Switch checked={workMode} onChange={onWorkModeChange} size="small" />
            {workMode && <span className="work-mode-hint">默认添加 9:00、18:00</span>}
        </div>
        <TimeRecordDayPicker issues={issues} setIssues={setIssues} routineType={routineType} total={total} study={study} ltnTotal={ltnTotal} onChange={onChange} />
    </div>)

}