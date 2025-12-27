import { NextRequest, NextResponse } from 'next/server'
import { SportRecordModal } from 'db'
import { Op } from 'sequelize'

// 运动类型配置
const SPORT_TYPES = ['running', 'resistance', 'hiking', 'class'] as const
type SportType = typeof SPORT_TYPES[number]

// 汇总对象属性 key
type SummaryKeys = SportType

// 初始化汇总对象
const createEmptySummary = (): Record<SummaryKeys, number> => {
	return {
		running: 0,
		resistance: 0,
		hiking: 0,
		class: 0,
	}
}

// 通用汇总计算函数
const calculateSummary = (records: any[]): Record<SummaryKeys, number> => {
	const summary = createEmptySummary()
	
	records.forEach((record: any) => {
		const recordType = record.get('type') as SportType
		const value = parseFloat(record.get('value')) || 0
		
		if (SPORT_TYPES.includes(recordType)) {
			summary[recordType] += value
		}
	})
	
	return summary
}

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
		
		// 使用通用函数计算汇总
		const todaySummary = calculateSummary(todayRecords)
		const totalSummary = calculateSummary(allRecords)
		
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
