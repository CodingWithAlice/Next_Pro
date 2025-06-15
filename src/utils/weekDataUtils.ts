import { WeekDataProps } from "@/api/deepseek/route"
import { IssueModal, SerialModal, TimeModal } from "db"
import { transTwoDateToWhereOptions } from "utils"

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
					routineTypeId: [9, 10, 13, 14, 16, 17, 18], // 9-总计 10-入睡时间 13-前端总计 14-总时长 16-LTN时长 17-运动 18-工作
				},
			},
		]
	})) as unknown as WeekDataProps[]
	return { startTime, endTime, weekData }
}
