import { Select, TimePicker } from "antd";
import dayjs from "dayjs";

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

interface CustomTimePickerProps extends Issue {
    onIssue?: (issue: Issue) => void;
}

interface Issue {
    startTime: dayjs.Dayjs;
    endTime: dayjs.Dayjs;
    type: string;
    id: number;
    duration: number;
}

function CustomTimePicker({ startTime, endTime, type, id, duration, onIssue }: CustomTimePickerProps) {
    const handleChange = (id: number, value: string | dayjs.Dayjs | null, changeType: keyof Issue) => {
        const newIssue = { startTime, endTime, type, id, duration, [changeType]: value };
        const dur = (newIssue.endTime as dayjs.Dayjs).diff(newIssue.startTime as dayjs.Dayjs, 'minute');
        if (onIssue) {
            onIssue({ ...newIssue, duration: dur });
        }
    }

    return (
        <div className='time-picker' key={id}>
            {['startTime', 'endTime'].map((timeType, index) => {
                return <>
                    <TimePicker
                        key={id}
                        format='HH:mm'
                        value={timeType === 'startTime' ? startTime : endTime}
                        onChange={(value) => handleChange(id, value, timeType as keyof Issue)}
                        needConfirm={false} />
                    {index === 0 && <>-
                        <span className='duration'>{duration}m</span>{` ->`}</>}
                </>
            })}
            <Select
                value={type}
                options={options}
                onChange={value => handleChange(id, value, 'type')}
                size='middle'
                className='select' />
        </div>
    );
}

export { CustomTimePicker };
export type { Issue };