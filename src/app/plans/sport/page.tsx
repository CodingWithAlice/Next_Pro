'use client';
import './app.css';
import { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, Button, Card, message, Calendar, Select, Progress } from 'antd';
import type { DatePickerProps, CalendarProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import RecordModal from './record-modal';
import Api from '@/service/api';

// 运动类型
export type SportType = 'running' | 'resistance' | 'hiking' | 'class';

interface SportRecord {
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

interface SportSummary {
    running: number;
    resistance: number;
    hiking: number;
    class: number;
}

interface RunningPlanItem {
    id: number;
    runType: string;
    distance: number;
    targetTimes: number;
    currentTimes: number;
    startDate: string;
    endDate: string;
    targetHeartRate?: string;
    totalDistance: number;
    progress: number;
    recordsCount: number;
}

interface RunningPlan {
    planName: string;
    startDate: string;
    endDate: string;
    totalTargetTimes: number;
    totalCompletedTimes: number;
    totalDistance: number;
    overallProgress: number;
    items: RunningPlanItem[];
}

// 运动类型配置
const SPORT_TYPES_CONFIG = [
    { type: 'running' as SportType, label: '跑步', unit: 'km', summaryKey: 'running' as keyof SportSummary },
    { type: 'resistance' as SportType, label: '撸铁', unit: 'kg', summaryKey: 'resistance' as keyof SportSummary },
    { type: 'hiking' as SportType, label: '徒步', unit: 'km', summaryKey: 'hiking' as keyof SportSummary },
    { type: 'class' as SportType, label: '课程', unit: 'min', summaryKey: 'class' as keyof SportSummary },
];

// 格式化记录显示内容
const formatRecordContent = (record: SportRecord): string => {
    const config = SPORT_TYPES_CONFIG.find(c => c.type === record.type);
    if (!config) return '';
    
    switch (record.type) {
        case 'running':
            return `跑步 ${record.value}km`;
        case 'resistance':
            return `${record.category} ${record.value}kg`;
        case 'hiking':
            return `徒步 ${record.value}km${record.subInfo ? ` (${record.subInfo})` : ''}`;
        case 'class':
            return `${record.category} ${record.value}分钟`;
        default:
            return '';
    }
};

export default function SportPage() {
    const [messageApi, contextHolder] = message.useMessage();
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [todaySummary, setTodaySummary] = useState<SportSummary>({
        running: 0,
        resistance: 0,
        hiking: 0,
        class: 0
    });
    const [totalSummary, setTotalSummary] = useState<SportSummary>({
        running: 0,
        resistance: 0,
        hiking: 0,
        class: 0
    });
    const [records, setRecords] = useState<SportRecord[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<SportType>('running');
    const [expandedRecords, setExpandedRecords] = useState(false);
    const [runningPlans, setRunningPlans] = useState<RunningPlan[]>([]);

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
                return `${record.category} ${record.value}min`;
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

    // 加载数据
    const loadData = async () => {
        try {
            // 获取全部记录用于显示
            const response = await Api.getSportApi();
            
            if (response.success) {
                // 设置今日汇总
                setTodaySummary(response.todaySummary);
                
                // 设置总汇总
                setTotalSummary(response.totalSummary);
                
                // 设置记录列表（显示全部记录）
                setRecords(response.records);
            }

            // 加载跑步计划进度
            const plansResponse = await Api.getRunningPlansApi();
            if (plansResponse.success) {
                setRunningPlans(plansResponse.plans || []);
            }
        } catch (error: any) {
            messageApi.error(error.message || '加载数据失败');
        }
    };

    // 日期选择器变化
    const onDateChange: DatePickerProps['onChange'] = (date) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    // 打开记录弹窗
    const openRecordModal = (type: SportType) => {
        setModalType(type);
        setIsModalOpen(true);
    };

    // 关闭弹窗
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    // 保存记录
    const handleSaveRecord = async (values: any) => {
        try {
            const response = await Api.postSportApi(values);
            if (response.success) {
                messageApi.success('记录保存成功');
                setIsModalOpen(false);
                // 刷新数据
                await loadData();
            }
        } catch (error: any) {
            messageApi.error(error.message || '保存失败');
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    return (
        <div className="sport-page">
            {contextHolder}

            {/* 第一层：快捷记录 + 时间维度切换 */}
            <Card className="sport-card" title={
                <div className="card-header">
                    <span>快捷记录</span>
                    <DatePicker
                        value={selectedDate}
                        onChange={onDateChange}
                        format="YYYY-MM-DD"
                        size="small"
                    />
                </div>
            }>
                <div className="today-summary">
                    <div className="summary-item">
                        <span className="label">今日运动：</span>
                        {SPORT_TYPES_CONFIG.map((config, index) => (
                            <span key={config.type}>
                                {index > 0 && <span className="separator">|</span>}
                                <span className="value">
                                    {config.label} {todaySummary[config.summaryKey]}{config.unit}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="quick-actions">
                    {SPORT_TYPES_CONFIG.map((config) => (
                        <Button 
                            key={config.type}
                            type="primary" 
                            onClick={() => openRecordModal(config.type)}
                        >
                            <PlusOutlined /> {config.label}
                        </Button>
                    ))}
                </div>
            </Card>

            {/* 第二层：今日概览 + 运动日历 */}
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
                    <div className="sport-calendar">
                        <Calendar dateCellRender={dateCellRender} />
                    </div>
                </div>
            </Card>

            

            {/* 第三层：运动进展卡片 */}
            <div className="progress-cards">
                <Card className="sport-card progress-card" title="跑步计划进度">
                    {runningPlans.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            暂无活跃的跑步计划
                        </div>
                    ) : (
                        <div className="running-plans-list">
                            {runningPlans.map((plan, planIndex) => (
                                <div key={plan.planName || planIndex} className="running-plan-item">
                                    <div className="plan-header">
                                        <span className="plan-name">{plan.planName}</span>
                                        <span className="plan-overall">
                                            总计：{plan.totalCompletedTimes}/{plan.totalTargetTimes}次
                                        </span>
                                    </div>
                                    <div className="plan-info">
                                        <div className="plan-summary">
                                            <span>总距离：{plan.totalDistance}km</span>
                                            <span className="plan-date">
                                                {plan.startDate} 至 {plan.endDate}
                                            </span>
                                        </div>
                                    </div>
                                    <Progress 
                                        percent={plan.overallProgress} 
                                        status={plan.overallProgress >= 100 ? 'success' : 'active'}
                                        strokeColor={plan.overallProgress >= 100 ? '#52c41a' : '#1890ff'}
                                    />
                                    
                                    {/* 显示每个子项 */}
                                    <div className="plan-items">
                                        {plan.items.map((item) => (
                                            <div key={item.id} className="plan-item-detail">
                                                <div className="item-header">
                                                    <span className="item-type">{item.runType}</span>
                                                    <span className="item-distance">{item.distance}km × {item.targetTimes}次</span>
                                                </div>
                                                <div className="item-progress">
                                                    <span className="item-status">
                                                        完成：{item.currentTimes}/{item.targetTimes}次
                                                        {item.totalDistance > 0 && ` (${item.totalDistance}km)`}
                                                    </span>
                                                    <Progress 
                                                        percent={item.progress}
                                                        size="small"
                                                        status={item.progress >= 100 ? 'success' : 'active'}
                                                        style={{ width: '200px' }}
                                                    />
                                                </div>
                                                {item.targetHeartRate && (
                                                    <div className="item-heart-rate">
                                                        目标心率：{item.targetHeartRate}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
                <Card className="sport-card progress-card" title="抗阻能力追踪">
                    {/* TODO: 抗阻能力追踪内容 */}
                    <div>抗阻能力追踪（待实现）</div>
                </Card>
            </div>

            {/* 第四层：近期运动记录 + 月度趋势 */}
            <Card className="sport-card" title="近期运动记录">
                <div className="recent-records">
                    {records.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            暂无记录
                        </div>
                    ) : (
                        (expandedRecords ? records : records.slice(0, 5)).map((record) => (
                            <div key={record.id} className="record-item">
                                <span className="record-date">{record.date}</span>
                                <span className="record-content">
                                    {formatRecordContent(record)}
                                    {record.duration && ` (${record.duration}分钟)`}
                                </span>
                            </div>
                        ))
                    )}
                    {records.length > 5 && (
                        <div className="record-actions">
                            <Button size="small" onClick={() => setExpandedRecords(!expandedRecords)}>
                                {expandedRecords ? '收起' : '展开全部'}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* 记录弹窗 */}
            <RecordModal
                open={isModalOpen}
                type={modalType}
                date={selectedDate}
                onCancel={handleCancel}
                onSave={handleSaveRecord}
            />
        </div>
    );
}

