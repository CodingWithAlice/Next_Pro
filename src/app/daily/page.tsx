"use client"
import { useState } from 'react';
import './app.css';
import IssueRecord from '@/components/issue-record';
import TimeRecord from '@/components/time-record';
import WeekTitle from '@/components/week-title';

export interface routineType {
    id: number;
    type: string;
    des: string;
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

    return (<div className='wrapper'>
        <WeekTitle />
        <div className="flex-around">
            <TimeRecord total={total} read={read} study={study} onChange={handleFunc} />
            <IssueRecord study={study} />
        </div></div>)
}

