import { Table } from 'antd';
import type { TableProps } from 'antd';
import { formatMinToHM } from './tool';
import { buildAggregatedMonthRow, type MonthTableWeekRow } from './month-table-aggregate';

interface DataType {
	frontOverview: string;
	sleepSportMovie: string;
	TEDRead: string;
	idea: string;
}

const render = (text: string) => (
	<div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
);

/**
 * 将所选多个 LTN 周期的周报字段，按固定结构合并为单行展示（不再按周期分行）。
 */
export default function MonthTable({ data, study }: { data: MonthTableWeekRow[]; study: number }) {
	const row = buildAggregatedMonthRow(data, study);

	const columns: TableProps<DataType>['columns'] = [
		{
			title: (
				<span>
					学习任务
					<span style={{ fontWeight: 400, fontSize: 12, marginLeft: 8, color: '#666' }}>
						（已合并所选各周期；「前端总计」合计 {formatMinToHM(row.studyTotalMinutes)}）
					</span>
				</span>
			),
			dataIndex: 'frontOverview',
			key: 'frontOverview',
			width: 620,
			render,
		},
		{
			title: '运动+睡眠+电影（已合并）',
			dataIndex: 'sleepSportMovie',
			key: 'sleepSportMovie',
			width: 480,
			render,
		},
		{
			title: 'TED+阅读+播客（已合并）',
			dataIndex: 'TEDRead',
			key: 'TEDRead',
			width: 360,
			render,
		},
		{
			title: '学习/工作方法复盘和改进（已合并）',
			dataIndex: 'idea',
			key: 'idea',
			width: 380,
			render,
		},
	];

	const source = [
		{
			frontOverview: row.frontOverview,
			sleepSportMovie: row.sleepSportMovie,
			TEDRead: row.TEDRead,
			idea: row.idea,
			key: row.key,
		},
	];

	return (
		<Table<DataType>
			bordered
			pagination={false}
			scroll={{ x: 'max-content' }}
			columns={columns}
			dataSource={source}
		/>
	);
}
