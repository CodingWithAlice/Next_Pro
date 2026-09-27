'use client';
import './app.css';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Button, Card, message, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import RecordModal from './record-modal';
import { useCanEdit, ViewOnlyTooltip } from '@/components/capability-context';
import RunningPlansCard, { type RunningPlan } from './running-plans-card';
import ResistancePlansCard from './resistance-plans-card';
import PlanModal, { type PlanFormValues, type PlanSportType } from './plan-modal';
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
    const [loading, setLoading] = useState(true);
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
    const [planModalType, setPlanModalType] = useState<PlanSportType | null>(null);
    const canEdit = useCanEdit('sport');

    // 加载数据
    const loadData = async () => {
        try {
            setLoading(true);
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
        } catch (error) {
            messageApi.error((error as Error).message || '加载数据失败');
        } finally {
            setLoading(false);
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

    const handleSavePlan = async (values: PlanFormValues) => {
        let response: { success: boolean; message?: string };
        try {
            response = await Api.postRunningPlanApi(values);
        } catch (error) {
            messageApi.error((error as Error).message || '保存失败');
            throw error;
        }
        if (!response.success) {
            messageApi.error(response.message || '保存失败');
            throw new Error(response.message || '保存失败');
        }
        messageApi.success('计划已添加');
        setPlanModalType(null);
        await loadData();
    };

    // 保存记录
    const handleSaveRecord = async (values: {
        type: SportType;
        date: string;
        value: number;
        category: string;
        subInfo?: string | null;
        duration?: number | null;
        notes?: string | null;
    }) => {
        try {
            const response = await Api.postSportApi({
                ...values,
                subInfo: values.subInfo ?? undefined,
                duration: values.duration ?? undefined,
                notes: values.notes ?? undefined,
            });
            if (response.success) {
                messageApi.success('记录保存成功');
                setIsModalOpen(false);
                // 刷新数据
                await loadData();
            }
        } catch (error) {
            messageApi.error((error as Error).message || '保存失败');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '400px' 
            }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="sport-page">
            {contextHolder}
            {/* 第一层：快捷记录 */}
            <Card
                className="sport-card sport-quick-card"
                title={
                    <div className="sport-quick-title">
                        <span>快捷记录</span>
                        <div className="quick-actions">
                            {SPORT_TYPES_CONFIG.map((config) => (
                                <ViewOnlyTooltip key={config.type} viewOnly={!canEdit}>
                                    <Button
                                        type="primary"
                                        size="small"
                                        disabled={!canEdit}
                                        onClick={() => openRecordModal(config.type)}
                                    >
                                        <PlusOutlined /> {config.label}
                                    </Button>
                                </ViewOnlyTooltip>
                            ))}
                        </div>
                    </div>
                }
            />

            {/* 第二层：今日概览 + 运动日历 */}
            <SportOverviewCard totalSummary={totalSummary} records={records} />

            

            {/* 第三层：运动进展卡片 */}
            <div className="progress-cards">
                <RunningPlansCard
                    plans={runningPlans.filter((plan) => plan.sportType !== 'resistance')}
                    canEdit={canEdit}
                    onAdd={() => setPlanModalType('running')}
                />
                <ResistancePlansCard
                    plans={runningPlans.filter((plan) => plan.sportType === 'resistance')}
                    canEdit={canEdit}
                    onAdd={() => setPlanModalType('resistance')}
                />
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
            <PlanModal
                open={planModalType !== null}
                sportType={planModalType || 'running'}
                onCancel={() => setPlanModalType(null)}
                onSave={handleSavePlan}
            />
        </div>
    );
}

