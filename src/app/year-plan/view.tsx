"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Button, Checkbox, Input, InputNumber, Modal, Select, message } from 'antd'
import { CheckOutlined, DownOutlined, ExpandOutlined, LeftOutlined, RightOutlined, UpOutlined } from '@ant-design/icons'
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
const STATIC_HIDE = new Set(['', '状态待更新', '未关联', '还没有阶段'])

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

export function YearPlanPage({ mode = 'page' }: { mode?: 'page' | 'modal' }) {
	const canEdit = useCanEdit('month')
	const [messageApi, contextHolder] = message.useMessage()
	const [modal, modalHolder] = Modal.useModal()
	const [year, setYear] = useState(() => new Date().getFullYear())
	const [plan, setPlan] = useState<Plan | null>(null)
	const [loading, setLoading] = useState(true)
	const [editingGroup, setEditingGroup] = useState<string | null>(null)
	const [drafts, setDrafts] = useState<Record<number, Draft>>({})
	const [savingId, setSavingId] = useState<number | null>(null)
	const [addingKey, setAddingKey] = useState<string | null>(null)
	const [folded, setFolded] = useState<Record<string, boolean>>({})
	const addingRef = useRef<string | null>(null)
	const [adds, setAdds] = useState<Record<string, { title: string; kind: Kind; target: number | null; refId: number | null }>>({})

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
		setEditingGroup(null)
		setDrafts({})
		load(nextYear)
	}

	useEffect(() => {
		load(year)
		// 只在进入页面时拉一次，换年走按钮
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const items = useMemo(() => plan?.groups.flatMap((group) => group.items) ?? [], [plan])

	const leaveEdit = () => {
		setEditingGroup(null)
		setDrafts({})
	}

	const openGroupEdit = (groupKey: string) => {
		if (editingGroup === groupKey) {
			leaveEdit()
			return
		}
		const rows = plan?.groups.find((group) => group.key === groupKey)?.items ?? []
		setDrafts(Object.fromEntries(rows.map((item) => [item.id, toDraft(item)])))
		setEditingGroup(groupKey)
		setFolded((prev) => ({ ...prev, [groupKey]: false }))
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
			await load(year)
			leaveEdit()
		} catch (error) {
			messageApi.error((error as { message?: string }).message || '保存失败')
		} finally {
			setSavingId(null)
		}
	}

	const toggleStage = async (item: Item, stageId: string, done: boolean) => {
		if (!canEdit) return
		if (editingGroup === item.groupKey) {
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
		modal.confirm({
			zIndex: 2000,
			title: '从今年清单拿掉这条？',
			content: item.title,
			okText: '拿掉',
			okButtonProps: { danger: true },
			cancelText: '留下',
			onOk: async () => {
				try {
					await Api.deleteYearPlanApi(item.id)
					messageApi.success('已拿掉')
					await load(year)
					leaveEdit()
				} catch (error) {
					messageApi.error((error as { message?: string }).message || '拿掉失败')
					throw error
				}
			},
		})
	}

	const addDraft = (groupKey: string) => adds[groupKey] ?? { title: '', kind: 'note' as Kind, target: null, refId: null }

	const patchAdd = (groupKey: string, patch: Partial<{ title: string; kind: Kind; target: number | null; refId: number | null }>) => {
		setAdds((prev) => ({ ...prev, [groupKey]: { ...addDraft(groupKey), ...prev[groupKey], ...patch } }))
	}

	const optionsForKind = (kind: Kind): Option[] => {
		if (!plan) return []
		if (kind === 'jar') return plan.options.jars
		if (kind === 'run') return plan.options.plans
		return []
	}

	const addItem = async (groupKey: string) => {
		if (addingRef.current) return
		const draft = addDraft(groupKey)
		const title = draft.title.trim()
		if (!title) {
			messageApi.warning('先写标题')
			return
		}
		addingRef.current = groupKey
		setAddingKey(groupKey)
		try {
			await Api.postYearPlanApi({
				year,
				title,
				kind: draft.kind,
				groupKey,
				refId: draft.kind === 'jar' || draft.kind === 'run' ? draft.refId : null,
				targetValue: STAT_KINDS.has(draft.kind) ? draft.target : null,
				scene: draft.kind === 'jar' ? 'piggy' : draft.kind === 'run' ? 'sport' : null,
				stages: draft.kind === 'checklist' ? [] : undefined,
			})
			setAdds((prev) => ({ ...prev, [groupKey]: { title: '', kind: 'note', target: null, refId: null } }))
			messageApi.success('已添加')
			const data = await load(year)
			if (!data) return
			const rows = data.groups.find((group) => group.key === groupKey)?.items ?? []
			setDrafts(Object.fromEntries(rows.map((row) => [row.id, toDraft(row)])))
		} catch (error) {
			messageApi.error((error as { message?: string }).message || '添加失败')
		} finally {
			addingRef.current = null
			setAddingKey(null)
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
			{modalHolder}
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
			{mode === 'modal' ? (
				<div className="year-plan-toolbar">
					<Link href="/year-plan" className="year-plan-open-page">
						<ExpandOutlined />
						整页打开
					</Link>
				</div>
			) : null}
			{loading && !plan ? <p className="year-plan-empty">正在读取这一年的清单</p> : null}
			{!loading && plan && items.length === 0 && mode === 'modal' ? (
				<p className="year-plan-empty">这一年还没有条目。到整页里添加。</p>
			) : null}
			{plan?.groups.map((group) => (
				<section key={group.key} className="year-plan-group">
					<div className="year-plan-group-head">
						<button
							type="button"
							className="year-plan-group-toggle"
							onClick={() => setFolded((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
						>
							<h2>{group.label}</h2>
						</button>
						{mode === 'page' ? (
							<ViewOnlyTooltip viewOnly={!canEdit}>
								<Button
									size="small"
									type={editingGroup === group.key ? 'primary' : 'default'}
									disabled={!canEdit || !plan || (editingGroup != null && editingGroup !== group.key)}
									onClick={() => openGroupEdit(group.key)}
								>
									{editingGroup === group.key ? '退出编辑' : '编辑'}
								</Button>
							</ViewOnlyTooltip>
						) : null}
						<button
							type="button"
							className="year-plan-group-fold"
							aria-expanded={!folded[group.key]}
							aria-label={folded[group.key] ? '展开' : '收起'}
							onClick={() => setFolded((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
						>
							{folded[group.key] ? <DownOutlined /> : <UpOutlined />}
						</button>
					</div>
					{folded[group.key] ? null : <ul>
						{group.items.length === 0 && editingGroup !== group.key ? <li className="year-plan-muted">这一组还没有条目</li> : null}
						{group.items.map((item) => {
							const draft = drafts[item.id]
							const groupEditing = editingGroup === group.key
							const stages = groupEditing && draft ? draft.stages : item.stages
							return (
								<li key={item.id}>
									<div className="year-plan-item-main">
										{groupEditing && draft ? (
											<div className="year-plan-item-edit">
												<Input
													value={draft.title}
													onChange={(event) => patchDraft(item.id, { title: event.target.value })}
												/>
												{item.kind === 'jar' || item.kind === 'run' ? (
													<Select
														allowClear
														placeholder={item.kind === 'jar' ? '选择罐子' : '选择跑步计划'}
														value={draft.refId ?? undefined}
														options={linkOptions(item).map((option) => ({ value: option.id, label: option.name }))}
														onChange={(value) => patchDraft(item.id, { refId: value ?? null })}
													/>
												) : null}
												{STAT_KINDS.has(item.kind) ? (
													<InputNumber
														min={0}
														placeholder="今年目标"
														value={draft.targetValue ?? undefined}
														onChange={(value) => patchDraft(item.id, { targetValue: value == null ? null : Number(value) })}
													/>
												) : null}
												<span className={item.progressDone ? 'year-plan-progress is-done' : item.progressText === '状态待更新' ? 'year-plan-progress is-pending' : 'year-plan-progress'}>
													{item.progressText}
												</span>
												<Button size="small" type="primary" loading={savingId === item.id} onClick={() => saveItem(item)}>
													保存
												</Button>
												<Button size="small" danger onClick={() => removeItem(item)}>拿掉</Button>
											</div>
										) : (
											<div className={item.progressDone ? 'year-plan-static is-done' : 'year-plan-static'}>
												<span className={item.progressDone ? 'year-plan-mark is-done' : 'year-plan-mark'} aria-hidden>
													{item.progressDone ? <CheckOutlined /> : null}
												</span>
												<strong>{item.title}</strong>
												{item.kind === 'checklist' || STATIC_HIDE.has(item.progressText.trim()) ? null : (
													<span className="year-plan-static-extra">{item.progressText}</span>
												)}
											</div>
										)}
										{!groupEditing && item.kind === 'checklist' && item.stages.length > 0 ? (
											<ul className="year-plan-stage-list">
												{item.stages.map((stage) => (
													<li key={stage.id} className={stage.done ? 'year-plan-static is-done' : 'year-plan-static'}>
														<span className={stage.done ? 'year-plan-mark is-done' : 'year-plan-mark'} aria-hidden>
															{stage.done ? <CheckOutlined /> : null}
														</span>
														<strong>{stage.title}</strong>
													</li>
												))}
											</ul>
										) : null}
										{groupEditing && item.kind === 'checklist' ? (
											<div className="year-plan-stages">
												{stages.length === 0 ? <span className="year-plan-muted">还没有阶段</span> : null}
												{stages.map((stage) => (
													<label key={stage.id}>
														<Checkbox
															checked={stage.done}
															disabled={!groupEditing}
															onChange={(event) => toggleStage(item, stage.id, event.target.checked)}
														/>
														{groupEditing && draft ? (
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
												{groupEditing && draft ? (
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
										{groupEditing && draft && item.kind === 'note' ? (
											<Input.TextArea
												value={draft.resultText}
												placeholder="结果句"
												autoSize={{ minRows: 2, maxRows: 4 }}
												onChange={(event) => patchDraft(item.id, { resultText: event.target.value })}
											/>
										) : null}
									</div>
								</li>
							)
						})}
						{mode === 'page' && canEdit && editingGroup === group.key ? (
							<li>
								<div className="year-plan-add">
									<Input
										placeholder="计划名称"
										value={addDraft(group.key).title}
										onChange={(event) => patchAdd(group.key, { title: event.target.value })}
									/>
									<Select
										value={addDraft(group.key).kind}
										options={(Object.keys(KIND_LABEL) as Kind[]).map((kind) => ({ value: kind, label: KIND_LABEL[kind] }))}
										onChange={(kind) => patchAdd(group.key, {
											kind,
											refId: kind === 'jar' || kind === 'run' ? addDraft(group.key).refId : null,
										})}
										style={{ minWidth: 140 }}
									/>
									{addDraft(group.key).kind === 'jar' || addDraft(group.key).kind === 'run' ? (
										<Select
											allowClear
											placeholder={addDraft(group.key).kind === 'jar' ? '选择罐子' : '选择跑步计划'}
											value={addDraft(group.key).refId ?? undefined}
											options={optionsForKind(addDraft(group.key).kind).map((option) => ({ value: option.id, label: option.name }))}
											onChange={(value) => patchAdd(group.key, { refId: value ?? null })}
											style={{ minWidth: 180 }}
										/>
									) : null}
									{STAT_KINDS.has(addDraft(group.key).kind) ? (
										<InputNumber
											min={0}
											placeholder="今年目标"
											value={addDraft(group.key).target ?? undefined}
											onChange={(value) => patchAdd(group.key, { target: value == null ? null : Number(value) })}
										/>
									) : null}
									<Button
										type="primary"
										loading={addingKey === group.key}
										disabled={addingKey != null && addingKey !== group.key}
										onClick={() => addItem(group.key)}
									>
										添加
									</Button>
								</div>
							</li>
						) : null}
					</ul>}
				</section>
			))}
			{mode === 'page' && editingGroup ? <p className="year-plan-muted">对象还没建出来也可以先保存标题。建出来之后再选罐子或跑步计划。</p> : null}
		</div>
	)
}
