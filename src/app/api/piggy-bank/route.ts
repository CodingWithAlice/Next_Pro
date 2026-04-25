import { NextRequest, NextResponse } from 'next/server'
import { PiggyBankJarModal, PiggyBankPoolModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'
import { refreshComputedPendingRow } from './pool-balance'

async function GET(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const jars = await PiggyBankJarModal.findAll({
			where: { userId },
			order: [['sortOrder', 'ASC'], ['id', 'ASC']],
			raw: true,
		})

		// 进入页面时刷新 pending，使前端仍旧读取 pending 求和即可拿到最新值
		await refreshComputedPendingRow(userId)
		const pendingRows = (await PiggyBankPoolModal.findAll({
			where: { userId, status: 'pending' },
			raw: true,
		})) as unknown as { amount: string | number }[]
		const poolBalance = pendingRows.reduce((s, r) => s + (parseFloat(String(r.amount)) || 0), 0)

		return NextResponse.json({
			jars,
			poolBalance,
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
