import { NextRequest, NextResponse } from 'next/server'

export const config = {
	matcher: '/api/:path*', // 匹配 api 下所有接口
}

// 校验请求头中是否存在 Authorization
export default function middleware(request: NextRequest) {
	if (request.method === 'POST') {
		const authHeader = request.headers.get('Authorization')

		if (!authHeader || authHeader !== 'owner') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
	}

	return NextResponse.next()
}
