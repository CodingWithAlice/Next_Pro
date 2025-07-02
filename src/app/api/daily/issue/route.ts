import { IssueModal } from 'db'
import { NextRequest, NextResponse } from 'next/server'
import { transOneDateToWhereOptions } from 'utils'

async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const data = body.data
		// 日期转换
		const option = transOneDateToWhereOptions(data.date)
		const [issue, created] = await IssueModal.findOrCreate({
			where: option,
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

export { POST }
