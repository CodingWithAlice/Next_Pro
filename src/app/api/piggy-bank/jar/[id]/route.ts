import { NextRequest, NextResponse } from 'next/server'
import { PiggyBankJarModal, PiggyBankPoolModal } from 'db'

async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		const body = await request.json()
		const data = body.data ?? body
		const { name, monthlyRepayment, targetAmount, proportion } = data

		const jar = await PiggyBankJarModal.findByPk(id)
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

		await jar.update(updateData)

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
		const { id } = await params
		const body = await request.json()
		const data = body.data ?? body
		const action = data?.action ?? body?.action

		if (action === 'abandon') {
			const jar = await PiggyBankJarModal.findByPk(id)
			if (!jar) {
				return NextResponse.json(
					{ success: false, message: '罐子不存在' },
					{ status: 404 }
				)
			}
			const balance = parseFloat(String(jar.get('balance')))
			if (balance > 0) {
				await PiggyBankPoolModal.create({
					amount: balance,
					status: 'pending',
					remark: `放弃罐子：${jar.get('name')}`,
				})
			}
			await jar.update({ balance: 0, status: 'abandoned' })
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
