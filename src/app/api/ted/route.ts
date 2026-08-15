import { NextRequest, NextResponse } from 'next/server'
import { TedModal, TedRecordModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

async function GET(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const where = { userId }
		const tedList = await TedModal.findAll({
			where,
			include: [{ model: TedRecordModal, where, required: false }],
		})
		const tedRecord = await TedRecordModal.findAll({ where })

		return NextResponse.json({
			tedList,
			recentTedRecord: tedRecord?.[tedRecord?.length - 1],
		})
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

async function POST(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		const data = body.data
		const title = typeof data?.title === 'string' ? data.title.trim() : ''
		if (!title) {
			return NextResponse.json(
				{ success: false, message: '请填写 TED 标题' },
				{ status: 400 }
			)
		}

		const ted = await TedModal.create({
			userId,
			title,
			times: data?.times ?? '0',
		})

		return NextResponse.json({
			success: true,
			message: '添加成功',
			ted,
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
