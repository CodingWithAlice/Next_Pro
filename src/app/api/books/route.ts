import {  NextResponse } from 'next/server'
import { BooksRecordModal, BooksTopicRecordModal } from 'db'

async function GET() {
    try {
        const booksData = await BooksRecordModal.findAll({
            include: [
                {
                    model: BooksTopicRecordModal,
                },
            ],
        })
        return NextResponse.json({ booksData: booksData[0] })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export { GET }
