import { NextRequest, NextResponse } from 'next/server'
import { MonthModal } from 'db'
import { Op } from 'sequelize'

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const monthId = searchParams.get('monthId')
		const flag = searchParams.get('flag') // 'pre' 或 'next'
		
		// 如果提供了 flag，直接返回对应方向的完整数据
		if (monthId && flag) {
			const currentId = +monthId
			let targetMonth = null
			
			if (flag === 'pre') {
				// 查询上一个阶段（id 更小，更早）
				targetMonth = await MonthModal.findOne({
					where: {
						id: {
							[Op.lt]: currentId
						}
					},
					order: [['id', 'DESC']], // 取小于当前 id 的最大值
				})
			} else if (flag === 'next') {
				// 查询下一个阶段（id 更大，更晚）
				targetMonth = await MonthModal.findOne({
					where: {
						id: {
							[Op.gt]: currentId
						}
					},
					order: [['id', 'ASC']], // 取大于当前 id 的最小值
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
			// 如果提供了 monthId，查询指定 id 的数据
			const result = await MonthModal.findAll({ where: { id: monthId } })
			monthData = result[0]
			currentId = +monthId
		} else {
			// 如果没有提供 monthId，查询最大 id 的数据（最新）
			monthData = await MonthModal.findOne({
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
		const body = await request.json()
		const data = body.data
		const [issue, created] = await MonthModal.findOrCreate({
			where: { id: data.id },
			defaults: data,
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
