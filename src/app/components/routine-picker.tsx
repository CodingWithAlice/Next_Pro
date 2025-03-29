import { Input, Select } from "antd";
import dayjs from "dayjs";
import { getGapTime } from "./tool";
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

function RoutinePicker({ init, onIssue, routineTypes }: CustomTimePickerProps) {
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

    return (
        <div className='time-picker' key={init.daySort}>
            <Input suffix="m(分)" defaultValue="m" value={init.duration} style={{ width: 150 }} />
            <Select
                value={init.type}
                options={options}
                onChange={value => handleChange(init.daySort, value, 'type')}
                size='middle'
                className="routine-select" />
        </div >
    );
}

export { RoutinePicker };
export type { Issue };