import { Table, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface Metric {
    name: string;
    current: number | string;
    lastMonth: number | string;
    threshold: [number, number];
    annualTarget: number;
    unit?: string;
    isDimension?: boolean; // 标记是否为维度标题行
}

const CoreMetricsTable: React.FC = () => {
    // 转换数据格式为AntD Table需要的扁平结构
    const generateTableData = () => {
        const metricsData: Record<string, Metric[]> = {
            '前端维度': [
                { name: '技术任务占比', current: 68, lastMonth: 62, threshold: [50, 80], annualTarget: 70, unit: '%' },
                { name: '专注时长', current: 42, lastMonth: 38, threshold: [30, 50], annualTarget: 500, unit: '小时' },
                { name: '复盘时长', current: 8, lastMonth: 6, threshold: [5, 10], annualTarget: 100, unit: '小时' },
                { name: 'LTN做题时长', current: 15, lastMonth: 12, threshold: [10, 20], annualTarget: 200, unit: '小时' },
            ],
            '健康维度': [
                { name: '平均入睡时间', current: '23:20', lastMonth: '23:45', threshold: [22, 24], annualTarget: 365 },
                { name: '平均起床时间', current: '6:40', lastMonth: '7:15', threshold: [6, 7.5], annualTarget: 365 },
                { name: '运动次数', current: 12, lastMonth: 8, threshold: [8, 16], annualTarget: 150 },
                { name: 'TED观看时长', current: 3.5, lastMonth: 2.8, threshold: [2, 5], annualTarget: 50, unit: '小时' },
                { name: '阅读时长', current: 6, lastMonth: 4, threshold: [4, 10], annualTarget: 80, unit: '小时' },
            ]
        };

        return Object.entries(metricsData).flatMap(([dimension, metrics]) => [
            // 维度标题行
            {
                key: `dimension-${dimension}`,
                name: dimension,
                isDimension: true,
                current: '',
                lastMonth: '',
                threshold: [0, 0],
                annualTarget: 0
            } as Metric,
            // 指标数据行
            ...metrics.map(metric => ({
                ...metric,
                key: `${dimension}-${metric.name}`,
                isDimension: false
            }))
        ]);
    };

    const getMonthOverMonth = (current: number, last: number) => {
        const change = ((current - last) / last) * 100;
        return {
            value: Math.abs(change).toFixed(1) + '%',
            isUp: change >= 0,
            color: change >= 0 ? '#52c41a' : '#f5222d'
        };
    };

    const getAnnualProgress = (current: number, target: number) => {
        return Math.min(Math.round((current / target) * 100), 100);
    };

    const formatThreshold = (threshold: [number, number], unit?: string) => {
        return `${threshold[0]}${unit || ''}~${threshold[1]}${unit || ''}`;
    };

    const columns = [
        {
            title: '维度/指标',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Metric) => (
                record.isDimension ?
                    <strong>{text}</strong> :
                    <span style={{ paddingLeft: 24 }}>{text}</span>
            )
        },
        {
            title: '本月值',
            dataIndex: 'current',
            key: 'current',
            render: (value: number | string, record: Metric) => (
                record.isDimension ? null : (
                    typeof value === 'string' ? value : `${value}${record.unit || ''}`
                )
            )
        },
        {
            title: '环比',
            key: 'comparison',
            render: (_: number, record: Metric) => {
                if (record.isDimension) return null;
                if (typeof record.current !== 'number' || typeof record.lastMonth !== 'number') return '-';

                const mom = getMonthOverMonth(record.current, record.lastMonth);
                return (
                    <span style={{ color: mom.color }}>
                        {mom.isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        {mom.value}
                    </span>
                );
            }
        },
        {
            title: '健康阈值',
            key: 'threshold',
            render: (_: number[], record: Metric) => (
                record.isDimension ? null : (
                    Array.isArray(record.threshold) ?
                        formatThreshold(record.threshold, record.unit) :
                        '-'
                )
            )
        },
        {
            title: '年度目标进度',
            key: 'progress',
            render: (_: number, record: Metric) => {
                if (record.isDimension) return null;
                if (typeof record.current !== 'number') return '-';

                const percent = getAnnualProgress(record.current, record.annualTarget);
                return (
                    <Progress
                        percent={percent}
                        strokeColor={percent >= 100 ? '#52c41a' : '#1890ff'}
                        format={() => `${percent}%`}
                    />
                );
            }
        }
    ];

    return (
        <Table
            size="small"
            columns={columns}
            dataSource={generateTableData()}
            pagination={false}
            bordered
            rowClassName={(record) => record.isDimension ? 'dimension-row' : 'metric-row'}
            style={{ borderRadius: 8, overflow: 'hidden' }}
        />
    );
};

export default CoreMetricsTable;