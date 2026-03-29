import { Table } from 'antd';
import type { TableProps } from 'antd';
import { formatMinToHM } from './tool';
import {
	buildAggregatedMonthRow,
	aggregateTedRead,
	type MonthTableWeekRow,
} from './month-table-aggregate';
import {
	formatSleepSportMovieColumn,
	type MonthStructuredMerge,
} from './month-structured-merge';

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
 * structuredMerge 存在时：学习任务 / 睡眠(客观+主观) / 复盘 为 AI；运动与影视为规则合并并拼入第三列；TED 列始终规则合并。
 */
export default function MonthTable({
	data,
	study,
	structuredMerge,
	aiMergeLoading,
}: {
	data: MonthTableWeekRow[];
	study: number;
	structuredMerge?: MonthStructuredMerge | null;
	/** 已进入页面并正在请求 AI 合并 */
	aiMergeLoading?: boolean;
}) {
	const ruleRow = buildAggregatedMonthRow(data, study);
	const tedRead = aggregateTedRead(data);

	const aiActive = structuredMerge != null;

	const row = aiActive
		? {
				key: 'ai-structured',
				frontOverview: structuredMerge!.learning_task_merged,
				sleepSportMovie: formatSleepSportMovieColumn(structuredMerge!, data),
				TEDRead: tedRead,
				idea: structuredMerge!.improve_methods_merged,
				studyTotalMinutes: study,
			}
		: { ...ruleRow, TEDRead: tedRead };

	const taskSub = aiActive
		? `（AI：学习+工作技术+工作非技术 合并 · 「前端总计」合计 ${formatMinToHM(
				row.studyTotalMinutes
			)}）`
		: aiMergeLoading
			? `（AI 合并请求中，暂显示规则合并 · 「前端总计」合计 ${formatMinToHM(
					row.studyTotalMinutes
				)}）`
			: `（规则合并 · 「前端总计」合计 ${formatMinToHM(
					row.studyTotalMinutes
				)}）`;

	const colSleepTitle = aiActive
		? '运动+睡眠+电影（AI 睡眠客观/主观 + 规则运动/影视）'
		: '运动+睡眠+电影（已合并）';

	const colIdeaTitle = aiActive
		? '学习/工作方法复盘和改进（AI 去重合并）'
		: '学习/工作方法复盘和改进（已合并）';

	const columns: TableProps<DataType>['columns'] = [
		{
			title: (
				<span>
					学习任务
					<span
						style={{
							fontWeight: 400,
							fontSize: 12,
							marginLeft: 8,
							color: '#666',
						}}
					>
						{taskSub}
					</span>
				</span>
			),
			dataIndex: 'frontOverview',
			key: 'frontOverview',
			width: 620,
			render,
		},
		{
			title: colSleepTitle,
			dataIndex: 'sleepSportMovie',
			key: 'sleepSportMovie',
			width: 480,
			render,
		},
		{
			title: 'TED+阅读+播客（规则合并）',
			dataIndex: 'TEDRead',
			key: 'TEDRead',
			width: 360,
			render,
		},
		{
			title: colIdeaTitle,
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
