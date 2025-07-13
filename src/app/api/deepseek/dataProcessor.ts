interface RawDayData {
	date: string
	frontDuration?: string
	ltnDuration?: string
	sleepTime?: string
	frontIssue: string
	workIssue: string
	sport: string
	entertain: string
	ted: string
	reading: string
	good: string[]
	better: string
	startTime: Date
	endTime: Date
}

interface FinalOutput {
	frontOverview: {
		learning: {
			total: string
			LTN: {
				questions: number
				time: string
			}
			tools: string[]
			BOX1: string[]
		}
		work: {
			tech: string[]
			business: string[]
		}
	}
	frontWellDone: {
		offTime: Date[]
		others: string
	}
	toBeBetter: string
	sleep: {
		bedtimes: Date[]
		wakeTimes: Date[]
	}
	sport: {
		schedule: string[]
		metrics: string[]
		cardio: string[]
	}
	movie: string[]
	ted: string
	read: string
	improveMethods: {
		learning: string
		tools: string
	}
	wellDone: string
	nextWeek: string
}

export class WeekDataProcessor {
	constructor(private rawData: RawDayData[]) {}

	// 计算总学习时长
	private calculateTotalLearning(): string {
		const total = this.rawData.reduce((sum, day) => {
			return sum + (day.frontDuration ? parseInt(day.frontDuration) : 0)
		}, 0)
		return `${total}分钟`
	}

	// 处理睡眠时间数组
	private processSleepTimes(): string[] {
		return this.rawData
			.filter((day) => day.sleepTime)
			.map((day) => day.sleepTime!.split(' ')[0]) // 提取HH:MM部分
	}

	// 生成最终结构
	public generateStructuredOutput() {
        console.log('生成最终结构', {rawData: this.rawData});
        
		return {
			
		}
	}
}
