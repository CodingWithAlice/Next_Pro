import { Select, TimePicker } from "antd";
import dayjs from "dayjs";
import { formatMinToHM, getGapTime } from "./tool";
import classNames from "classnames";
import { routineType } from '@/daily/page';
import config from "config";

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

    const isWorkType = +init.type === +config.workId; // 判断是否为工作类型

    const handleChange = (daySort: number, value: string | number | dayjs.Dayjs | null, changeType: keyof Issue) => {
        const newIssue = { ...init, daySort, [changeType]: value };
        
        // 如果是工作类型且修改的是时间，同时更新 startTime 和 endTime
        if (+newIssue.type === +(config.workId) && (changeType === 'startTime' || changeType === 'endTime')) {
            const timeValue = value as dayjs.Dayjs;
            if (timeValue) {
                newIssue.startTime = timeValue;
                newIssue.endTime = timeValue;
                newIssue.duration = 0; // 工作类型 duration 为 0
            }
        } else {
            // 优化：如果开始时间大于结束时间，则结束时间+1分钟
            if (changeType === 'startTime' && newIssue.endTime.isBefore(newIssue.startTime)) {
                newIssue.endTime = newIssue.startTime.add(1, 'minute');
            }
            const dur = getGapTime(newIssue.startTime, newIssue.endTime, 'minute');
            newIssue.duration = dur;
        }

        // 如果切换类型，需要处理
        if (changeType === 'type') {
            if (+(value ?? '') === +(config.workId)) {
                // 切换到工作类型，设置时间相同
                const currentTime = newIssue.startTime || dayjs();
                newIssue.startTime = currentTime;
                newIssue.endTime = currentTime;
                newIssue.duration = 0;
            } else if (+init.type === +(config.workId)) {
                // 从工作类型切换到其他类型，需要设置结束时间
                if (newIssue.endTime.isSame(newIssue.startTime)) {
                    newIssue.endTime = newIssue.startTime.add(1, 'minute');
                }
                newIssue.duration = getGapTime(newIssue.startTime, newIssue.endTime, 'minute');
            }
        }

        if (onIssue) {
            if (changeType !== 'duration') {
                onIssue(newIssue);
                return;
            }
            onIssue(newIssue)
        }
    }
    const intervalClass = classNames({
        'purple': init.interval > init.duration
    })

    return (
        <div className='time-picker' key={init.daySort}>
            {isWorkType ? (
                // 工作类型：只显示一个时间选择器
                <div className='time-picker-item'>
                    <TimePicker
                        className="picker"
                        format='HH:mm'
                        value={init.startTime}
                        onChange={(value) => handleChange(init.daySort, value, 'startTime')}
                        needConfirm={false} />
                </div>
            ) : (
                // 非工作类型：显示两个时间选择器
                ['startTime', 'endTime'].map((timeType, index) => {
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
                })
            )}
            <Select
                value={init.type}
                options={options}
                onChange={value => handleChange(init.daySort, value, 'type')}
                size='middle'
                className="routine-select" />
            {<span className={`${intervalClass} interval phone-hidden`}> {!!init.interval && formatMinToHM(init.interval)}</span>}
        </div >
    );
}

export { CustomTimePicker };
export type { Issue };