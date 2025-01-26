"use client"
import { useEffect, useState } from 'react';
import './app.css';
import IssueRecord from '@/components/issue-record';
import TimeRecord from '@/components/time-record';
import WeekTitle from '@/components/week-title';
import Api from '@/service/api';
import dayjs from 'dayjs';
import { type Issue } from '@/components/custom-time-picker';

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

export default function Daily() {
    const [total, setTotal] = useState(0);
    const [read, setRead] = useState(0);
    const [study, setStudy] = useState(0);

    const [routineType, setRoutineType] = useState<routineType[]>([]);
    const [issues, setIssues] = useState<Issue[]>([]);


    useEffect(() => {
        Api.getDailyApi(dayjs().subtract(1, 'day').format('YYYY-MM-DD')).then(({ routineData, dailyData }) => {
            const routine = routineData.filter((it: routineType) => !it.type.includes('total'));
            setRoutineType(routine);
            setIssues(dailyData.map((data: DailyDataProps) => ({
                ...data,
                startTime: dayjs(`${data.date} ${data.startTime}`),
                endTime: dayjs(`${data.date} ${data.endTime}`),
                type: data.routineTypeId
            })));
        })
    }, []);

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

    return (<div className='wrapper'>
        <WeekTitle />
        <div className="flex-around">
            <TimeRecord total={total} read={read} study={study} onChange={handleFunc} issues={issues} setIssues={setIssues} routineType={routineType} />
            <IssueRecord study={study} />
        </div></div>)
}

