import { NextRequest, NextResponse } from 'next/server'
import { PiggyBankJarModal, PiggyBankPoolModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'
import { refreshComputedPendingRow } from '../../pool-balance'

async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const { id } = await params
		const body = await request.json()
		const data = body.data ?? body
		const { name, monthlyRepayment, targetAmount, actualConsumption } = data

		const jar = await PiggyBankJarModal.findOne({ where: { id, userId } })
		if (!jar) {
			return NextResponse.json(
				{ success: false, message: '罐子不存在' },
				{ status: 404 }
			)
		}

		const updateData: Record<string, unknown> = {}
		if (name !== undefined) updateData.name = String(name).trim()
		if (monthlyRepayment !== undefined) updateData.monthlyRepayment = monthlyRepayment == null ? null : parseFloat(monthlyRepayment)
		if (targetAmount !== undefined) updateData.targetAmount = targetAmount == null ? null : parseFloat(targetAmount)

		// 按真实消费调整罐子：罐子创建早于消费，还款结束前消费已发生时使用
		if (actualConsumption !== undefined && actualConsumption !== null && actualConsumption !== '') {
			const real = parseFloat(actualConsumption)
			if (isNaN(real) || real < 0) {
				return NextResponse.json(
					{ success: false, message: '真实消费须为非负数字' },
					{ status: 400 }
				)
			}
			const currentTarget = jar.get('targetAmount') != null ? parseFloat(String(jar.get('targetAmount'))) : 0
			const balance = parseFloat(String(jar.get('balance')))
			const status = jar.get('status')

			updateData.targetAmount = real
			// 实际消费大于原目标：提高目标并重新开启罐子以便继续还款
			if (real > currentTarget) {
				updateData.status = 'active'
			} else if (balance >= real) {
				// 余额已满足真实消费：罐子满额关闭
				updateData.status = 'completed'
			}
			// 实际消费小于原目标：多分配的金额退回待分配池
			if (real < currentTarget && balance > real) {
				// pending 会由公式自动变大，这里只需要把罐子余额调回真实消费
				updateData.balance = real
			}
		}

		await jar.update(updateData)
		await refreshComputedPendingRow(userId)

		return NextResponse.json({
			success: true,
			message: '更新成功',
			data: jar,
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

async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const { id } = await params
		const body = await request.json()
		const data = body.data ?? body
		const action = data?.action ?? body?.action

		if (action === 'abandon') {
			const jar = await PiggyBankJarModal.findOne({ where: { id, userId } })
			if (!jar) {
				return NextResponse.json(
					{ success: false, message: '罐子不存在' },
					{ status: 404 }
				)
			}
			await jar.update({ balance: 0, status: 'abandoned' })
			await refreshComputedPendingRow(userId)
			return NextResponse.json({
				success: true,
				message: '已放弃，资金已进入待分配池',
			})
		}

		return NextResponse.json(
			{ success: false, message: '未知操作' },
			{ status: 400 }
		)
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

export { PUT, POST }
