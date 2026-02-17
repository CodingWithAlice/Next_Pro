import { NextRequest, NextResponse } from 'next/server'
import { PiggyBankJarModal, PiggyBankPoolModal } from 'db'

async function POST(request: NextRequest) {
	try {
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

		let poolRow = await PiggyBankPoolModal.findOne()
		if (!poolRow) {
			poolRow = await PiggyBankPoolModal.create({ balance: 0 })
		}
		const poolBalance = parseFloat(String(poolRow.get('balance')))
		if (totalAllocate > poolBalance) {
			return NextResponse.json(
				{
					success: false,
					message: `待分配池余额不足，当前 ¥${poolBalance.toFixed(2)}`,
				},
				{ status: 400 }
			)
		}

		for (const a of allocations) {
			const jar = await PiggyBankJarModal.findByPk(a.jarId)
			if (jar && a.amount > 0 && jar.get('status') === 'active') {
				const amt = parseFloat(String(a.amount))
				const currentBalance = parseFloat(String(jar.get('balance')))
				await jar.update({ balance: currentBalance + amt })
			}
		}

		await poolRow.update({ balance: poolBalance - totalAllocate })

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
