import { PiggyBankJarModal, PiggyBankPoolModal } from 'db'

function getAllocateMaxRatio(): number {
	const ratio = parseFloat(process.env.NEXT_PUBLIC_PIGGY_BANK_ALLOCATE_MAX_RATIO ?? '0.35')
	if (Number.isFinite(ratio)) return Math.min(1, Math.max(0, ratio))
	return 0.35
}

const REMARK_POOL_ALLOCATE = '从池分配'
const REMARK_LEGACY_PENDING = 'legacy-pending'
const REMARK_COMPUTED_PENDING = 'computed-pending'

export function isIncomeAllocatedRemark(remarkRaw: unknown): boolean {
	const remark = remarkRaw == null ? '' : String(remarkRaw)
	if (remark === REMARK_POOL_ALLOCATE) return false
	if (remark === REMARK_LEGACY_PENDING) return false
	if (remark === REMARK_COMPUTED_PENDING) return false
	return true
}

export async function computeComputedPendingBalance(userId: number): Promise<number> {
	// 口径：
	// - piggy_bank_pool allocated：作为“所有入账金额”的历史记录（排除 从池分配/内部占位）
	// - piggy_bank_jar balance：当前已被分配到梦想罐的金额
	// - pending：可分配额度 = (入账总额 * 比例) - 罐子余额总额
	const ratio = getAllocateMaxRatio()

	const allocatedRows = (await PiggyBankPoolModal.findAll({
		where: { userId, status: 'allocated' },
		raw: true,
	})) as unknown as { amount: string | number; remark?: string | null }[]
	const totalIncome = allocatedRows.reduce((s, r) => {
		if (!isIncomeAllocatedRemark(r.remark)) return s
		return s + (parseFloat(String(r.amount)) || 0)
	}, 0)

	const jarRows = (await PiggyBankJarModal.findAll({
		where: { userId },
		raw: true,
	})) as unknown as { balance: string | number }[]
	const allocatedToJars = jarRows.reduce((s, r) => s + (parseFloat(String(r.balance)) || 0), 0)

	const maxPool = totalIncome * ratio
	return Math.max(0, maxPool - allocatedToJars)
}

export async function refreshComputedPendingRow(userId: number): Promise<number> {
	const computed = await computeComputedPendingBalance(userId)

	const pendingRows = await PiggyBankPoolModal.findAll({
		where: { userId, status: 'pending' },
		order: [['id', 'ASC']],
	})

	if (pendingRows.length === 0) {
		await PiggyBankPoolModal.create({
			userId,
			amount: computed,
			status: 'pending',
			remark: REMARK_COMPUTED_PENDING,
		})
		return computed
	}

	// 保留最早的一行 pending 作为“计算后的余额行”，其余 pending 行改为 allocated 且置 0，避免干扰余额求和
	const [keep, ...rest] = pendingRows
	await keep.update({ amount: computed, remark: REMARK_COMPUTED_PENDING })
	for (const r of rest) {
		await r.update({ status: 'allocated', amount: 0, remark: REMARK_LEGACY_PENDING })
	}
	return computed
}

