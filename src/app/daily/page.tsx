"use client"
import { useEffect, useState } from 'react';
import { Button, Input } from 'antd';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import './app.css';
import { FormatDateToMonthDayWeek, formatMinToHM } from '@/components/tool';
import { CustomTimePicker, type Issue } from '@/components/custom-time-picker';
import ProcessCircle from '@/components/process-circle';
import Api from '../service/api';

const { TextArea } = Input;
const now = dayjs();
dayjs.extend(weekOfYear);

const TotalType = ['READ', 'STUDY', 'REVIEW', 'TED', 'SPORT'];
const StudyType = ['STUDY'];
const ReadType = ['READ', 'TED'];

function Time({ total, read, study, onChange }: { total: number, read: number, study: number, onChange: (obj: { [key: string]: number }) => void }) {
    const [issues, setIssues] = useState<Issue[]>([]);

    const handleAddIssue = () => {
        const suggestTime = issues[issues.length - 1]?.endTime || dayjs()
        const newIssue = {
            startTime: suggestTime,
            endTime: suggestTime.add(1, 'minute'),
            type: '',
            id: issues.length,
            duration: 0,
            interval: 0
        };
        setIssues([...issues, newIssue]);
    }

    const handleIssueUPdate = (currentIssue: Issue) => {
        const currentIndex = issues.findIndex((it) => it.id === currentIssue.id);
        // 修改
        if (currentIndex > -1) {
            if (currentIndex >= 1) {
                const preIssue = issues[currentIndex - 1];
                const interval = currentIssue.startTime.diff(preIssue.endTime, 'minute');
                // 更新上一项的间隔时间
                preIssue.interval = interval;
            }
            issues.splice(currentIndex, 1, currentIssue);
            setIssues([...issues]);
        } else {
            // 添加
            setIssues([...issues, currentIssue]);
        }
        // 任意一项更新，都重新计算总计时间
        onChange(calculate(issues));
    }

    const handleSave = () => {
        console.log(issues);
    }

    return (<div className='wrap'>
        <b>一、时间统计</b>
        <p>总计：{formatMinToHM(total)}
            (阅读：{formatMinToHM(read)}
            <span style={{ backgroundColor: 'yellow' }}>前端：{formatMinToHM(study)}</span>)
        </p>
        <FormatDateToMonthDayWeek />
        {issues.map((it, index) => <CustomTimePicker init={it} key={index} onIssue={handleIssueUPdate} />)}
        <div className='flex-around'>
            <Button className='btn' onClick={handleAddIssue}>添加一项</Button>
            <Button type="primary" className='btn' onClick={handleSave}>保存</Button>
        </div>

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

function Issue({ study }: { study: number }) {
    function uniformTextAreaWithStyle(key: string, placeholder: string) {
        return <TextArea key={key} placeholder={placeholder} style={{ resize: 'both', overflow: 'auto' }} />
    }
    return (<div className='wrap'>
        <b>二、事项统计</b>
        <FormatDateToMonthDayWeek />
        <h4>前端学习时长：{formatMinToHM(study)} 🎉🎉🎉</h4>
        <section className='wrap'>
            【复盘】
            ①运动 + 电影：
            <section className='flex'>
                {[
                    { key: 'sport', placeholder: '运动情况' },
                    { key: 'movie', placeholder: '电影' }
                ].map(it => uniformTextAreaWithStyle(it.key, it.placeholder))}
            </section>
            ② 前端：
            {uniformTextAreaWithStyle('study', '前端学习情况')}
            ③ TED+阅读：
            <section className='flex'>
                {[
                    { key: 'ted', placeholder: 'TED主题' },
                    { key: 'read', placeholder: '阅读情况' }
                ].map(it => uniformTextAreaWithStyle(it.key, it.placeholder))}
            </section>
            【做得棒的3件事】
            {uniformTextAreaWithStyle('good', '积极心理学')}
            【今天有犯错吗？错误是纠正偏差的大好机会】
            {uniformTextAreaWithStyle('fix', '可以变得更好的事情')}
        </section>
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
    useEffect(() => {
        Api.getDailyApi().then(res => {
            console.log(res);
        })
    }, []);

    return (<>
        <h1 className='week'>
            Week {now.week()}
            <br />
            <ProcessCircle startTime='2024-12-30' cycle={15} />
        </h1>
        <div className="flex-around">
            <Time total={total} read={read} study={study} onChange={handleFunc} />
            <Issue study={study} />
        </div></>)
}

