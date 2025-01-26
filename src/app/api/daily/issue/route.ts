import { IssueModal } from 'db'
import { NextRequest, NextResponse } from 'next/server'
import { transDateToWhereOptions } from 'utils';


async function POST(request: NextRequest) {
	try {
		const body = await request.json();

        // 日期转换
        const option = transDateToWhereOptions(body.date);
      
		const [issue, created] = await IssueModal.findOrCreate({
			...option,
			defaults: body,
		})
		if (!created) {
            issue.set(body);
			// 如果已经存在，更新描述
			await issue.save()
		}
		return NextResponse.json({ success: true, message: created ? '观察成功' : '更新成功' })
	} catch (e) {
		console.error(e)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export { POST }
