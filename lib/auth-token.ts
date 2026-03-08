/**
 * 多用户：令牌 → user_id 解析与主账号读取
 * 从 config.env 的 USER_TOKEN_MAP（方案 B JSON）和 MAIN_USER_ID 读取
 */

const MAIN_USER_ID_KEY = 'MAIN_USER_ID'
const USER_TOKEN_MAP_KEY = 'USER_TOKEN_MAP'
const CHECK_AUTH_KEY = 'CHECK_AUTH'

let tokenMap: Record<string, string> | null = null

function getTokenMap(): Record<string, string> {
	if (tokenMap) return tokenMap
	const raw = process.env[USER_TOKEN_MAP_KEY]
	if (!raw || typeof raw !== 'string') {
		tokenMap = {}
		return tokenMap
	}
	try {
		const parsed = JSON.parse(raw) as Record<string, string>
		tokenMap = parsed && typeof parsed === 'object' ? parsed : {}
	} catch {
		tokenMap = {}
	}
	return tokenMap
}

/**
 * 根据令牌解析 user_id
 * 若令牌等于 CHECK_AUTH（主账号专用令牌，不放在 USER_TOKEN_MAP），则返回主账号 id；
 * 否则从 USER_TOKEN_MAP 查找，找不到则返回 null（旁观者）。
 * @param token 从 URL 或 Header 取到的令牌
 * @returns user_id 或 null（旁观者）
 */
export function resolveUserId(token: string | null): string | null {
	if (token == null || String(token).trim() === '') return null
	const t = String(token).trim()
	const checkAuth = process.env[CHECK_AUTH_KEY]
	if (checkAuth != null && String(checkAuth).trim() === t) return getMainUserId()
	const map = getTokenMap()
	const userId = map[t]
	if (userId == null || String(userId).trim() === '') return null
	return String(userId)
}

/**
 * 返回主账号 user_id，用于旁观者 GET 时的数据查询
 * 若配置带中文等后缀，只取前导数字部分
 */
export function getMainUserId(): string {
	const raw = process.env[MAIN_USER_ID_KEY]
	if (raw == null || String(raw).trim() === '') return '1'
	const s = String(raw).trim()
	const numMatch = s.match(/^\d+/)
	return numMatch ? numMatch[0] : s
}

/**
 * 从请求头解析当前请求应使用的 user_id（API 用）
 * 若有 x-user-id 则用该用户；否则（旁观者 GET）用 x-main-user-id
 */
export function getEffectiveUserIdFromRequest(request: { headers: { get: (name: string) => string | null } }): string {
	const uid = request.headers.get('x-user-id')
	if (uid != null && String(uid).trim() !== '') return String(uid)
	const main = request.headers.get('x-main-user-id')
	if (main != null && String(main).trim() !== '') return String(main)
	return getMainUserId()
}
