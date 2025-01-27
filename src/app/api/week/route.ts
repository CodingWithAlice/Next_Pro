import { NextRequest, NextResponse } from 'next/server'
import { SerialModal, WeekModal } from 'db'

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serial')

		const weekData = await WeekModal.findAll({ where: { serialNumber } })
		const serialData = await SerialModal.findAll()
		return NextResponse.json({ weekData, serialData })
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
		await WeekModal.findOrCreate({
			where: { serialNumber: data.serialNumber },
			defaults: data,
		})
		return NextResponse.json({ success: true })
	} catch (e) {
		console.error(e)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export { GET, POST }
