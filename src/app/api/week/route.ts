import { NextRequest, NextResponse } from 'next/server'
import { SerialModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

async function GET(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serialNumber')
		if (!serialNumber) {
			return
		}
		const where = { userId }
		const serialData = await SerialModal.findAll({
			where,
			attributes: ['serialNumber', 'startTime', 'endTime'],
		})
		const weekList = await SerialModal.findAll({ where: { ...where, serialNumber } })
		return NextResponse.json({
			weekData: weekList[0] || {},
			serialData,
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
		const data = body.data
		const [issue, created] = await SerialModal.findOrCreate({
			where: { userId, serialNumber: data.serialNumber },
			defaults: { ...data, userId },
		})
		if (!created) {
			issue.set(data)
			// 如果已经存在，更新描述
			await issue.save()
		}
		return NextResponse.json({
			success: true,
			message: created ? '观察成功' : '更新成功',
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

export { GET, POST }
