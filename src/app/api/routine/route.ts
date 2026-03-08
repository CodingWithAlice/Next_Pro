import { NextRequest, NextResponse } from 'next/server'
import { RoutineTypeModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

async function GET(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const res = await RoutineTypeModal.findAll({ where: { userId } })
		return NextResponse.json({
			data: res,
			success: true,
			message: '操作成功',
		})
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{
				success: false,
				message: '操作失败',
				error: (error as Error).message,
			},
			{ status: 500 }
		)
	}
}

async function POST(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		if (Array.isArray(body?.data)) {
			const rows = body.data.map((row: Record<string, unknown>) => ({ ...row, userId }))
			await RoutineTypeModal.bulkCreate(rows, { validate: true })
			return NextResponse.json({ success: true, message: '操作成功' })
		}
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{
				success: false,
				message: '操作失败',
				error: (error as Error).message,
			},
			{ status: 500 }
		)
	}
}

async function PUT(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		const { id, type, des } = body
		if (id) {
			await RoutineTypeModal.update(
				{ type, des },
				{ where: { id, userId } }
			)
			return NextResponse.json({ success: true, message: '操作成功' })
		}
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{
				success: false,
				message: '操作失败',
				error: (error as Error).message,
			},
			{ status: 500 }
		)
	}
}

// eslint-disable-next-line
async function DELETE(request: NextRequest) {
	const userId = Number(getEffectiveUserIdFromRequest(request))
	const { searchParams } = request.nextUrl
	const id = searchParams.get('id')
	if (id) {
		await RoutineTypeModal.destroy({ where: { id, userId } })
	} else {
		await RoutineTypeModal.destroy({ where: { userId } })
	}
}

export { GET, POST, PUT }
