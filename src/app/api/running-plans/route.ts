import { NextRequest, NextResponse } from 'next/server'
import { RunningPlanModal, SportRecordModal } from 'db'
import { Op } from 'sequelize'

async function GET(request: NextRequest) {
	try {
		// 获取所有跑步计划（包括 active 和 completed）
		const plans = await RunningPlanModal.findAll({
			where: {
				status: {
					[Op.in]: ['active', 'completed'],
				},
			},
			order: [['plan_name', 'ASC'], ['start_date', 'DESC']],
		})

		// 获取所有跑步记录
		const runningRecords = await SportRecordModal.findAll({
			where: {
				type: 'running',
			},
			order: [['date', 'DESC']],
		})

		// 按 plan_name 分组
		const plansByName: { [key: string]: any[] } = {}
		plans.forEach((plan: any) => {
			const planName = plan.get('planName')
			if (!plansByName[planName]) {
				plansByName[planName] = []
			}
			plansByName[planName].push(plan)
		})

		// 计算每个计划的进度（按 plan_name 分组）
		const plansWithProgress = Object.keys(plansByName).map((planName) => {
			const planItems = plansByName[planName]
			
			// 获取计划的日期范围（最早的开始日期和最晚的结束日期）
			const startDates = planItems.map((item: any) => item.get('startDate')).sort()
			const endDates = planItems.map((item: any) => item.get('endDate')).sort()
			const planStartDate = startDates[0]
			const planEndDate = endDates[endDates.length - 1]
			
			// 获取计划状态（取第一个子项的状态，或者如果所有子项都是 completed，则为 completed）
			const planStatus = planItems.every((item: any) => item.get('status') === 'completed') 
				? 'completed' 
				: 'active'

			// 计算该计划期间的跑步记录（用于计算实际完成情况）
			// 将日期字符串转换为 Date 对象进行比较，确保比较准确
			const planStart = new Date(planStartDate)
			const planEnd = new Date(planEndDate)
			const planRecords = runningRecords.filter((record: any) => {
				const recordDate = new Date(record.get('date'))
				return recordDate >= planStart && recordDate <= planEnd
			})

			// 计算每个子项的完成情况
			let totalTargetTimes = 0
			let totalCompletedTimes = 0
			let totalDistance = 0
			
			const items = planItems.map((item: any) => {
				const itemDistance = parseFloat(item.get('distance')) || 0
				const itemTargetTimes = item.get('targetTimes') || 0
				const itemCurrentTimes = item.get('currentTimes') || 0 // 直接使用数据库中的 currentTimes
				const itemStartDate = item.get('startDate')
				const itemEndDate = item.get('endDate')

				// 计算该子项期间的跑步记录（用于计算实际完成情况）
				// 将日期字符串转换为 Date 对象进行比较，确保比较准确
				const itemStart = new Date(itemStartDate)
				const itemEnd = new Date(itemEndDate)
				const itemRecords = planRecords.filter((record: any) => {
					const recordDate = new Date(record.get('date'))
					return recordDate >= itemStart && recordDate <= itemEnd
				})

				// 计算子项的目标总距离（计划需要完成的总距离 = target_times × distance）
				const itemTotalDistance = itemTargetTimes * itemDistance

				// 累加总目标次数和完成次数（使用数据库中的 currentTimes）
				totalTargetTimes += itemTargetTimes
				totalCompletedTimes += itemCurrentTimes
				totalDistance += itemTotalDistance

				// 计算子项进度（使用数据库中的 currentTimes）
				const itemProgress = itemTargetTimes > 0 ? Math.min((itemCurrentTimes / itemTargetTimes) * 100, 100) : 0

				return {
					id: item.get('id'),
					runType: item.get('runType'),
					distance: itemDistance,
					targetTimes: itemTargetTimes,
					currentTimes: itemCurrentTimes, // 直接使用数据库中的 currentTimes
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

