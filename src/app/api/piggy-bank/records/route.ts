import { NextResponse } from 'next/server'
import { PiggyBankPoolModal } from 'db'

async function GET() {
	try {
		const records = await PiggyBankPoolModal.findAll({
			where: { status: 'allocated' },
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
