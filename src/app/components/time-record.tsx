import { FormatDateToMonthDayWeek, formatMinToHM } from '@/components/tool';
import { type Issue } from '@/components/custom-time-picker';
import { routineType } from '@/daily/page';
import TimeRecordDayPicker from './time-record-day-picker';
import { Switch, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const WORK_MODE_TIP = '默认添加 9:00、18:00';

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
    return (
        <div className="daily-panel daily-panel--time">
            <header className="daily-panel__head">
                <h2 className="daily-panel__title">一、时间统计</h2>
                <p className="daily-panel__meta">
                    总计：{formatMinToHM(total)}
                    {' '}(阅读：{formatMinToHM(read)}
                    {' '}
                    <span className="front-time">前端：{formatMinToHM(study)}</span>)
                </p>
                <FormatDateToMonthDayWeek />
            </header>
            <div className="daily-panel__body">
                <div className="work-mode-row">
                    <span className="work-mode-label">工作模式</span>
                    <Tooltip title={WORK_MODE_TIP} placement="top">
                        <InfoCircleOutlined className="work-mode-tip-icon" />
                    </Tooltip>
                    <Switch checked={workMode} onChange={onWorkModeChange} size="small" />
                </div>
                <TimeRecordDayPicker
                    issues={issues}
                    setIssues={setIssues}
                    routineType={routineType}
                    total={total}
                    study={study}
                    ltnTotal={ltnTotal}
                    onChange={onChange}
                />
            </div>
        </div>
    );
}
