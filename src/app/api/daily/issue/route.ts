import { IssueModal, TimeModal, SportRecordModal } from 'db'
import { NextRequest, NextResponse } from 'next/server'
import { transOneDateToWhereOptions, incrementRunningPlanProgress } from 'utils'
import { Op } from 'sequelize'
import { parseSportText } from './parseSportText'
import { getEffectiveUserIdFromRequest } from '@lib/auth-token'

/**
 * 查询指定日期的运动时长（按 user_id 隔离）
 */
async function getSportDuration(date: string, userId: number): Promise<number | null> {
	try {
		const dateOption = transOneDateToWhereOptions(date)
		const timeRecords = await TimeModal.findAll({
			where: {
				...dateOption,
				userId,
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
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const body = await request.json()
		const data = body.data
		const option = transOneDateToWhereOptions(data.date)
		const [issue, created] = await IssueModal.findOrCreate({
			where: { ...option, userId },
			defaults: { ...data, userId },
		})
		if (!created) {
			// PATCH 语义：空字段不覆盖已有值（避免 AI/表单把内容清空）
			const patch: Record<string, unknown> = {}
			for (const [k, v] of Object.entries(data || {})) {
				if (k === 'id' || k === 'userId') continue
				if (v == null) continue
				if (typeof v === 'string') {
					if (!v.trim()) continue
					patch[k] = v
					continue
				}
				patch[k] = v
			}
			issue.set(patch)
			// 如果已经存在，更新描述
			await issue.save()
		}

		// 解析运动文本并创建运动记录（仅匹配已声明的运动类型）
		let msg: string | undefined;
		if (data.sport && typeof data.sport === 'string' && data.sport.trim()) {
			try {
				const { records: parsedRecords, unrecognizedClasses } = await parseSportText(data.sport, { userId });
				if (unrecognizedClasses.length > 0) {
					msg = `以下课程类型未识别，请先在运动类型中添加：${unrecognizedClasses.join('、')}`;
				}

				if (parsedRecords.length > 0) {
					const sportDuration = await getSportDuration(data.date, userId)

					for (const record of parsedRecords) {
						try {
							if (
								(record.type === 'running' || record.type === 'resistance') &&
								!record.duration &&
								sportDuration !== null
							) {
								record.duration = sportDuration
							}

							const [sportRecord, created] = await SportRecordModal.findOrCreate({
								where: {
									userId,
									date: data.date,
									type: record.type,
									category: record.category,
									value: record.value,
								},
								defaults: {
									userId,
									type: record.type,
									date: data.date,
									value: record.value,
									category: record.category,
									subInfo: record.subInfo || null,
									duration: record.duration || null,
									notes: record.notes || null,
								},
							})

							// 如果记录已存在，更新相关信息
							if (!created) {
								sportRecord.set({
									subInfo: record.subInfo || null,
									duration: record.duration || null,
									notes: record.notes || null,
								});
								await sportRecord.save();
							} else if (record.type === 'running' && record.value > 0 && record.category) {
								incrementRunningPlanProgress(data.date, record.category, record.value, userId).catch((e) =>
									console.error('更新跑步计划进度失败:', e)
								)
							}
						} catch (recordError) {
							console.error('处理运动记录失败:', recordError, '记录:', record);
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
			...(msg && { msg }),
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
		const userId = Number(getEffectiveUserIdFromRequest(request))
		const issueList = await IssueModal.findAll({
			where: { userId },
			order: [['date', 'DESC']],
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
