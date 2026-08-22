'use client'
import Api from "@/service/api";
import { useEffect, useState } from "react";
import { WeekDayProps, WeekDay } from "@/components/week-day";
import '../week/app.css';
import { useSearchParams } from 'next/navigation';
import { LoadingOutlined } from "@ant-design/icons";
import {
    buildSerialDisplayCatalog,
    formatSerialYearIndex,
    type SerialTimeRange,
} from "@lib/serial-display";

export default function Period({ curSerial }: { curSerial: number }) {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [weekData, setWeekData] = useState([]);
    const [pending, setPending] = useState(true);
    const [title, setTitle] = useState('');

    const urlParams = useSearchParams();
    const serialNumber = curSerial || +(urlParams?.get('serialNumber') || 0);


    useEffect(() => {
        if (!serialNumber) return;
        setPending(true);
        Promise.all([
            Api.getWeekPeriodApi(serialNumber),
            Api.getSerial().then(({ serialData = [] }) => serialData as SerialTimeRange[]),
        ]).then(([res, serialData]) => {
            setStartTime(res.startTime.slice(5));
            setEndTime(res.endTime.slice(5));
            setWeekData(res?.weekData);
            const catalog = buildSerialDisplayCatalog(serialData);
            const meta = catalog.get(serialNumber);
            setTitle(
                meta
                    ? formatSerialYearIndex(meta)
                    : `全局#${serialNumber}`
            );
            setPending(false);
        })
    }, [curSerial, serialNumber])

    return <>
        {pending ? <LoadingOutlined /> : <><h1 className="week-period" title={`全局#${serialNumber}`}>
            周期时间 {title}
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
