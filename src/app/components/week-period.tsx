'use client'
import Api from "@/service/api";
import { useEffect, useState } from "react";
import { WeekDayProps, WeekDay } from "@/components/week-day";
import '../week/app.css';
import { formatSerialNumber } from "@/components/tool";
import { useSearchParams } from 'next/navigation';
import { LoadingOutlined } from "@ant-design/icons";

export default function Period({ curSerial }: { curSerial: number }) {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [weekData, setWeekData] = useState([]);
    const [pending, setPending] = useState(true);

    const urlParams = useSearchParams();
    const serialNumber = curSerial || +(urlParams?.get('serialNumber') || 0);


    useEffect(() => {
        if (!serialNumber) return;
        Api.getWeekPeriodApi(serialNumber).then(res => {
            setStartTime(res.startTime.slice(5));
            setEndTime(res.endTime.slice(5));
            setWeekData(res.weekData);
            setPending(false);
        })
    }, [curSerial, serialNumber])

    return <>
        {pending ? <LoadingOutlined /> : <><h1 className="week-period">周期时间 {formatSerialNumber(serialNumber)}
            <div className='week-period-time'></div>
            {startTime}--{endTime}
        </h1>
            <section className="week-data-wrap">
                {weekData.map((item: WeekDayProps, index) => {
                    return <WeekDay data={item} key={item.id} index={index} />
                })}
            </section></>}
    </>
}