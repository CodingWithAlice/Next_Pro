import { NextRequest, NextResponse } from 'next/server'
// import { AIPOST, MessageProp } from '../../../../lib/request'
// import { GetMonthWeekInfosAndTimeTotals } from '../month/detail/route'
import { IssueAttributes } from 'db'
import { GetWeekData } from 'utils'
import { DailyDataProps } from '@/daily/page'
import { AIPOST, MessageProp } from '../../../../lib/request'

type Primitive = string | number | boolean | null | undefined
type Flatten = Primitive | { [key: string]: Flatten } | Flatten[]

export interface WeekDataProps extends IssueAttributes {
	daily_time_records?: DailyDataProps[]
}
interface WeekInputProps {
	startTime: Date
	endTime: Date
	weekData: WeekDataProps[]
}

interface WeekAIProps {
	[key: string]: string | Date | string | undefined
	date: Date
	startTime: Date
	endTime: Date
	frontOverview: string
	frontWellDone: string
	toBeBetter: string
	sleep?: string
	sport: string
	movie: string
	ted: string
	read: string
	improveMethods: string
	wellDone: string
}

// function GetAIMonthInputText(weekList: SerialAttributes[]) {
// 	const start = weekList[0].startTime
// 	const end = weekList[weekList.length - 1].endTime
// 	const weekListText = weekList.map((week) => {
// 		return `### 周期时间：${week.startTime} 至 ${week.endTime}
//         ####学习内容
//         - 完成的学习任务 ${week.frontOverview}
//         - 每个周期有简单为学习任务总结：${week.frontWellDone}
//         - 学习方法复盘和改进的思考：${week.improveMethods}
//         ####其他事项
//         - 1、运动情况：${week.sport}
//         2、睡眠情况：${week.sleep}
//         3、娱乐情况：${week.movie}
//         4、TED学习情况：${week.ted}
//         5、阅读情况：${week.read}
//         ####总结
//         - 做得好的事项 ${week.wellDone}
//         - 可以做得更好的事项${week.toBeBetter}`
// 	})
// 	return {
// 		prompt: '',
// 		rawData: `我有一组数据，是我 ${start} 至 ${end} 的学习、日常记录，我想要分别汇总每个周期，并汇总所有周期，总结、分析得到对 学习内容 和 其他事项 的回顾。每周期数据列表数据如下： \n ${weekListText.join(
// 			'\n'
// 		)}`,
// 	}
// }

// 将每天的数据按照指定结构拼接
function transDaysData({
	startTime,
	endTime,
	weekData,
}: WeekInputProps): WeekAIProps[] {
	return (weekData || [])?.map((week: WeekDataProps) => {
		const getDuration = (typeId: number) => {
			const filed = week?.daily_time_records?.find(
				(it) => it.routineTypeId === typeId
			)

			return filed?.duration
		}
		const getSleepTime = () => {
			const filed = week?.daily_time_records?.find(
				(it) => it.routineTypeId === 10
			)            
            const { startTime, endTime } = filed || {}
			return [startTime, endTime].join(' -- ')
		}
		return {
			date: week.date,
			startTime, // 本周期的第一天
			endTime, // 本周期的最后一天
			frontOverview: `前端时长 ${getDuration(
				13
			)?.toString()}min / LTN 时长 ${getDuration(
				16
			)?.toString()}min \n  前端事项：${week.front || ''} ${
				!!week?.work ? '\n - 工作：' + week?.work : ''
			}`,
			frontWellDone: [week.good1, week.good2, week.good3].join(','),
			toBeBetter: week.better || '',
			sleep: getSleepTime(),
			sport: week.sport,
			movie: week.video,
			ted: week.ted,
			read: week.reading,
			improveMethods: week.better || '',
			wellDone: [week.good1, week.good2, week.good3].join(','),
		}
	})
}

async function GetRawContentByType(serialNumber: string, type: string) {
	if (type === 'month') {
		throw Error('暂时关闭月报 AI 查询通道，改版后重新开放')
		// const { weekList } = await GetMonthWeekInfosAndTimeTotals(serialNumber)
		// return GetAIMonthInputText(weekList)
	}
	if (type === 'week') {
		const data: WeekInputProps = await GetWeekData(serialNumber)
		return transDaysData(data as WeekInputProps)
	}
}

// 将每日数据整合为周期数据
function calcPeriodData(source: WeekAIProps[]) {
	const result: { [key: string]: string } = {}
	source.forEach((day: WeekAIProps) => {
		Object.keys(day).forEach((item) => {
			if (!result[item]) {
				result[item] = ''
			}
			if (
				day[item] &&
				day[item] !== '/' &&
				typeof day[item] === 'string' &&
				!['date', 'startTime', 'endTime'].includes(item)
			) {
				result[item] += `${day.date}: ${day[item]} \n`
			} else {
				result[item] += day[item]?.toString() || ''
			}
		})
	})
	return result
}

/**
 * 递归展平数据为字符串，保留完整属性路径
 * @param data 要处理的数据
 * @param path 当前属性路径（内部使用）
 * @returns 拼接后的字符串，每行格式为 "完整路径, 值"
 */
function flattenDataToString(data: Flatten, path: string[] = []): string {
	// 处理基础类型
	if (data === null || data === undefined) {
		return ''
	}
	if (typeof data !== 'object') {
		return path.length > 0 ? `${path.join('.')}, ${data}` : String(data)
	}

	const result: string[] = []

	// 处理数组
	if (Array.isArray(data)) {
		if (data.every((item) => typeof item !== 'object')) {
			// 纯基础类型数组直接拼接
			return path.length > 0
				? `${path.join('.')}, ${data.join(',')}`
				: data.join(',')
		} else {
			// 递归处理数组元素
			data.forEach((item, index) => {
				const itemResult = flattenDataToString(item, [
					...path,
					String(index),
				])
				if (itemResult) result.push(itemResult)
			})
			return result.join('\n')
		}
	}

	// 处理对象
	for (const [key, value] of Object.entries(data)) {
		const newPath = [...path, key]
		const valueResult = flattenDataToString(value, newPath)
		if (valueResult) result.push(valueResult)
	}

	return result.join('\n')
}

// ai 数据按照 对象返回，需转换为方便展示的数据
const transToString = (aiData: { [key: string]: Flatten }) => {
	const originFrontOverview = aiData?.frontOverview || {}
	const originFrontWellDone = aiData?.frontWellDone || {}

	return {
		frontOverview: flattenDataToString(originFrontOverview),
		frontWellDone: flattenDataToString(originFrontWellDone),
		wellDone: flattenDataToString(originFrontWellDone),
	}
}

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serialNumber')
		const type = searchParams.get('type')
		if (!serialNumber) return

		// 阶段1：预处理 - 获取两张表的数据每天数据
		const daysData = await GetRawContentByType(
			serialNumber,
			type || 'month'
		)

		// 阶段2：将每日数据整合
		const weekData = daysData && calcPeriodData(daysData)

		// 阶段3：AI 获取建议
		const messages: MessageProp[] = [
			{
				role: 'assistant',
				content: process.env?.[`${type}_EXAMPLE`] || '',
			},
			{
				role: 'user',
				content: JSON.stringify({
					frontOverview: weekData?.frontOverview,
					frontWellDone: weekData?.frontWellDone,
				}),
			},
		]
		const aiResponse = await AIPOST(messages)

		// 添加验证
		if (!aiResponse || aiResponse.trim() === '') {
			console.error('AI 返回空响应')
			return NextResponse.json(
				{ error: 'AI service returned empty response' },
				{ status: 500 }
			)
		}
		let aiData
		try {
			aiData = transToString(JSON.parse(aiResponse))
		} catch (parseError) {
			console.error('解析 AI 响应失败:', parseError)
			console.error('原始响应内容:', aiResponse)
            console.log(`AI响应大小: ${aiResponse?.length}字符`);
			return NextResponse.json(
				{
					error: 'Failed to parse AI response',
					rawResponse: aiResponse, // 可选：返回原始响应用于调试
				},
				{ status: 500 }
			)
		}

		return NextResponse.json({
			daysData,
			data: { 
                ...weekData, 
                ...aiData, 
                startTime: daysData?.[0]?.startTime,
                endTime: daysData?.[0]?.endTime,
             },
			aiResponse: JSON.parse(aiResponse || ''),
		})
	} catch (error) {
		console.error(error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export { GET }
