import { QueryTypes } from 'sequelize'
import dayjs from 'dayjs'
import {
	sequelize,
	BooksRecordModal,
	PiggyBankJarModal,
	RunningPlanModal,
	YearPlanItemModal,
} from 'db'
import { readTedRound } from '@lib/ted-round'

export const YEAR_PLAN_GROUPS = [
	{ key: 'sport', label: '跑步 / 有氧 / 重量' },
	{ key: 'travel', label: '体验 / 出行 / 健康花费' },
	{ key: 'media', label: '影像' },
	{ key: 'reading', label: '阅读' },
	{ key: 'ted', label: 'TED / 播客' },
	{ key: 'work', label: '前端 / 工作 / 学习 / B 站' },
	{ key: 'other', label: '其他' },
] as const

export type YearPlanGroupKey = (typeof YEAR_PLAN_GROUPS)[number]['key']
export type YearPlanKind = 'jar' | 'plan_status' | 'aggregate' | 'note' | 'checklist'
export type YearPlanMetric = 'sport_days' | 'movie_count' | 'book_count' | 'ted_round' | 'ltn_coins'
export type YearPlanExpect = 'completed' | 'active'

export type YearPlanStage = { id: string; title: string; done: boolean }

export type YearPlanOption = { id: number; name: string; status: string }

export type YearPlanView = {
	id: number
	code: string | null
	groupKey: string
	title: string
	kind: YearPlanKind
	scene: string | null
	refId: number | null
	expectStatus: YearPlanExpect | null
	metric: YearPlanMetric | null
	targetValue: number | null
	resultText: string
	stages: YearPlanStage[]
	struck: boolean
	progressText: string
	progressDone: boolean | null
}

const KINDS = new Set<YearPlanKind>(['jar', 'plan_status', 'aggregate', 'note', 'checklist'])
const METRICS = new Set<YearPlanMetric>(['sport_days', 'movie_count', 'book_count', 'ted_round', 'ltn_coins'])
const GROUP_KEYS = new Set<string>(YEAR_PLAN_GROUPS.map((group) => group.key))

const METRIC_UNIT: Record<YearPlanMetric, string> = {
	sport_days: '天',
	movie_count: '部',
	book_count: '本',
	ted_round: '轮',
	ltn_coins: '金币',
}

const JAR_STATUS: Record<string, string> = {
	active: '进行中',
	abandoned: '已放弃',
	completed: '已结清',
}

const PLAN_STATUS: Record<string, string> = {
	active: '进行中',
	completed: '已完成',
	cancelled: '已取消',
}

type Seed = {
	code: string
	groupKey: YearPlanGroupKey
	title: string
	kind: YearPlanKind
	scene?: string | null
	expectStatus?: YearPlanExpect | null
	metric?: YearPlanMetric | null
	targetValue?: number | null
	stages?: YearPlanStage[]
	struck?: boolean
}

function stage(id: string, title: string): YearPlanStage {
	return { id, title, done: false }
}

/** 只放已经对齐的条。待确认的不进今年清单。 */
const SEED_2026: Seed[] = [
	{ code: 'run-plan-3', groupKey: 'sport', title: '今年完成跑步计划 3', kind: 'plan_status', scene: 'sport', expectStatus: 'completed' },
	{ code: 'run-plan-4', groupKey: 'sport', title: '今年开启跑步计划 4（心率 150 以下跑 10km，课表未定）', kind: 'plan_status', scene: 'sport', expectStatus: 'active' },
	{ code: 'sport-days', groupKey: 'sport', title: '150 天运动打卡', kind: 'aggregate', scene: 'sport', metric: 'sport_days', targetValue: 150 },
	{ code: 'weight', groupKey: 'sport', title: '体重 69kg 到 65kg', kind: 'note' },
	{ code: 'body-fat', groupKey: 'sport', title: '体脂 29% 到 26%', kind: 'note' },
	{ code: 'sleep', groupKey: 'sport', title: '多睡觉', kind: 'note' },
	{ code: 'yor', groupKey: 'travel', title: '约尔太太 cos（4.18，已完成）', kind: 'jar', scene: 'piggy' },
	{ code: 'kite', groupKey: 'travel', title: '4 月风筝节（已划掉）', kind: 'jar', scene: 'piggy', struck: true },
	{ code: 'volcano', groupKey: 'travel', title: '5.1 火山徒步（已完成）', kind: 'jar', scene: 'piggy' },
	{ code: 'cruise', groupKey: 'travel', title: '6.17 端午邮轮（已完成）', kind: 'jar', scene: 'piggy' },
	{ code: 'fuji', groupKey: 'travel', title: '9 月富士山（已划掉，政治问题）', kind: 'jar', scene: 'piggy', struck: true },
	{ code: 'huangshan', groupKey: 'travel', title: '黄山 / 其他山', kind: 'jar', scene: 'piggy' },
	{ code: 'nose', groupKey: 'travel', title: '鼻子微创', kind: 'jar', scene: 'piggy' },
	{ code: 'teeth', groupKey: 'travel', title: '8 月洗牙', kind: 'jar', scene: 'piggy' },
	{ code: 'lashes', groupKey: 'travel', title: '种睫毛', kind: 'jar', scene: 'piggy' },
	{ code: 'africa', groupKey: 'travel', title: '非洲大迁徙', kind: 'jar', scene: 'piggy' },
	{ code: 'nadam', groupKey: 'travel', title: '内蒙古那达慕', kind: 'jar', scene: 'piggy' },
	{ code: 'fish', groupKey: 'travel', title: '梁静茹演唱会', kind: 'jar', scene: 'piggy' },
	{ code: 'livehouse', groupKey: 'travel', title: 'livehouse / 音乐节', kind: 'jar', scene: 'piggy' },
	{ code: 'movies', groupKey: 'media', title: 'Friday movie night，一年 24 部', kind: 'aggregate', scene: 'media', metric: 'movie_count', targetValue: 24 },
	{ code: 'books', groupKey: 'reading', title: '整体读书', kind: 'aggregate', scene: 'media', metric: 'book_count', targetValue: 20 },
	{ code: 'ted-round', groupKey: 'ted', title: '进行到 Round 5（Round 3 于 4.15 结束）', kind: 'aggregate', scene: 'ted', metric: 'ted_round', targetValue: 5 },
	{ code: 'bilibili', groupKey: 'work', title: 'B 站更新 4 条', kind: 'note' },
	{ code: 'job', groupKey: 'work', title: '换一份工作，或赚更多钱', kind: 'checklist', stages: [] },
	{ code: 'meetup', groupKey: 'work', title: '前端分享会 4 次以上', kind: 'checklist', stages: [] },
	{
		code: 'changelog',
		groupKey: 'work',
		title: '网站更新日志，以及移动端优化',
		kind: 'checklist',
		stages: [stage('changelog', '更新日志'), stage('mobile', '移动端优化')],
	},
	{ code: 'product', groupKey: 'work', title: '寻找产品设计的可能性', kind: 'checklist', stages: [] },
	{
		code: 'q3-product',
		groupKey: 'work',
		title: 'Q3 对话式配置、新手引导、模板市场、付费机制',
		kind: 'checklist',
		stages: [
			stage('chat-config', '对话式配置'),
			stage('onboarding', '新手引导'),
			stage('templates', '模板市场'),
			stage('pay', '付费机制'),
		],
	},
	{
		code: 'q3-users',
		groupKey: 'work',
		title: 'Q3 第一批外部用户邀请',
		kind: 'checklist',
		stages: [stage('invite', '第一批外部用户邀请')],
	},
	{ code: 'daily-review', groupKey: 'work', title: '继续每日复盘', kind: 'note' },
	{ code: 'ltn', groupKey: 'work', title: 'LTN 累计金币', kind: 'aggregate', metric: 'ltn_coins', targetValue: 1500 },
]

let tableReady: Promise<void> | null = null

export function ensureYearPlanTable(): Promise<void> {
	if (!tableReady) {
		tableReady = sequelize.query(
			`CREATE TABLE IF NOT EXISTS year_plan_item (
				id INT NOT NULL AUTO_INCREMENT,
				user_id INT NOT NULL,
				plan_year INT NOT NULL,
				group_key VARCHAR(32) NOT NULL,
				sort_order INT NOT NULL DEFAULT 0,
				code VARCHAR(64) NULL,
				title VARCHAR(200) NOT NULL,
				kind VARCHAR(32) NOT NULL,
				scene VARCHAR(32) NULL,
				ref_id INT NULL,
				expect_status VARCHAR(32) NULL,
				metric VARCHAR(32) NULL,
				target_value DECIMAL(12, 2) NULL,
				result_text TEXT NULL,
				stages_json TEXT NULL,
				struck TINYINT(1) NOT NULL DEFAULT 0,
				created_at DATETIME NOT NULL,
				updated_at DATETIME NOT NULL,
				PRIMARY KEY (id),
				KEY idx_year_plan_user_year (user_id, plan_year)
			)`,
			{ type: QueryTypes.RAW }
		).then(() => undefined)
	}
	return tableReady
}

export function parseStages(raw: unknown): YearPlanStage[] {
	let value = raw
	if (typeof raw === 'string' && raw.trim()) {
		try {
			value = JSON.parse(raw)
		} catch {
			return []
		}
	}
	if (!Array.isArray(value)) return []
	const stages: YearPlanStage[] = []
	for (const item of value) {
		if (!item || typeof item !== 'object') continue
		const row = item as { id?: unknown; title?: unknown; done?: unknown }
		const title = String(row.title ?? '').trim().slice(0, 100)
		if (!title) continue
		const id = String(row.id ?? '').trim().slice(0, 40) || `s-${stages.length + 1}`
		stages.push({ id, title, done: row.done === true })
		if (stages.length >= 40) break
	}
	return stages
}

function numOrNull(value: unknown): number | null {
	if (value == null || value === '') return null
	const n = Number(value)
	return Number.isFinite(n) ? n : null
}

export function isYearPlanKind(value: unknown): value is YearPlanKind {
	return typeof value === 'string' && KINDS.has(value as YearPlanKind)
}

export function isYearPlanGroup(value: unknown): value is YearPlanGroupKey {
	return typeof value === 'string' && GROUP_KEYS.has(value)
}

export function isYearPlanMetric(value: unknown): value is YearPlanMetric {
	return typeof value === 'string' && METRICS.has(value as YearPlanMetric)
}

async function seedYear(userId: number, year: number) {
	if (year !== 2026) return
	const count = await YearPlanItemModal.count({ where: { userId, planYear: year } })
	if (count > 0) return
	const now = new Date()
	await YearPlanItemModal.bulkCreate(
		SEED_2026.map((item, index) => ({
			userId,
			planYear: year,
			groupKey: item.groupKey,
			sortOrder: index,
			code: item.code,
			title: item.title,
			kind: item.kind,
			scene: item.scene ?? null,
			expectStatus: item.expectStatus ?? null,
			metric: item.metric ?? null,
			targetValue: item.targetValue ?? null,
			stagesJson: item.kind === 'checklist' ? JSON.stringify(item.stages ?? []) : null,
			struck: item.struck === true,
			createdAt: now,
			updatedAt: now,
		}))
	)
}

type PlanGroup = {
	name: string
	status: string
	progress: number
	representativeId: number
	memberIds: number[]
}

type Metrics = {
	sportDays: number | null
	movieCount: number | null
	bookCount: number | null
	tedRound: number | null
	ltnCoins: number | null
	jars: Map<number, { name: string; balance: number; target: number | null; status: string }>
	plans: PlanGroup[]
}

async function loadMetrics(userId: number, year: number): Promise<Metrics> {
	const start = `${year}-01-01`
	const end = `${year}-12-31`
	const metrics: Metrics = {
		sportDays: null,
		movieCount: null,
		bookCount: null,
		tedRound: readTedRound(),
		ltnCoins: null,
		jars: new Map(),
		plans: [],
	}

	try {
		const rows = await sequelize.query<{ days: string | number }>(
			`SELECT COUNT(DISTINCT date) AS days
			 FROM sport_records
			 WHERE user_id = :userId AND date >= :start AND date <= :end`,
			{ replacements: { userId, start, end }, type: QueryTypes.SELECT }
		)
		metrics.sportDays = Number(rows[0]?.days ?? 0)
	} catch {
		metrics.sportDays = null
	}

	try {
		const books = await BooksRecordModal.findAll({
			where: { userId },
			attributes: ['tag', 'recent'],
		})
		let movies = 0
		let reads = 0
		for (const book of books) {
			const recent = book.get('recent') as string | Date | null
			if (!recent || dayjs(recent).year() !== year) continue
			const tag = book.get('tag') as string
			if (tag === '电影') movies += 1
			if (tag === '阅读') reads += 1
		}
		metrics.movieCount = movies
		metrics.bookCount = reads
	} catch {
		metrics.movieCount = null
		metrics.bookCount = null
	}

	try {
		const rows = await sequelize.query<{ total: string | number }>(
			`SELECT COALESCE(SUM(coins), 0) AS total
			 FROM ltn_daily_coins
			 WHERE date >= :start AND date <= :end`,
			{ replacements: { start, end }, type: QueryTypes.SELECT }
		)
		metrics.ltnCoins = Number(rows[0]?.total ?? 0)
	} catch {
		metrics.ltnCoins = null
	}

	try {
		const jars = await PiggyBankJarModal.findAll({ where: { userId }, order: [['sortOrder', 'ASC'], ['id', 'ASC']] })
		for (const jar of jars) {
			const id = Number(jar.get('id'))
			metrics.jars.set(id, {
				name: String(jar.get('name') ?? ''),
				balance: Number(jar.get('balance') ?? 0),
				target: numOrNull(jar.get('targetAmount')),
				status: String(jar.get('status') ?? 'active'),
			})
		}
	} catch {
		metrics.jars = new Map()
	}

	try {
		const plans = await RunningPlanModal.findAll({ where: { userId }, order: [['id', 'ASC']] })
		const byName = new Map<string, typeof plans>()
		for (const plan of plans) {
			const name = String(plan.get('planName') ?? '')
			const list = byName.get(name) ?? []
			list.push(plan)
			byName.set(name, list)
		}
		for (const [name, items] of byName) {
			const open = items.filter((item) => item.get('status') !== 'cancelled')
			const basis = open.length > 0 ? open : items
			const status = basis.every((item) => item.get('status') === 'completed')
				? 'completed'
				: basis.some((item) => item.get('status') === 'active')
					? 'active'
					: 'cancelled'
			let targetTimes = 0
			let currentTimes = 0
			for (const item of basis) {
				targetTimes += Number(item.get('targetTimes') ?? 0)
				currentTimes += Number(item.get('currentTimes') ?? 0)
			}
			const progress = targetTimes > 0 ? Math.min((currentTimes / targetTimes) * 100, 100) : 0
			metrics.plans.push({
				name,
				status,
				progress,
				representativeId: Number(basis[0].get('id')),
				memberIds: items.map((item) => Number(item.get('id'))),
			})
		}
	} catch {
		metrics.plans = []
	}

	return metrics
}

function formatRatio(current: number | null, target: number | null, unit: string): { text: string; done: boolean | null } {
	if (current == null) return { text: '这个数暂时读不到', done: null }
	const shown = Number.isInteger(current) ? String(current) : String(Math.round(current * 100) / 100)
	if (target == null) return { text: `${shown} ${unit}`, done: null }
	const goal = Number.isInteger(target) ? String(target) : String(target)
	return { text: `${shown} / ${goal} ${unit}`, done: current >= target }
}

function progressFor(row: {
	kind: string
	code: string | null
	refId: number | null
	expectStatus: string | null
	metric: string | null
	targetValue: unknown
	resultText: string | null
	stages: YearPlanStage[]
}, metrics: Metrics): { progressText: string; progressDone: boolean | null } {
	if (row.kind === 'note') {
		if (row.code === 'daily-review') return { progressText: '就是现在每天的日报', progressDone: null }
		const text = (row.resultText ?? '').trim()
		return text
			? { progressText: text, progressDone: null }
			: { progressText: '还没有结果句', progressDone: null }
	}
	if (row.kind === 'checklist') {
		const total = row.stages.length
		const done = row.stages.filter((item) => item.done).length
		if (total === 0) return { progressText: '还没有阶段', progressDone: null }
		return { progressText: `${done} / ${total} 个阶段`, progressDone: done === total }
	}
	if (row.kind === 'aggregate' && isYearPlanMetric(row.metric)) {
		const target = numOrNull(row.targetValue)
		if (row.metric === 'ted_round' && metrics.tedRound == null) {
			return { progressText: '当前轮还没有写进配置，这行算不出来', progressDone: null }
		}
		const current = {
			sport_days: metrics.sportDays,
			movie_count: metrics.movieCount,
			book_count: metrics.bookCount,
			ted_round: metrics.tedRound,
			ltn_coins: metrics.ltnCoins,
		}[row.metric]
		const ratio = formatRatio(current, target, METRIC_UNIT[row.metric])
		if (row.metric === 'ted_round' && metrics.tedRound != null) {
			const goal = target == null ? '' : ` / ${Number.isInteger(target) ? target : target}`
			return {
				progressText: `第 ${metrics.tedRound} 轮${goal}`,
				progressDone: target == null ? null : metrics.tedRound >= target,
			}
		}
		return { progressText: ratio.text, progressDone: ratio.done }
	}
	if (row.kind === 'jar') {
		if (row.refId == null) return { progressText: '未关联', progressDone: null }
		const jar = metrics.jars.get(row.refId)
		if (!jar) return { progressText: '关联的罐子已经不在', progressDone: null }
		const status = JAR_STATUS[jar.status] ?? jar.status
		if (jar.status === 'abandoned') return { progressText: `${jar.name}，已放弃`, progressDone: false }
		if (jar.status === 'completed') return { progressText: `${jar.name}，已结清`, progressDone: true }
		const target = jar.target == null ? '未设目标金额' : String(jar.target)
		return { progressText: `${jar.name}，${status} ${jar.balance} / ${target}`, progressDone: false }
	}
	if (row.kind === 'plan_status') {
		if (row.refId == null) return { progressText: '未关联', progressDone: null }
		const group = metrics.plans.find((plan) => plan.memberIds.includes(row.refId as number))
		if (!group) return { progressText: '关联的计划已经不在', progressDone: null }
		const status = PLAN_STATUS[group.status] ?? group.status
		const percent = `${Math.round(group.progress)}%`
		if (row.expectStatus === 'completed') {
			const done = group.status === 'completed'
			return {
				progressText: done ? `${group.name}，已完成` : `${group.name}，${status}，整体 ${percent}`,
				progressDone: done,
			}
		}
		const opened = group.status === 'active' || group.status === 'completed'
		return {
			progressText: opened ? `${group.name}，已开启（${status}）` : `${group.name}，${status}`,
			progressDone: opened,
		}
	}
	return { progressText: '', progressDone: null }
}

function toView(row: {
	get: (key: string) => unknown
}, metrics: Metrics): YearPlanView {
	const kind = String(row.get('kind')) as YearPlanKind
	const stages = parseStages(row.get('stagesJson'))
	const viewBase = {
		kind,
		code: (row.get('code') as string | null) ?? null,
		refId: numOrNull(row.get('refId')),
		expectStatus: (row.get('expectStatus') as string | null) ?? null,
		metric: (row.get('metric') as string | null) ?? null,
		targetValue: numOrNull(row.get('targetValue')),
		resultText: (row.get('resultText') as string | null) ?? null,
		stages,
	}
	const progress = progressFor(viewBase, metrics)
	return {
		id: Number(row.get('id')),
		code: viewBase.code,
		groupKey: String(row.get('groupKey')),
		title: String(row.get('title') ?? ''),
		kind,
		scene: (row.get('scene') as string | null) ?? null,
		refId: viewBase.refId == null ? null : Math.trunc(viewBase.refId),
		expectStatus: viewBase.expectStatus === 'active' || viewBase.expectStatus === 'completed' ? viewBase.expectStatus : null,
		metric: isYearPlanMetric(viewBase.metric) ? viewBase.metric : null,
		targetValue: viewBase.targetValue,
		resultText: viewBase.resultText ?? '',
		stages,
		struck: row.get('struck') === true || row.get('struck') === 1,
		progressText: progress.progressText,
		progressDone: progress.progressDone,
	}
}

export async function loadYearPlan(userId: number, year: number) {
	await ensureYearPlanTable()
	await seedYear(userId, year)
	const metrics = await loadMetrics(userId, year)
	const rows = await YearPlanItemModal.findAll({
		where: { userId, planYear: year },
		order: [['sortOrder', 'ASC'], ['id', 'ASC']],
	})
	const items = rows.map((row) => toView(row, metrics))
	const groups = YEAR_PLAN_GROUPS.map((group) => ({
		key: group.key,
		label: group.label,
		items: items.filter((item) => item.groupKey === group.key),
	})).filter((group) => group.items.length > 0)

	const jars: YearPlanOption[] = [...metrics.jars.entries()].map(([id, jar]) => ({
		id,
		name: jar.status === 'active' ? jar.name : `${jar.name}（${JAR_STATUS[jar.status] ?? jar.status}）`,
		status: jar.status,
	}))
	const plans: YearPlanOption[] = metrics.plans
		.filter((plan) => plan.status === 'active' || plan.status === 'completed')
		.map((plan) => ({
			id: plan.representativeId,
			name: plan.name,
			status: plan.status,
		}))

	return { year, groups, options: { jars, plans } }
}

export type YearPlanWrite = {
	title?: string
	groupKey?: string
	kind?: YearPlanKind
	scene?: string | null
	refId?: number | null
	expectStatus?: YearPlanExpect | null
	metric?: YearPlanMetric | null
	targetValue?: number | null
	resultText?: string | null
	stages?: YearPlanStage[]
	struck?: boolean
}

export function writableFields(input: YearPlanWrite): Record<string, unknown> | string {
	const fields: Record<string, unknown> = {}
	if (input.title != null) {
		const title = String(input.title).trim()
		if (!title) return '标题不能为空'
		fields.title = title.slice(0, 200)
	}
	if (input.groupKey != null) {
		if (!isYearPlanGroup(input.groupKey)) return '分组不对'
		fields.groupKey = input.groupKey
	}
	if (input.kind != null) {
		if (!isYearPlanKind(input.kind)) return '类型不对'
		fields.kind = input.kind
	}
	if ('scene' in input) {
		const scene = input.scene == null || input.scene === '' ? null : String(input.scene)
		if (scene != null && !['sport', 'piggy', 'media', 'ted'].includes(scene)) return '场景不对'
		fields.scene = scene
	}
	if ('refId' in input) {
		if (input.refId == null || input.refId === ('' as unknown)) fields.refId = null
		else {
			const id = Number(input.refId)
			if (!Number.isInteger(id) || id <= 0) return '关联对象不对'
			fields.refId = id
		}
	}
	if ('expectStatus' in input) {
		if (input.expectStatus == null || input.expectStatus === ('' as unknown)) fields.expectStatus = null
		else if (input.expectStatus !== 'active' && input.expectStatus !== 'completed') return '完成标准不对'
		else fields.expectStatus = input.expectStatus
	}
	if ('metric' in input) {
		if (input.metric == null || input.metric === ('' as unknown)) fields.metric = null
		else if (!isYearPlanMetric(input.metric)) return '统计口径不对'
		else fields.metric = input.metric
	}
	if ('targetValue' in input) {
		if (input.targetValue == null || input.targetValue === ('' as unknown)) fields.targetValue = null
		else {
			const n = Number(input.targetValue)
			if (!Number.isFinite(n) || n < 0) return '目标要是一个不小于 0 的数'
			fields.targetValue = n
		}
	}
	if ('resultText' in input) {
		fields.resultText = input.resultText == null ? null : String(input.resultText).slice(0, 2000)
	}
	if ('stages' in input) {
		fields.stagesJson = JSON.stringify(parseStages(input.stages))
	}
	if ('struck' in input) fields.struck = input.struck === true
	return fields
}
