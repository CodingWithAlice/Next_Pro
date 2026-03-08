import { NextRequest, NextResponse } from 'next/server'
import { MonthModal } from 'db'
import { Op } from 'sequelize'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

async function GET(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const { searchParams } = request.nextUrl
		const monthId = searchParams.get('monthId')
		const flag = searchParams.get('flag')
		const whereBase = { userId }

		if (monthId && flag) {
			const currentId = +monthId
			let targetMonth = null
			if (flag === 'pre') {
				targetMonth = await MonthModal.findOne({
					where: { ...whereBase, id: { [Op.lt]: currentId } },
					order: [['id', 'DESC']],
				})
			} else if (flag === 'next') {
				targetMonth = await MonthModal.findOne({
					where: { ...whereBase, id: { [Op.gt]: currentId } },
					order: [['id', 'ASC']],
				})
			}
			if (targetMonth) {
				const targetId = targetMonth.get('id') as number
				return NextResponse.json({
					monthData: targetMonth,
					currentId: targetId,
					success: true,
					message: '操作成功',
				})
			} else {
				return NextResponse.json({
					monthData: null,
					currentId: null,
					success: true,
					message: '操作成功',
				})
			}
		}
		
		// 如果没有 flag，返回数据
		let monthData;
		let currentId: number | null = null;
		
		if (monthId) {
			const result = await MonthModal.findAll({ where: { ...whereBase, id: monthId } })
			monthData = result[0]
			currentId = +monthId
		} else {
			monthData = await MonthModal.findOne({
				where: whereBase,
				order: [['id', 'DESC']],
			})
			if (monthData) {
				currentId = monthData.get('id') as number
			}
		}
		
		return NextResponse.json({
			monthData: monthData || null,
			currentId: currentId,
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

async function POST(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		const data = body.data
		const [issue, created] = await MonthModal.findOrCreate({
			where: { userId, id: data.id },
			defaults: { ...data, userId },
		})

		if (!created) {
			issue.set(data)
			// 如果已经存在，更新描述
			await issue.save()
		}
		return NextResponse.json({
			success: true,
			message: created ? '观察成功' : '更新成功',
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

export { GET, POST }
