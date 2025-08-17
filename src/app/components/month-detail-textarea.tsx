import { useEffect, useState } from "react";
import { SerialsPicker } from "@/components/serials-picker";
import Api from "@/service/api";
import { timeTotalByRoutineTypeProps } from "./month-total-time";
import MonthTable from "./month-table";
import { transTextArea, transTitle } from "./tool";
import DeepSeek from "./deep-seek";
import FocusHeatmap from "./focus-heatmap";
import CoreMetricsTable from "./core-metric-table";
// import MonthTotalTime from "./month-total-time";

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
    const [duration, setDuration] = useState(0); // 学习总时长
    const [serials, setSerials] = useState<{ serialNumber: number, startTime: string, endTime: string }[]>([]);
 

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

    const handleSerials = () => {
        Api.getSerial().then(({ serialData = [] }) => {
            setSerials(serialData.reverse())
        })
    }

    useEffect(() => {
        // 更新选择的 LTN 周期后，刷新当前页面数据
        if (periods.length >= 1 && +periods[0] !== 0) {
            Api.getMonthDetailApi(periods.join(',')).then(({ weekList, currentRawRecords, currentTimeTotalByRoutineType, metricData, gapTime }) => {
                setRawRecords(currentRawRecords)
                setTimeTotalByRoutineType(currentTimeTotalByRoutineType);
                setWeeksData(weekList);
                setMetricData(metricData);
                setDuration(gapTime)
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
    
    // 初始化周期数据
    useEffect(() => {
        handleSerials()
    }, [])

    return <section className='wrap'>
        <section>
            本月周期：
            <SerialsPicker
                onValueChange={onSerialChange}
                value={periods} mode='multiple'
                className="serial-month"
                duration={duration}
                serials={serials}
            />
        </section>
        <section className='section'>
            {transTitle('【战况速览】')}
            {!!weeksData?.length && [
                { key: 'processMonth', desc: '年度目标完成度', tip: '参看、对齐2025年度计划，填写完成度记录' },
            ].map(it => handleTrans(it, monthData))}
            {!!weeksData?.length && <FocusHeatmap data={rawRecords} periodTime={handlePeriodTime(weeksData)} />}
            {[
                { key: 'frontHighEfficiency', desc: '[效率峰值]可复用的方法论', tip: "是否在其他场景重复出现？→ 记录可迁移经验" },
                { key: 'frontLowEfficiency', desc: '[效率低谷]执行漏洞', tip: "是否在其他场景重复出现？→ 记录可迁移经验" }
            ].map(it => handleTrans(it, monthData))}
        </section>
        <section className='section'>
            {transTitle('【核心指标】')}
            <CoreMetricsTable source={metricData || {}} />
            {/* {handleTrans({ key: 'timeDiffDesc', desc: '非短期决策' }, monthData)} */}
        </section>
        <section className='section'>
            <div className="month-review">
                {!!weeksData.length && transTitle('【决策】')}
                <DeepSeek periods={periods} handleChange={handleDeepSeek} type='month' />
            </div>
            {[
                { key: 'frontMonthDesc', desc: '非短期决策 - 前端' },
                { key: 'otherMonthDesc', desc: '非短期决策 - 其他' }
            ].map(it => handleTrans(it, monthData))}
        </section>
        <section className='section'>
            {!!weeksData.length && transTitle('【月度详情：不同LTN周期任务对比】')}
            {!!weeksData.length && <MonthTable key={weeksData.length} data={weeksData} study={studyTotal} />}
        </section>
    </section>
}