'use client';
import { useState } from 'react';
import { Card, Button } from 'antd';
import type { SportRecord } from './sport-overview-card';
import './app.css';

interface RecentRecordsCardProps {
    records: SportRecord[];
}

// 运动类型配置
const SPORT_TYPES_CONFIG = [
    { type: 'running' as const, label: '跑步', unit: 'km' },
    { type: 'resistance' as const, label: '撸铁', unit: 'kg' },
    { type: 'hiking' as const, label: '徒步', unit: 'km' },
    { type: 'class' as const, label: '课程', unit: 'min' },
];

// 格式化记录显示内容
const formatRecordContent = (record: SportRecord): string => {
    const config = SPORT_TYPES_CONFIG.find(c => c.type === record.type);
    if (!config) return '';
    
    switch (record.type) {
        case 'running':
            return `${record.category} ${record.value}km`;
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

export default function RecentRecordsCard({ records }: RecentRecordsCardProps) {
    const [expandedRecords, setExpandedRecords] = useState(false);

    return (
        <Card className="sport-card" title="近期运动记录">
            <div className="recent-records">
                {records.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        暂无记录
                    </div>
                ) : (
                    (expandedRecords ? records : records.slice(0, 5)).map((record) => {
                        // 对于 class 类型，formatRecordContent 已经包含了时长（value 就是时长），不需要再显示 duration
                        const shouldShowDuration = record.duration && record.type !== 'class';
                        
                        return (
                            <div key={record.id} className="record-item">
                                <span className="record-date">{record.date}</span>
                                <span className="record-content">
                                    {formatRecordContent(record)}
                                    {shouldShowDuration && ` (${record.duration}分钟)`}
                                </span>
                            </div>
                        );
                    })
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
    );
}

