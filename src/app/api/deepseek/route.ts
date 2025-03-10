import { NextRequest, NextResponse } from 'next/server'
import { AIPOST, MessageProp } from '../../../../lib/request'
import { GetMonthWeekInfosAndTimeTotals } from '../month/detail/route'
import { IssueAttributes, SerialAttributes } from 'db'
import { GetWeekData } from 'utils'
import { DailyDataProps } from '@/daily/page'

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
	return `我有一组数据，是我 ${start} 至 ${end} 的学习、日常记录，我想要分别汇总每个周期，并汇总所有周期，总结、分析得到对 学习内容 和 其他事项 的回顾。每周期数据列表数据如下： \n ${weekListText.join(
		'\n'
	)}`
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
		return `### 时间：${week.date}
        ####前端学习时长
        - 前端总计学习时长${getDuration(
			13
		)}分钟，其中 LTN 做题时长${getDuration(16)}分钟
        ####各事项的关键内容
        - 1、前端情况：${week.front}
        - 2、运动情况：${week.sport}
        - 3、睡眠情况：入睡时间点 ${getSleepTime()}
        - 4、娱乐情况：${week.video}
        - 5、TED学习情况：${week.ted}
        - 6、阅读情况：${week.reading}
        ####当天的总结
        - 觉得做得好的事项 ${week.good1} ${week.good2} ${week.good3}
        - 可以做得更好的事项${week.better}`
	})
	return `我有一组数据，是我 ${startTime} 至 ${endTime} 的日常事项的记录，我想要汇总、总结这段时间我的每项情况。每天数据如下： \n ${weekListText.join(
		'\n'
	)}`
}

async function GetContentDesc(serialNumber: string, type: string) {
	if (type === 'month') {
		const { weekList } = await GetMonthWeekInfosAndTimeTotals(serialNumber)
		return GetAIMonthInputText(weekList)
	} else if (type === 'week') {
		const data: WeekInputProps = await GetWeekData(serialNumber)
		return GetWeekInputText(data as WeekInputProps)
	}
}

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serialNumber')
		const type = searchParams.get('type')
		if (!serialNumber) return

		const content = await GetContentDesc(serialNumber, type || 'month')
		const messages: MessageProp[] = [
			{ role: 'user', content: content || '' },
			{
				role: 'assistant',
				content: process.env?.[`${type}_EXAMPLE`] || '',
			},
		]

		//  按照周期获取此月的数据
		const data = await AIPOST(messages)
		return NextResponse.json({
			data,
			content,
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
