import { NextRequest, NextResponse } from 'next/server'
import { PiggyBankJarModal, PiggyBankPoolModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

type PoolRow = { id: number; amount: string | number }

async function POST(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		const data = body.data ?? body
		const { allocations } = data

		if (!Array.isArray(allocations) || allocations.length === 0) {
			return NextResponse.json(
				{ success: false, message: '请指定要分配的罐子及金额' },
				{ status: 400 }
			)
		}

		const totalAllocate = allocations.reduce(
			(s: number, a: { amount: number }) => s + parseFloat(String(a.amount)),
			0
		)
		if (totalAllocate <= 0) {
			return NextResponse.json(
				{ success: false, message: '分配总额须大于0' },
				{ status: 400 }
			)
		}

		const pendingRows = (await PiggyBankPoolModal.findAll({
			where: { userId, status: 'pending' },
			order: [['id', 'ASC']],
		})) as unknown as PoolRow[]
		const poolBalance = pendingRows.reduce((s, r) => s + parseFloat(String(r.amount)), 0)
		if (totalAllocate > poolBalance) {
			return NextResponse.json(
				{
					success: false,
					message: `待分配池余额不足，当前 ¥${poolBalance.toFixed(2)}`,
				},
				{ status: 400 }
			)
		}

		// 先计算每个罐子的实际上限，得到实际可分配总额，避免分配超过罐子所需
		const cappedAllocations: { jarId: number; toAdd: number; jar: Awaited<ReturnType<typeof PiggyBankJarModal.findOne>> }[] = []
		let actualTotalAllocate = 0
		for (const a of allocations) {
			const jar = await PiggyBankJarModal.findOne({ where: { id: a.jarId, userId } })
			if (jar && a.amount > 0 && jar.get('status') === 'active') {
				const amt = parseFloat(String(a.amount))
				const currentBalance = parseFloat(String(jar.get('balance')))
				const targetRaw = jar.get('targetAmount') != null ? parseFloat(String(jar.get('targetAmount'))) : 0
				const monthly = jar.get('monthlyRepayment') != null ? parseFloat(String(jar.get('monthlyRepayment'))) : 0
				const target = targetRaw > 0 ? targetRaw : monthly > 0 ? monthly * 12 : 0
				const cap = target > 0 ? Math.max(0, target - currentBalance) : Infinity
				const toAdd = Math.min(amt, cap)
				if (toAdd > 0) {
					cappedAllocations.push({ jarId: a.jarId, toAdd, jar })
					actualTotalAllocate += toAdd
				}
			}
		}
		for (const { jar, toAdd } of cappedAllocations) {
			const currentBalance = parseFloat(String(jar.get('balance')))
			const newBalance = currentBalance + toAdd
			const targetRaw = jar.get('targetAmount') != null ? parseFloat(String(jar.get('targetAmount'))) : 0
			const monthly = jar.get('monthlyRepayment') != null ? parseFloat(String(jar.get('monthlyRepayment'))) : 0
			const target = targetRaw > 0 ? targetRaw : monthly > 0 ? monthly * 12 : 0
			const shouldClose = target > 0 && newBalance >= target
			await jar.update({ balance: newBalance, ...(shouldClose ? { status: 'completed' as const } : {}) })
		}

		// 只从池中扣除实际分配到罐子的金额
		let remain = actualTotalAllocate
		for (const row of pendingRows) {
			if (remain <= 0) break
			const rowAmt = parseFloat(String(row.amount))
			const poolRow = await PiggyBankPoolModal.findOne({ where: { id: row.id, userId } })
			if (!poolRow) continue
			if (rowAmt <= remain) {
				await poolRow.update({ status: 'allocated', amount: rowAmt, remark: '从池分配' })
				remain -= rowAmt
			} else {
				await PiggyBankPoolModal.create({ userId, amount: rowAmt - remain, status: 'pending' })
				await poolRow.update({ status: 'allocated', amount: remain, remark: '从池分配' })
				remain = 0
			}
		}

		return NextResponse.json({
			success: true,
			message: '分配成功',
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

export { POST }
