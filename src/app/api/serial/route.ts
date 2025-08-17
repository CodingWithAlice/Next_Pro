import {  NextRequest, NextResponse } from 'next/server'
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

async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const data = body.data
        await SerialModal.bulkCreate([data], {updateOnDuplicate: ['serialNumber']})
        
        return NextResponse.json({
            success: true,
            data: { targetSerial: data?.serialNumber },
            message: '添加成功',
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


export { GET, POST }
