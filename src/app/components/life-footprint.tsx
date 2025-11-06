"use client"
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Api from '@/service/api';
import './life-footprint.css';

interface LifeFootprintProps {
    /** 当前显示的日期 */
    currentDate?: string;
}

export default function LifeFootprint({ currentDate }: LifeFootprintProps) {
    const [totalDays, setTotalDays] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // 获取记录天数
    const fetchTotalDays = async () => {
        setLoading(true);
        try {
            // 使用今天的日期作为参数
            const response = await Api.getIssueListApi();
            
            if (response?.success) {
                setTotalDays(response.totalDays || 0);
            }
        } catch (error) {
            console.error('获取记录天数失败:', error);
            setTotalDays(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTotalDays();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate]); // 当日期改变时重新计算（用户保存数据后）

    return (
        <div className="life-footprint">
            {loading ? (
                <div className="footprint-loading">计算中...</div>
            ) : (
                <div className="footprint-content">
                    <div className="footprint-text">
                        您已连续记录 <span className="days-number">{totalDays}</span> 天
                    </div>
                </div>
            )}
        </div>
    );
}

