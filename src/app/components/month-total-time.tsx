import { formatMinToHM } from "./tool";
import { routineType } from '@/daily/page';

export interface timeTotalByRoutineTypeProps {
    routine_type: routineType;
    totalDuration: string;
    routine_type_id: number;
}

interface MonthTotalTimeProps {
    times: { key: string, desc?: string }[], 
    source?: timeTotalByRoutineTypeProps[]
}

const calcOneTime = (it: { key: string, desc?: string, source: timeTotalByRoutineTypeProps[] }) => {
    const init = it.source.find((timeTotal: timeTotalByRoutineTypeProps) => timeTotal.routine_type.type === it.key)?.totalDuration || '';

    return <span key={it.key}>
        {it.desc && <span className="desc">{it.desc}:</span>}
        {formatMinToHM(+init)}
    </span>
}


export default function MonthTotalTime ({times, source}: MonthTotalTimeProps) {
    if (!source) return;
    return <div className="times-wrap">{
        times.map((item) => {
            return calcOneTime({ key: item.key, desc: item.desc, source });
        })
    }</div>
}