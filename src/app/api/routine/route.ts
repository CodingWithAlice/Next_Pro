import { NextRequest, NextResponse } from 'next/server'
import { RoutineTypeModal } from 'db'

async function GET() {
	try {
		// const { searchParams } = request.nextUrl
		const res = await RoutineTypeModal.findAll()
		return NextResponse.json({
			data: res,
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
		// 以 id 查询更新
		if (Array.isArray(body?.data)) {
			// 以 data 批量插入
			await RoutineTypeModal.bulkCreate(body?.data, { validate: true })
			return NextResponse.json({ success: true, message: '操作成功' })
		}
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

async function PUT(request: NextRequest) {
	try {
		const body = await request.json()
		// 以 id 查询更新
		const { id, type, des } = body
		if (id) {
			await RoutineTypeModal.update(
				{ type, des },
				{
					where: {
						id,
					},
				}
			)
			return NextResponse.json({ success: true, message: '操作成功' })
		}
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

// 删除数据 - 该功能不导出，仅供内部使用
// eslint-disable-next-line
async function DELETE(request: NextRequest) {
	const { searchParams } = request.nextUrl
	const id = searchParams.get('id')
	if (id) {
		// 删除指定id的数据
		await RoutineTypeModal.destroy({
			where: {
				id,
			},
		})
	} else {
		// 清空表
		await RoutineTypeModal.destroy({
			truncate: true,
		})
	}
}

export { GET, POST, PUT }
