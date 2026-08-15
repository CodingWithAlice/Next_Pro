import { NextRequest, NextResponse } from 'next/server'
import { BooksRecordModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

async function GET(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const { searchParams } = request.nextUrl
		const pageParam = searchParams.get('page')
		const pageSizeParam = searchParams.get('pageSize')
		const where = { userId }
		const order: [string, string][] = [['recent', 'DESC']]

		// 传 page 时分页；不传则返回全量（兼容年度分享等场景）
		if (pageParam != null) {
			const page = Math.max(1, Number(pageParam) || 1)
			const pageSize = Math.min(50, Math.max(1, Number(pageSizeParam) || 20))
			const { rows, count } = await BooksRecordModal.findAndCountAll({
				where,
				order,
				limit: pageSize,
				offset: (page - 1) * pageSize,
			})
			return NextResponse.json({
				booksData: rows,
				total: count,
				page,
				pageSize,
				hasMore: page * pageSize < count,
				success: true,
				message: '操作成功',
			})
		}

		const booksData = await BooksRecordModal.findAll({ where, order })
		return NextResponse.json({
			booksData,
			total: booksData.length,
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
		const { readData } = data
		await BooksRecordModal.create({ ...readData, userId }, { validate: true })

		return NextResponse.json({
			success: true,
			message: '体验 + 1',
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

async function PUT(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		const data = body.data
		const { readData } = data
		const { id, ...updateData } = readData
		if (!id) {
			return NextResponse.json(
				{ success: false, message: '缺少记录ID' },
				{ status: 400 }
			)
		}
		const [affectedCount] = await BooksRecordModal.update(updateData, {
			where: { id, userId },
		})

		if (affectedCount === 0) {
			return NextResponse.json(
				{
					success: false,
					message: '记录不存在或已被删除',
				},
				{ status: 404 }
			)
		}

		return NextResponse.json({
			success: true,
			message: '更新成功',
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

export { GET, POST, PUT }
