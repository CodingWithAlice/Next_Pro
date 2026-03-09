import { NextRequest, NextResponse } from 'next/server'
import { GetWeekData } from 'utils'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

async function GET(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serialNumber')
		if (!serialNumber) {
			return NextResponse.json(
				{ error: 'serialNumber is required' },
				{ status: 400 }
			)
		}
		const data = await GetWeekData(serialNumber, userId)
		return NextResponse.json(data, { status: 200 })
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export { GET }
