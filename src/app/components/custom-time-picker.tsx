import { Select, TimePicker } from "antd";
import dayjs from "dayjs";
import { formatMinToHM, getGapTime } from "./tool";
import classNames from "classnames";
import { routineType } from '@/daily/page';

interface CustomTimePickerProps {
    onIssue?: (issue: Issue) => void;
    init: Issue;
    routineTypes: routineType[];
}

interface Issue {
    startTime: dayjs.Dayjs;
    endTime: dayjs.Dayjs;
    type: string;
    daySort: number;
    duration: number;
    interval: number;
}

function CustomTimePicker({ init, onIssue, routineTypes }: CustomTimePickerProps) {
    const options = routineTypes.map((type: routineType) => ({
        value: type.id,
        label: type.des,
    }));

    const handleChange = (daySort: number, value: string | dayjs.Dayjs | null, changeType: keyof Issue) => {
        const newIssue = { ...init, daySort, [changeType]: value };
        // 优化：如果开始时间大于结束时间，则结束时间+1分钟
        if (changeType === 'startTime' && newIssue.endTime.isBefore(newIssue.startTime)) {
            newIssue.endTime = newIssue.startTime.add(1, 'minute');
        }

        const dur = getGapTime(newIssue.startTime, newIssue.endTime, 'minute');
        if (onIssue) {
            onIssue({ ...newIssue, duration: dur });
        }
    }
    const intervalClass = classNames({
        'purple': init.interval > init.duration
    })

    return (
        <div className='time-picker' key={init.daySort}>
            {['startTime', 'endTime'].map((timeType, index) => {
                return <div key={`${init.daySort}-${timeType}`} className={index === 0 ? 'time-picker-item' : ''
                }>
                    <TimePicker
                        key={init.daySort}
                        className="picker"
                        format='HH:mm'
                        value={init[timeType as keyof Issue] as dayjs.Dayjs}
                        onChange={(value) => handleChange(init.daySort, value, timeType as keyof Issue)}
                        needConfirm={false} />
                    {index === 0 && <div className='duration'>
                        <span className="phone-hidden">-</span>
                        <span className="duration-time"> {formatMinToHM(init.duration)}</span>
                        <span className="phone-hidden">{'->'}</span>
                    </div>}
                </div>
            })}
            <Select
                value={init.type}
                options={options}
                onChange={value => handleChange(init.daySort, value, 'type')}
                size='middle'
                className="routine-select" />
            {!!init.interval && <span className={`${intervalClass} interval phone-hidden`}> {formatMinToHM(init.interval)}</span>}
        </div >
    );
}

export { CustomTimePicker };
export type { Issue };