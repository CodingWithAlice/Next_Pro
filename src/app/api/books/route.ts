import { NextRequest, NextResponse } from 'next/server'
import { BooksRecordModal } from 'db'

async function GET() {
	try {
		const booksData = await BooksRecordModal.findAll()
		return NextResponse.json({
			booksData,
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
		const { readData } = data
		await BooksRecordModal.create(readData, { validate: true })

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
		const body = await request.json()
		const data = body.data
		const { readData } = data
		const { id, ...updateData } = readData
		
		if (!id) {
			return NextResponse.json(
				{
					success: false,
					message: '缺少记录ID',
				},
				{ status: 400 }
			)
		}

		const [affectedCount] = await BooksRecordModal.update(updateData, {
			where: { id },
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
