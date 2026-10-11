import { NextRequest, NextResponse } from 'next/server'
import { TedModal, TedRecordModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'
import { denyIfCapabilityOff } from '@lib/capabilities'
import { formatTedIssueLine, toIssueDateKey, withDailyIssueHint } from '@lib/daily-issue-line'
import { syncDailyIssueSnippet } from '@lib/daily-issue-sync'

async function POST(request: NextRequest) {
	try {
		const denied = await denyIfCapabilityOff(request)
		if (denied) return denied
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		const data = body.data
		await TedRecordModal.bulkCreate([{ ...data, userId }], { updateOnDuplicate: ['userId', 'record'] })

		const ted = await TedModal.findOne({ where: { id: data?.tedId, userId } })
		const date = toIssueDateKey(data?.date)
		const synced = await syncDailyIssueSnippet({
			userId,
			date,
			snippet: formatTedIssueLine(data?.tedId, ted?.get('title')),
		})

		return NextResponse.json({
			success: true,
			message: withDailyIssueHint('添加成功', synced, date),
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
