import { NextRequest, NextResponse } from 'next/server'
import pool from '../../../../lib/db'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl
    const connection = await pool.getConnection()
    const [rows, fields] = await connection.execute('SELECT * FROM routine_type')
    connection.release()
    return NextResponse.json(rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
