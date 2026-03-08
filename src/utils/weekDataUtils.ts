import { WeekDataProps } from '@/api/deepseek/route'
import { IssueModal, SerialModal, TimeModal } from 'db'
import { transTwoDateToWhereOptions } from 'utils'

export async function GetWeekData(serialNumber: string, userId: number) {
	const serialDateInfo = await SerialModal.findOne({
		where: { userId, serialNumber: +serialNumber },
	})
	if (!serialDateInfo) {
		throw new Error('当前周期无数据')
	}
	const startTime = serialDateInfo.getDataValue('startTime')
	const endTime = serialDateInfo.getDataValue('endTime')
	const whereBase = {
		...transTwoDateToWhereOptions(startTime, endTime),
		userId,
	}
	const weekData = (await IssueModal.findAll({
		where: whereBase,
		include: [
			{
				model: TimeModal,
				where: {
					userId,
					routineTypeId: [9, 10, 13, 14, 16, 17, 18],
				},
			},
		],
		order: [['date', 'ASC']],
	})) as unknown as WeekDataProps[]
	return { startTime, endTime, weekData }
}
