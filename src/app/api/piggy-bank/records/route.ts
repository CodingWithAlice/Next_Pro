import { NextRequest, NextResponse } from 'next/server'
import { PiggyBankPoolModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

async function GET(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const records = await PiggyBankPoolModal.findAll({
			where: { userId, status: 'allocated' },
			order: [['createdAt', 'DESC']],
			limit: 50,
			raw: true,
		})

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
