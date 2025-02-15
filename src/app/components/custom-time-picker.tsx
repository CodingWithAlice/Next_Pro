import { Select, TimePicker } from "antd";
import dayjs from "dayjs";
import { formatMinToHM, getGapTime } from "./tool";
// import classNames from "classnames";
import './component.css';
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
    const options = routineTypes.map((type:routineType) => ({
        value: type.id,
        label: type.des,
    }));

    const handleChange = (daySort: number, value: string | dayjs.Dayjs | null, changeType: keyof Issue) => {        
        const newIssue = { ...init, daySort, [changeType]: value };
        // 优化：如果开始时间大于结束时间，则结束时间+1分钟
        if(changeType === 'startTime' && newIssue.endTime.isBefore(newIssue.startTime)) {
            newIssue.endTime = newIssue.startTime.add(1, 'minute');
        }

        const dur = getGapTime(newIssue.startTime, newIssue.endTime, 'minute');
        if (onIssue) {
            onIssue({ ...newIssue, duration: dur });
        }
    }
    // const intervalClass = classNames({
    //     'purple': init.interval > init.duration
    // })

    return (
        <div className='time-picker' key={init.daySort}>
            {['startTime', 'endTime'].map((timeType, index) => {
                return <div key={`${init.daySort}-${timeType}`}>
                    <TimePicker
                        key={init.daySort}
                        className="picker"
                        format='HH:mm'
                        value={init[timeType as keyof Issue] as dayjs.Dayjs}
                        onChange={(value) => handleChange(init.daySort, value, timeType as keyof Issue)}
                        needConfirm={false} />
                    {index === 0 && <>-
                        <span className='duration'>{formatMinToHM(init.duration)}</span>{` ->`}</>}
                </div>
            })}
            &nbsp;
            <Select
                value={init.type}
                options={options}
                onChange={value => handleChange(init.daySort, value, 'type')}
                size='middle'
                className='select' />
            &nbsp;
            {/* {!!init.interval && <span className={intervalClass}>{formatMinToHM(init.interval)}</span>} */}
        </div>
    );
}

export { CustomTimePicker };
export type { Issue };