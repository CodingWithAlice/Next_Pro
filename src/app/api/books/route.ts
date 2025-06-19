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
		await BooksRecordModal.bulkCreate(readData, { validate: true })

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

export { GET, POST }
