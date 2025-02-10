'use client'
import Api from "@/service/api";
import { useEffect, useState } from "react";
import { WeekDayProps, WeekDay } from "@/components/week-day";
import '../app.css';
import { formatSerialNumber, getUrlParams } from "@/components/tool";

const urlParams = getUrlParams();

export default function Period({ curSerial }: { curSerial: number }) {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [weekData, setWeekData] = useState([]);
    const serialNumber = curSerial || +(urlParams?.serialNumber || 0);


    useEffect(() => {
        if(!serialNumber) return;
        Api.getWeekPeriodApi(serialNumber).then(res => {
            setStartTime(res.startTime.slice(5));
            setEndTime(res.endTime.slice(5));
            setWeekData(res.weekData);
        })
    }, [curSerial, serialNumber])

    return <div>
        <h1 className="week-period">周期时间 {formatSerialNumber(serialNumber)} {startTime}--{endTime}</h1>
        <section className="week-data-wrap">
            {weekData.map((item: WeekDayProps, index) => {
                return <WeekDay data={item} key={item.id} index={index} />
            })}
        </section>
    </div>
}