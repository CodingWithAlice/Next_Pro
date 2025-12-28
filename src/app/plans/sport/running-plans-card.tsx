'use client';
import { useState, useRef } from 'react';
import { Card, Progress, Button } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import ShareImageButton from '@/components/share-image-button';
import './app.css';

export interface RunningPlanItem {
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

export interface RunningPlan {
    planName: string;
    status: string;
    startDate: string;
    endDate: string;
    totalTargetTimes: number;
    totalCompletedTimes: number;
    totalDistance: number;
    overallProgress: number;
    items: RunningPlanItem[];
}

interface RunningPlansCardProps {
    plans: RunningPlan[];
}

export default function RunningPlansCard({ plans }: RunningPlansCardProps) {
    // 跟踪每个计划的展开状态
    const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
    // 用于整体分享的 ref
    const allPlansRef = useRef<HTMLDivElement>(null);
    // 用于单个计划分享的 refs
    const planRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // 切换计划的展开状态
    const togglePlanExpanded = (planName: string) => {
        setExpandedPlans(prev => {
            const newSet = new Set(prev);
            if (newSet.has(planName)) {
                newSet.delete(planName);
            } else {
                newSet.add(planName);
            }
            return newSet;
        });
    };

    // 格式化每个类型的显示：如 匀速跑4(15/18)、5(7/12)
    const formatTypeDisplay = (runType: string, items: RunningPlanItem[]): string => {
        const parts = items
            .sort((a, b) => a.distance - b.distance) // 按距离排序
            .map(item => `${item.distance}(${item.currentTimes}/${item.targetTimes})`)
            .join('、')
        return `${runType}${parts}`
    }

    // 对计划进行排序：先按状态（active 优先），再按开始时间（新的在前）
    const sortedPlans = [...plans].sort((a, b) => {
        // 先按状态排序：active 优先
        if (a.status === 'active' && b.status === 'completed') {
            return -1; // a 在前
        }
        if (a.status === 'completed' && b.status === 'active') {
            return 1; // b 在前
        }
        // 相同状态下，按开始时间排序（新的在前）
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    return (
        <Card 
            className="sport-card progress-card" 
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>跑步计划进度</span>
                    {sortedPlans.length > 0 && allPlansRef.current && (
                        <ShareImageButton
                            targetElement={allPlansRef.current}
                            fileName="跑步计划进度-全部"
                            size="small"
                            type="link"
                            style={{ padding: 0 }}
                        />
                    )}
                </div>
            }
        >
            {sortedPlans.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    暂无跑步计划
                </div>
            ) : (
                <div className="running-plans-list" ref={allPlansRef}>
                    {sortedPlans.map((plan, planIndex) => {
                        // 按 run_type 分组
                        const itemsByType: { [key: string]: RunningPlanItem[] } = {}
                        plan.items.forEach((item) => {
                            if (!itemsByType[item.runType]) {
                                itemsByType[item.runType] = []
                            }
                            itemsByType[item.runType].push(item)
                        })

                        const isExpanded = expandedPlans.has(plan.planName);

                        return (
                            <div 
                                key={plan.planName || planIndex} 
                                className={`running-plan-item ${plan.status === 'completed' ? 'plan-completed' : ''}`}
                                ref={(el) => {
                                    if (plan.planName) {
                                        planRefs.current[plan.planName] = el;
                                    }
                                }}
                            >
                                <div className="plan-header">
                                    <span className="plan-name">{plan.planName}</span>
                                    <div className="plan-header-right">
                                        <span className="plan-overall">
                                            总计：{plan.totalCompletedTimes}/{plan.totalTargetTimes}次
                                        </span>
                                        {planRefs.current[plan.planName] && (
                                            <ShareImageButton
                                                targetElement={planRefs.current[plan.planName]!}
                                                fileName={`跑步计划-${plan.planName}`}
                                                size="small"
                                                type="link"
                                                style={{ padding: 0, marginLeft: 4 }}
                                                beforeCapture={async () => {
                                                    // 截图前确保计划是展开状态，以便包含完整信息
                                                    if (!isExpanded) {
                                                        setExpandedPlans(prev => {
                                                            const newSet = new Set(prev);
                                                            newSet.add(plan.planName);
                                                            return newSet;
                                                        });
                                                        await new Promise(resolve => setTimeout(resolve, 300));
                                                    }
                                                }}
                                                afterCapture={async () => {
                                                    // 截图后恢复原状态
                                                    if (!isExpanded) {
                                                        setExpandedPlans(prev => {
                                                            const newSet = new Set(prev);
                                                            newSet.delete(plan.planName);
                                                            return newSet;
                                                        });
                                                    }
                                                }}
                                            />
                                        )}
                                        <Button
                                            type="link"
                                            size="small"
                                            icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                                            onClick={() => togglePlanExpanded(plan.planName)}
                                            style={{ padding: 0, marginLeft: 8 }}
                                        />
                                    </div>
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
                                
                                {/* 按 run_type 分组显示 - 根据展开状态显示 */}
                                {isExpanded && (
                                    <div className="plan-items-by-type">
                                        {Object.keys(itemsByType).map((runType) => (
                                            <div key={runType} className="plan-type-group">
                                                <div className="type-group-header">
                                                    <span className="type-group-title">
                                                        {formatTypeDisplay(runType, itemsByType[runType])}
                                                    </span>
                                                </div>
                                                <div className="type-group-items">
                                                    {itemsByType[runType]
                                                        .sort((a, b) => a.distance - b.distance)
                                                        .map((item) => (
                                                            <div key={item.id} className="plan-item-detail">
                                                                <div className="item-header">
                                                                    <span className="item-distance">{item.distance}km × {item.targetTimes}次</span>
                                                                    <span className="item-status">
                                                                        {item.currentTimes}/{item.targetTimes}次
                                                                        {` (${item.currentTimes * item.distance}km)`}
                                                                    </span>
                                                                </div>
                                                                <Progress 
                                                                    percent={item.progress}
                                                                    size="small"
                                                                    status={item.progress >= 100 ? 'success' : 'active'}
                                                                />
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
                            </div>
                        )
                    })}
                </div>
            )}
        </Card>
    );
}

