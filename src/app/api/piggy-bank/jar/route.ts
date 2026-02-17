import { NextRequest, NextResponse } from 'next/server'
import { PiggyBankJarModal } from 'db'

async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const data = body.data ?? body
		const { name, monthlyRepayment, targetAmount, monthlyRepaymentAmount, planMonths, totalAdvance } = data

		if (!name) {
			return NextResponse.json(
				{ success: false, message: '罐子名称不能为空' },
				{ status: 400 }
			)
		}

		let monthlyRepaymentVal: number | null = null
		if (monthlyRepayment != null && monthlyRepayment !== '') {
			monthlyRepaymentVal = parseFloat(monthlyRepayment)
		} else if (monthlyRepaymentAmount != null && monthlyRepaymentAmount !== '') {
			monthlyRepaymentVal = parseFloat(monthlyRepaymentAmount)
		} else if (planMonths != null && totalAdvance != null && planMonths > 0) {
			monthlyRepaymentVal = parseFloat(totalAdvance) / parseInt(planMonths, 10)
		}

		const maxOrder = await PiggyBankJarModal.max('sortOrder')
		const jar = await PiggyBankJarModal.create({
			name: String(name).trim(),
			balance: 0,
			monthlyRepayment: monthlyRepaymentVal,
			targetAmount: targetAmount != null ? parseFloat(targetAmount) : null,
			status: 'active',
			sortOrder: (maxOrder ?? 0) + 1,
		})

		return NextResponse.json({
			success: true,
			message: '添加成功',
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

export { POST }
