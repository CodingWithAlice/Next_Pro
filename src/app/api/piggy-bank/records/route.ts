import { NextRequest, NextResponse } from 'next/server'
import { PiggyBankPoolModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'
import { isIncomeAllocatedRemark } from '../pool-balance'

async function GET(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const rows = await PiggyBankPoolModal.findAll({
			where: { userId, status: 'allocated' },
			order: [['createdAt', 'DESC']],
			limit: 50,
			raw: true,
		})
		const records = (rows as unknown as { remark?: string | null }[]).filter((r) => isIncomeAllocatedRemark(r.remark))

		return NextResponse.json({
			records,
			success: true,
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
