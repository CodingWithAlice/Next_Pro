import { NextRequest, NextResponse } from 'next/server'
import { YearPlanItemModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'
import { denyIfCapabilityOff } from '@lib/capabilities'
import {
	isYearPlanGroup,
	isYearPlanKind,
	loadYearPlan,
	writableFields,
} from '@lib/year-plan'

function readYear(raw: string | null): number {
	const year = Number(raw)
	const fallback = new Date().getFullYear()
	if (!Number.isInteger(year) || year < 2000 || year > 2100) return fallback
	return year
}

async function GET(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const year = readYear(request.nextUrl.searchParams.get('year'))
		const plan = await loadYearPlan(userId, year)
		return NextResponse.json({ ...plan, success: true, message: '操作成功' })
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ success: false, message: '操作失败', error: (error as Error).message },
			{ status: 500 }
		)
	}
}

async function POST(request: NextRequest) {
	try {
		const denied = await denyIfCapabilityOff(request)
		if (denied) return denied
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		const data = body.data ?? body
		const year = readYear(data.year == null ? null : String(data.year))
		const title = String(data.title ?? '').trim()
		if (!title) {
			return NextResponse.json({ success: false, message: '标题不能为空' }, { status: 400 })
		}
		if (!isYearPlanKind(data.kind)) {
			return NextResponse.json({ success: false, message: '类型不对' }, { status: 400 })
		}
		if (data.kind === 'aggregate' && data.metric == null) {
			return NextResponse.json({ success: false, message: '要选统计口径' }, { status: 400 })
		}
		if (data.kind === 'jar' && (data.scene == null || data.scene === '')) data.scene = 'piggy'
		if (data.kind === 'plan_status') {
			data.scene = 'sport'
			if (data.expectStatus == null) data.expectStatus = 'completed'
		}
		const groupKey = isYearPlanGroup(data.groupKey) ? data.groupKey : 'other'
		const fields = writableFields({
			title,
			groupKey,
			kind: data.kind,
			scene: data.scene,
			refId: data.refId,
			expectStatus: data.expectStatus,
			metric: data.metric,
			targetValue: data.targetValue,
			resultText: data.resultText,
			stages: data.stages,
			struck: data.struck,
		})
		if (typeof fields === 'string') {
			return NextResponse.json({ success: false, message: fields }, { status: 400 })
		}
		const maxSort = await YearPlanItemModal.max('sortOrder', { where: { userId, planYear: year } })
		const created = await YearPlanItemModal.create({
			...fields,
			userId,
			planYear: year,
			groupKey,
			sortOrder: Number(maxSort ?? -1) + 1,
		})
		return NextResponse.json({ success: true, message: '已添加', id: created.get('id') })
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ success: false, message: '操作失败', error: (error as Error).message },
			{ status: 500 }
		)
	}
}

export { GET, POST }
