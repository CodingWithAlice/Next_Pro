import { NextRequest, NextResponse } from 'next/server'
import {  MonthModal } from 'db'

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const monthId = searchParams.get('monthId')
		if (!monthId) return
		// 每个周期的时长信息查询 - 查询起始时间
		const monthData = await MonthModal.findAll({ where: { id: monthId } })
		return NextResponse.json({ monthData: monthData[0] })
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const data = body.data
		const [issue, created] = await MonthModal.findOrCreate({
			where: { id: data.id },
			defaults: data,
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
	} catch (e) {
		console.error(e)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export { GET, POST }
