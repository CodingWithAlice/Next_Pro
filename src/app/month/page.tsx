"use client";
import "./app.css";
import { Button, message } from "antd";
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useEffect, useState, useRef } from "react";
import { MonthDetailTextarea } from "@/components/month-detail-textarea";
import Api from "@/service/api";

export default function Month() {
    const [monthData, setMonthData] = useState<{ [key: string]: string }>({});
    const [periods, setPeriods] = useState<number[]>([0]);
    const [monthId, setMonthId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [messageApi, contextHolder] = message.useMessage();
    const isInitialized = useRef(false);

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

    const handlePrevMonth = async () => {
        if (!monthId || loading) return;
        
        setLoading(true);
        try {
            const { monthData, currentId } = await Api.getMonthApi(monthId, 'pre');
            if (currentId && monthData) {
                setMonthId(currentId);
                processMonthData(monthData);
            } else {
                messageApi.warning('已经是第一阶段了');
            }
        } catch (e: any) {
            messageApi.error(e.message || '加载失败');
        } finally {
            setLoading(false);
        }
    }

    const handleNextMonth = async () => {
        if (!monthId || loading) return;
        
        setLoading(true);
        try {
            const { monthData, currentId } = await Api.getMonthApi(monthId, 'next');
            if (currentId && monthData) {
                setMonthId(currentId);
                processMonthData(monthData);
            } else {
                messageApi.warning('已经是最新阶段了');
            }
        } catch (e: any) {
            messageApi.error(e.message || '加载失败');
        } finally {
            setLoading(false);
        }
    }

    // 处理月份数据的公共逻辑
    const processMonthData = (monthData: any) => {
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
    }

    // 加载月份数据
    const loadMonthData = (id: number) => {
        setLoading(true);
        return Api.getMonthApi(id).then(({ monthData, currentId }) => {
            // 如果有 currentId，更新 monthId（主要用于初始加载）
            if (currentId && currentId !== monthId) {
                setMonthId(currentId);
            }
            
            // 处理数据
            processMonthData(monthData);
        }).catch((e) => {
            messageApi.error(e.message || '加载数据失败');
            throw e;
        }).finally(() => {
            setLoading(false);
        })
    }

    // 初始化：加载最新阶段（只执行一次）
    useEffect(() => {
        if (isInitialized.current) return; // 已经初始化过了，跳过
        
        setLoading(true);
        Api.getMonthApi().then(({ monthData, currentId }) => {
            if (currentId && monthData) {
                setMonthId(currentId);
                processMonthData(monthData);
            }
            isInitialized.current = true;
        }).catch((e) => {
            messageApi.error(e.message || '加载数据失败');
            isInitialized.current = true; // 即使失败也标记为已初始化，避免重复尝试
        }).finally(() => {
            setLoading(false);
        })
    }, []); // 只在组件挂载时执行一次

    // 按钮禁用状态：只有在加载中才禁用，能否切换需要通过 API 查询判断
    const canGoPrev = !loading && monthId > 0;
    const canGoNext = !loading && monthId > 0;

    return <div className="outer">
        {contextHolder}
        <div className="month">
            <Button
                icon={<LeftOutlined />}
                onClick={handlePrevMonth}
                disabled={!canGoPrev}
                loading={loading}
                size="small"
                className="month-nav-btn"
            >
                上一阶段
            </Button>
            <h1 className="month-title"> {monthId} 阶段报</h1>
            <Button
                icon={<RightOutlined />}
                onClick={handleNextMonth}
                disabled={!canGoNext}
                loading={loading}
                size="small"
                className="month-nav-btn"
            >
                下一阶段
            </Button>
        </div>
         <MonthDetailTextarea monthData={monthData} setMonthData={setMonthData} periods={periods} setPeriods={setPeriods} />
        <Button type="primary" className='btn' onClick={handleSave}>保存</Button>
    </div>
}