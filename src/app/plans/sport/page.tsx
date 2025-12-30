'use client';
import './app.css';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Button, Card, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import RecordModal from './record-modal';
import RunningPlansCard, { type RunningPlan } from './running-plans-card';
import SportOverviewCard, { type SportRecord, type SportSummary } from './sport-overview-card';
import RecentRecordsCard from './recent-records-card';
import Api from '@/service/api';

// 运动类型
export type SportType = 'running' | 'resistance' | 'hiking' | 'class';

// 运动类型配置
const SPORT_TYPES_CONFIG = [
    { type: 'running' as SportType, label: '跑步', unit: 'km', summaryKey: 'running' as keyof SportSummary },
    { type: 'resistance' as SportType, label: '撸铁', unit: 'kg', summaryKey: 'resistance' as keyof SportSummary },
    { type: 'hiking' as SportType, label: '徒步', unit: 'km', summaryKey: 'hiking' as keyof SportSummary },
    { type: 'class' as SportType, label: '课程', unit: 'min', summaryKey: 'class' as keyof SportSummary },
];

export default function SportPage() {
    const [messageApi, contextHolder] = message.useMessage();
    const [totalSummary, setTotalSummary] = useState<SportSummary>({
        running: 0,
        resistance: 0,
        hiking: 0,
        class: 0
    });
    const [records, setRecords] = useState<SportRecord[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<SportType>('running');
    const [runningPlans, setRunningPlans] = useState<RunningPlan[]>([]);

    // 加载数据
    const loadData = async () => {
        try {
            // 获取全部记录用于显示
            const response = await Api.getSportApi();
            
            if (response.success) {
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
    }, []);

    return (
        <div className="sport-page">
            {contextHolder}

            {/* 第一层：快捷记录 */}
            <Card className="sport-card" title="快捷记录">
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
            <SportOverviewCard totalSummary={totalSummary} records={records} />

            

            {/* 第三层：运动进展卡片 */}
            <div className="progress-cards">
                <RunningPlansCard plans={runningPlans} />
                <Card className="sport-card progress-card" title="抗阻能力追踪">
                    {/* TODO: 抗阻能力追踪内容 */}
                    <div>抗阻能力追踪（待实现）</div>
                </Card>
            </div>

            {/* 第四层：近期运动记录 + 月度趋势 */}
            <RecentRecordsCard records={records} />

            {/* 记录弹窗 */}
            <RecordModal
                open={isModalOpen}
                type={modalType}
                date={dayjs()}
                onCancel={handleCancel}
                onSave={handleSaveRecord}
            />
        </div>
    );
}

