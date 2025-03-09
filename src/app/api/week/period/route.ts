import { transTwoDateToWhereOptions } from 'utils'
import { NextRequest, NextResponse } from 'next/server'
import { IssueModal, SerialModal, TimeModal } from 'db'
import { WeekDataProps } from '@/api/deepseek/route'

// 按照周期整合数据
// function getPeriodData(dailyTimeRecord: any, dailyIssueRecord: any) {
// 	console.log(dailyTimeRecord, dailyIssueRecord)
// 	return {}
// }

export async function GetWeekData(serialNumber: string) {
	const serialDateInfo = await SerialModal.findOne({
		where: { serialNumber: +serialNumber },
	})
	if (!serialDateInfo) {
		throw new Error('当前周期无数据')
	}
	// 周期起始时间
	const startTime = serialDateInfo.getDataValue('startTime')
	const endTime = serialDateInfo.getDataValue('endTime')
	// 查询周期内的时间 + 事项记录
	const weekData = (await IssueModal.findAll({
		where: transTwoDateToWhereOptions(startTime, endTime),
		include: [
			{
				model: TimeModal,
				where: {
					routineTypeId: [9, 10, 13, 14, 16], // 9-总计 10-入睡时间 13-前端总计 14-总时长 16-LTN时长
				},
			},
		],
		raw: true,
	})) as unknown as WeekDataProps[]
	return { startTime, endTime, weekData }
}

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
