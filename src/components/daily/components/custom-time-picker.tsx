import { Select, TimePicker } from "antd";
import dayjs from "dayjs";
import { showTime } from "./tool";

enum TypeEnum {
    READ = '阅读',
    STUDY = '前端',
    REVIEW = '复盘',
    TED = 'TED',
    SPORT = '运动',
    SLEEP = '睡眠',
    MOVIE = '电影',
}
const options = Object.keys(TypeEnum).map(key => ({
    value: key,
    label: TypeEnum[key as keyof typeof TypeEnum]
}));

interface CustomTimePickerProps {
    onIssue?: (issue: Issue) => void;
    init: Issue;
}

interface Issue {
    startTime: dayjs.Dayjs;
    endTime: dayjs.Dayjs;
    type: string;
    id: number;
    duration: number;
    interval: number;
}

function CustomTimePicker({ init, onIssue }: CustomTimePickerProps) {
    const handleChange = (id: number, value: string | dayjs.Dayjs | null, changeType: keyof Issue) => {
        const newIssue = { ...init, id, [changeType]: value };
        const dur = (newIssue.endTime as dayjs.Dayjs).diff(newIssue.startTime as dayjs.Dayjs, 'minute');
        if (onIssue) {
            onIssue({ ...newIssue, duration: dur });
        }
    }

    return (
        <div className='time-picker' key={init.id}>
            {['startTime', 'endTime'].map((timeType, index) => {
                return <div key={`${init.id}-${timeType}`}>
                    <TimePicker
                        key={init.id}
                        format='HH:mm'
                        value={init[timeType as keyof Issue] as dayjs.Dayjs}
                        onChange={(value) => handleChange(init.id, value, timeType as keyof Issue)}
                        needConfirm={false}
                        style={{width: 88}} />
                    {index === 0 && <>-
                        <span className='duration'>{showTime(init.duration)}</span>{` ->`}</>}
                </div>
            })}
            &nbsp;
            <Select
                value={init.type}
                options={options}
                onChange={value => handleChange(init.id, value, 'type')}
                size='middle'
                className='select' />
            &nbsp;
            {!!init.interval && <span className={init.interval > init.duration ? 'purple' : ''}>{showTime(init.interval)}</span>}
        </div>
    );
}

export { CustomTimePicker };
export type { Issue };