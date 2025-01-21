import { CustomTimePicker, type Issue } from '@/components/custom-time-picker';
import { routineType } from '@/daily/page';

const TotalType = ['reading', 'frontEnd', 'review', 'TED', 'strength', 'aerobic', 'LTN'];
const StudyType = ['frontEnd', 'LTN'];
const ReadType = ['reading'];

interface CustomTimePickerListProps {
    list: Issue[],
    routineTypes: routineType[],
    setList: (list: Issue[]) => void,
    freshTime: (obj: { [key: string]: number }) => void
}

export default function CustomTimePickerList({ list, routineTypes, setList, freshTime }: CustomTimePickerListProps) {

    function calculate(arr: Issue[] = list) {
        const res = { total: 0, read: 0, study: 0 };
        arr.forEach((it) => {
            const type = routineTypes.find((type) => type.id === +it.type)?.type;
            if (!type) return;
            if (TotalType.includes(type)) {
                res.total += it.duration;
            }
            if (ReadType.includes(type)) {
                res.read += it.duration;
            }
            if (StudyType.includes(type)) {
                res.study += it.duration;
            }
        });
        return res;
    }

    const handleIssueUPdate = (currentIssue: Issue) => {
        const currentIndex = list.findIndex((it) => it.id === currentIssue.id);
        // 修改
        if (currentIndex > -1) {
            if (currentIndex >= 1) {
                const preIssue = list[currentIndex - 1];
                const interval = currentIssue.startTime.diff(preIssue.endTime, 'minute');
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
        freshTime(calculate(list));
    }
    return <>
        {list.map((it, index) => <CustomTimePicker routineTypes={routineTypes} init={it} key={index} onIssue={handleIssueUPdate} />)}</>
}