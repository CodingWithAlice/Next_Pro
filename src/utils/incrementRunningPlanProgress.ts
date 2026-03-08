import { RunningPlanModal } from 'db'
import { Op } from 'sequelize'

/**
 * 根据跑步记录更新跑步计划进度（按 user_id 隔离）
 * @param date 运动日期 YYYY-MM-DD
 * @param category 跑步类型：匀速跑、变速跑、长跑
 * @param value 距离 km
 * @param userId 用户 id
 */
export async function incrementRunningPlanProgress(
	date: string,
	category: string,
	value: number,
	userId: number
): Promise<void> {
	if (value <= 0) return

	let runType: string
	let matchDistance: number

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
			userId,
			status: 'active',
			runType,
			distance: matchDistance,
			startDate: { [Op.lt]: date },
		},
	})
    
	for (const plan of plans) {
		const current = plan.get('currentTimes') as number
		await plan.update({ currentTimes: (current || 0) + 1 })
	}
}
