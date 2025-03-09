import { NextRequest, NextResponse } from 'next/server'
import { GetWeekData } from 'utils'

// 按照周期整合数据
// function getPeriodData(dailyTimeRecord: any, dailyIssueRecord: any) {
// 	console.log(dailyTimeRecord, dailyIssueRecord)
// 	return {}
// }

async function GET(request: NextRequest) {
	try {
		// 查询周期
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serialNumber')
		if (!serialNumber) {
			return NextResponse.json(
				{ error: 'serialNumber is required' },
				{ status: 400 }
			)
		}

		const data = await GetWeekData(serialNumber)
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
