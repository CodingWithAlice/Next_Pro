'use client';
import { useState } from 'react';
import { Card, Calendar, Button } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import type { CalendarProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import './app.css';

export type SportType = 'running' | 'resistance' | 'hiking' | 'class';

export interface SportRecord {
    id?: number;
    date: string;
    type: SportType;
    value: number;
    category: string;
    subInfo?: string;
    duration?: number;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SportSummary {
    running: number;
    resistance: number;
    hiking: number;
    class: number;
}

interface SportOverviewCardProps {
    totalSummary: SportSummary;
    records: SportRecord[];
}

// 运动类型配置
const SPORT_TYPES_CONFIG = [
    { type: 'running' as SportType, label: '跑步', unit: 'km', summaryKey: 'running' as keyof SportSummary },
    { type: 'resistance' as SportType, label: '撸铁', unit: 'kg', summaryKey: 'resistance' as keyof SportSummary },
    { type: 'hiking' as SportType, label: '徒步', unit: 'km', summaryKey: 'hiking' as keyof SportSummary },
    { type: 'class' as SportType, label: '课程', unit: 'min', summaryKey: 'class' as keyof SportSummary },
];

export default function SportOverviewCard({ totalSummary, records }: SportOverviewCardProps) {
    const [calendarExpanded, setCalendarExpanded] = useState(false);

    // 格式化单个记录用于日历显示（不包含时长）
    const formatRecordForCalendar = (record: SportRecord): string => {
        switch (record.type) {
            case 'running':
                return `${record.value}km`;
            case 'resistance':
                return `${record.category} ${record.value}kg`;
            case 'hiking':
                return `${record.value}km${record.subInfo ? `(${record.subInfo})` : ''}`;
            case 'class':
                return `${record?.notes ?? record.category} ${record.value}min`;
            default:
                return '';
        }
    };

    // 日历日期单元格自定义渲染
    const dateCellRender = (value: Dayjs) => {
        const dateStr = value.format('YYYY-MM-DD');
        // 获取当天的所有运动记录
        const dayRecords = records.filter(record => record.date === dateStr);
        
        if (dayRecords.length > 0) {
            return (
                <div className="sport-calendar-cell-content">
                    {dayRecords.map((record, index) => (
                        <div key={record.id || index} className="sport-calendar-record-item">
                            {formatRecordForCalendar(record)}
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="sport-card" title="运动概览">
            <div className="quick-record-section">
                <div className="total-summary">
                    <span className="label">总数：</span>
                    {SPORT_TYPES_CONFIG.map((config, index) => (
                        <span key={config.type}>
                            {index > 0 && <span className="separator">|</span>}
                            <span className="value">
                                {config.label} {totalSummary[config.summaryKey]}{config.unit}
                            </span>
                        </span>
                    ))}
                </div>

                {/* 运动日历组件 */}
                <div className="sport-calendar-section">
                    <div className="sport-calendar-header">
                        <span className="calendar-title">运动打卡日历</span>
                        <Button
                            type="text"
                            size="small"
                            icon={calendarExpanded ? <UpOutlined /> : <DownOutlined />}
                            onClick={() => setCalendarExpanded(!calendarExpanded)}
                        >
                            {calendarExpanded ? '收起' : '展开'}
                        </Button>
                    </div>
                    {calendarExpanded && (
                        <div className="sport-calendar">
                            <Calendar dateCellRender={dateCellRender} />
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

