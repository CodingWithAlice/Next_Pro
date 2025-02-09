'use client'
import Api from "@/service/api"
import { useEffect, useState } from "react"
import { WeekDayProps, WeekDay } from "@/components/week-day";
import '../app.css'

export default function Period() {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [weekData, setWeekData] = useState([]);

    useEffect(() => {
        Api.getWeekPeriodApi(14).then(res => {
            setStartTime(res.startTime.slice(5));
            setEndTime(res.endTime.slice(5));
            setWeekData(res.weekData);
        })
    }, [])

    return <div>
        <h1 className="week-period">周期时间 {startTime}--{endTime}</h1>
        <section className="week-data-wrap">
            {weekData.map((item: WeekDayProps, index) => {
                return <WeekDay data={item} key={item.id} index={index} />
            })}
        </section>
    </div>
}