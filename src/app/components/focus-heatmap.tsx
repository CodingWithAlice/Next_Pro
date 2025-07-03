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
                splitArea: { show: true }
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
                max: Math.max(...data.map(item => item.duration), 60),
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: 0,
                inRange: {
                    color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']
                }
            },
            series: [{
                name: '专注时长',
                type: 'heatmap',
                data: generateHeatmapData(),
                label: { show: false },
                emphasis: {
                    itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
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