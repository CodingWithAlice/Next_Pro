"use client"
import { useCallback, useEffect, useState } from 'react';
import './app.css';
import IssueRecord from '@/components/issue-record';
import TimeRecord from '@/components/time-record';
import WeekTitle from '@/components/week-title';
import LifeFootprint from '@/components/life-footprint';
import Api from '@/service/api';
import dayjs from 'dayjs';
import { type Issue } from '@/components/custom-time-picker';
import { getCurrentBySub, IssueRecordProps, sortIssuesWithSleepLast } from '@/components/tool';
import { useSearchParams, useRouter } from 'next/navigation';
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
        work: '',
        ted: '',
        reading: '',
        good: '',
        better: '',
    });
    const urlParams = useSearchParams();
    const router = useRouter();
    const urlDate = urlParams?.get('date');
    const currentDate = urlDate || getCurrentBySub(config.current).format('YYYY-MM-DD');

    // 初始化时，如果没有URL参数，自动跳转到昨天
    useEffect(() => {
        if (!urlDate) {
            const yesterdayDate = getCurrentBySub(config.current).format('YYYY-MM-DD');
            router.replace(`/daily?date=${yesterdayDate}`);
        }
    }, [urlDate, router]);

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

            // 处理所有事项（包括工作类型）
            const initIssues: any[] = [];
            let idx = 0; // 独立的计数器，每添加一项就递增
            dailyData
                .filter((it: DailyDataProps) => routineIds.includes(it.routineTypeId))
                .forEach((data: DailyDataProps) => {
                    const startTime = dayjs(`${data.date} ${data.startTime}`);
                    const endTime = dayjs(`${data.date} ${data.endTime}`);
                    
                    // 处理工作类型：判断 startTime 和 endTime 的小时和分钟是否一致
                    if (+data.routineTypeId === +config.workId) {
                        const startHour = startTime.hour();
                        const startMinute = startTime.minute();
                        const endHour = endTime.hour();
                        const endMinute = endTime.minute();
                        
                        // 如果小时和分钟都相同，保持为一条记录
                        if (startHour === endHour && startMinute === endMinute) {
                            initIssues.push({
                                ...data,
                                startTime: startTime,
                                endTime: startTime, // 确保 endTime 和 startTime 相同
                                type: data.routineTypeId,
                                daySort: idx++,
                                interval: data.interval || 0,
                                routineTypeId: data.routineTypeId,
                                duration: 0
                            });
                        } else {
                            // 如果小时或分钟不同，拆分成两条记录：一条是开始时间，一条是结束时间
                            const baseIssue = {
                                ...data,
                                type: data.routineTypeId,
                                interval: 0,
                                routineTypeId: data.routineTypeId,
                                duration: 0
                            };
                            
                            // 开始时间的工作节点
                            initIssues.push({
                                ...baseIssue,
                                startTime: startTime,
                                endTime: startTime,
                                daySort: idx++
                            });
                            
                            // 结束时间的工作节点
                            initIssues.push({
                                ...baseIssue,
                                startTime: endTime,
                                endTime: endTime,
                                daySort: idx++
                            });
                        }
                    } else {
                        // 非工作类型，正常处理
                        initIssues.push({
                            ...data,
                            startTime: startTime,
                            endTime: endTime,
                            type: data.routineTypeId,
                            daySort: idx++,
                            interval: data.interval || 0,
                            routineTypeId: data.routineTypeId
                        });
                    }
                });

            // 按开始时间排序，但睡眠始终排在最后
            const sortedIssues = sortIssuesWithSleepLast(initIssues).map((it: any, index: number) => ({
                ...it,
                daySort: index
            }));
            
            setIssues(sortedIssues);

            setIssueData({
                ...IssueData,
                front: IssueData.front || '1、LTN：做？题 + 错题重做(时长) \n2、BOX1： \n3、在线工具：',
                work: IssueData.work || '1、技术方向： \n2、业务方向：',
                good: ([IssueData.good1 || '', IssueData.good2 || '', IssueData.good3 || '']).filter(it => !!it).join('\n'),
                ted: IssueData.ted || 'Round3: '
            });
        })
    }, [currentDate]);

    return (<div className='outer'>
        <div style={{ position: 'relative' }}>
            <WeekTitle />
            <LifeFootprint currentDate={currentDate} />
        </div>
        <div className="flex-around">
            <TimeRecord total={total} read={read} study={study} ltnTotal={ltnTotal} onChange={handleFunc} issues={issues} setIssues={setIssues} routineType={routineType} />
            <IssueRecord study={study} issueData={issueData} setIssueData={setIssueData} currentDate={currentDate} />
        </div></div>)
}
