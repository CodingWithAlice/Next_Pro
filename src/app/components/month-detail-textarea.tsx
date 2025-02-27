import { useEffect, useState } from "react";
import { SerialsPicker } from "@/components/serials-picker";
import Api from "@/service/api";
import MonthTotalTime from "./month-total-time";
import { timeTotalByRoutineTypeProps } from "./month-total-time";
import MonthTable from "./month-table";
import { transTextArea, transTitle } from "./tool";

const timeTotal = [
    [
        { key: 'total', desc: '专注总体时长' },
        { key: 'front_total', desc: '前端总时长' },
        { key: 'ltn_total', desc: 'LTN做题总时长' },
        { key: 'review', desc: '复盘总时长' },
    ],
    [
        { key: 'reading', desc: '阅读总时长' },
        { key: 'TED', desc: 'TED总时长' },
        { key: 'strength', desc: '力训总时长' },
        { key: 'aerobic', desc: '有氧总时长' },
    ]
]
interface MonthDetailTextareaProps {
    monthData: { [key: string]: string },
    setMonthData: (data: { [key: string]: string }) => void,
    periods: number[],
    setPeriods: (data: number[]) => void
}

export function MonthDetailTextarea({ monthData, setMonthData, periods, setPeriods }: MonthDetailTextareaProps) {
    const [timeTotalByRoutineType, setTimeTotalByRoutineType] = useState<timeTotalByRoutineTypeProps[]>();
    const [weeksData, setWeeksData] = useState([]); // 每周数据
    const [studyTotal, setStudyTotal] = useState(0); // 学习总时长

    const handleTrans = (it: { key: string, desc?: string }, source?: { [key: string]: string }) => {
        if (!source) return;
        return transTextArea({ ...it, source, onChange: handleChange });
    }

    const handleChange = (v: { [key: string]: string }) => {
        setMonthData({ ...monthData, ...v });
    }

    const onSerialChange = (v: number | number[]) => {
        if (Array.isArray(v)) {
            setPeriods(v);
        }
    }

    useEffect(() => {
        // 更新选择的 LTN 周期后，刷新当前页面数据
        if (periods.length >= 1) {
            Api.getMonthDetailApi(periods.join(',')).then(({ weekList, timeTotalByRoutineType }) => {
                setTimeTotalByRoutineType(timeTotalByRoutineType);
                setWeeksData(weekList);
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
            <SerialsPicker onValueChange={onSerialChange} value={periods} mode='multiple' />
        </section>
        <section className='section'>
            {transTitle('【总计时长】')}
            <MonthTotalTime key='total1' times={timeTotal[0]} source={timeTotalByRoutineType} />
            <MonthTotalTime key='total2' times={timeTotal[1]} source={timeTotalByRoutineType} />
            {handleTrans({ key: 'timeDiffDesc', desc: '时长差异存在原因' }, monthData)}
        </section>
        <section className='section'>
            {!!weeksData.length && transTitle('【不同LTN周期任务对比】')}
            {!!weeksData.length && <MonthTable key={weeksData.length} data={weeksData} study={studyTotal} />}
        </section>
        <section className='section'>
            {[
                { key: 'frontMonthDesc', desc: '回顾总结 - 前端' },
                { key: 'otherMonthDesc', desc: '回顾总结 - 其他' }
            ].map(it => handleTrans(it, monthData))}
        </section>


    </section>
}