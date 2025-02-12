import { Table } from 'antd';
import type { TableProps } from 'antd';
import { formatMinToHM, formatSerialNumber, getGapTime } from './tool';

interface DataType {
    key: string;
    name: string;
    age: number;
    address: string;
    tags: string[];
}

const render = (text: string) => <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div> // 换行显示

export default function MonthTable({ data, study }: { data: any[], study: number }) {
    const columns: TableProps<DataType>['columns'] = [
        {
            title: '时间',
            dataIndex: 'time',
            key: 'time',
            render
        },
        {
            title: `学习任务: ${formatMinToHM(study)}`,
            dataIndex: 'frontOverview',
            key: 'frontOverview',
            render
        },
        {
            title: '运动+睡眠+电影',
            dataIndex: 'sleepSportMovie',
            key: 'sleepSportMovie',
            render
        },
        {
            title: 'TED+阅读+播客',
            dataIndex: 'TEDRead',
            key: 'TEDRead',
            render
        },
        {
            title: '学习方法复盘和改进',
            dataIndex: 'idea',
            key: 'idea',
            render
        }
    ];

    const source = data.map(it => {
        return {
            ...it,
            time: `LTN ${formatSerialNumber(it.serialNumber)} 
${it.startTime.slice(5)} 至 ${it.endTime.slice(5)}
${getGapTime(it.startTime, it.endTime)}天`,
            sleepSportMovie: `${it.sleep}
${it.sport}
${it.movie}`,
            TEDRead: `${it.ted}
${it.read}`,
            idea: it.improveMethods
        }
    })
    
    return <Table<DataType>
        bordered
        pagination={false}
        scroll={{ x: 'max-content' }}
        columns={columns}
        dataSource={source}
    />
}