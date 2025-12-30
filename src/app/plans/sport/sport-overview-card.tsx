'use client';
import { useState, useMemo } from 'react';
import { Card, Calendar, Button } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import type { CalendarProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import ShareImageButton from '@/components/share-image-button';
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
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
    const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());

    // 获取课程类型的颜色
    const getClassColor = (category: string): string => {
        const colorMap: { [key: string]: string } = {
            '跳操': '#ff7875',
            '瑜伽课': '#95de64',
            '踏板课': '#ffc069',
            '乒乓球': '#40a9ff',
            '蹦床课': '#b37feb',
            '杠铃课': '#ff85c0',
            '跳舞': '#ff9c6e',
            '舞力全开': '#ffd666',
            '有氧操': '#ffadd2',
            '尊巴': '#ff7a45',
            '肚皮舞': '#ffa940',
            '舞蹈课': '#ffc53d',
            '跳大绳': '#ffa940',
            '团课': '#ff7875',
            '翘臀美腿团课': '#ff85c0',
            '杠铃减脂': '#ffc069',
            '杠零臀腿': '#ffc069',
            '搏击课': '#ff4d4f',
            '搏击操': '#ff4d4f',
            '爬坡': '#8c8c8c',
            '爬楼': '#8c8c8c',
            '爬楼梯': '#8c8c8c',
        };
        return colorMap[category] || '#722ed1'; // 默认紫色
    };

    // 格式化单个记录用于日历显示
    const formatRecordForCalendar = (record: SportRecord): { data: string; label: string; color: string; showLabel: boolean } => {
        switch (record.type) {
            case 'running':
                return {
                    data: `${record.value}km`,
                    label: '跑步',
                    color: '#52c41a', // 绿色
                    showLabel: true,
                };
            case 'resistance':
                return {
                    data: `${record.value}`, // 不带kg单位
                    label: record.category || '力量',
                    color: '#1890ff', // 深蓝色
                    showLabel: true,
                };
            case 'hiking':
                return {
                    data: `${record.value}km${record.subInfo ? `(${record.subInfo})` : ''}`,
                    label: '徒步',
                    color: '#52c41a', // 绿色
                    showLabel: true,
                };
            case 'class':
                return {
                    data: record.category || record.notes || '课程',
                    label: '',
                    color: getClassColor(record.category),
                    showLabel: false, // 课程类型不显示下面的标签
                };
            default:
                return {
                    data: '',
                    label: '',
                    color: '#999',
                    showLabel: false,
                };
        }
    };

    // 获取有运动记录的日期集合（用于年视图）
    const sportDatesSet = useMemo(() => {
        const datesSet = new Set<string>();
        records.forEach(record => {
            datesSet.add(record.date);
        });
        return datesSet;
    }, [records]);

    // 计算当前年份的运动天数
    const currentYearSportDays = useMemo(() => {
        const yearStart = `${selectedYear}-01-01`;
        const yearEnd = `${selectedYear}-12-31`;
        let count = 0;
        sportDatesSet.forEach(date => {
            if (date >= yearStart && date <= yearEnd) {
                count++;
            }
        });
        return count;
    }, [selectedYear, sportDatesSet]);

    // 日历日期单元格自定义渲染（月视图）
    const dateCellRender = (value: Dayjs) => {
        const dateStr = value.format('YYYY-MM-DD');
        // 获取当天的所有运动记录
        const dayRecords = records.filter(record => record.date === dateStr);
        
        if (dayRecords.length > 0) {
            return (
                <div className="sport-calendar-cell-content">
                    {dayRecords.map((record, index) => {
                        const formatted = formatRecordForCalendar(record);
                        return (
                            <div key={record.id || index} className="sport-calendar-record-item">
                                <div 
                                    className="sport-calendar-record-data" 
                                    style={{ 
                                        backgroundColor: formatted.color,
                                        color: '#ffffff'
                                    }}
                                >
                                    {formatted.data}
                                </div>
                                {formatted.showLabel && (
                                    <div className="sport-calendar-record-label">
                                        {formatted.label}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    // 年视图：渲染单个月的日历
    const renderMonthCalendar = (month: number, year: number) => {
        const monthStart = dayjs(`${year}-${month.toString().padStart(2, '0')}-01`);
        const monthEnd = monthStart.endOf('month');
        const daysInMonth = monthEnd.date();
        const firstDayOfWeek = monthStart.day(); // 0 = 周日, 6 = 周六
        
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const days: (number | null)[] = [];
        
        // 填充月初的空格
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }
        
        // 填充日期
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }
        
        return (
            <div key={`${year}-${month}`} className="year-view-month">
                <div className="year-view-month-title">
                    {month}月
                </div>
                <div className="year-view-month-calendar">
                    <div className="year-view-weekdays">
                        {weekDays.map(day => (
                            <div key={day} className="year-view-weekday">{day}</div>
                        ))}
                    </div>
                    <div className="year-view-days">
                        {days.map((day, index) => {
                            if (day === null) {
                                return <div key={index} className="year-view-day empty"></div>;
                            }
                            
                            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                            const hasSport = sportDatesSet.has(dateStr);
                            
                            return (
                                <div
                                    key={index}
                                    className={`year-view-day ${hasSport ? 'has-sport' : ''}`}
                                    title={hasSport ? `${dateStr} 有运动记录` : dateStr}
                                >
                                    {day}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // 渲染年视图
    const renderYearView = () => {
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        
        return (
            <div className="year-view-container">
                <div className="year-view-header">
                    <Button
                        size="small"
                        onClick={() => setSelectedYear(selectedYear - 1)}
                    >
                        上一年
                    </Button>
                    <span className="year-view-title">
                        {selectedYear}年运动记录
                        <span style={{ marginLeft: 8, color: '#8b0000', fontWeight: 500 }}>
                            {currentYearSportDays}天
                        </span>
                    </span>
                    <Button
                        size="small"
                        onClick={() => setSelectedYear(selectedYear + 1)}
                    >
                        下一年
                    </Button>
                </div>
                <div className="year-view-months">
                    {months.map(month => renderMonthCalendar(month, selectedYear))}
                </div>
            </div>
        );
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {calendarExpanded && (
                                <>
                                    <Button
                                        size="small"
                                        type={viewMode === 'month' ? 'primary' : 'default'}
                                        onClick={() => setViewMode('month')}
                                    >
                                        月视图
                                    </Button>
                                    <Button
                                        size="small"
                                        type={viewMode === 'year' ? 'primary' : 'default'}
                                        onClick={() => setViewMode('year')}
                                    >
                                        年视图
                                    </Button>
                                    {viewMode === 'month' && (
                                        <ShareImageButton
                                            targetElement=".sport-calendar"
                                            fileName="运动打卡日历"
                                            size="small"
                                            type="link"
                                            style={{ padding: 0 }}
                                        />
                                    )}
                                    {viewMode === 'year' && (
                                        <ShareImageButton
                                            targetElement=".year-view-container"
                                            fileName={`${selectedYear}年运动打卡日历`}
                                            size="small"
                                            type="link"
                                            style={{ padding: 0 }}
                                        />
                                    )}
                                </>
                            )}
                            <Button
                                type="text"
                                size="small"
                                icon={calendarExpanded ? <UpOutlined /> : <DownOutlined />}
                                onClick={() => setCalendarExpanded(!calendarExpanded)}
                                style={{ padding: 0 }}
                            />
                        </div>
                    </div>
                    {calendarExpanded && (
                        <div className="sport-calendar">
                            {viewMode === 'month' ? (
                                <Calendar dateCellRender={dateCellRender} />
                            ) : (
                                renderYearView()
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

