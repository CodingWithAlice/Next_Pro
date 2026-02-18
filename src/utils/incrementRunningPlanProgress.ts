import { RunningPlanModal } from 'db'
import { Op } from 'sequelize'

/**
 * 根据跑步记录更新跑步计划进度
 * - 距离 4km 或 5km：按 category 分类（匀速跑、变速跑）
 * - 距离 > 5km：统一为长跑
 * @param date 运动日期 YYYY-MM-DD
 * @param category 跑步类型：匀速跑、变速跑、长跑
 * @param value 距离 km
 */
export async function incrementRunningPlanProgress(
	date: string,
	category: string,
	value: number
): Promise<void> {
	if (value <= 0) return

	let runType: string
	let matchDistance: number

    console.log('1', {value});
	if (value > 5) {
		runType = '长跑'
		matchDistance = Math.round(value)
	} else if (value === 4 || value === 5) {
		runType = category === '变速跑' ? '变速跑' : '匀速跑'
		matchDistance = value
	} else {
		return
	}

	const plans = await RunningPlanModal.findAll({
		where: {
			status: 'active',
			runType,
			distance: matchDistance,
			startDate: { [Op.lt]: date },
		},
	})

    console.log('1 🌹', {plans, matchDistance, runType});
    
	for (const plan of plans) {
		const current = plan.get('currentTimes') as number
		await plan.update({ currentTimes: (current || 0) + 1 })
	}
}
