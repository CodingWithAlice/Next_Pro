import { NextRequest, NextResponse } from 'next/server'
import { PiggyBankJarModal, PiggyBankPoolModal } from 'db'

type JarRow = { id: number; name: string; balance: string | number; monthlyRepayment?: string | number | null; targetAmount?: string | number | null; status: string; sortOrder: number }

async function POST(request: NextRequest) {
	try {
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

		if (toPool) {
			let poolRow = await PiggyBankPoolModal.findOne()
			if (!poolRow) {
				poolRow = await PiggyBankPoolModal.create({ balance: 0 })
			}
			const poolBalance = parseFloat(String(poolRow.get('balance')))
			await poolRow.update({ balance: poolBalance + totalAmount })
			return NextResponse.json({
				success: true,
				message: '已放入待分配池',
			})
		}

		const activeJars = (await PiggyBankJarModal.findAll({
			where: { status: 'active' },
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
			if (monthlyTotal > totalAmount) {
				return NextResponse.json({
					success: false,
					message: `月还款目标合计 ¥${monthlyTotal.toFixed(2)} 大于输入金额，请调整`,
				})
			}
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

			return NextResponse.json({
				success: true,
				suggestion,
				message: '分配建议已生成',
			})
		}

		const sumAllocated = allocations.reduce((s: number, a: { amount: number }) => s + parseFloat(String(a.amount)), 0)
		if (sumAllocated > totalAmount * 0.35) {
			return NextResponse.json(
				{ success: false, message: '金额超过了薪资的 35%' },
				{ status: 400 }
			)
		}

		for (const a of allocations) {
			const jar = await PiggyBankJarModal.findByPk(a.jarId)
			if (jar && a.amount > 0) {
				const amt = parseFloat(String(a.amount))
				const currentBalance = parseFloat(String(jar.get('balance')))
				await jar.update({ balance: currentBalance + amt })
			}
		}

		await PiggyBankPoolModal.create({
			amount: totalAmount,
			status: 'allocated',
			remark: remark != null ? String(remark).trim() || null : null,
		})

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
