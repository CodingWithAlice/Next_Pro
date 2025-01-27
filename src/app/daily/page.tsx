"use client"
import { useEffect, useState } from 'react';
import './app.css';
import IssueRecord from '@/components/issue-record';
import TimeRecord from '@/components/time-record';
import WeekTitle from '@/components/week-title';
import Api from '@/service/api';
import dayjs from 'dayjs';
import { type Issue } from '@/components/custom-time-picker';
import { IssueRecordProps } from '@/components/tool';

export interface routineType {
    id: number;
    type: string;
    des: string;
}

interface DailyDataProps {
    date: string,
    daySort: number,
    duration: number,
    endTime: string,
    id: number,
    interval: number,
    routineTypeId: number,
    startTime: string,
    weekday: string
}

const TotalType = ['reading', 'frontEnd', 'review', 'TED', 'strength', 'aerobic', 'LTN'];
const StudyType = ['frontEnd', 'LTN'];
const ReadType = ['reading'];

export default function Daily() {
    const [total, setTotal] = useState(0);
    const [read, setRead] = useState(0);
    const [study, setStudy] = useState(0);

    const [routineType, setRoutineType] = useState<routineType[]>([]);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [issueData, setIssueData] = useState<IssueRecordProps>({
        sport: '',
        video: '',
        front: '',
        ted: '',
        reading: '',
        good: '',
        better: '',
    });


    useEffect(() => {
        Api.getDailyApi(dayjs().subtract(1, 'day').format('YYYY-MM-DD')).then(({ routineData, dailyData, IssueData }) => {
            const routine = routineData.filter((it: routineType) => !it.type.includes('total'));
            setRoutineType(routine);
            setIssues(dailyData.map((data: DailyDataProps) => ({
                ...data,
                startTime: dayjs(`${data.date} ${data.startTime}`),
                endTime: dayjs(`${data.date} ${data.endTime}`),
                type: data.routineTypeId
            })));
            setIssueData({ 
                ...IssueData, 
                good: IssueData.good1 ? (IssueData.good1 + '，' + IssueData.good2 + '，' + IssueData.good3) : null });
        })
    }, []);

    const handleFunc = (arr: Issue[]) => {
        const valueObj = calculate(arr);
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

    function calculate(arr: Issue[]) {
        const res = { total: 0, read: 0, study: 0 };
        arr.forEach((it) => {
            const type = routineType.find((type) => type.id === +it.type)?.type;
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

    return (<div className='wrapper'>
        <WeekTitle />
        <div className="flex-around">
            <TimeRecord total={total} read={read} study={study} onChange={handleFunc} issues={issues} setIssues={setIssues} routineType={routineType} />
            <IssueRecord study={study} issueData={issueData} />
        </div></div>)
}
