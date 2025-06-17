import { NextRequest, NextResponse } from 'next/server'
import { BooksRecordModal } from 'db'

async function GET() {
	try {
		const booksData = await BooksRecordModal.findAll()
		return NextResponse.json({
			booksData: booksData[0],
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

		const [issue, created] = await BooksRecordModal.findOrCreate({
			where: { id: readData.id },
			defaults: readData,
		})
		if (!created) {
			issue.set(readData)
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
