import { Progress, Table } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Metric } from './month-detail-textarea';


const CoreMetricsTable = ({source}: {source: Record<string, Metric[]>}) => {
    // 转换数据格式为AntD Table需要的扁平结构
    const generateTableData = (data: Record<string, Metric[]>) => {        
        return Object.entries(data).flatMap(([dimension, metrics]) => [
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
        return Math.round((current / target) * 100);
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
                if (typeof record.current !== 'number' || typeof record.lastMonth !== 'number') return record.lastMonth;

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
            title: '年度目标阈值',
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
            dataSource={generateTableData(source)}
            pagination={false}
            bordered
            rowClassName={(record) => record.isDimension ? 'dimension-row' : 'metric-row'}
            style={{ borderRadius: 8, overflow: 'hidden' }}
        />
    );
};

export default CoreMetricsTable;