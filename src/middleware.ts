import { NextRequest, NextResponse } from 'next/server'
import { resolveUserId, getMainUserId } from '@lib/auth-token'

export const config = {
	matcher: '/api/:path*', // 匹配 api 下所有接口
}

function getToken(request: NextRequest): string | null {
	const url = request.nextUrl
	const fromUrl = url.searchParams.get('j-user-id') ?? url.searchParams.get('type')
	if (fromUrl) return fromUrl
	return request.headers.get('j-user-id') ?? request.headers.get('Authorization')
}

export default function middleware(request: NextRequest) {
	const token = getToken(request)
	const userId = resolveUserId(token)
	const mainUserId = getMainUserId()

	const res = NextResponse.next()
	res.headers.set('x-user-id', userId ?? '')
	res.headers.set('x-main-user-id', mainUserId)

	// 旁观者：只放行 GET，其余 401
	if (userId == null || userId === '') {
		if (request.method !== 'GET') {
			return NextResponse.json({ message: '达咩！你没有权限操作哦' }, { status: 401 })
		}
	}

	return res
}
