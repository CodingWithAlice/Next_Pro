import { NextResponse } from 'next/server'
import { PiggyBankJarModal, PiggyBankPoolModal } from 'db'

async function GET() {
	try {
		const jars = await PiggyBankJarModal.findAll({
			order: [['sortOrder', 'ASC'], ['id', 'ASC']],
			raw: true,
		})

		const pendingRows = (await PiggyBankPoolModal.findAll({
			where: { status: 'pending' },
			raw: true,
		})) as unknown as { amount: string | number }[]
		const poolBalance = pendingRows.reduce((s, r) => s + parseFloat(String(r.amount)), 0)

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
