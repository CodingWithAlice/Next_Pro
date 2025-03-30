"use client"
import { useCallback, useEffect, useState } from 'react';
import './app.css';
import IssueRecord from '@/components/issue-record';
import TimeRecord from '@/components/time-record';
import WeekTitle from '@/components/week-title';
import Api from '@/service/api';
import dayjs from 'dayjs';
import { type Issue } from '@/components/custom-time-picker';
import { getCurrentBySub, IssueRecordProps } from '@/components/tool';
import { useSearchParams } from 'next/navigation';
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
const LTNType = ['LTN'];
const ReadType = ['reading'];

export default function Daily() {
    const [total, setTotal] = useState(0);
    const [read, setRead] = useState(0);
    const [study, setStudy] = useState(0);
    const [ltnTotal, setLtnTotal] = useState(0);

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
    const urlParams = useSearchParams();
    const urlDate = urlParams?.get('date');
    const currentDate = urlDate || getCurrentBySub(config.current).format('YYYY-MM-DD');

    const handleFunc = useCallback((arr: Issue[], types?: routineType[]) => {
        if (!types) {
            types = routineType;
        }
        function calculate(arr: Issue[], types?: routineType[]) {
            const routineTypes = types || routineType;
            const res = { total: 0, read: 0, study: 0, ltnTotal: 0 };
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
                if (LTNType.includes(type)) {
                    res.ltnTotal += it.duration;
                }
            });
            return res;
        }
        const valueObj = calculate(arr, types);
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
                case 'ltnTotal':
                    setLtnTotal(value);
                    break;
            }
        });
    }, [routineType])

    useEffect(() => {
        if (issues.length === 0 || routineType.length === 0) return;
        handleFunc(issues, routineType);
    }, [routineType, issues, handleFunc]);


    useEffect(() => {
        Api.getDailyApi(currentDate).then(({ routineData, dailyData, IssueData }) => {
            // 过程可以展示的 routine 类别
            const routine = routineData.filter((it: routineType) => it.show);
            const routineIds = routine.map((it: routineType) => it.id);
            setRoutineType(routine);

            const initIssues = dailyData.filter((it: DailyDataProps) => routineIds.includes(it.routineTypeId)).map((data: DailyDataProps) => ({
                ...data,
                startTime: dayjs(`${data.date} ${data.startTime}`),
                endTime: dayjs(`${data.date} ${data.endTime}`),
                type: data.routineTypeId
            }))
            setIssues(initIssues);

            setIssueData({
                ...IssueData,
                front: IssueData.front || '1、LTN：做？题 + 错题重做(时长) \n2、BOX1： \n3、在线工具：\n4、WORK：',
                good: ([IssueData.good1 || '', IssueData.good2 || '', IssueData.good3 || '']).filter(it => !!it).join('\n'),
            });
        })
    }, [currentDate]);

    return (<div className='outer'>
        <WeekTitle />
        <div className="flex-around">
            <TimeRecord total={total} read={read} study={study} ltnTotal={ltnTotal} onChange={handleFunc} issues={issues} setIssues={setIssues} routineType={routineType} />
            <IssueRecord study={study} issueData={issueData} setIssueData={setIssueData} currentDate={currentDate} />
        </div></div>)
}
