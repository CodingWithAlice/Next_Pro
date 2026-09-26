"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button, Checkbox, Input, InputNumber, Modal, Select, message } from 'antd'
import { ExpandOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import Api from '@/service/api'
import { useCanEdit, ViewOnlyTooltip } from '@/components/capability-context'
import './app.css'

type Kind = 'jar' | 'run' | 'sport_days' | 'movie_count' | 'book_count' | 'ted_round' | 'ltn_coins' | 'note' | 'checklist'
type Stage = { id: string; title: string; done: boolean }
type Option = { id: number; name: string; status: string }

type Item = {
	id: number
	groupKey: string
	title: string
	kind: Kind
	scene: string | null
	refId: number | null
	targetValue: number | null
	resultText: string
	stages: Stage[]
	progressText: string
	progressDone: boolean | null
}

type Plan = Awaited<ReturnType<typeof Api.getYearPlanApi>>

const KIND_LABEL: Record<Kind, string> = {
	jar: '零钱罐子',
	run: '跑步计划',
	sport_days: '运动天数',
	movie_count: '电影部数',
	book_count: '阅读本数',
	ted_round: 'TED 当前轮',
	ltn_coins: 'LTN 金币',
	note: '无数据源',
	checklist: '阶段勾选',
}

const STAT_KINDS = new Set<Kind>(['sport_days', 'movie_count', 'book_count', 'ted_round', 'ltn_coins'])

const GROUP_OPTIONS = [
	{ value: 'sport', label: '跑步 / 有氧 / 重量' },
	{ value: 'travel', label: '体验 / 出行 / 健康花费' },
	{ value: 'media', label: '影像' },
	{ value: 'reading', label: '阅读' },
	{ value: 'ted', label: 'TED / 播客' },
	{ value: 'work', label: '前端 / 工作 / 学习 / B 站' },
	{ value: 'other', label: '其他' },
]

type Draft = {
	title: string
	refId: number | null
	targetValue: number | null
	resultText: string
	stages: Stage[]
}

function toDraft(item: Item): Draft {
	return {
		title: item.title,
		refId: item.refId,
		targetValue: item.targetValue,
		resultText: item.resultText,
		stages: item.stages.map((stage) => ({ ...stage })),
	}
}

function newStageId() {
	return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export default function YearPlanPage({ mode = 'page' }: { mode?: 'page' | 'modal' }) {
	const canEdit = useCanEdit('month')
	const [messageApi, contextHolder] = message.useMessage()
	const [year, setYear] = useState(() => new Date().getFullYear())
	const [plan, setPlan] = useState<Plan | null>(null)
	const [loading, setLoading] = useState(true)
	const [editing, setEditing] = useState(false)
	const [drafts, setDrafts] = useState<Record<number, Draft>>({})
	const [savingId, setSavingId] = useState<number | null>(null)
	const [addTitle, setAddTitle] = useState('')
	const [addKind, setAddKind] = useState<Kind>('note')
	const [addGroup, setAddGroup] = useState('other')
	const [addTarget, setAddTarget] = useState<number | null>(null)

	const load = useCallback(async (nextYear: number) => {
		setLoading(true)
		try {
			const data = await Api.getYearPlanApi(nextYear)
			setPlan(data)
			setYear(data.year)
			return data
		} catch (error) {
			messageApi.error((error as { message?: string }).message || '加载失败')
			return null
		} finally {
			setLoading(false)
		}
	}, [messageApi])

	const changeYear = (nextYear: number) => {
		setEditing(false)
		load(nextYear)
	}

	useEffect(() => {
		load(year)
		// 只在进入页面时拉一次，换年走按钮
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const items = useMemo(() => plan?.groups.flatMap((group) => group.items) ?? [], [plan])

	const startEdit = () => {
		setDrafts(Object.fromEntries(items.map((item) => [item.id, toDraft(item)])))
		setEditing(true)
	}

	const patchDraft = (id: number, patch: Partial<Draft>) => {
		setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
	}

	const saveItem = async (item: Item) => {
		const draft = drafts[item.id]
		if (!draft) return
		setSavingId(item.id)
		try {
			await Api.putYearPlanApi(item.id, {
				title: draft.title,
				refId: item.kind === 'jar' || item.kind === 'run' ? draft.refId : undefined,
				targetValue: STAT_KINDS.has(item.kind) ? draft.targetValue : undefined,
				resultText: item.kind === 'note' ? draft.resultText : undefined,
				stages: item.kind === 'checklist' ? draft.stages : undefined,
			})
			messageApi.success('已保存')
			const data = await load(year)
			const fresh = data?.groups.flatMap((group) => group.items).find((row) => row.id === item.id)
			if (fresh) setDrafts((prev) => ({ ...prev, [item.id]: toDraft(fresh) }))
		} catch (error) {
			messageApi.error((error as { message?: string }).message || '保存失败')
		} finally {
			setSavingId(null)
		}
	}

	const toggleStage = async (item: Item, stageId: string, done: boolean) => {
		if (!canEdit) return
		if (editing) {
			const draft = drafts[item.id]
			if (!draft) return
			patchDraft(item.id, {
				stages: draft.stages.map((stage) => (stage.id === stageId ? { ...stage, done } : stage)),
			})
			return
		}
		try {
			await Api.putYearPlanApi(item.id, {
				stages: item.stages.map((stage) => (stage.id === stageId ? { ...stage, done } : stage)),
			})
			await load(year)
		} catch (error) {
			messageApi.error((error as { message?: string }).message || '保存失败')
		}
	}

	const removeItem = (item: Item) => {
		Modal.confirm({
			title: '从今年清单拿掉这条？',
			content: item.title,
			okText: '拿掉',
			cancelText: '留下',
			onOk: async () => {
				await Api.deleteYearPlanApi(item.id)
				messageApi.success('已拿掉')
				await load(year)
			},
		})
	}

	const addItem = async () => {
		const title = addTitle.trim()
		if (!title) {
			messageApi.warning('先写标题')
			return
		}
		try {
			await Api.postYearPlanApi({
				year,
				title,
				kind: addKind,
				groupKey: addGroup,
				targetValue: STAT_KINDS.has(addKind) ? addTarget : null,
				scene: addKind === 'jar' ? 'piggy' : addKind === 'run' ? 'sport' : null,
				stages: addKind === 'checklist' ? [] : undefined,
			})
			setAddTitle('')
			messageApi.success('已添加')
			const data = await load(year)
			if (!data) return
			setDrafts((prev) => {
				const next = { ...prev }
				for (const row of data.groups.flatMap((group) => group.items)) {
					if (!next[row.id]) next[row.id] = toDraft(row)
				}
				return next
			})
		} catch (error) {
			messageApi.error((error as { message?: string }).message || '添加失败')
		}
	}

	const linkOptions = (item: Item): Option[] => {
		if (!plan) return []
		if (item.kind === 'jar') return plan.options.jars
		if (item.kind === 'run') return plan.options.plans
		return []
	}

	return (
		<div className={mode === 'modal' ? 'year-plan-outer is-modal' : 'outer year-plan-outer'}>
			{contextHolder}
			<header className="year-plan-header">
				<Button icon={<LeftOutlined />} size="small" onClick={() => changeYear(year - 1)}>
					上一年
				</Button>
				<div className="year-plan-heading">
					<h1>
						{mode === 'page' ? (
							<Link href="/month" className="home-link-title">{year} 年计划</Link>
						) : (
							<span>{year} 年计划</span>
						)}
					</h1>
					<p>{mode === 'modal' ? '仅展示，可进入整页编辑' : '改标题、关联和目标在编辑里。'}</p>
				</div>
				<Button icon={<RightOutlined />} size="small" onClick={() => changeYear(year + 1)}>
					下一年
				</Button>
			</header>
			<div className="year-plan-toolbar">
				{mode === 'modal' ? (
					<Link href="/year-plan" className="year-plan-open-page">
						<ExpandOutlined />
						整页打开
					</Link>
				) : null}
				{mode === 'page' ? (
					<ViewOnlyTooltip viewOnly={!canEdit}>
						<Button disabled={!canEdit || !plan} onClick={() => (editing ? setEditing(false) : startEdit())}>
							{editing ? '完成编辑' : '编辑'}
						</Button>
					</ViewOnlyTooltip>
				) : null}
			</div>
			{loading && !plan ? <p className="year-plan-empty">正在读取这一年的清单</p> : null}
			{!loading && plan && plan.groups.length === 0 ? (
				<p className="year-plan-empty">
					{mode === 'modal' ? '这一年还没有条目。到整页里添加。' : '这一年还没有条目。点编辑后可以添加。'}
				</p>
			) : null}
			{plan?.groups.map((group) => (
				<section key={group.key} className="year-plan-group">
					<h2>{group.label}</h2>
					<ul>
						{group.items.map((item) => {
							const draft = drafts[item.id]
							const stages = editing && draft ? draft.stages : item.stages
							return (
								<li key={item.id}>
									<div className="year-plan-item-main">
										<div className="year-plan-item-title">
											{editing && draft ? (
												<Input
													value={draft.title}
													onChange={(event) => patchDraft(item.id, { title: event.target.value })}
												/>
											) : (
												<strong>{item.title}</strong>
											)}
											<span className="year-plan-kind">{KIND_LABEL[item.kind]}</span>
										</div>
										<p className={item.progressDone ? 'year-plan-progress is-done' : 'year-plan-progress'}>
											{item.progressText}
										</p>
										{item.kind === 'checklist' ? (
											<div className="year-plan-stages">
												{stages.length === 0 ? <span className="year-plan-muted">还没有阶段</span> : null}
												{stages.map((stage) => (
													<label key={stage.id}>
														<Checkbox
															checked={stage.done}
															disabled={mode === 'modal' || !canEdit}
															onChange={(event) => toggleStage(item, stage.id, event.target.checked)}
														/>
														{editing && draft ? (
															<>
																<Input
																	value={stage.title}
																	onChange={(event) => patchDraft(item.id, {
																		stages: draft.stages.map((row) => row.id === stage.id ? { ...row, title: event.target.value } : row),
																	})}
																/>
																<Button
																	size="small"
																	type="link"
																	onClick={() => patchDraft(item.id, {
																		stages: draft.stages.filter((row) => row.id !== stage.id),
																	})}
																>
																	删除
																</Button>
															</>
														) : (
															<span className={stage.done ? 'is-done-stage' : ''}>{stage.title}</span>
														)}
													</label>
												))}
												{editing && draft ? (
													<Button
														size="small"
														type="link"
														onClick={() => patchDraft(item.id, {
															stages: [...draft.stages, { id: newStageId(), title: '新阶段', done: false }],
														})}
													>
														添加阶段
													</Button>
												) : null}
											</div>
										) : null}
										{editing && draft && (item.kind === 'jar' || item.kind === 'run') ? (
											<div className="year-plan-edit-row">
												<Select
													allowClear
													placeholder={item.kind === 'jar' ? '选择罐子' : '选择跑步计划'}
													value={draft.refId ?? undefined}
													options={linkOptions(item).map((option) => ({ value: option.id, label: option.name }))}
													onChange={(value) => patchDraft(item.id, { refId: value ?? null })}
													style={{ minWidth: 220 }}
												/>
											</div>
										) : null}
										{editing && draft && STAT_KINDS.has(item.kind) ? (
											<div className="year-plan-edit-row">
												<span>{KIND_LABEL[item.kind]}目标</span>
												<InputNumber
													min={0}
													value={draft.targetValue ?? undefined}
													onChange={(value) => patchDraft(item.id, { targetValue: value == null ? null : Number(value) })}
												/>
											</div>
										) : null}
										{editing && draft && item.kind === 'note' ? (
											<Input.TextArea
												value={draft.resultText}
												placeholder="结果句"
												autoSize={{ minRows: 2, maxRows: 4 }}
												onChange={(event) => patchDraft(item.id, { resultText: event.target.value })}
											/>
										) : null}
										{editing ? (
											<div className="year-plan-edit-row">
												<Button size="small" type="primary" loading={savingId === item.id} onClick={() => saveItem(item)}>
													保存这条
												</Button>
												<Button size="small" danger onClick={() => removeItem(item)}>拿掉</Button>
											</div>
										) : null}
									</div>
								</li>
							)
						})}
					</ul>
				</section>
			))}
			{editing ? (
				<section className="year-plan-group">
					<h2>新增一条</h2>
					<div className="year-plan-add">
						<Input placeholder="计划名称" value={addTitle} onChange={(event) => setAddTitle(event.target.value)} />
						<Select value={addGroup} options={GROUP_OPTIONS} onChange={setAddGroup} style={{ minWidth: 180 }} />
						<Select
							value={addKind}
							options={(Object.keys(KIND_LABEL) as Kind[]).map((kind) => ({ value: kind, label: KIND_LABEL[kind] }))}
							onChange={setAddKind}
							style={{ minWidth: 180 }}
						/>
						{STAT_KINDS.has(addKind) ? (
							<InputNumber min={0} placeholder="今年目标" value={addTarget ?? undefined} onChange={(value) => setAddTarget(value == null ? null : Number(value))} />
						) : null}
						<Button type="primary" onClick={addItem}>添加</Button>
					</div>
					<p className="year-plan-muted">对象还没建出来也可以先保存标题。建出来之后再选罐子或跑步计划。</p>
				</section>
			) : null}
		</div>
	)
}
