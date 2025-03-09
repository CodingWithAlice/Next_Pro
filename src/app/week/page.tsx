"use client";
import './app.css';
import { Button, message } from "antd";
import { useEffect, useState } from "react";
import Api from "@/service/api";
import { SerialsPicker } from "@/components/serials-picker";
import { WeekDetailTextarea } from '@/components/week-detail-textarea';
import { WeekPeriodModal } from '@/components/week-period-modal';
import { getGapTime } from '@/components/tool';

export default function Week() {
    const [weekData, setWeekData] = useState<{ [key: string]: string }>({});
    const [curSerial, setCurSerial] = useState<number>(0);
    const [serialsLength, setSerialsLength] = useState(0);
    const [messageApi, contextHolder] = message.useMessage();

    const handleSingleChange = (value: number | number[]) => {
        if (typeof value === 'number') {
            setCurSerial(value);
        }
    };

    const handleSave = () => {
        const current = +curSerial === 0 ? serialsLength + 1 : curSerial;
        Api.postWeekApi({ ...weekData, serialNumber: current }).then((e) => {
            messageApi.success(e.data.message);
        }).catch((e) => {
            messageApi.error(e.message || '保存失败');
        })
    }

    useEffect(() => {
        Api.getWeekApi(curSerial).then(({ weekData, serialData }) => {
            const currentSerial = serialData.filter((it: { [key: string]: string }) => +it.serialNumber === curSerial)?.[0];
            const gap = getGapTime(currentSerial?.startTime, currentSerial?.endTime, 'day');
            const time = currentSerial ? `${currentSerial?.startTime} 至 ${currentSerial?.endTime} ${gap}天` : '新周期';

            setWeekData({ ...weekData, time });
        })
    }, [curSerial])

    return <div className="outer">
        {contextHolder}
        <div className="week">
            <h1 className='week-title'>LTN 周报</h1>
            <SerialsPicker onValueChange={handleSingleChange} value={curSerial} onSerialsLength={setSerialsLength} className='serial-week' />
        </div>
        <WeekDetailTextarea weekData={weekData} setWeekData={setWeekData} curSerial={curSerial} />
        <Button type="primary" className='btn' onClick={handleSave}>保存</Button>
        {curSerial !== 0 && <WeekPeriodModal curSerial={curSerial} />}
    </div>
}