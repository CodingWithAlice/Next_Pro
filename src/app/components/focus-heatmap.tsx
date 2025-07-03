import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { rawRecord } from './month-detail-textarea';

const FocusHeatmap: React.FC<{ data: rawRecord[], periodTime: { start: string, end: string } }> = ({ data, periodTime }) => {
    // 处理数据：生成 ECharts 热力图需要的格式
    const generateHeatmapData = () => {
        return data.map(item => {
            const date = dayjs(item.date);
            const formatted = `${date.month() + 1}.${date.date()}`;
            return [
                formatted, // 月.日
                +item.startTime.slice(0, 2),
                item.duration || 0, // 确保有默认值
            ]
        });
    };

    // 生成日期范围数组（格式：M.D）
    const generateDaysArray = ({ start, end }: { start: string, end: string }) => {
        let current = dayjs(start);
        const endDate = dayjs(end);
        const days: string[] = [];

        while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
            // 格式化为 "M.D"（单数月/日不加零）
            days.push(`${current.month() + 1}.${current.date()}`);
            current = current.add(1, 'day');
        }

        return days;
    };


    // 生成 ECharts 配置
    const getOption = () => {
        const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        const days = generateDaysArray(periodTime);

        return {
            tooltip: {
                position: 'top',
                // eslint-disable-next-line
                formatter: (params: any) => {
                    return `时间: ${params.data[1]}:00<br/>
                  专注时长: ${params.data[2]}分钟`;
                }
            },
            grid: {
                top: 20,
                left: 60,
                right: 30,
                bottom: 30
            },
            yAxis: {
                type: 'category',
                data: hours,
                splitArea: { show: true },
                axisLabel: {
                    interval: 1, // 强制显示所有小时标签
                },
            },
            xAxis: {
                type: 'category',
                data: days,
                splitArea: { show: true },
                name: '日期',
                nameLocation: 'middle',
                nameGap: 40
            },
            visualMap: {
                min: 0,
                // max: Math.max(...data.map(item => item.duration), 60),
                max: 120, // 固定最大值120分钟（2小时），超过部分按最高色阶显示
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: 0,
                inRange: {
                    color: [
                        '#f3e5ff', // 极浅紫（接近白）
                        '#d7b7ff', // 香芋紫
                        '#b388ff', // 标准紫
                        '#7c4dff', // 深紫
                        '#4a148c'  // 暗紫
                    ]
                },
                // 添加分段标签
                pieces: [
                    { min: 0, max: 15, label: '碎片化' },
                    { min: 15, max: 45, label: '轻度专注' },
                    { min: 45, max: 90, label: '深度专注' },
                    { min: 90, label: '超强聚焦' }
                ]
            },
            series: [{
                name: '专注时长',
                type: 'heatmap',
                data: generateHeatmapData(),
                // 增加单元格大小
                itemStyle: {
                    borderWidth: 1,
                    borderColor: '#fff'
                },
                label: { show: false },
                emphasis: {
                    itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.8)' }
                }
            }]
        };
    };

    return (
        <div className="heatmap-container">
            <ReactECharts
                option={getOption()}
                theme="light"
                className="heatmap-table"
            />
        </div>
    );
};

export default FocusHeatmap;