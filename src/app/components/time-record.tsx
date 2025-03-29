import { FormatDateToMonthDayWeek, formatMinToHM } from '@/components/tool';
import TimeRecordPicker from './time-record-picker';
import { type Issue } from '@/components/custom-time-picker';
import { routineType } from '@/daily/page';

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
    return (<div className='wrap-week'>
        <b>一、时间统计</b>
        <p>总计：{formatMinToHM(total)}
            (阅读：{formatMinToHM(read)}
            <span className='front-time'>前端：{formatMinToHM(study)}</span>)
        </p>
        <FormatDateToMonthDayWeek />
        <TimeRecordPicker issues={issues} setIssues={setIssues} routineType={routineType} total={total} study={study} ltnTotal={ltnTotal} onChange={onChange} />
    </div>)

}