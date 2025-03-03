"use client";
import "./app.css";
import { Button, message } from "antd";
import { useEffect, useState } from "react";
// import Api from "@/service/api";
import { MonthDetailTextarea } from "@/components/month-detail-textarea";
import Api from "@/service/api";
import config from "config";
import { useSearchParams } from 'next/navigation';

export default function Month() {
    const [monthData, setMonthData] = useState<{ [key: string]: string }>({});
    const [periods, setPeriods] = useState<number[]>([0]);
    const [messageApi, contextHolder] = message.useMessage();
    const urlParams = useSearchParams();
    const monthId = +(urlParams?.get('monthId') || 0) || config.monthSerial;

    const handleSave = () => {
        Api.postMonthApi({
            ...monthData,
            periods: periods.join(','),
            id: monthId,
        }).then((e) => {
            if (e?.data) {
                messageApi.success(e.data.message);
            }
        }).catch((e) => {
            messageApi.error(e.message || '保存失败');
        })
    }

    useEffect(() => {
        Api.getMonthApi(monthId).then(({ monthData }) => {
            if (monthData?.periods) {
                setMonthData(monthData);
                setPeriods(monthData.periods.split(',').map((it: string) => +it));
            }
        })
    }, [monthId])

    return <div className="outer">
        {contextHolder}
        <div className="month">
            <h1>LTN {monthId} 月报</h1>
        </div>
        <MonthDetailTextarea monthData={monthData} setMonthData={setMonthData} periods={periods} setPeriods={setPeriods} />
        <Button type="primary" className='btn' onClick={handleSave}>保存</Button>
    </div>
}