import { NextRequest, NextResponse } from 'next/server'
import { YearPlanItemModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'
import { denyIfCapabilityOff } from '@lib/capabilities'
import { writableFields, type YearPlanWrite } from '@lib/year-plan'

async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const denied = await denyIfCapabilityOff(request)
		if (denied) return denied
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const { id } = await context.params
		const itemId = Number(id)
		if (!Number.isInteger(itemId) || itemId <= 0) {
			return NextResponse.json({ success: false, message: '条目不存在' }, { status: 400 })
		}
		const row = await YearPlanItemModal.findOne({ where: { id: itemId, userId } })
		if (!row) {
			return NextResponse.json({ success: false, message: '条目不存在' }, { status: 404 })
		}
		const body = await request.json()
		const data = (body.data ?? body) as YearPlanWrite
		const fields = writableFields(data)
		if (typeof fields === 'string') {
			return NextResponse.json({ success: false, message: fields }, { status: 400 })
		}
		if (Object.keys(fields).length === 0) {
			return NextResponse.json({ success: true, message: '没有要改的内容' })
		}
		await row.update(fields)
		return NextResponse.json({ success: true, message: '已保存' })
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ success: false, message: '操作失败', error: (error as Error).message },
			{ status: 500 }
		)
	}
}

async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const denied = await denyIfCapabilityOff(request)
		if (denied) return denied
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const { id } = await context.params
		const itemId = Number(id)
		const removed = await YearPlanItemModal.destroy({ where: { id: itemId, userId } })
		if (!removed) {
			return NextResponse.json({ success: false, message: '条目不存在' }, { status: 404 })
		}
		return NextResponse.json({ success: true, message: '已从今年清单拿掉' })
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ success: false, message: '操作失败', error: (error as Error).message },
			{ status: 500 }
		)
	}
}

export { PUT, DELETE }
