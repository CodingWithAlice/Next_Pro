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
import config from 'config';

export interface routineType {
    id: number;
    type: string;
    des: string;
    show: boolean;
}

export interface DailyDataProps {
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
        Api.getDailyApi(dayjs().subtract(config.current, 'day').format('YYYY-MM-DD')).then(({ routineData, dailyData, IssueData }) => {
            // 过程可以展示的 routine 类别
            const routine = routineData.filter((it: routineType) => it.show);
            const routineIds = routine.map((it: routineType) => it.id);
            setRoutineType(routine);
            setIssues(dailyData.filter((it: DailyDataProps) => routineIds.includes(it.routineTypeId)).map((data: DailyDataProps) => ({
                ...data,
                startTime: dayjs(`${data.date} ${data.startTime}`),
                endTime: dayjs(`${data.date} ${data.endTime}`),
                type: data.routineTypeId
            })));
            setIssueData({
                ...IssueData,
                good: ([IssueData.good1 || '', IssueData.good2 || '', IssueData.good3 || '']).filter(it => !!it).join('\n'),
            });
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
            <IssueRecord study={study} issueData={issueData} setIssueData={setIssueData} />
        </div></div>)
}
