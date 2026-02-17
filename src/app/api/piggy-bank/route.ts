import { NextResponse } from 'next/server'
import { PiggyBankJarModal, PiggyBankPoolModal } from 'db'

async function GET() {
	try {
		const jars = await PiggyBankJarModal.findAll({
			order: [['sortOrder', 'ASC'], ['id', 'ASC']],
			raw: true,
		})

		let poolBalance = 0
		const poolRow = await PiggyBankPoolModal.findOne({ raw: true })
		if (poolRow && typeof poolRow === 'object' && 'balance' in poolRow) {
			poolBalance = parseFloat(String(poolRow.balance))
		} else {
			await PiggyBankPoolModal.create({ balance: 0 })
		}

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
