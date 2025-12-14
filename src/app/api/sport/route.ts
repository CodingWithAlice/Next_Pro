import { NextRequest, NextResponse } from 'next/server'
import { SportRecordModal } from 'db'
import { Op } from 'sequelize'

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const date = searchParams.get('date') // 日期，格式：YYYY-MM-DD
		const type = searchParams.get('type') // 运动类型：running, resistance, hiking, class
		
		const whereClause: any = {}
		
		if (date) {
			whereClause.date = date
		}
		
		if (type) {
			whereClause.type = type
		}
		
		const records = await SportRecordModal.findAll({
			where: whereClause,
			order: [['date', 'DESC'], ['created_at', 'DESC']],
		})
		
		// 只查询一次全量数据
		const allRecords = await SportRecordModal.findAll()
		
		// 计算今日汇总（从全量数据中过滤）
		const today = new Date().toISOString().split('T')[0]
		const todayRecords = allRecords.filter((record: any) => {
			const recordDate = record.get('date')
			return recordDate === today
		})
		
		// 初始化汇总对象
		const todaySummary = {
			running: 0,
			resistance: 0,
			hiking: 0,
			class: 0,
		}
		
		const totalSummary = {
			running: 0,
			resistance: 0,
			hiking: 0,
			class: 0,
		}
		
		// 计算今日汇总
		todayRecords.forEach((record: any) => {
			const recordType = record.get('type')
			const value = parseFloat(record.get('value')) || 0
			
			if (recordType === 'running') {
				todaySummary.running += value
			} else if (recordType === 'resistance') {
				todaySummary.resistance += value
			} else if (recordType === 'hiking') {
				todaySummary.hiking += value
			} else if (recordType === 'class') {
				todaySummary.class += value
			}
		})
		
		// 计算总数汇总
		allRecords.forEach((record: any) => {
			const recordType = record.get('type')
			const value = parseFloat(record.get('value')) || 0
			
			if (recordType === 'running') {
				totalSummary.running += value
			} else if (recordType === 'resistance') {
				totalSummary.resistance += value
			} else if (recordType === 'hiking') {
				totalSummary.hiking += value
			} else if (recordType === 'class') {
				totalSummary.class += value
			}
		})
		
		return NextResponse.json({
			records: records.map((record: any) => ({
				id: record.get('id'),
				type: record.get('type'),
				date: record.get('date'),
				value: parseFloat(record.get('value')) || 0,
				category: record.get('category'),
				subInfo: record.get('subInfo'),
				duration: record.get('duration'),
				notes: record.get('notes'),
				createdAt: record.get('created_at'),
				updatedAt: record.get('updated_at'),
			})),
			todaySummary,
			totalSummary,
			success: true,
			message: '操作成功',
		})
	} catch (error) {
		console.error(error)
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

async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const data = body.data
		
		// 验证必填字段
		if (!data.type || !data.date || data.value === undefined || !data.category) {
			return NextResponse.json(
				{
					success: false,
					message: '缺少必填字段：type, date, value, category',
				},
				{ status: 400 }
			)
		}
		
		// 创建记录
		const record = await SportRecordModal.create({
			type: data.type,
			date: data.date,
			value: data.value,
			category: data.category,
			subInfo: data.subInfo || null,
			duration: data.duration || null,
			notes: data.notes || null,
		})
		
		return NextResponse.json({
			success: true,
			message: '记录保存成功',
			data: {
				id: record.get('id'),
				type: record.get('type') as string,
				date: record.get('date') as string,
				value: parseFloat(record.get('value') as string) || 0,
				category: record.get('category') as string,
				subInfo: record.get('subInfo') as string | null,
				duration: record.get('duration') as number | null,
				notes: record.get('notes') as string | null,
			},
		})
	} catch (error) {
		console.error(error)
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
