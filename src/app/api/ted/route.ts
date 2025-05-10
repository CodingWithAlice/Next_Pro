import {  NextResponse } from 'next/server'
import { TedModal } from 'db'

async function GET() {
    try {
        const tedList = await TedModal.findAll()
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
