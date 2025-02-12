"use client";
import "./app.css";
import { Button } from "antd";
import { useState } from "react";
// import Api from "@/service/api";
import { MonthDetailTextarea } from "@/components/month-detail-textarea";
import Api from "@/service/api";
import config from "config";

export default function Month() {
    const [monthData, setMonthData] = useState<{ [key: string]: string }>({});
    const [periods, setPeriods] = useState<number[]>([0]);

    const handleSave = () => {
        Api.postMonthApi({
            ...monthData, 
            periods: periods.join(','),
            id: config.monthSerial, 
        }).then((e) => {
            console.log(222222, e);
        })
    }

    return <div className="outer">
        <div className="month">
            <h1>LTN 月报</h1>
        </div>
        <MonthDetailTextarea monthData={monthData} setMonthData={setMonthData} periods={periods} setPeriods={setPeriods} />
        <Button type="primary" className='btn' onClick={handleSave}>保存</Button>
    </div>
}