import { NextRequest, NextResponse } from 'next/server'
import { Op } from 'sequelize'
import { DayLogModal, RoutineTypeModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'
import { denyIfCapabilityOff } from '@lib/capabilities'
import { ensureDayLogTable } from '@lib/day-log-db'

function dateKey(value: unknown): string | null {
	if (value == null || value === '') return null
	if (typeof value === 'string') {
		const matched = value.trim().match(/^(\d{4}-\d{2}-\d{2})/)
		return matched ? matched[1] : null
	}
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		const month = String(value.getMonth() + 1).padStart(2, '0')
		const day = String(value.getDate()).padStart(2, '0')
		return `${value.getFullYear()}-${month}-${day}`
	}
	return null
}

type DayLogRow = { get: (key: string) => unknown }

function toLog(row: DayLogRow) {
	return {
		id: row.get('id'),
		date: dateKey(row.get('date')),
		routineTypeId: row.get('routineTypeId'),
		startedAt: row.get('startedAt'),
		endedAt: row.get('endedAt'),
		durationMin: row.get('durationMin'),
		note: row.get('note') || '',
	}
}

async function GET(request: NextRequest) {
	try {
		await ensureDayLogTable()
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const today = dateKey(new Date()) as string
		const requested = dateKey(request.nextUrl.searchParams.get('date')) || today

		const routineData = await RoutineTypeModal.findAll({
			where: { userId, show: true },
		})
		const logs = await DayLogModal.findAll({
			where: { userId, date: requested },
			order: [['startedAt', 'DESC']],
		})
		const open = await DayLogModal.findOne({
			where: { userId, endedAt: { [Op.is]: null } },
			order: [['startedAt', 'DESC']],
		})
		const dateRows: DayLogRow[] = await DayLogModal.findAll({
			where: { userId },
			attributes: ['date'],
		})
		const dates = Array.from(
			new Set([
				today,
				...dateRows
					.map((row) => dateKey(row.get('date')))
					.filter((value): value is string => value != null),
			])
		).sort((a, b) => b.localeCompare(a))

		return NextResponse.json({
			success: true,
			date: requested,
			today,
			dates,
			routineData,
			logs: logs.map(toLog),
			open: open ? toLog(open) : null,
		})
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ success: false, message: '读取当场记录失败', error: (error as Error).message },
			{ status: 500 }
		)
	}
}

async function POST(request: NextRequest) {
	try {
		const denied = await denyIfCapabilityOff(request)
		if (denied) return denied
		await ensureDayLogTable()
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		const data = body.data || {}
		const action = data.action as string

		if (action === 'start') {
			const date = dateKey(data.date)
			const routineTypeId = Number(data.routineTypeId)
			if (!date || !routineTypeId) {
				return NextResponse.json({ success: false, message: '缺少日期或类型' }, { status: 400 })
			}
			const type = await RoutineTypeModal.findOne({ where: { id: routineTypeId, userId } })
			if (!type) {
				return NextResponse.json({ success: false, message: '类型不存在' }, { status: 400 })
			}
			const open = await DayLogModal.findOne({
				where: { userId, endedAt: { [Op.is]: null } },
			})
			if (open) {
				return NextResponse.json({ success: false, message: '上一段还没结束' }, { status: 400 })
			}
			const created = await DayLogModal.create({
				userId,
				date,
				routineTypeId,
				startedAt: new Date(),
				endedAt: null,
				durationMin: null,
				note: typeof data.note === 'string' ? data.note.slice(0, 500) : null,
			})
			return NextResponse.json({ success: true, log: toLog(created) })
		}

		if (action === 'stop') {
			const id = Number(data.id)
			const row = await DayLogModal.findOne({ where: { id, userId } })
			if (!row || row.get('endedAt')) {
				return NextResponse.json({ success: false, message: '没有进行中的一段' }, { status: 400 })
			}
			const endedAt = new Date()
			const startedAt = new Date(row.get('startedAt') as string | Date)
			const clock = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000))
			if (typeof data.note === 'string') row.set('note', data.note.slice(0, 500))
			row.set({
				endedAt,
				durationMin: clock,
			})
			await row.save()
			return NextResponse.json({ success: true, log: toLog(row) })
		}

		if (action === 'update') {
			const id = Number(data.id)
			const row = await DayLogModal.findOne({ where: { id, userId } })
			if (!row) {
				return NextResponse.json({ success: false, message: '记录不存在' }, { status: 404 })
			}
			if (typeof data.note === 'string') row.set('note', data.note.slice(0, 500))
			if (data.durationMin != null && data.durationMin !== '') {
				const minutes = Number(data.durationMin)
				if (!Number.isFinite(minutes) || minutes < 0 || minutes > 24 * 60) {
					return NextResponse.json({ success: false, message: '时长不对' }, { status: 400 })
				}
				row.set('durationMin', Math.round(minutes))
			}
			if (data.routineTypeId != null) {
				const routineTypeId = Number(data.routineTypeId)
				const type = await RoutineTypeModal.findOne({ where: { id: routineTypeId, userId } })
				if (!type) {
					return NextResponse.json({ success: false, message: '类型不存在' }, { status: 400 })
				}
				row.set('routineTypeId', routineTypeId)
			}
			await row.save()
			return NextResponse.json({ success: true, log: toLog(row) })
		}

		return NextResponse.json({ success: false, message: '未知操作' }, { status: 400 })
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ success: false, message: '保存当场记录失败', error: (error as Error).message },
			{ status: 500 }
		)
	}
}

async function DELETE(request: NextRequest) {
	try {
		const denied = await denyIfCapabilityOff(request)
		if (denied) return denied
		await ensureDayLogTable()
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const id = Number(request.nextUrl.searchParams.get('id'))
		if (!id) {
			return NextResponse.json({ success: false, message: '缺少记录' }, { status: 400 })
		}
		await DayLogModal.destroy({ where: { id, userId } })
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ success: false, message: '删除失败', error: (error as Error).message },
			{ status: 500 }
		)
	}
}

export { GET, POST, DELETE }
