import { NextRequest, NextResponse } from 'next/server'
import { AIPOST } from '../../../../lib/request'
import { GetMonthWeekInfosAndTimeTotals } from '../month/detail/route'
import { SerialAttributes } from 'db'

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

async function GET(request: NextRequest) {
	try {
		const { searchParams } = request.nextUrl
		const serialNumber = searchParams.get('serialNumber')
		if (!serialNumber) return
		const { weekList } = await GetMonthWeekInfosAndTimeTotals(serialNumber)
		const content = GetAIMonthInputText(weekList)
        console.log('🌹🌹🌹 调用 AIPOST');
        

		//  按照周期获取此月的数据
		const data = await AIPOST([
			{ role: 'user', content },
			{
				role: 'assistant',
				content:
					'返回回答的数据格式为json : {“studyConclude”: ‘’”, “others”: “”},studyConclude 为所有周期的学习内容总结，others 为所有周期的其他事项总结',
			},
		])
		return NextResponse.json({
			data,
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
