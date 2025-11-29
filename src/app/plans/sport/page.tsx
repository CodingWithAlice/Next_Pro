'use client';
import './app.css';
import { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, Button, Card, Modal, Input, InputNumber, Select, message } from 'antd';
import type { DatePickerProps } from 'antd';
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import RecordModal from './record-modal';

// 运动类型
export type SportType = 'running' | 'resistance' | 'hiking' | 'course';

interface SportRecord {
    id?: number;
    date: string;
    type: SportType;
    content: string;
    // running: { distance: number }; // km
    // resistance: { times: number }; // 次数
    // hiking: { location: string; times: number }; // 地点，次数
    // course: { name: string; times: number }; // 课程名，次数
}

interface TodaySummary {
    running: number; // km
    resistance: number; // 次
    hiking: number; // 次
    course: number; // 节
}

interface TotalSummary {
    running: number; // km
    resistance: number; // 次
    hiking: number; // 次
    course: number; // 节
}

export default function SportPage() {
    const [messageApi, contextHolder] = message.useMessage();
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [todaySummary, setTodaySummary] = useState<TodaySummary>({
        running: 0,
        resistance: 0,
        hiking: 0,
        course: 0
    });
    const [totalSummary, setTotalSummary] = useState<TotalSummary>({
        running: 0,
        resistance: 0,
        hiking: 0,
        course: 0
    });
    const [records, setRecords] = useState<SportRecord[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<SportType>('running');
    const [expandedRecords, setExpandedRecords] = useState(false);

    // 日期选择器变化
    const onDateChange: DatePickerProps['onChange'] = (date) => {
        if (date) {
            setSelectedDate(date);
            // TODO: 加载选中日期的数据
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
    const handleSaveRecord = (values: any) => {
        // TODO: 调用 API 保存数据
        console.log('保存记录:', modalType, values);
        messageApi.success('记录保存成功');
        setIsModalOpen(false);
        // TODO: 刷新数据
    };

    // 解析运动数据（从 IssueModal.sport 字段解析）
    const parseSportData = (sportText: string): SportRecord[] => {
        // TODO: 解析 sport 文本数据
        // 这里暂时返回空数组，后续根据实际数据格式解析
        return [];
    };

    useEffect(() => {
        // TODO: 加载今日数据
        // TODO: 加载总数据
        // TODO: 加载运动记录
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
                        <span className="value">跑步 {todaySummary.running}km</span>
                        <span className="separator">|</span>
                        <span className="value">撸铁 {todaySummary.resistance}次</span>
                        <span className="separator">|</span>
                        <span className="value">徒步 {todaySummary.hiking}次</span>
                        <span className="separator">|</span>
                        <span className="value">课程 {todaySummary.course}节</span>
                    </div>
                </div>

                <div className="quick-actions">
                    <Button type="primary" onClick={() => openRecordModal('running')}>
                        <PlusOutlined /> 跑步
                    </Button>
                    <Button type="primary" onClick={() => openRecordModal('resistance')}>
                        <PlusOutlined /> 抗阻
                    </Button>
                    <Button type="primary" onClick={() => openRecordModal('hiking')}>
                        <PlusOutlined /> 徒步
                    </Button>
                    <Button type="primary" onClick={() => openRecordModal('course')}>
                        <PlusOutlined /> 课程
                    </Button>
                </div>
            </Card>

            {/* 第二层：今日概览 + 运动日历 */}
            <Card className="sport-card" title="运动概览">
                <div className="quick-record-section">
                    <div className="total-summary">
                        <span className="label">总数：</span>
                        <span className="value">跑步 {totalSummary.running}km</span>
                        <span className="separator">|</span>
                        <span className="value">撸铁 {totalSummary.resistance}次</span>
                        <span className="separator">|</span>
                        <span className="value">徒步 {totalSummary.hiking}次</span>
                        <span className="separator">|</span>
                        <span className="value">课程 {totalSummary.course}节</span>
                    </div>

                    {/* TODO: 运动日历组件 */}
                    <div className="sport-calendar">
                        <CalendarOutlined /> 运动日历（待实现）
                    </div>
                </div>
            </Card>

            

            {/* 第三层：运动进展卡片 */}
            <div className="progress-cards">
                <Card className="sport-card progress-card" title="跑步计划进度">
                    {/* TODO: 跑步计划进度内容 */}
                    <div>跑步计划进度（待实现）</div>
                </Card>
                <Card className="sport-card progress-card" title="抗阻能力追踪">
                    {/* TODO: 抗阻能力追踪内容 */}
                    <div>抗阻能力追踪（待实现）</div>
                </Card>
            </div>

            {/* 第四层：近期运动记录 + 月度趋势 */}
            <Card className="sport-card" title="近期运动记录">
                <div className="recent-records">
                    {(expandedRecords ? records : records.slice(0, 3)).map((record, index) => (
                        <div key={index} className="record-item">
                            <span className="record-date">{record.date}</span>
                            <span className="record-content">- {record.content}</span>
                        </div>
                    ))}
                    <div className="record-actions">
                        <Button size="small" onClick={() => setExpandedRecords(!expandedRecords)}>
                            {expandedRecords ? '收起' : '展开整月'}
                        </Button>
                        <Button size="small">展开全部</Button>
                    </div>
                </div>
            </Card>

            {/* 记录弹窗 */}
            <RecordModal
                open={isModalOpen}
                type={modalType}
                onCancel={handleCancel}
                onSave={handleSaveRecord}
            />
        </div>
    );
}

