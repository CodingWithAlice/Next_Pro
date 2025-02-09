import { transTwoDateToWhereOptions } from 'utils';
import { NextRequest, NextResponse } from 'next/server'
import { IssueModal, SerialModal, TimeModal } from 'db'

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

		const serialDateInfo = await SerialModal.findOne({
			where: { serialNumber: +serialNumber },
		})
		if (serialDateInfo) {
			// 周期起始时间
			const startTime = serialDateInfo.getDataValue('startTime')
			const endTime = serialDateInfo.getDataValue('endTime')
			// 查询周期内的时间 + 事项记录			
			const weekData = await IssueModal.findAll({
                where: transTwoDateToWhereOptions(startTime, endTime),
				include: [
					{
						model: TimeModal,
                        where: {
                            routineTypeId: [9, 10, 13, 14] // 9-总计 10-入睡时间 13-前端总计 14-LTN时长
                        },
					},
				],
			})

			return NextResponse.json(
				{ startTime, endTime, weekData },
				{ status: 200 }
			)
		}
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export { GET }
