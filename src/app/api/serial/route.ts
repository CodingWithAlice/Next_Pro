import { NextRequest, NextResponse } from 'next/server'
import { SerialModal } from 'db'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

async function GET(request: NextRequest) {
	try {
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const serialData = await SerialModal.findAll({ where: { userId } })
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
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		const data = body.data
		await SerialModal.bulkCreate([{ ...data, userId }], { updateOnDuplicate: ['userId', 'serialNumber'] })
        
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
