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
    const [monthId, setMonthId] = useState<number>(0);
    const [messageApi, contextHolder] = message.useMessage();
    const urlParams = useSearchParams();

    const handleSave = () => {
        Api.postMonthApi({
            ...monthData,
            periods: periods.join(','),
            id: monthId,
        }).then((e) => {            
            if (e) {
                messageApi.success(e.message);
            }
        }).catch((e) => {
            messageApi.error(e.message || '保存失败');
        })
    }

    // 初始化 monthId：先从 URL 参数获取，如果没有则从数据库查询最大 id
    useEffect(() => {
        const urlMonthId = urlParams?.get('monthId');
        
        if (urlMonthId) {
            // 如果 URL 中有 monthId，直接使用
            setMonthId(+urlMonthId);
        } else {
            // 如果没有 URL 参数，从数据库查询最大 id
            Api.getMonthApi().then(({ monthData }) => {
                if (monthData?.id) {
                    // 从返回的数据中获取 id
                    setMonthId(monthData.id);
                }
            })
        }
    }, [urlParams]);

    // 当 monthId 确定后，加载月份数据
    useEffect(() => {
        if (!monthId) return; // 如果 monthId 还没确定，不加载数据
        
        Api.getMonthApi(monthId).then(({ monthData }) => {
            if (monthData?.periods) {
                const longTimeDecision = `【保持】已验证有效模式：
【尝试】方法论迁移场景：
【放弃】低ROI事项：
【纠正】偏离年度目标：`
                let editMonth = monthData?.frontMonthDesc ? monthData :  {...monthData, frontMonthDesc: longTimeDecision}
                editMonth = monthData?.otherMonthDesc ? monthData :  {...editMonth, otherMonthDesc: longTimeDecision}
                setMonthData(editMonth);
                setPeriods(monthData.periods.split(',').map((it: string) => +it));
            }
        }).catch((e) => {
            messageApi.error(e.message || '加载数据失败');
        })
    }, [monthId, messageApi])

    return <div className="outer">
        {contextHolder}
        <div className="month">
            <h1> {monthId} 阶段报</h1>
        </div>
         <MonthDetailTextarea monthData={monthData} setMonthData={setMonthData} periods={periods} setPeriods={setPeriods} />
        <Button type="primary" className='btn' onClick={handleSave}>保存</Button>
    </div>
}