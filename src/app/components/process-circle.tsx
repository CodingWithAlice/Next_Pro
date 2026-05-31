import { Progress } from "antd";
import { getPassedPercent } from "./tool";

export default function ProcessCircle({ startTime, cycle }: { startTime: string, cycle: number }) {
    const { percent, steps } = getPassedPercent(startTime, cycle);

    return (
        <Progress
            className="process-circle-steps"
            percent={percent}
            steps={steps}
            showInfo
            format={(p) => `${p?.toFixed(0)}%`}
            strokeColor="#96e6a1"
        />
    );
}