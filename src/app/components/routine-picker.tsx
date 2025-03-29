import { Input, Select } from "antd";
import dayjs from "dayjs";
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

    const handleChange = (daySort: number, value: string| number | dayjs.Dayjs | null, changeType: keyof Issue) => {
        if (onIssue) {
            onIssue({ ...init, daySort, [changeType]: value });
        }
    }

    return (
        <div className='time-picker' key={init.daySort}>
            <Input suffix="m(分)" defaultValue="m" value={init.duration} style={{ width: 150 }} onChange={(e) => handleChange(init.daySort, +e.target.value, 'duration')} />
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