import { CustomTimePicker, type Issue } from '@/components/custom-time-picker';
import { routineType } from '@/daily/page';
import { getGapTime } from './tool';
import config from 'config';

interface CustomTimePickerListProps {
    list: Issue[],
    routineTypes: routineType[],
    setList: (list: Issue[]) => void,
    freshTime: (arr: Issue[]) => void
}

// 按照开始时间排序
function sortIssuesByStartTime(issues: Issue[]): Issue[] {
    return [...issues].sort((a, b) => {
        // 比较开始时间
        const diff = a.startTime.diff(b.startTime, 'minute');
        if (diff !== 0) {
            return diff;
        }
        // 如果开始时间相同，保持原有顺序（通过 daySort）
        return a.daySort - b.daySort;
    });
}

export default function CustomTimePickerList({ list, routineTypes, setList, freshTime }: CustomTimePickerListProps) {
    // 对列表按开始时间排序
    const sortedList = sortIssuesByStartTime(list);

    const handleIssueUPdate = (currentIssue: Issue) => {
        // 创建新列表副本
        const newList = [...list];
        const originalIndex = newList.findIndex((it) => it.daySort === currentIssue.daySort);
        
        // 更新列表
        if (originalIndex > -1) {
            newList[originalIndex] = currentIssue;
        } else {
            newList.push(currentIssue);
        }

        // 重新排序
        const newSortedList = sortIssuesByStartTime(newList);
        
        // 更新 daySort 以保持正确的排序顺序
        const updatedList = newSortedList.map((it, index) => ({
            ...it,
            daySort: index
        }));

        // 重新计算间隔时间
        updatedList.forEach((it, index) => {
            if (index >= 1) {
                const preIssue = updatedList[index - 1];
                // 计算间隔时间 - 单一选择器时，开始结束时间一致
                const pretendEndTime = +preIssue.type === +config.workId 
                    ? preIssue.startTime 
                    : preIssue.endTime;
                const interval = getGapTime(pretendEndTime, it.startTime, 'minute');
                // 更新上一项的间隔时间
                updatedList[index - 1].interval = interval;
            } else {
                // 第一项间隔时间为 0
                updatedList[index].interval = 0;
            }
        });

        setList(updatedList);
        // 任意一项更新，都重新计算总计时间
        freshTime(updatedList);
    }
    
    return <>
        {sortedList.map((it, index) => (
            <CustomTimePicker 
                routineTypes={routineTypes} 
                init={it} 
                key={it.daySort} 
                onIssue={handleIssueUPdate} 
            />
        ))}
    </>
}