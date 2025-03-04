import { NextRequest, NextResponse } from 'next/server'

export const config = {
	matcher: '/api/:path*', // 匹配 api 下所有接口
}

// 校验请求头中是否存在 Authorization
export default function middleware(request: NextRequest) {
	if (request.method === 'POST') {
		const authHeader = request.headers.get('Authorization')
        
		if (!authHeader || authHeader !== process.env.CHECK_AUTH) {
			return NextResponse.json({ message: '达咩！你没有权限操作哦' }, { status: 401 })
		}
	}

	return NextResponse.next()
}
