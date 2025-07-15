import { NextRequest, NextResponse } from 'next/server'
import { AIPOST, MessageProp } from '../../../../lib/request'
import { GetMonthWeekInfosAndTimeTotals } from '../month/detail/route'
import { IssueAttributes, SerialAttributes } from 'db'
import { GetWeekData } from 'utils'
import { DailyDataProps } from '@/daily/page'
import { processWeekData } from './dataProcessor'

export interface WeekDataProps extends IssueAttributes {
	daily_time_records?: DailyDataProps[]
}
interface WeekInputProps {
	startTime: Date
	endTime: Date
	weekData: WeekDataProps[]
}

function GetAIMonthInputText(weekList: SerialAttributes[]) {
	const start = weekList[0].startTime
	const end = weekList[weekList.length - 1].endTime
	const weekListText = weekList.map((week) => {
		return `### 周期时间：${week.startTime} 至 ${week.endTime} 
        ####学习内容
        - 完成的学习任务 ${week.frontOverview}
        - 每个周期有简单为学习任务总结：${week.frontWellDone}
        - 学习方法复盘和改进的思考：${week.improveMethods}
        ####其他事项
        - 1、运动情况：${week.sport}
        2、睡眠情况：${week.sleep}
        3、娱乐情况：${week.movie}
        4、TED学习情况：${week.ted}
        5、阅读情况：${week.read}
        ####总结
        - 做得好的事项 ${week.wellDone}
        - 可以做得更好的事项${week.toBeBetter}`
	})
	return {
		prompt: '',
		rawData: `我有一组数据，是我 ${start} 至 ${end} 的学习、日常记录，我想要分别汇总每个周期，并汇总所有周期，总结、分析得到对 学习内容 和 其他事项 的回顾。每周期数据列表数据如下： \n ${weekListText.join(
			'\n'
		)}`,
	}
	// return `我有一组数据，是我 ${start} 至 ${end} 的学习、日常记录，我想要分别汇总每个周期，并汇总所有周期，总结、分析得到对 学习内容 和 其他事项 的回顾。每周期数据列表数据如下： \n ${weekListText.join(
	// 	'\n'
	// )}`
}

function GetWeekInputText({ startTime, endTime, weekData }: WeekInputProps) {
	const weekListText = (weekData || [])?.map((week: WeekDataProps) => {
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
			return filed?.startTime
		}
		// return `### 时间：${week.date}
		// ####前端学习时长
		// - 前端总计学习时长${getDuration(
		// 	13
		// )}分钟，其中 LTN 做题时长${getDuration(16)}分钟
		// ####各事项的关键内容
		// - 1、前端学习情况：${week.front}
		// - 2、前端工作情况：${week.work}
		// - 3、运动情况：${week.sport}
		// - 4、睡眠情况：入睡时间点 ${getSleepTime()}
		// - 5、娱乐情况：${week.video}
		// - 6、TED学习情况：${week.ted}
		// - 7、阅读情况：${week.reading}
		// ####当天的总结
		// - 觉得做得好的事项 ${week.good1} ${week.good2} ${week.good3}
		// - 可以做得更好的事项${week.better}`
		return {
			date: week.date,
			frontDuration: getDuration(13),
			ltnDuration: getDuration(16),
			sleepTime: getSleepTime(),
			frontIssue: week.front,
			workIssue: week.work,
			sport: week.sport,
			entertain: week.video,
			ted: week.ted,
			reading: week.reading,
			good: [week.good1, week.good2, week.good3],
			better: week.better,
			startTime,
			endTime,
		}
	})
	// return `我有一组数据，是我 ${startTime} 至 ${endTime} 的日常事项的记录，我想要汇总、总结这段时间我的每项情况。每天数据如下： \n ${weekListText.join(
	// 	'\n'
	// )}`
	return {
		prompt: `请严格按以下格式提取每日数据（不要计算/汇总）：
            {
  "date": "年月日格式（例如：2025-07-13）",
  "frontOverview": {
    "learning": {
      "total": "前端学习总时长字符串（例如：5小时30分钟）",
      "LTN": {
        "questions": "LTN题目数量（数字类型）",
        "time": "LTN 做题时长字符串（例如：2小时15分钟）"
      },
      "tools": ["工具相关字符串数组（每个元素为工具名称或描述）"],
      "BOX1": ["BOX1相关字符串数组（每个元素为具体内容）"]
    },
    "work": {
      "tech": ["技术相关字符串数组（每个元素为技术任务描述）"],
      "business": ["业务相关字符串数组（每个元素为业务任务描述）"]
    }
  },
  "frontWellDone": {
    "offTime": ["下班时间数组（每个元素为日期类型，例如：18:30）"],
    "others": "其他做得好的内容字符串"
  },
  "toBeBetter": "待改进事项字符串",
  "sleep": {
    "bedtimes": ["就寝时间数组（每个元素为日期类型，例如：23:30）"],
    "wakeTimes": ["起床时间数组（每个元素为日期类型，例如：07:00）"]
  },
  "sport": {
    "schedule": ["统计该周期内每天的运动字符串数组（每个元素为训练内容，当天没训练则该项为空字符串）"],
    "metrics": ["力量训练指标字符串数组（每个元素为指标描述）"],
    "cardio": ["有氧运动字符串数组（每个元素为有氧项目描述）"]
  },
  "movie": ["电影名称数组（每个元素为电影名）"],
  "ted": "TED相关数量总计，例如：10个",
  "read": "阅读相关字符串内容，例如：书名 和 进度百分比",
  "improveMethods": {
    "learning": "学习改进方法字符串",
    "tools": "工具改进方法字符串"
  },
  "wellDone": "做得好的事项字符串",
  "nextWeek": "下周计划字符串"
            }`,
		rawData: weekListText,
	}
}

async function GetContentDesc(serialNumber: string, type: string) {
	if (type === 'month') {
		const { weekList } = await GetMonthWeekInfosAndTimeTotals(serialNumber)
		return GetAIMonthInputText(weekList)
	}
	if (type === 'week') {
		const data: WeekInputProps = await GetWeekData(serialNumber)
		return GetWeekInputText(data as WeekInputProps)
	}
}

const cleanAI = (str: string) => {
	try {
		return JSON.parse(str)
	} catch {
		// 3. 容错处理
		console.warn('标准JSON解析失败，尝试修复...')

		// 修复常见问题：
		const fixedJson = str
			.replace(/'/g, '"') // 单引号转双引号
			.replace(/,\s*]/g, ']') // 去除尾部多余逗号
			.replace(/,\s*}/g, '}') // 去除对象尾部多余逗号

		try {
			return JSON.parse(fixedJson)
		} catch (finalError) {
			throw new Error(`最终解析失败: ${finalError}`)
		}
	}
}

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serialNumber')
		const type = searchParams.get('type')
		if (!serialNumber) return

		// 阶段1：预处理
		const processData = await GetContentDesc(serialNumber, type || 'month')

		// 阶段2：AI提取
		const messages: MessageProp[] = [
			{
				role: 'system',
				content: processData?.prompt || '',
			},
			// {
			// 	role: 'assistant',
			// 	content: process.env?.[`${type}_EXAMPLE`] || '',
			// },
			{
				role: 'user',
				content: JSON.stringify(processData?.rawData),
			},
		]
		const aiResponse = await AIPOST(messages)
		// 先移除Markdown代码标记
		const cleanSteps = [
			(str: string) => str.replace(/```json\n|\n```/g, ''),
			(str: string) => str.trim(),
			(str: string) => str.replace(/\n/g, ''), // 可选：移除所有换行
		]
		const cleanJson = cleanSteps.reduce((acc, fn) => fn(acc || ''), aiResponse)
		const dataArray = cleanAI(cleanJson || '')

		// 阶段3：本地处理
		const finalOutput = processWeekData(dataArray)

        

		return NextResponse.json({
			data: dataArray,
			finalOutput,
			content: processData?.rawData,
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
