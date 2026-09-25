import { NextRequest, NextResponse } from 'next/server'
import { parseEnabledList, resolveCapabilities, saveCapabilities } from '@lib/capabilities'

function loginUserId(request: NextRequest): string | null {
	const userId = request.headers.get('x-user-id')?.trim() ?? ''
	return /^\d+$/.test(userId) ? userId : null
}

export async function GET(request: NextRequest) {
	const userId = loginUserId(request)
	if (!userId) {
		return NextResponse.json({ message: '达咩！你没有权限操作哦' }, { status: 401 })
	}
	try {
		const result = await resolveCapabilities(userId)
		return NextResponse.json({ success: true, ...result })
	} catch (error) {
		return NextResponse.json(
			{ success: false, message: (error as Error).message || '场景配置不可用' },
			{ status: 500 }
		)
	}
}

export async function PUT(request: NextRequest) {
	const userId = loginUserId(request)
	if (!userId) {
		return NextResponse.json({ message: '达咩！你没有权限操作哦' }, { status: 401 })
	}
	try {
		const body = await request.json()
		const payload = body?.data ?? body
		const enabled = parseEnabledList(payload?.enabled)
		if (!enabled) {
			return NextResponse.json({ success: false, message: '场景勾选无法解析' }, { status: 400 })
		}
		await saveCapabilities(userId, enabled)
		return NextResponse.json({ success: true, enabled, source: 'user' })
	} catch (error) {
		return NextResponse.json(
			{ success: false, message: (error as Error).message || '保存失败' },
			{ status: 500 }
		)
	}
}
