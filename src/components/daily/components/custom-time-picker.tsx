import { Select, TimePicker } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

enum TypeEnum {
    READ = '阅读',
    STUDY = '前端',
    REVIEW = '复盘',
    TED = 'TED',
    SPORT = '运动',
    SLEEP = '睡眠',
    MOVIE = '电影',
}

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
    const options = Object.keys(TypeEnum).map(key => ({ value: key, label: TypeEnum[key as keyof typeof TypeEnum] }));
    const [init, setInit] = useState<Issue>({ startTime, endTime, type, id, duration });

    const handleChange = (id: number, value: string | dayjs.Dayjs | null, type: keyof Issue) => {
        const newIssue = { ...init, [type]: value };
        const dur = (newIssue.endTime as dayjs.Dayjs).diff(newIssue.startTime as dayjs.Dayjs, 'minute');
        setInit({ ...newIssue, duration: dur });
    }

    useEffect(() => {
        // if (onIssue) onIssue(init);
        console.log(11111, init);
    }, [init, onIssue]);

    return (
        <div className='time-picker' key={init.id}>
            {['startTime', 'endTime'].map((key, index) => {
                return <>
                    <TimePicker
                        key={init.id}
                        format='HH:mm'
                        value={init[key as keyof Issue] as dayjs.Dayjs}
                        onChange={(value) => handleChange(init.id, value, key as keyof Issue)}
                        needConfirm={false} />
                    {index === 0 && <>-
                        <span className='duration'>{init.duration}m</span>{` ->`}</>}
                </>
            })}
            <Select
                value={init.type}
                options={options}
                onChange={value => handleChange(init.id, value, 'type')}
                size='middle'
                className='select' />
        </div>
    );
}

export { CustomTimePicker };
export type { Issue };