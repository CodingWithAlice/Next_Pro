import { IssueModal } from 'db'
import { NextRequest, NextResponse } from 'next/server'
import { Op } from 'sequelize';


async function POST(request: NextRequest) {
	try {
		const body = await request.json();

        // 日期转换
        const dateObj = new Date(body.date);
        const startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        const endDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59);
      
		const [issue, created] = await IssueModal.findOrCreate({
			where: { date: {
                [Op.between]: [startDate, endDate]
            } },
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
