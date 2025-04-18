import { CustomTimePicker, type Issue } from '@/components/custom-time-picker';
import { routineType } from '@/daily/page';
import { getGapTime } from './tool';
import { modeType } from 'config';

interface CustomTimePickerListProps {
    list: Issue[],
    routineTypes: routineType[],
    setList: (list: Issue[]) => void,
    freshTime: (arr: Issue[]) => void,
    mode: modeType
}

export default function CustomTimePickerList({ list, routineTypes, setList, freshTime, mode }: CustomTimePickerListProps) {
    const handleIssueUPdate = (currentIssue: Issue) => {
        const currentIndex = list.findIndex((it) => it.daySort === currentIssue.daySort);
        // 修改
        if (currentIndex > -1) {
            if (currentIndex >= 1) {
                const preIssue = list[currentIndex - 1];
                const interval = getGapTime(preIssue.endTime, currentIssue.startTime, 'minute');
                // 更新上一项的间隔时间
                preIssue.interval = interval;
            }
            list.splice(currentIndex, 1, currentIssue);
            setList([...list]);
        } else {
            // 添加
            setList([...list, currentIssue]);
        }
        // 任意一项更新，都重新计算总计时间
        freshTime(list);
    }
    return <>
        {list.map((it, index) => <CustomTimePicker routineTypes={routineTypes} init={it} key={index} onIssue={handleIssueUPdate} mode={mode} />)}</>
}