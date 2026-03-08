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

	// 旁观者：只放行 GET，其余 401
	if (userId == null || userId === '') {
		if (request.method !== 'GET') {
			return NextResponse.json({ message: '达咩！你没有权限操作哦' }, { status: 401 })
		}
	}

	// 把 user id 写入请求头，供 API 路由通过 request.headers.get('x-user-id') 读取
	const requestHeaders = new Headers(request.headers)
	requestHeaders.set('x-user-id', userId ?? '')
	requestHeaders.set('x-main-user-id', mainUserId)

	return NextResponse.next({ request: { headers: requestHeaders } })
}
