'use client';
import { useState } from 'react';
import { Card, Progress, Button } from 'antd';
import { DownOutlined, PlusOutlined, UpOutlined } from '@ant-design/icons';
import { ViewOnlyTooltip } from '@/components/capability-context';
import type { RunningPlan } from './running-plans-card';
import './app.css';

const PART_ORDER = ['上肢', '下肢'];
const PREVIEW_COUNT = 2;

interface ResistancePlansCardProps {
    plans: RunningPlan[];
    canEdit?: boolean;
    onAdd?: () => void;
}

export default function ResistancePlansCard({ plans, canEdit = false, onAdd }: ResistancePlansCardProps) {
    const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
    const [showAllPlans, setShowAllPlans] = useState(false);

    const togglePlanExpanded = (planName: string) => {
        setExpandedPlans((prev) => {
            const next = new Set(prev);
            if (next.has(planName)) {
                next.delete(planName);
            } else {
                next.add(planName);
            }
            return next;
        });
    };

    const sortedPlans = [...plans].sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
    const visiblePlans = showAllPlans ? sortedPlans : sortedPlans.slice(0, PREVIEW_COUNT);

    return (
        <Card
            className="sport-card progress-card"
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>抗阻能力追踪</span>
                    {onAdd && (
                        <ViewOnlyTooltip viewOnly={!canEdit}>
                            <Button
                                type="link"
                                size="small"
                                icon={<PlusOutlined />}
                                disabled={!canEdit}
                                onClick={onAdd}
                                style={{ padding: 0 }}
                            >
                                添加计划
                            </Button>
                        </ViewOnlyTooltip>
                    )}
                </div>
            }
        >
            {sortedPlans.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    暂无抗阻计划
                </div>
            ) : (
                <>
                <div className="running-plans-list">
                    {visiblePlans.map((plan, planIndex) => {
                        const isExpanded = expandedPlans.has(plan.planName);
                        const dateText = plan.endDate
                            ? `${plan.startDate}～${plan.endDate}`
                            : `${plan.startDate}～`;
                        const items = [...plan.items].sort(
                            (a, b) => PART_ORDER.indexOf(a.runType) - PART_ORDER.indexOf(b.runType)
                        );

                        return (
                            <div
                                key={plan.planName || planIndex}
                                className={`running-plan-item ${plan.status === 'completed' ? 'plan-completed' : ''}`}
                            >
                                <div className="plan-header">
                                    <span className="plan-name">{plan.planName}</span>
                                    <div className="plan-header-right">
                                        <span className="plan-overall">
                                            总计 {plan.totalCompletedTimes}/{plan.totalTargetTimes}kg
                                        </span>
                                        <Button
                                            type="link"
                                            size="small"
                                            icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                                            onClick={() => togglePlanExpanded(plan.planName)}
                                            style={{ padding: 0, marginLeft: 8 }}
                                        />
                                    </div>
                                </div>
                                <div className="plan-progress-row">
                                    <span className="plan-summary-text">
                                        {dateText}
                                    </span>
                                    <Progress
                                        percent={plan.overallProgress}
                                        status={plan.overallProgress >= 100 ? 'success' : 'active'}
                                        strokeColor={plan.overallProgress >= 100 ? '#52c41a' : '#1890ff'}
                                        strokeWidth={6}
                                        showInfo={false}
                                        className="plan-progress-bar"
                                    />
                                    <span className="plan-percent">{Math.round(plan.overallProgress)}%</span>
                                </div>
                                {isExpanded && (
                                    <div className="plan-items-by-type">
                                        {items.map((item) => (
                                            <div key={item.id} className="plan-item-detail">
                                                <div className="plan-item-progress-row">
                                                    <span className="item-label">
                                                        {item.runType} 已完成{item.current}/{item.target}kg
                                                    </span>
                                                    <Progress
                                                        percent={item.progress}
                                                        size="small"
                                                        status={item.progress >= 100 ? 'success' : 'active'}
                                                        strokeWidth={5}
                                                        showInfo={false}
                                                        className="item-progress-bar"
                                                    />
                                                    <span className="item-percent">{Math.round(item.progress)}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {sortedPlans.length > PREVIEW_COUNT && (
                    <div className="record-actions">
                        <Button size="small" onClick={() => setShowAllPlans((open) => !open)}>
                            {showAllPlans ? '收起' : `展开全部 ${sortedPlans.length} 个`}
                        </Button>
                    </div>
                )}
                </>
            )}
        </Card>
    );
}
