import TextArea from "antd/es/input/TextArea";
import { useEffect, useState } from "react";
import { SerialsPicker } from "@/components/serials-picker";
import Api from "@/service/api";
import { routineType } from '@/daily/page';
import { formatMinToHM } from "./tool";

interface MonthDetailTextareaProps {
    monthData: { [key: string]: string },
    setMonthData: (data: { [key: string]: string }) => void
}

interface UniformTextAreaWithStyleProps {
    type: string,
    desc: string,
    init: string,
    onChange: (data: { [key: string]: string }) => void
}

interface timeTotalByRoutineTypeProps {
    routine_type: routineType;
    totalDuration: string;
    routine_type_id: number;
}

// 统一标题样式
function transTitle(title: string) {
    return <span key={title} className="title">{title}</span>
}

// 统一 textarea 样式
function UniformTextAreaWithStyle({ type, desc, init, onChange }: UniformTextAreaWithStyleProps) {
    const handleText = (type: string, value: string) => {
        onChange({ [type]: value });
    }

    return <div className="textarea" key={type}>
        {desc && <span className="desc">{desc}:</span>}
        <TextArea
            key={type}
            style={{ resize: 'both' }}
            rows={1}
            onChange={(e) => handleText(type, e.target.value)}
            value={init}
            disabled={type === 'time'}
            autoSize={{ minRows: 1, maxRows: 15 }} />
    </div>
}

const transOneTime = (it: { key: string, desc?: string, source: timeTotalByRoutineTypeProps[] }) => {
    const init = it.source.find((timeTotal: timeTotalByRoutineTypeProps) => timeTotal.routine_type.type === it.key)?.totalDuration || '';

    return <span key={it.key}>
        {it.desc && <span className="desc">{it.desc}:</span>}
        {formatMinToHM(+init)}
    </span>
}



export function MonthDetailTextarea({ monthData, setMonthData }: MonthDetailTextareaProps) {
    const [periods, setPeriods] = useState<number[]>([0]);
    const [timeTotalByRoutineType, setTimeTotalByRoutineType] = useState<timeTotalByRoutineTypeProps[]>();

    const handleTimes = (it: { key: string, desc?: string }[], source?: timeTotalByRoutineTypeProps[]) => {
        if (!source) return;
        return <div className="times-wrap">{
            it.map((item) => {
                return transOneTime({ key: item.key, desc: item.desc, source });
            })
        }</div>
    }

    const transTextArea = (it: { key: string, desc?: string, source: { [key: string]: string } }) => {
        return <UniformTextAreaWithStyle
            key={it.key}
            type={it.key}
            desc={it.desc || ''}
            init={it.source?.[it.key] || ''}
            onChange={(v) => handleChange(v)}
        />
    };

    const handleTrans = (it: { key: string, desc?: string }, source?: { [key: string]: string }) => {
        if (!source) return;
        return transTextArea({ ...it, source });
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
            Api.getMonthApi(periods.join(',')).then(({ weekList, timeTotalByRoutineType }) => {
                setTimeTotalByRoutineType(timeTotalByRoutineType);
                console.log(weekList);
            })
        }
    }, [periods])

    return <section className='wrap'>
        <section>
            本月周期：
            <SerialsPicker onValueChange={onSerialChange} value={periods} mode='multiple' />
        </section>
        {transTitle('【总计时长】')}
        {handleTimes([
            { key: 'total', desc: '专注总体时长' },
            { key: 'front_total', desc: '前端总时长' },
            { key: 'ltn_total', desc: 'LTN做题总时长' },
            { key: 'review', desc: '复盘总时长' },
        ], timeTotalByRoutineType)}
        {handleTimes([
            { key: 'reading', desc: '阅读总时长' },
            { key: 'TED', desc: 'TED总时长' },
            { key: 'strength', desc: '力训总时长' },
            { key: 'aerobic', desc: '有氧总时长' },
        ], timeTotalByRoutineType)}
        {handleTrans({ key: 'timeDiffDesc', desc: '时长差异存在原因' }, monthData)}

        {/* {transTitle('【睡眠 + 运动 + 电影】')}
        {[
            { key: 'sleep', desc: '睡眠情况' },
            { key: 'sport', desc: '运动情况' },
            { key: 'movie', desc: '电影' }
        ].map(it => handleTrans(it, monthData))}
        {transTitle('【TED + 阅读 + 播客】')}

        {[
            { key: 'ted', desc: 'TED主题' },
            { key: 'read', desc: '阅读情况' }
        ].map(it => handleTrans(it, monthData))} */}

        {/* {transTitle('【学习方法复盘和改进】')}
        {handleTrans({ key: 'improveMethods' }, monthData)}

        {transTitle('【本周期做得不错的地方】')}
        {handleTrans({ key: 'wellDone' }, monthData)}

        {transTitle('【下周主要学习的内容】')}
        {handleTrans({ key: 'nextWeek' }, monthData)} */}
    </section>
}