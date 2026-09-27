import { NextRequest, NextResponse } from 'next/server'
import { RunningPlanModal, SportRecordModal } from 'db'
import { Op } from 'sequelize'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

async function GET(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const plans = await RunningPlanModal.findAll({
			where: {
				userId,
				status: { [Op.in]: ['active', 'completed'] },
			},
			order: [['plan_name', 'ASC'], ['start_date', 'DESC']],
		})

		const runningRecords = await SportRecordModal.findAll({
			where: { userId, type: 'running' },
			order: [['date', 'DESC']],
		})

		// 按 plan_name 分组
		const plansByName: { [key: string]: typeof plans } = {}
		plans.forEach((plan) => {
			const planName = plan.get('planName') as string
			if (!plansByName[planName]) {
				plansByName[planName] = []
			}
			plansByName[planName].push(plan)
		})

		// 计算每个计划的进度（按 plan_name 分组）
		const plansWithProgress = Object.keys(plansByName).map((planName) => {
			const planItems = plansByName[planName]
			
			// 获取计划的日期范围（最早的开始日期和最晚的结束日期）
			const startDates = planItems.map((item) => item.get('startDate') as string).sort()
			const endDates = planItems.map((item) => item.get('endDate') as string).sort()
			const planStartDate = startDates[0]
			const planEndDate = endDates[endDates.length - 1]
			
			// 获取计划状态（取第一个子项的状态，或者如果所有子项都是 completed，则为 completed）
			const planStatus = planItems.every((item) => item.get('status') === 'completed') 
				? 'completed' 
				: 'active'
			const sportType = (planItems[0].get('sportType') as string) || 'running'

			// 计算该计划期间的跑步记录（用于计算实际完成情况）
			// 将日期字符串转换为 Date 对象进行比较，确保比较准确
			const planStart = new Date(planStartDate)
			const planEnd = new Date(planEndDate)
			const planRecords = runningRecords.filter((record) => {
				const recordDate = new Date(record.get('date') as string)
				return recordDate >= planStart && recordDate <= planEnd
			})

			// 计算每个子项的完成情况
			let totalTargetTimes = 0
			let totalCompletedTimes = 0
			let totalDistance = 0
			
			const items = planItems.map((item) => {
				const itemDistance = parseFloat(String(item.get('distance'))) || 0
				const itemTarget = (item.get('target') as number) || 0
				const itemCurrent = (item.get('current') as number) || 0
				const itemStartDate = item.get('startDate') as string
				const itemEndDate = item.get('endDate') as string

				// 计算该子项期间的跑步记录（用于计算实际完成情况）
				// 将日期字符串转换为 Date 对象进行比较，确保比较准确
				const itemStart = new Date(itemStartDate)
				const itemEnd = new Date(itemEndDate)
				const itemRecords = planRecords.filter((record) => {
					const recordDate = new Date(record.get('date') as string)
					return recordDate >= itemStart && recordDate <= itemEnd
				})

				// 跑步：目标总距离 = target × distance。撸铁的 distance 不用，进度只看 current / target。
				const itemTotalDistance = sportType === 'running' ? itemTarget * itemDistance : 0

				totalTargetTimes += itemTarget
				totalCompletedTimes += itemCurrent
				totalDistance += itemTotalDistance

				const itemProgress = itemTarget > 0 ? Math.min((itemCurrent / itemTarget) * 100, 100) : 0

				return {
					id: item.get('id'),
					runType: item.get('runType'),
					distance: itemDistance,
					target: itemTarget,
					current: itemCurrent,
					startDate: itemStartDate,
					endDate: itemEndDate,
					targetHeartRate: item.get('targetHeartRate'),
					totalDistance: parseFloat(itemTotalDistance.toFixed(2)),
					progress: parseFloat(itemProgress.toFixed(2)),
					recordsCount: itemRecords.length,
				}
			})

			// 计算整体进度百分比
			const overallProgress = totalTargetTimes > 0 ? Math.min((totalCompletedTimes / totalTargetTimes) * 100, 100) : 0

			return {
				planName,
				sportType,
				status: planStatus,
				startDate: planStartDate,
				endDate: planEndDate,
				totalTargetTimes,
				totalCompletedTimes,
				totalDistance: parseFloat(totalDistance.toFixed(2)),
				overallProgress: parseFloat(overallProgress.toFixed(2)),
				items,
			}
		})

		return NextResponse.json({
			plans: plansWithProgress,
			success: true,
			message: '操作成功',
		})
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{
				success: false,
				message: '操作失败',
				error: (error as Error).message,
			},
			{ status: 500 }
		)
	}
}

export { GET }

