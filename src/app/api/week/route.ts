import { NextRequest, NextResponse } from 'next/server'
import { SerialModal, WeekModal } from 'db'

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serialNumber')

		const weekList = await WeekModal.findAll({ where: { serialNumber } })
		const serialData = await SerialModal.findAll()
		return NextResponse.json({ weekData: weekList[0] || {}, serialData })
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
		const [issue, created] = await WeekModal.findOrCreate({
			where: { serialNumber: data.serialNumber },
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
