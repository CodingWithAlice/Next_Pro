import {  NextResponse } from 'next/server'
import { SerialModal } from 'db'

async function GET() {
    try {
        const serialData = await SerialModal.findAll()
        return NextResponse.json({ serialData })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export { GET }
