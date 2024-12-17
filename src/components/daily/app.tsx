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

function Time({ total, read, study, onChange }: { total: number, read: number, study: number, onChange: (value: number, type: string) => void }) {
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
        console.log('lastIssueId=', lastIssueId);

        setLastIssueId(lastIssueId + 1);
    }
    const handleIssueUPdate = (newIssue: Issue) => {
        console.log(1111, newIssue);
        const newIndex = issues.findIndex((it) => it.id === newIssue.id);
        if (newIndex > -1) {
            issues.splice(newIndex, 1, newIssue);
            setIssues([...issues]);
        } else {
            setIssues([...issues, newIssue]);
        }
        if (TotalType.includes(newIssue.type)) {
            onChange(issues.reduce((acc, cur) => acc + cur.duration, 0), 'total');
        }
        if (StudyType.includes(newIssue.type)) {
            onChange(issues.reduce((acc, cur) => acc + cur.duration, 0), 'study');
        }
        if (ReadType.includes(newIssue.type)) {
            onChange(issues.reduce((acc, cur) => acc + cur.duration, 0), 'read');
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

    const handleFunc =(value: number,type:string)=>{
        switch(type){
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
    }

    return (<>
        <h1 style={{ textAlign: 'center' }}>Week {now.week()}</h1>
        <div className="daily">
            <Time total={total} read={read} study={study} onChange={handleFunc} />
            <Issue />
        </div></>)
}

