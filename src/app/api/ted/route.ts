import { NextResponse } from 'next/server'
import { TedModal, TedRecordModal } from 'db'

async function GET() {
	try {
		const tedList = await TedModal.findAll({
            include:[{
                model: TedRecordModal
            }]
        })
        
		return NextResponse.json({ tedList })
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export { GET }
