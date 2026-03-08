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

export { GET }
