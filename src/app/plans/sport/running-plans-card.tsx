'use client';
import { Card, Progress } from 'antd';
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
    // 格式化每个类型的显示：如 匀速跑4(15/18)、5(7/12)
    const formatTypeDisplay = (runType: string, items: RunningPlanItem[]): string => {
        const parts = items
            .sort((a, b) => a.distance - b.distance) // 按距离排序
            .map(item => `${item.distance}(${item.currentTimes}/${item.targetTimes})`)
            .join('、')
        return `${runType}${parts}`
    }

    return (
        <Card className="sport-card progress-card" title="跑步计划进度">
            {plans.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    暂无跑步计划
                </div>
            ) : (
                <div className="running-plans-list">
                    {plans.map((plan, planIndex) => {
                        // 按 run_type 分组
                        const itemsByType: { [key: string]: RunningPlanItem[] } = {}
                        plan.items.forEach((item) => {
                            if (!itemsByType[item.runType]) {
                                itemsByType[item.runType] = []
                            }
                            itemsByType[item.runType].push(item)
                        })

                        return (
                            <div key={plan.planName || planIndex} className={`running-plan-item ${plan.status === 'completed' ? 'plan-completed' : ''}`}>
                                <div className="plan-header">
                                    <span className="plan-name">{plan.planName}</span>
                                    <div className="plan-header-right">
                                        {plan.status === 'completed' && (
                                            <span className="plan-status-badge">已结束</span>
                                        )}
                                        <span className="plan-overall">
                                            总计：{plan.totalCompletedTimes}/{plan.totalTargetTimes}次
                                        </span>
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
                                
                                {/* 按 run_type 分组显示 */}
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
                                                                    {item.totalDistance > 0 && ` (${item.totalDistance}km)`}
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
                            </div>
                        )
                    })}
                </div>
            )}
        </Card>
    );
}

