import { useEffect, useState } from "react";
import { SerialsPicker } from "@/components/serials-picker";
import Api from "@/service/api";
import MonthTotalTime from "./month-total-time";
import { timeTotalByRoutineTypeProps } from "./month-total-time";
import MonthTable from "./month-table";
import { transTextArea, transTitle } from "./tool";
import DeepSeek from "./deep-seek";
import FocusHeatmap from "./focus-heatmap";
import CoreMetricsTable from "./core-metric-table";

const timeTotal = [
    [
        { key: 'total', desc: '专注总体时长' },
        { key: 'front_total', desc: '前端总时长' },
        { key: 'ltn_total', desc: 'LTN做题总时长' },
        { key: 'work', desc: '工作总时长' },
    ],
    [
        { key: 'reading', desc: '阅读总时长' },
        { key: 'TED', desc: 'TED总时长' },
        { key: 'sport', desc: '运动总时长' },
        { key: 'review', desc: '复盘总时长' },
        // { key: 'strength', desc: '力训总时长' },
        // { key: 'aerobic', desc: '有氧总时长' },
    ]
]

export interface dataProps {
    frontOverview: string;
    serialNumber: number;
    startTime: string;
    endTime: string;
    sleep: string;
    sport: string;
    movie: string;
    ted: string;
    improveMethods: string;
    read: string;
    id: number;
}

export interface rawRecord {
    date: string, 
    duration: number,
    startTime: string,
    endTime: string,
    routineTypeId: number,
    'routine_type.des': string,
    isWorkDay: number
}
interface MonthDetailTextareaProps {
    monthData: { [key: string]: string },
    setMonthData: (data: { [key: string]: string }) => void,
    periods: number[],
    setPeriods: (data: number[]) => void
}

export interface Metric {
    name: string;
    current: number | string;
    lastMonth: number | string;
    threshold: [number, number];
    annualTarget: number;
    unit?: string;
    isDimension?: boolean; // 标记是否为维度标题行
}

export function MonthDetailTextarea({ monthData, setMonthData, periods, setPeriods }: MonthDetailTextareaProps) {
    const [timeTotalByRoutineType, setTimeTotalByRoutineType] = useState<timeTotalByRoutineTypeProps[]>();
    const [weeksData, setWeeksData] = useState<dataProps[]>([]); // 每周数据
    const [rawRecords, setRawRecords] = useState<rawRecord[]>([]); // 每周数据
    const [metricData, setMetricData] = useState<Record<string, Metric[]>>(); // 每周数据
    const [studyTotal, setStudyTotal] = useState(0); // 学习总时长

    const handleTrans = (it: { key: string, desc?: string, tip?: string }, source?: { [key: string]: string }) => {
        if (!source) return;
        return transTextArea({ ...it, source, onChange: handleChange });
    }

    const handleChange = (v: { [key: string]: string }) => {
        setMonthData({ ...monthData, ...v });
    }

    const handleDeepSeek = (data: string) => {
        const { studyConclude, others } = JSON.parse(data);
        handleChange({
            frontMonthDesc: studyConclude,
            otherMonthDesc: others
        })
    }

    // 获取周期的起始时间
    const handlePeriodTime = (weeksData: dataProps[]) => {
        const sort = weeksData.sort((a, b) => a.serialNumber - b.serialNumber);        
        return { start: sort?.[0]?.startTime, end: sort?.[sort?.length - 1]?.endTime }
    }

    const onSerialChange = (v: number | number[]) => {
        if (Array.isArray(v)) {
            setPeriods(v);
        }
    }

    useEffect(() => {
        // 更新选择的 LTN 周期后，刷新当前页面数据
        if (periods.length >= 1) {
            Api.getMonthDetailApi(periods.join(',')).then(({ weekList, timeTotalByRoutineType, rawRecords }) => {
                setRawRecords(rawRecords)
                setTimeTotalByRoutineType(timeTotalByRoutineType);
                setWeeksData(weekList);
        //         const metricsDataMock: Record<string, Metric[]> = {
        //     '前端维度': [
        //         { name: '技术任务占比', current: 68, lastMonth: 62, threshold: [50, 80], annualTarget: 70, unit: '%' },
        //         { name: '专注时长', current: 42, lastMonth: 38, threshold: [30, 50], annualTarget: 500, unit: '小时' },
        //         { name: '复盘时长', current: 8, lastMonth: 6, threshold: [5, 10], annualTarget: 100, unit: '小时' },
        //         { name: 'LTN做题时长', current: 15, lastMonth: 12, threshold: [10, 20], annualTarget: 200, unit: '小时' },
        //     ],
        //     '健康维度': [
        //         { name: '平均入睡时间', current: '23:20', lastMonth: '23:45', threshold: [22, 24], annualTarget: 365 },
        //         { name: '平均起床时间', current: '6:40', lastMonth: '7:15', threshold: [6, 7.5], annualTarget: 365 },
        //         { name: '运动次数', current: 12, lastMonth: 8, threshold: [8, 16], annualTarget: 150 },
        //         { name: 'TED观看时长', current: 3.5, lastMonth: 2.8, threshold: [2, 5], annualTarget: 50, unit: '小时' },
        //         { name: '阅读时长', current: 6, lastMonth: 4, threshold: [4, 10], annualTarget: 80, unit: '小时' },
        //     ]
        // };
                setMetricData(metricData || {})
                let study = 0
                timeTotalByRoutineType?.forEach((it: timeTotalByRoutineTypeProps) => {
                    if (it.routine_type?.des === '前端总计') {
                        study += +it.totalDuration
                    }
                })
                setStudyTotal(study);
            })
        }
    }, [periods])

    return <section className='wrap'>
        <section>
            本月周期：
            <SerialsPicker onValueChange={onSerialChange} value={periods} mode='multiple' className="serial-month" />
        </section>
        <section className='section'>
            {transTitle('【战况速览】')}
            {!!weeksData?.length && [
                { key: 'processMonth', desc: '年度目标完成度', tip: '参看、对齐2025年度计划，填写完成度记录' },
            ].map(it => handleTrans(it, monthData))}
            {!!weeksData?.length && <FocusHeatmap data={rawRecords} periodTime={handlePeriodTime(weeksData)} />}
            {[
                { key: 'frontHighEfficiency', desc: '效率峰值场景复刻条件' },
                { key: 'frontLowEfficiency', desc: '效率低谷共同干扰因素' }
            ].map(it => handleTrans(it, monthData))}
        </section>
        <section className='section'>
            {transTitle('【核心指标】')}
            <MonthTotalTime key='total1' times={timeTotal[0]} source={timeTotalByRoutineType} />
            <MonthTotalTime key='total2' times={timeTotal[1]} source={timeTotalByRoutineType} />
            <CoreMetricsTable source={metricData || {}} />
            {handleTrans({ key: 'timeDiffDesc', desc: '时长差异存在原因' }, monthData)}
        </section>
        <section className='section'>
            {!!weeksData.length && transTitle('【不同LTN周期任务对比】')}
            {!!weeksData.length && <MonthTable key={weeksData.length} data={weeksData} study={studyTotal} />}
        </section>
        <section className='section'>
            <div className="month-review">
                {!!weeksData.length && transTitle('【总结】')}
                <DeepSeek periods={periods} handleChange={handleDeepSeek} type='month' />
            </div>
            {[
                { key: 'frontMonthDesc', desc: '回顾总结 - 前端' },
                { key: 'otherMonthDesc', desc: '回顾总结 - 其他' }
            ].map(it => handleTrans(it, monthData))}
        </section>
    </section>
}