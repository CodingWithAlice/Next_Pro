import { NextRequest, NextResponse } from 'next/server'
import { QueryTypes } from 'sequelize'
import { sequelize } from 'db'
import {
	capabilityKeyForPath,
	isCapabilityKey,
	type CapabilityKey,
} from '@lib/capability-keys'

const VIEW_ONLY_MESSAGE = '该场景当前仅可查看'

let tableReady: Promise<void> | null = null

function ensureTable(): Promise<void> {
	if (!tableReady) {
		tableReady = sequelize.query(
			`CREATE TABLE IF NOT EXISTS capability_config (
				id INT NOT NULL AUTO_INCREMENT,
				user_id INT NOT NULL,
				enabled_json TEXT NOT NULL,
				updated_at DATETIME NOT NULL,
				PRIMARY KEY (id),
				UNIQUE KEY uniq_capability_user (user_id)
			)`,
			{ type: QueryTypes.RAW }
		).then(() => undefined)
	}
	return tableReady
}

export function readCapabilityDefault(): CapabilityKey[] {
	const raw = process.env.CAPABILITY_DEFAULT
	if (raw == null || String(raw).trim() === '') {
		throw new Error('缺少 CAPABILITY_DEFAULT')
	}
	const parts = String(raw)
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
	if (parts.length === 0 || parts.some((item) => !isCapabilityKey(item))) {
		throw new Error('CAPABILITY_DEFAULT 无法解析')
	}
	return [...new Set(parts)] as CapabilityKey[]
}

export function parseEnabledList(value: unknown): CapabilityKey[] | null {
	if (!Array.isArray(value)) return null
	const keys: CapabilityKey[] = []
	for (const item of value) {
		if (typeof item !== 'string' || !isCapabilityKey(item)) return null
		if (!keys.includes(item)) keys.push(item)
	}
	return keys
}

export async function resolveCapabilities(userId: string): Promise<{
	enabled: CapabilityKey[]
	source: 'user' | 'default'
}> {
	await ensureTable()
	const rows = await sequelize.query<{ enabled_json: string }>(
		'SELECT enabled_json FROM capability_config WHERE user_id = :userId LIMIT 1',
		{ replacements: { userId: Number(userId) }, type: QueryTypes.SELECT }
	)
	const row = rows[0]
	if (!row) {
		return { enabled: readCapabilityDefault(), source: 'default' }
	}
	let parsed: unknown
	try {
		parsed = JSON.parse(row.enabled_json)
	} catch {
		throw new Error('个人场景配置无法解析')
	}
	const enabled = parseEnabledList(parsed)
	if (!enabled) {
		throw new Error('个人场景配置无法解析')
	}
	return { enabled, source: 'user' }
}

export async function saveCapabilities(userId: string, enabled: CapabilityKey[]): Promise<void> {
	await ensureTable()
	const now = new Date()
	await sequelize.query(
		`INSERT INTO capability_config (user_id, enabled_json, updated_at)
		 VALUES (:userId, :enabledJson, :updatedAt)
		 ON DUPLICATE KEY UPDATE enabled_json = VALUES(enabled_json), updated_at = VALUES(updated_at)`,
		{
			replacements: {
				userId: Number(userId),
				enabledJson: JSON.stringify(enabled),
				updatedAt: now.toISOString().slice(0, 19).replace('T', ' '),
			},
			type: QueryTypes.RAW,
		}
	)
}

export async function denyIfCapabilityOff(request: NextRequest): Promise<NextResponse | null> {
	const method = request.method.toUpperCase()
	if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null
	const key = capabilityKeyForPath(request.nextUrl.pathname)
	if (!key) return null
	const userId = request.headers.get('x-user-id')?.trim() ?? ''
	if (!/^\d+$/.test(userId)) return null
	try {
		const { enabled } = await resolveCapabilities(userId)
		if (enabled.includes(key)) return null
		return NextResponse.json({ message: VIEW_ONLY_MESSAGE }, { status: 403 })
	} catch (error) {
		return NextResponse.json(
			{ message: (error as Error).message || '场景配置不可用' },
			{ status: 500 }
		)
	}
}
