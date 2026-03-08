/**
 * 多用户：令牌 → user_id 解析与主账号读取
 * 从 config.env 的 USER_TOKEN_MAP（方案 B JSON）和 MAIN_USER_ID 读取
 */

const MAIN_USER_ID_KEY = 'MAIN_USER_ID'
const USER_TOKEN_MAP_KEY = 'USER_TOKEN_MAP'

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
 * @param token 从 URL 或 Header 取到的令牌
 * @returns user_id 或 null（旁观者）
 */
export function resolveUserId(token: string | null): string | null {
	if (token == null || String(token).trim() === '') return null
	const map = getTokenMap()
	const userId = map[token]
	if (userId == null || String(userId).trim() === '') return null
	return String(userId)
}

/**
 * 返回主账号 user_id，用于旁观者 GET 时的数据查询
 */
export function getMainUserId(): string {
	const id = process.env[MAIN_USER_ID_KEY]
	if (id != null && String(id).trim() !== '') return String(id)
	return '1'
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
