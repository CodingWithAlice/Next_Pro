import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { rawRecord } from './month-detail-textarea';
import { useState } from 'react';
import { groupBy } from 'lodash';

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

    // 月.日
    const formatDate = (time: string) => {
        const date = dayjs(time);
        return `${date.month() + 1}.${date.date()}`;
    }

    // 处理数据：生成 ECharts 热力图需要的格式
    const generateHeatmapData = () => {
        return data
            .filter(item => (activeTypes.length === 0 || activeTypes.includes(item.routineTypeId))
                && Object.keys(TYPE_COLORS).includes(item.routineTypeId + ''))
            .map(item => {
                const value = [
                    formatDate(item.date), // 月.日
                    +item.startTime.slice(0, 2),
                    item.duration || 0, // 确保有默认值
                    item.routineTypeId,
                ]
                return value
            });
    };

    // 计算学习效率曲线
    const getEfficiencyData = () => {
        const groupByDate = groupBy(data, 'date');
        const efficiencyValues: number[] = []; // 存储所有效率值用于计算范围

        const result = Object.keys(groupByDate).map(date => {
            const curDay = groupByDate[date];
            const workItem = curDay.filter(it => +it.routineTypeId === 18); // 工作日
            const ltnTotal = curDay.find(it => +it.routineTypeId === 16)?.duration || 0; // LTN做题时长
            const frontTotal = curDay.find(it => +it.routineTypeId === 13)?.duration || 0; // 前端总计做题时长

            // 日学习效率分 计算
            const isWorkDay = !!workItem?.length; // 工作日
            const suffix = isWorkDay ? 1.2 : 1; // 系数1 - 工作日下班1.2/休息日1
            const addFixScore = (ltnTotal * 1.2 + (frontTotal - ltnTotal)) * suffix; // 日学习效率分

            // 有效时长 计算
            const lastWorkItem = workItem[workItem?.length - 1];
            const start = isWorkDay ? lastWorkItem?.endTime : curDay?.[0]?.startTime
            const times = dayjs(date + '23:00:00').diff(dayjs(date + start), 'minute') // 休息日
            // 前端学习时长超低于 30min 判定为非有效时长
            const efficiency = frontTotal > 30 ? Math.min(Number((addFixScore / times).toFixed(2)), 1) * 100 : null;

            if (efficiency !== null) {
                efficiencyValues.push(efficiency);
            }
            // [日期, 学习效率分, 工作日：开始时间, 前端学习总数]
            const value = [
                formatDate(date), // 日期
                efficiency, // 学习效率
                !!isWorkDay,
                frontTotal > 30 ? 1 : 0]
            return {
                value,
                itemStyle: { color: isWorkDay ? '#FFC107' : '#4CAF50' },
                extraData: {  // 非坐标数据放在额外字段
                    start, // 学习开始时间
                    frontTotal, // 前端学习时长
                }
            }
        })
        return {
            data: result,
            min: Math.min(...efficiencyValues),
            max: Math.max(...efficiencyValues)
        };
    }

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
        const efficiencyData = getEfficiencyData(); // 获取数据和范围

        return {
            tooltip: {
                // trigger: 'axis', // 坐标轴触发
                // axisPointer: {
                //     type: 'cross'
                // }
            },
            grid: [
                // 热力图网格
                {
                    top: '2%',
                    height: '66%',
                    left: '7%',    // 减少左侧留白
                    right: '4%',   // 减少右侧留白
                    width: '89%'   // 显式设置宽度
                },
                // 效率曲线网格
                {
                    top: '82%',
                    height: '11%',
                    left: '7%',    // 减少左侧留白
                    right: '4%',   // 减少右侧留白
                    width: '89%'   // 显式设置宽度
                }
            ],
            yAxis: [
                // 热力图Y轴（时段）
                {
                    type: 'category',
                    gridIndex: 0,
                    data: hours,
                    splitArea: { show: true },
                    axisLabel: {
                        interval: 2, // 小时间隔
                    },
                    name: '热力图', // 添加Y轴名称
                    nameLocation: 'middle', // 名称位置
                    nameGap: 50, // 名称与轴的距离
                    nameTextStyle: { // 名称文本样式
                        color: '#666',
                        fontWeight: 'bold',
                        padding: [0, 0, 0, -40] // 调整位置
                    }
                },
                // 效率曲线Y轴
                {
                    gridIndex: 1,
                    axisLabel: {
                        formatter: '{value}%',
                    },
                    min: Math.floor(efficiencyData.min / 10) * 10, // 向下取整到最近的10
                    max: Math.ceil(efficiencyData.max / 10) * 10,  // 向上取整到最近的10
                    interval: Math.ceil((Math.ceil(efficiencyData.max / 10) * 10 -
                        Math.floor(efficiencyData.min / 10) * 10) / 3), // 分成5个区间
                    name: '学习效率', // 添加Y轴名称
                    nameLocation: 'middle',
                    nameGap: 50,
                    nameTextStyle: {
                        color: '#666',
                        fontWeight: 'bold',
                        padding: [0, 0, 0, -5]
                    }
                }],
            xAxis: [
                // 热力图X轴（日期）
                {
                    type: 'category',
                    gridIndex: 0,
                    splitArea: { show: true },
                    nameLocation: 'middle',
                    nameGap: 40,
                    data: days,
                    axisLabel: { interval: 1 } // 稀疏显示日期
                },
                // 效率曲线X轴（同步日期）
                {
                    type: 'category',
                    gridIndex: 1,
                    data: days,
                    axisLabel: { interval: 1 } // 稀疏显示日期
                }],
            visualMap: {
                type: 'piecewise', // 改为分段式
                pieces: Object.keys(TYPE_COLORS).map(id => ({
                    value: +id,
                    label: allTypes[+id],
                    color: getTypeColor(+id)
                })),
                inRange: {
                    color: ['#f3e5ff', '#4a148c'] // 保留基础色阶
                },
                orient: 'horizontal',
                left: 'center',
                bottom: 56,
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
                },
                tooltip: {
                    // position: 'top',
                    // eslint-disable-next-line
                    formatter: (params: any) => {
                        return `
                    类型: ${allTypes[params.data[3]]}<br/>
                    时间: ${params.data[1]}:00<br/>
                    专注时长: ${params.data[2]}分钟
                  `;
                    }
                },
            }, {
                name: '学习效率',
                type: 'line',
                xAxisIndex: 1, // 使用第二个x轴
                yAxisIndex: 1,
                data: getEfficiencyData().data,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: { color: '#FFD54F' },
                markLine: {
                    data: [{ type: 'average', name: '平均线' }]
                },
                tooltip: {
                    // 曲线图特定的 tooltip 配置
                    // eslint-disable-next-line
                    formatter: (params: any) => {
                        const data = params.data || {};
                        const extraData = data.extraData || {};
                        const value = data.value || [];

                        return `
                            学习效率: ${value[1].toFixed(0)}%<br/>
                            ${value[2] ? '工作日' : '休息日'}：${extraData.start}<br/>
                            学习时长: ${extraData.frontTotal}min
                        `;
                    }
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
            {data?.length && <ReactECharts
                option={getOption()}
                onEvents={{
                    legendselectchanged: handleLegendSelect // 绑定图例选择事件
                }}
                theme="light"
                className="heatmap-table"
            />}
        </div>
    );
};

export default FocusHeatmap;