import { useEffect, useState } from 'react';
import { Button } from 'antd';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import './app.css';
import {YesterDay, showTime} from './components/tool';
import { CustomTimePicker, type Issue } from './components/custom-time-picker';

const now = dayjs();
dayjs.extend(weekOfYear);
const initialIssue = {
    startTime: dayjs(),
    endTime: dayjs().add(1, 'second'),
    type: '',
    id: 0,
    duration: 0,
};

const TotalType = ['READ', 'STUDY', 'REVIEW', 'TED', 'SPORT'];
const StudyType = ['STUDY'];
const ReadType = ['READ', 'TED'];

function Time({ total, read, study, onChange }: { total: number, read: number, study: number, onChange: (obj: { [key: string]: number }) => void }) {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [lastIssueId, setLastIssueId] = useState(0);

    const handleAddIssue = () => {
        setLastIssueId(lastIssueId + 1);
    }
    const handleIssueUPdate = (currentIssue: Issue) => {
        const currentIndex = issues.findIndex((it) => it.id === currentIssue.id);
        if (currentIndex > -1) {
            if (currentIndex >= 1) {
                const interval = currentIssue.startTime.diff(issues[currentIndex - 1].endTime, 'minute');
                issues[currentIndex - 1].interval = interval;
            }
            // 更新
            issues.splice(currentIndex, 1, currentIssue);
            setIssues([...issues]);
        } else {
            // 添加
            setIssues([...issues, currentIssue]);
        }
        // 任意一项更新，都重新计算总计时间
        onChange(calculate(issues));
    }

    useEffect(() => {
        const newIssues = [...issues, { ...initialIssue, id: lastIssueId + 1, interval: 0 }];
        setIssues(newIssues);
    }, [lastIssueId])

    return (<div className='outer'>
        <h2>一、时间统计</h2>
        <p>总计：{showTime(total)}
            (阅读：{showTime(read)}
            <span style={{ backgroundColor: 'yellow' }}>前端：{showTime(study)}</span>)
        </p>
        <YesterDay />
        {issues.map((it, index) => <CustomTimePicker init={it} key={index} onIssue={handleIssueUPdate} />)}
        <Button className='btn' onClick={handleAddIssue}>添加一项</Button>
    </div>)

    function calculate(arr: Issue[] = issues) {
        const res = { total: 0, read: 0, study: 0 };
        arr.forEach((it) => {
            if (TotalType.includes(it.type)) {
                res.total += it.duration;
            }
            if (ReadType.includes(it.type)) {
                res.read += it.duration;
            }
            if (StudyType.includes(it.type)) {
                res.study += it.duration;
            }
        });
        return res;
    }
}
function Issue() {
    return (<div className='outer'>
        <h2>二、事项统计</h2>
        <YesterDay />
    </div>)
}
export default function Daily() {
    const [total, setTotal] = useState(0);
    const [read, setRead] = useState(0);
    const [study, setStudy] = useState(0);

    const handleFunc = (valueObj: { [key: string]: number }) => {
        Object.entries(valueObj).forEach(([type, value]) => {
            switch (type) {
                case 'total':
                    setTotal(value);
                    break;
                case 'read':
                    setRead(value);
                    break;
                case 'study':
                    setStudy(value);
                    break;
            }
        });
    }

    return (<>
        <h1 style={{ textAlign: 'center' }}>Week {now.week()}</h1>
        <div className="daily">
            <Time total={total} read={read} study={study} onChange={handleFunc} />
            <Issue />
        </div></>)
}

