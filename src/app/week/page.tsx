"use client";
import './app.css';
import { Button } from "antd";
import { useEffect, useState } from "react";
import Api from "@/service/api";
import { SerialsPicker } from "@/components/serials-picker";
import { WeekDetailTextarea } from '@/components/week-detail-textarea';
import { WeekPeriodModal } from '@/components/week-period-modal';

export default function Week() {
    const [weekData, setWeekData] = useState<{ [key: string]: string }>({});
    const [serials, setSerials] = useState([]);
    const [curSerial, setCurSerial] = useState(0);
    
    const handleSave = () => {
        const current = +curSerial === 0 ? serials.length + 1 : curSerial;
        Api.postWeekApi({ ...weekData, serialNumber: current }).then((res) => {
            console.log('post', res);
        })
    }

    useEffect(() => {
        Api.getWeekApi(curSerial).then(({ weekData, serialData }) => {
            setSerials(serialData.reverse());

            const currentSerial = serialData.filter((it: { [key: string]: string }) => +it.serialNumber === curSerial)?.[0];            
            const time = currentSerial ? `${currentSerial?.startTime} 至 ${currentSerial?.endTime}` : '新周期';
            setWeekData({ ...weekData, time });
        })
    }, [curSerial])

    return <div className="outer">
        <div className="week">
            <h1>LTN 周报</h1>
            <SerialsPicker serials={serials} setCurSerial={setCurSerial} curSerial={curSerial} />
        </div>
        <WeekDetailTextarea weekData={weekData} setWeekData={setWeekData} />
        <Button type="primary" className='btn' onClick={handleSave}>保存</Button>
        <WeekPeriodModal curSerial={curSerial} />
    </div>
}