import { NextRequest, NextResponse } from 'next/server'
import { PiggyBankJarModal, PiggyBankPoolModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'
import { refreshComputedPendingRow } from '../pool-balance'

type JarRow = { id: number; name: string; balance: string | number; monthlyRepayment?: string | number | null; targetAmount?: string | number | null; status: string; sortOrder: number }

async function POST(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		const data = body.data ?? body
		const { amount, suggestOnly, allocations, toPool, remark } = data

		const totalAmount = parseFloat(amount)
		if (isNaN(totalAmount) || totalAmount <= 0) {
			return NextResponse.json(
				{ success: false, message: '金额必须大于0' },
				{ status: 400 }
			)
		}

		const maxRatio = Math.min(1, Math.max(0, parseFloat(process.env.NEXT_PUBLIC_PIGGY_BANK_ALLOCATE_MAX_RATIO ?? '0.35') || 0.35))
		if (toPool) {
			// 入账记录写入 allocated，pending 由公式刷新得到
			await PiggyBankPoolModal.create({
				userId,
				amount: totalAmount,
				status: 'allocated',
				remark: remark != null ? String(remark).trim() || null : null,
			})
			await refreshComputedPendingRow(userId)
			return NextResponse.json({
				success: true,
				message: '已放入待分配池',
			})
		}

		const activeJars = (await PiggyBankJarModal.findAll({
			where: { userId, status: 'active' },
			order: [['sortOrder', 'ASC'], ['id', 'ASC']],
			raw: true,
		})) as unknown as JarRow[]

		if (activeJars.length === 0) {
			return NextResponse.json({
				success: true,
				suggestion: [],
				message: '暂无活跃罐子，请先添加',
			})
		}

		const hasMonthlyRepayment = activeJars.filter(
			(j) => j.monthlyRepayment != null && parseFloat(String(j.monthlyRepayment)) > 0
		)
		const others = activeJars.filter(
			(j) => j.monthlyRepayment == null || parseFloat(String(j.monthlyRepayment)) <= 0
		)

		let suggestion: { jarId: number; jarName: string; amount: number; proportion: number; monthlyRepayment?: number }[] = []
		let remaining = totalAmount

		if (suggestOnly || !allocations || allocations.length === 0) {
			const monthlyTotal = hasMonthlyRepayment.reduce((s, j) => s + parseFloat(String(j.monthlyRepayment)), 0)
			// 分配建议不限制月还合计是否大于输入金额：收入不足时按比例分配给月还罐子，其余罐子为 0
			if (monthlyTotal > totalAmount) {
				// 全部输入金额按比例分给月还罐子
				hasMonthlyRepayment.forEach((j) => {
					const targetAmt = parseFloat(String(j.monthlyRepayment))
					const amt = (targetAmt / monthlyTotal) * totalAmount
					suggestion.push({
						jarId: j.id,
						jarName: j.name,
						amount: amt,
						proportion: (amt / totalAmount) * 100,
						monthlyRepayment: targetAmt,
					})
				})
				// 其他罐子本次不分配
			} else {
				remaining = totalAmount - monthlyTotal

				hasMonthlyRepayment.forEach((j) => {
					const amt = parseFloat(String(j.monthlyRepayment))
					suggestion.push({
						jarId: j.id,
						jarName: j.name,
						amount: amt,
						proportion: (amt / totalAmount) * 100,
						monthlyRepayment: amt,
					})
				})

				if (others.length > 0 && remaining > 0) {
					const evenAmount = remaining / others.length
					others.forEach((j) => {
						suggestion.push({
							jarId: j.id,
							jarName: j.name,
							amount: evenAmount,
							proportion: (evenAmount / totalAmount) * 100,
						})
					})
				}
			}

			// 建议总额限制在输入金额的 config.env maxAllowed 比例以内，与确认时的校验一致
			const maxAllowed = totalAmount * maxRatio
			let suggestedTotal = suggestion.reduce((s, i) => s + i.amount, 0)
			if (suggestedTotal > maxAllowed && suggestedTotal > 0) {
				const scale = maxAllowed / suggestedTotal
				suggestion = suggestion.map((i) => ({
					...i,
					amount: i.amount * scale,
					proportion: (i.amount * scale / totalAmount) * 100,
				}))
				suggestedTotal = maxAllowed
			}
			// 单罐建议不超过罐子剩余所需（目标 - 当前余额）
			const jarMap = new Map(activeJars.map((j) => [j.id, j]))
			suggestion = suggestion.map((i) => {
				const j = jarMap.get(i.jarId)
				if (!j) return i
				const balance = parseFloat(String(j.balance)) || 0
				const targetRaw = j.targetAmount != null ? parseFloat(String(j.targetAmount)) : 0
				const monthly = j.monthlyRepayment != null ? parseFloat(String(j.monthlyRepayment)) : 0
				const target = targetRaw > 0 ? targetRaw : monthly > 0 ? monthly * 12 : 0
				const cap = target > 0 ? Math.max(0, target - balance) : Infinity
				const amount = Math.min(i.amount, cap)
				return { ...i, amount, proportion: totalAmount > 0 ? (amount / totalAmount) * 100 : 0 }
			})

			return NextResponse.json({
				success: true,
				suggestion,
				message: '分配建议已生成',
			})
		}

		const sumAllocated = allocations.reduce((s: number, a: { amount: number }) => s + parseFloat(String(a.amount)), 0)
		if (sumAllocated > totalAmount * maxRatio) {
			const pct = Math.round(maxRatio * 100)
			return NextResponse.json(
				{ success: false, message: `金额超过了薪资的 ${pct}%` },
				{ status: 400 }
			)
		}

		let totalAdded = 0
		for (const a of allocations) {
			const jar = await PiggyBankJarModal.findOne({ where: { id: a.jarId, userId } })
			if (jar && a.amount > 0) {
				const amt = parseFloat(String(a.amount))
				const currentBalance = parseFloat(String(jar.get('balance')))
				const targetRaw = jar.get('targetAmount') != null ? parseFloat(String(jar.get('targetAmount'))) : 0
				const monthly = jar.get('monthlyRepayment') != null ? parseFloat(String(jar.get('monthlyRepayment'))) : 0
				const target = targetRaw > 0 ? targetRaw : monthly > 0 ? monthly * 12 : 0
				const cap = target > 0 ? Math.max(0, target - currentBalance) : Infinity
				const toAdd = Math.min(amt, cap)
				if (toAdd <= 0) continue
				totalAdded += toAdd
				const newBalance = currentBalance + toAdd
				const shouldClose = target > 0 && newBalance >= target
				await jar.update({ balance: newBalance, ...(shouldClose ? { status: 'completed' as const } : {}) })
			}
		}
		await PiggyBankPoolModal.create({
			userId,
			amount: totalAmount,
			status: 'allocated',
			remark: remark != null ? String(remark).trim() || null : null,
		})
		// 分配后刷新 pending
		await refreshComputedPendingRow(userId)

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
