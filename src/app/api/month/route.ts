import { NextRequest, NextResponse } from 'next/server'
import { MonthModal } from 'db'

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const monthId = searchParams.get('monthId')
		
		let monthData;
		
		if (monthId) {
			// 如果提供了 monthId，查询指定 id 的数据
			const result = await MonthModal.findAll({ where: { id: monthId } })
			monthData = result[0]
		} else {
			// 如果没有提供 monthId，查询最大 id 的数据
			monthData = await MonthModal.findOne({
				order: [['id', 'DESC']],
			})
		}
		
		return NextResponse.json({
			monthData: monthData || null,
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
