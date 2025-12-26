import { IssueModal, TimeModal, SportRecordModal } from 'db'
import { NextRequest, NextResponse } from 'next/server'
import { transOneDateToWhereOptions } from 'utils'
import { Op } from 'sequelize'
import { parseSportText, type ParsedSportRecord } from './parseSportText'

/**
 * 查询指定日期的运动时长
 * @param date 日期字符串 (YYYY-MM-DD)
 * @returns 运动时长（分钟），如果没有找到返回 null
 */
async function getSportDuration(date: string): Promise<number | null> {
	try {
		const dateOption = transOneDateToWhereOptions(date)
		const timeRecords = await TimeModal.findAll({
			where: {
				...dateOption,
				routineTypeId: {
					[Op.in]: [2, 3, 17],
				},
			},
		})

		if (timeRecords.length === 0) {
			return null;
		}

		// 计算总时长
		const totalDuration = timeRecords.reduce((sum, record) => {
			const duration = record.get('duration') as number;
			return sum + (duration || 0);
		}, 0);

		return totalDuration > 0 ? totalDuration : null;
	} catch (error) {
		console.error('查询运动时长失败:', error);
		return null;
	}
}

async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const data = body.data
		// 日期转换
		const option = transOneDateToWhereOptions(data.date)
		const [issue, created] = await IssueModal.findOrCreate({
			where: option,
			defaults: data,
		})
		if (!created) {
			issue.set(data)
			// 如果已经存在，更新描述
			await issue.save()
		}

		// 解析运动文本并创建运动记录
		if (data.sport && typeof data.sport === 'string' && data.sport.trim()) {
			try {
				const parsedRecords = parseSportText(data.sport);
				
				if (parsedRecords.length > 0) {
					// 对于 running 和 resistance 类型，如果没有 duration，查询运动时长
					const sportDuration = await getSportDuration(data.date);
					
					// 创建运动记录
					for (const record of parsedRecords) {
						try {
							// 如果是 running 或 resistance 类型且没有 duration，使用查询到的时长
							if (
								(record.type === 'running' || record.type === 'resistance') &&
								!record.duration &&
								sportDuration !== null
							) {
								record.duration = sportDuration;
							}

							await SportRecordModal.create({
								type: record.type,
								date: data.date,
								value: record.value,
								category: record.category,
								subInfo: record.subInfo || null,
								duration: record.duration || null,
								notes: record.notes || null,
							});
						} catch (createError) {
							console.error('创建运动记录失败:', createError, '记录:', record);
							// 继续处理下一条记录，不影响整体流程
						}
					}
				}
			} catch (parseError) {
				console.error('解析运动文本失败:', parseError, '文本:', data.sport);
				// 解析失败不影响 issue 保存
			}
		}

		return NextResponse.json({
			success: true,
			message: created ? '观察成功' : '更新成功',
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

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		
		// 查询所有 IssueModal 数据
		const issueList = await IssueModal.findAll({
			order: [['date', 'DESC']], // 按日期倒序排列
		})

		// 统计有记录的天数（列表长度）
		const totalDays = issueList.length

		return NextResponse.json({
			success: true,
			data: issueList,
			totalDays: totalDays,
			message: '查询成功',
		})
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{
				success: false,
				message: '查询失败',
				error: (error as Error).message,
			},
			{ status: 500 }
		)
	}
}

export { POST, GET }
