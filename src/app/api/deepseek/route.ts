import { NextRequest, NextResponse } from 'next/server'
import { AIPOST } from '../../../../lib/request'

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serialNumber')
		if (!serialNumber) return
		const serials = serialNumber
			.split(',')
			.map((it) => +it)
			.sort((a, b) => a - b)

		const data = AIPOST({ inputText: serials.join('') })
		return NextResponse.json({
			serials,
			data,
		})
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export { GET }
