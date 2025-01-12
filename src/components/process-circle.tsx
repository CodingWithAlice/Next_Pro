import { Progress } from "antd";
import { getPassedPercent } from "./tool";

export default function ProcessCircle({startTime, cycle}:{startTime: string, cycle: number}) {
    const {percent, steps} = getPassedPercent(startTime, cycle);
    
    return <Progress percent={percent} steps={steps} showInfo format={(p) => `本周期进度条：${p?.toFixed(0)}%`} />
}