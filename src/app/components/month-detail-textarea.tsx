import { useEffect, useState } from "react";
import { SerialsPicker } from "@/components/serials-picker";
import Api from "@/service/api";
import { timeTotalByRoutineTypeProps } from "./month-total-time";
import MonthTable from "./month-table";
import { transTextArea, transTitle } from "./tool";
import MonthAiSynthesize from "./month-ai-synthesize";
import type { MonthStructuredMerge } from "./month-structured-merge";
import CycleCompareTable, { type PerSerialMetricRow } from "./cycle-compare-table";
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
    const [studyTotal, setStudyTotal] = useState(0); // 所选跨度内「前端总计」合计（分钟）
    const [duration, setDuration] = useState(0); // 学习总时长
    const [perSerialMetrics, setPerSerialMetrics] = useState<PerSerialMetricRow[]>([]);
    const [structuredMerge, setStructuredMerge] = useState<MonthStructuredMerge | null>(null);
    const [aiMergeLoading, setAiMergeLoading] = useState(false);
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
        setStructuredMerge(null);
        setAiMergeLoading(false);

        if (!(periods.length >= 1 && +periods[0] !== 0)) {
            return;
        }

        let cancelled = false;

        Api.getMonthDetailApi(periods.join(','))
            .then(({ weekList, currentRawRecords, currentTimeTotalByRoutineType, metricData, gapTime, perSerialMetrics: serialMetrics }) => {
                if (cancelled) return;

                setRawRecords(currentRawRecords)
                setTimeTotalByRoutineType(currentTimeTotalByRoutineType);
                setWeeksData(weekList);
                setMetricData(metricData);
                setDuration(gapTime)
                setPerSerialMetrics(Array.isArray(serialMetrics) ? serialMetrics : [])
                let study = 0
                currentTimeTotalByRoutineType?.forEach((it: timeTotalByRoutineTypeProps) => {
                    if (it.routine_type?.des === '前端总计') {
                        study += +it.totalDuration
                    }
                })
                setStudyTotal(study);

                if (!weekList?.length) {
                    return Promise.resolve(null);
                }

                setAiMergeLoading(true);
                return Api.postMonthMergeStructuredApi(periods.join(','))
            })
            .then((merge) => {
                if (cancelled) return;
                if (merge && typeof merge === 'object' && 'learning_task_merged' in merge) {
                    setStructuredMerge(merge as MonthStructuredMerge);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setStructuredMerge(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setAiMergeLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
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
                { key: 'processMonth', desc: '年度目标完成度', tip: '参看、对齐年度计划，填写完成度记录' },
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
                {!!weeksData.length && (
                    <MonthAiSynthesize periods={periods} handleChange={handleDeepSeek} />
                )}
            </div>
            {[
                { key: 'frontMonthDesc', desc: '非短期决策 - 前端' },
                { key: 'otherMonthDesc', desc: '非短期决策 - 其他' }
            ].map(it => handleTrans(it, monthData))}
        </section>
        <section className='section'>
            {!!weeksData.length && transTitle('【月度详情：不同LTN周期任务对比】')}
            {aiMergeLoading && (
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                    正在请求 AI 合并学习任务、睡眠与复盘（运动/影视/TED 为规则合并）…
                </div>
            )}
            {!!perSerialMetrics.length && (
                    <CycleCompareTable data={perSerialMetrics} />
            )}
            {!!weeksData.length && (
                <MonthTable
                    key={`${weeksData.length}-${structuredMerge ? 'ai' : 'rule'}`}
                    data={weeksData}
                    study={studyTotal}
                    structuredMerge={structuredMerge}
                    aiMergeLoading={aiMergeLoading}
                />
            )}
        </section>
    </section>
}
