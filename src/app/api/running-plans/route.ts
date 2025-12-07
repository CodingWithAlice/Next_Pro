import { NextRequest, NextResponse } from 'next/server'
import { RunningPlanModal, SportRecordModal } from 'db'
import { Op } from 'sequelize'

async function GET(request: NextRequest) {
	try {
		// 获取所有活跃的跑步计划
		const plans = await RunningPlanModal.findAll({
			where: {
				status: 'active',
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

			// 计算该计划期间的跑步记录
			const planRecords = runningRecords.filter((record: any) => {
				const recordDate = record.get('date')
				return recordDate >= planStartDate && recordDate <= planEndDate
			})

			// 计算每个子项的完成情况
			let totalTargetTimes = 0
			let totalCompletedTimes = 0
			let totalDistance = 0
			
			const items = planItems.map((item: any) => {
				const itemDistance = parseFloat(item.get('distance')) || 0
				const itemTargetTimes = item.get('targetTimes') || 0
				const itemStartDate = item.get('startDate')
				const itemEndDate = item.get('endDate')

				// 计算该子项期间的跑步记录
				const itemRecords = planRecords.filter((record: any) => {
					const recordDate = record.get('date')
					return recordDate >= itemStartDate && recordDate <= itemEndDate
				})

				// 统计完成次数（匹配计划距离的记录）
				let completedTimes = 0
				itemRecords.forEach((record: any) => {
					const recordDistance = parseFloat(record.get('value')) || 0
					// 如果记录距离等于或大于计划距离，算作完成一次
					if (recordDistance >= itemDistance) {
						completedTimes++
					}
				})

				// 计算子项的总距离
				const itemTotalDistance = itemRecords.reduce((sum: number, record: any) => {
					return sum + (parseFloat(record.get('value')) || 0)
				}, 0)

				// 累加总目标次数和完成次数
				totalTargetTimes += itemTargetTimes
				totalCompletedTimes += completedTimes
				totalDistance += itemTotalDistance

				// 计算子项进度
				const itemProgress = itemTargetTimes > 0 ? Math.min((completedTimes / itemTargetTimes) * 100, 100) : 0

				return {
					id: item.get('id'),
					runType: item.get('runType'),
					distance: itemDistance,
					targetTimes: itemTargetTimes,
					currentTimes: completedTimes,
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

