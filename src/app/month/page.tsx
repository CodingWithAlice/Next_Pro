"use client";
import "./app.css";
import { Button } from "antd";
import { useState } from "react";
// import Api from "@/service/api";
import { MonthDetailTextarea } from "@/components/month-detail-textarea";

export default function Month() {
    const [monthData, setMonthData] = useState<{ [key: string]: string }>({});

    const handleSave = () => {}

    return <div className="outer">
        <div className="month">
            <h1>LTN 月报</h1>
        </div>
        <MonthDetailTextarea monthData={monthData} setMonthData={setMonthData} />
        <Button type="primary" className='btn' onClick={handleSave}>保存</Button>
    </div>
}