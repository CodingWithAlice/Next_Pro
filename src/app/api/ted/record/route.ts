import { NextRequest, NextResponse } from 'next/server'
import { TedRecordModal } from 'db'

async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const data = body.data
		await TedRecordModal.bulkCreate([data], {updateOnDuplicate: ['record']})
		
		return NextResponse.json({
			success: true,
			message: '添加成功',
		})
	} catch (error) {
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
