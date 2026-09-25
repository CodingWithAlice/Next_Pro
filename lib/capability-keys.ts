export const CAPABILITY_KEYS = [
	'daily',
	'week',
	'month',
	'ted',
	'sport',
	'media',
	'piggy',
] as const

export type CapabilityKey = (typeof CAPABILITY_KEYS)[number]

export const CAPABILITY_LABELS: { key: CapabilityKey; label: string }[] = [
	{ key: 'daily', label: '晨昏日志' },
	{ key: 'week', label: '双周扫描' },
	{ key: 'month', label: '季度沙盘' },
	{ key: 'ted', label: 'TED' },
	{ key: 'sport', label: '运动' },
	{ key: 'media', label: '书 / 电影' },
	{ key: 'piggy', label: '零钱罐子' },
]

/** 写接口前缀。只匹配完整段，避免 /api/routine 命中 /api/routine-types */
const WRITE_PREFIXES: { prefix: string; key: CapabilityKey }[] = [
	{ prefix: '/api/daily', key: 'daily' },
	{ prefix: '/api/routine', key: 'daily' },
	{ prefix: '/api/ai/parse-time', key: 'daily' },
	{ prefix: '/api/ai/parse-issue', key: 'daily' },
	{ prefix: '/api/week', key: 'week' },
	{ prefix: '/api/serial', key: 'week' },
	{ prefix: '/api/month', key: 'month' },
	{ prefix: '/api/ted', key: 'ted' },
	{ prefix: '/api/sport', key: 'sport' },
	{ prefix: '/api/running-plans', key: 'sport' },
	{ prefix: '/api/books', key: 'media' },
	{ prefix: '/api/uploads/books', key: 'media' },
	{ prefix: '/api/piggy-bank', key: 'piggy' },
	{ prefix: '/api/uploads/piggy-jars', key: 'piggy' },
]

export function isCapabilityKey(value: string): value is CapabilityKey {
	return (CAPABILITY_KEYS as readonly string[]).includes(value)
}

export function capabilityKeyForPath(pathname: string): CapabilityKey | null {
	const hit = WRITE_PREFIXES.find(
		({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	)
	return hit?.key ?? null
}
