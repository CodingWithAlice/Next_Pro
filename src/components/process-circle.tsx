import { Progress } from "antd";
import { getPassedPercent } from "./tool";

export default function ProcessCircle({ startTime, cycle }: { startTime: string, cycle: number }) {
    const { percent, steps } = getPassedPercent(startTime, cycle);
    
    return <Progress
        percent={percent}
        steps={steps}
        showInfo
        format={(p) => `${p?.toFixed(0)}%`} style={{ height: 32 }}
        strokeColor="#96e6a1" />
}