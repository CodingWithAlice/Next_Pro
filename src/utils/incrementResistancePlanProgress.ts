import { RunningPlanModal } from 'db'
import { Op } from 'sequelize'
import { splitResistanceVolume } from './resistanceVolume'

/**
 * 新的抗阻记录写入进行中的撸铁计划。
 * category 是正文解析出的部位（臀腿、胸肩背、全身、背腿），不是日程里的「运动」。
 * 全身、背腿按上肢 30%、下肢 70%，余数归下肢。只在新记录上累加 current。
 */
export async function incrementResistancePlanProgress(
	date: string,
	category: string,
	value: number,
	userId: number
): Promise<void> {
	const split = splitResistanceVolume(category, value)
	if (!split) return

	const plans = await RunningPlanModal.findAll({
		where: {
			userId,
			sportType: 'resistance',
			status: 'active',
			runType: { [Op.in]: ['上肢', '下肢'] },
			startDate: { [Op.lte]: date },
			[Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: date } }],
		},
	})

	for (const plan of plans) {
		const part = plan.get('runType') as string
		const add = part === '上肢' ? split.upper : split.lower
		if (add <= 0) continue
		const current = (plan.get('current') as number) || 0
		await plan.update({ current: current + add })
	}
}
