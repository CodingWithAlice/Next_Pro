import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { rawRecord } from './month-detail-textarea';
import { useState } from 'react';

const TYPE_COLORS: { [key: number]: string } = {
  1: 'cyan',  // 电影 - 珊瑚橙
  4: '#4DB6AC',  // TED - 薄荷青
  5: '#7c4dff',  // 前端 - 天空蓝 
  6: '#F06292',  // LTN - 薰衣草紫
  7: '#d7b7ff',  // 复盘 - 蔷薇粉（最高视觉权重）
  8: '#81C784',  // 阅读 - 嫩绿色
  17: '#FFD54F'  // 运动 - 向日葵黄
};

const getTypeColor = (typeId: number) =>
    TYPE_COLORS[typeId] || '#9e9e9e'; // 默认灰色

const FocusHeatmap: React.FC<{ data: rawRecord[], periodTime: { start: string, end: string } }> = ({ data, periodTime }) => {
    const [activeTypes, setActiveTypes] = useState<number[]>([]); // 当前选中的类型ID
    // 获取所有类型用于图例
    const allTypes = (() => {
        const res: Record<number, string> = {};
        data.forEach((item) => {
            if (!Object.keys(res).includes(item.routineTypeId + '')) {
                res[+item.routineTypeId] = item['routine_type.des']
            }
        })
        return res
    })()
    console.log({ allTypes });


    // 处理数据：生成 ECharts 热力图需要的格式
    const generateHeatmapData = () => {
        return data
            .filter(item => activeTypes.length === 0 || activeTypes.includes(item.routineTypeId))
            .map(item => {
                const date = dayjs(item.date);
                const formatted = `${date.month() + 1}.${date.date()}`;
                const value = [
                    formatted, // 月.日
                    +item.startTime.slice(0, 2),
                    item.duration || 0, // 确保有默认值
                    item.routineTypeId,
                ]
                return value
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
                    return `
                    类型: ${allTypes[params.data[3]]}<br/>
                    时间: ${params.data[1]}:00<br/>
                    专注时长: ${params.data[2]}分钟
                  `;
                }
            },
            grid: {
                top: 20,
                left: 60,
                right: 30,
                bottom: 72
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
                nameLocation: 'middle',
                nameGap: 40
            },
            visualMap: {
                type: 'piecewise', // 改为分段式
                pieces: Object.keys(allTypes).map(id => ({
                    value: +id,
                    label: allTypes[+id],
                    color: getTypeColor(+id)
                })),
                inRange: {
                    color: ['#f3e5ff', '#4a148c'] // 保留基础色阶
                },
                orient: 'horizontal',
                left: 'center',
                bottom: 10,
            },
            legend: { show: false }, // 隐藏传统图例
            series: [{
                name: '专注时长',
                type: 'heatmap',
                data: generateHeatmapData(),
                // 增加单元格大小
                itemStyle: {
                    borderWidth: 1,
                    borderColor: '#fff',
                    color: (params: { data: (string | number)[] }) => {
                        const typeId = params.data[3];
                        return getTypeColor(+typeId); // 根据类型返回颜色
                    }
                },
                emphasis: {
                    itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.8)' }
                }
            }],
        };
    };

    // 图例选择处理
    const handleLegendSelect = (selected: Record<string, boolean>) => {
        const allSelected = Object.values(selected).every(Boolean);
        setActiveTypes(allSelected ? [] :
            Object.keys(selected).filter(k => selected[k]).map(Number)
        );
    };

    return (
        <div className="heatmap-container">
            <ReactECharts
                option={getOption()}
                onEvents={{
                    legendselectchanged: handleLegendSelect // 绑定图例选择事件
                }}
                theme="light"
                className="heatmap-table"
            />
        </div>
    );
};

export default FocusHeatmap;