import { NextResponse } from 'next/server'
import { TedModal, TedRecordModal } from 'db'

async function GET() {
	try {
		const tedList = await TedModal.findAll({
			include: [
				{
					model: TedRecordModal,
				},
			],
		})

		const tedRecord = await TedRecordModal.findAll()

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
