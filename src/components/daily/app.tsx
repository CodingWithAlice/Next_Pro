import { useEffect, useState } from 'react';
import { Button } from 'antd';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import './app.css';
import YesterDay from './components/yesterday';
import { CustomTimePicker, type Issue } from './components/custom-time-picker';

const now = dayjs();
dayjs.extend(weekOfYear);

const TotalType = ['READ', 'STUDY', 'REVIEW', 'TED', 'SPORT'];
const StudyType = ['STUDY'];
const ReadType = ['READ', 'TED'];

function Time({ total, read, study, onChange }: { total: number, read: number, study: number, onChange: (obj: { [key: string]: number }) => void }) {
    const initialIssue = {
        startTime: dayjs(),
        endTime: dayjs().add(1, 'second'),
        type: '',
        id: 0,
        duration: 0,
    };
    const [issues, setIssues] = useState<Issue[]>([]);
    const [lastIssueId, setLastIssueId] = useState(0);
    const handleAdd = () => {
        setLastIssueId(lastIssueId + 1);
    }
    const handleIssueUPdate = (newIssue: Issue) => {
        const newIndex = issues.findIndex((it) => it.id === newIssue.id);
        if (newIndex > -1) {
            issues.splice(newIndex, 1, newIssue);
            setIssues([...issues]);
        } else {
            setIssues([...issues, newIssue]);
        }
        onChange(calculate());

        function calculate() {
            const res = { total: 0, read: 0, study: 0 };
            issues.forEach((it) => {
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

    useEffect(() => {
        const newIssues = [...issues, { ...initialIssue, id: lastIssueId + 1 }];
        setIssues(newIssues);
    }, [lastIssueId])

    return (<div className='outer'>
        <h2>一、时间统计</h2>
        <p>总计：{total}m
            &nbsp;(阅读{read}m&nbsp;
            <span style={{ backgroundColor: 'yellow' }}>前端{study}m</span>)
        </p>
        <YesterDay />
        {issues.map((it, index) => <CustomTimePicker {...it} key={index} onIssue={handleIssueUPdate} />)}
        <Button className='btn' onClick={handleAdd}>添加一项</Button>
    </div>)
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

