"use client";
import "./app.css";
import { Button } from "antd";
import { useEffect, useState } from "react";
// import Api from "@/service/api";
import { MonthDetailTextarea } from "@/components/month-detail-textarea";
import { SerialsPicker } from "@/components/serials-picker";

export default function Month() {
    const [monthData, setMonthData] = useState<{ [key: string]: string }>({});
    const [periods, setPeriods] = useState<number[]>([0]);

    const handleSave = () => {

    }
    const onSerialChange = (v: number | number[]) => {
        if (Array.isArray(v)) {
            setPeriods(v);
            console.log('Multiple selected values:', v);
          }

    }

    useEffect(() => {

    }, [])

    return <div className="outer">
        <div className="month">
            <h1>LTN 月报</h1>
            <SerialsPicker onValueChange={onSerialChange} value={periods} mode='multiple' />
        </div>
        <MonthDetailTextarea monthData={monthData} setMonthData={setMonthData} />
        <Button type="primary" className='btn' onClick={handleSave}>保存</Button>
    </div>
}