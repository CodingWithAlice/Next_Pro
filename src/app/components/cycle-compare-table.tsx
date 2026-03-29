import type { ReactNode } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatMinToHM, formatSerialNumber } from './tool'

export type PerSerialMetricRow = {
	serialNumber: number
	startTime: string
	endTime: string
	gapDays: number
	routineTotals: { typeId: number; des: string; totalMinutes: number }[]
	sleepAvg: { startTime: string; endTime: string }
}

type RowKind = 'min' | 'sleepStart' | 'sleepEnd'

type MetricDef = {
	key: string
	label: string
	kind: RowKind
	typeId?: number
}

const METRICS: MetricDef[] = [
	{ key: 'm13', label: '学习专注', kind: 'min', typeId: 13 },
	{ key: 'm16', label: 'LTN', kind: 'min', typeId: 16 },
	{ key: 'm7', label: '复盘', kind: 'min', typeId: 7 },
	{ key: 'm4', label: 'TED', kind: 'min', typeId: 4 },
	{ key: 'm8', label: '阅读', kind: 'min', typeId: 8 },
	{ key: 'm17', label: '运动', kind: 'min', typeId: 17 },
	{ key: 'sleepIn', label: '平均入睡（圆均）', kind: 'sleepStart' },
	{ key: 'sleepOut', label: '平均起床（圆均）', kind: 'sleepEnd' },
]

function minutesFor(row: PerSerialMetricRow, typeId: number) {
	return (
		row.routineTotals.find((t) => t.typeId === typeId)?.totalMinutes ?? 0
	)
}

function deltaPct(cur: number, prev: number) {
	if (prev === 0) return null
	const p = ((cur - prev) / prev) * 100
	return Math.round(p)
}

function DeltaNote({ cur, prev }: { cur: number; prev: number }) {
	const d = deltaPct(cur, prev)
	if (d === null) return null
	const color = d >= 0 ? '#52c41a' : '#f5222d'
	return (
		<div style={{ fontSize: 12, color, marginTop: 2 }}>
			较上周期 {d >= 0 ? '↑' : '↓'}
			{Math.abs(d)}%
		</div>
	)
}

function CellMin({
	value,
	prevValue,
}: {
	value: number
	prevValue: number | null
}) {
	return (
		<div>
			<div>{formatMinToHM(value)}</div>
			{prevValue !== null && (
				<DeltaNote cur={value} prev={prevValue} />
			)}
		</div>
	)
}

function CellTime({
	value,
	prev,
}: {
	value: string
	prev: string | null
}) {
	const changed = prev !== null && prev !== value && prev !== '--:--'
	return (
		<div>
			<div>{value}</div>
			{changed && (
				<div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
					上周期 {prev}
				</div>
			)}
		</div>
	)
}

export default function CycleCompareTable({
	data,
}: {
	data: PerSerialMetricRow[]
}) {
	if (!data?.length) return null

	const sorted = [...data].sort((a, b) => a.serialNumber - b.serialNumber)

	const tableRows = METRICS.map((def) => {
		const record: Record<string, unknown> = {
			key: def.key,
			label: def.label,
		}
		sorted.forEach((m, idx) => {
			const prev = idx > 0 ? sorted[idx - 1] : null
			if (def.kind === 'min' && def.typeId != null) {
				const v = minutesFor(m, def.typeId)
				const pv = prev ? minutesFor(prev, def.typeId) : null
				record[`s${m.serialNumber}`] = (
					<CellMin value={v} prevValue={pv} />
				)
			} else if (def.kind === 'sleepStart') {
				const v = m.sleepAvg?.startTime ?? '--:--'
				const pv = prev?.sleepAvg?.startTime ?? null
				record[`s${m.serialNumber}`] = (
					<CellTime value={v} prev={pv} />
				)
			} else if (def.kind === 'sleepEnd') {
				const v = m.sleepAvg?.endTime ?? '--:--'
				const pv = prev?.sleepAvg?.endTime ?? null
				record[`s${m.serialNumber}`] = (
					<CellTime value={v} prev={pv} />
				)
			}
		})
		return record
	})

	const columns: ColumnsType<Record<string, unknown>> = [
		{
			title: '指标',
			dataIndex: 'label',
			key: 'label',
			fixed: 'left',
			width: 160,
		},
		...sorted.map((m) => ({
			title: (
				<span style={{ whiteSpace: 'pre-line' }}>
					LTN {formatSerialNumber(m.serialNumber)}
					{'\n'}
					{String(m.startTime).slice(5, 10)}～{String(m.endTime).slice(5, 10)}
				</span>
			),
			dataIndex: `s${m.serialNumber}`,
			key: `s${m.serialNumber}`,
			width: 130,
			render: (node: ReactNode) => node,
		})),
	]

	return (
		<Table<Record<string, unknown>>
			size="small"
			bordered
			pagination={false}
			scroll={{ x: 'max-content' }}
			columns={columns}
			dataSource={tableRows}
			style={{ marginBottom: 16 }}
		/>
	)
}
