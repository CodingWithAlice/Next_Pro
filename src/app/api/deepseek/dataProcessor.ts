interface FinalOutput {
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

interface RawDayData {
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

const fakeData = [
	{
		date: '2025-06-15',
		frontOverview: {
			learning: {
				total: '46分钟',
				LTN: { questions: 0, time: '0分钟' },
				tools: [
					'完成周报，进入新周期',
					'TED 复制 bug 修复',
					'线轴 数据梳理 50%',
				],
				BOX1: [],
			},
			work: { tech: [], business: [] },
		},
		frontWellDone: {
			offTime: [],
			others: '积极完成了周报，虽然周期长达19天，但9天没工作、没学习，十分简易的总结，把阳的状态抛下！开启新周期！',
		},
		toBeBetter:
			'周末的早饭得提前备好，“等待早饭-吃了会该吃午饭了-躺一会吃午饭” 早上的时光就溜走拉~\\n晚上不知道为什么睡不着，可能晚上6点多睡到8点多还是不太行，白天少睡觉！',
		sleep: { bedtimes: [], wakeTimes: [] },
		sport: { schedule: [''], metrics: [], cardio: [] },
		movie: [],
		ted: '/',
		read: '/',
		improveMethods: { learning: '', tools: '' },
		wellDone:
			'昨天原本约了倩倩逛西湖，结果大台风，笑署 - 但早起了，拥有了一整天充足的时间 ~',
		nextWeek: '',
	},
	{
		date: '2025-06-21',
		frontOverview: {
			learning: {
				total: '137分钟',
				LTN: { questions: 17, time: '134分钟' },
				tools: [],
				BOX1: [],
			},
			work: {
				tech: [
					'表格内存泄漏排查(排除) 39m',
					'表格 性能分析 mousemove定位 91m',
				],
				business: [],
			},
		},
		frontWellDone: {
			offTime: [],
			others: '高效的一天了，即使看了医生、电影，也依旧完成了工作、学习计划，工作2h、学习 2h，很可以，张弛有度，专注力很高！',
		},
		toBeBetter:
			'看完电影，大概 间隔2h 之后开始坐下来先跟妍妍聊了会天，再开始学习。但是 2h 之内我除了吃饭，也想不起来在忙啥了，没做家务也没睡觉，算是刷视频的黑洞时间了！多记录！',
		sleep: { bedtimes: [], wakeTimes: [] },
		sport: { schedule: [''], metrics: [], cardio: [] },
		movie: ['《酱园弄·悬案》'],
		ted: '播客：漫读《状态比能力更重要》',
		read: '/',
		improveMethods: { learning: '', tools: '' },
		wellDone:
			'早上7.30 迷迷登登就起来，打车去了医院，9.30 已经在办公室进行复盘了 - 最大的好消息莫过于我的手终于没有病毒啦~另一个好消息就是看完手，也才 9点多，一整天才刚刚开始！nice！完全不影响周末的安排！突然爱上这个节奏，下周拔牙也这样吧！',
		nextWeek: '',
	},
	{
		date: '2025-06-22',
		frontOverview: {
			learning: {
				total: '254分钟',
				LTN: { questions: 0, time: '0分钟' },
				tools: [
					'5月月报',
					'前端拆分为工作和学习',
					'线轴数据同步 周报表/books表',
				],
				BOX1: ['循环方法和async/await的兼容'],
			},
			work: { tech: [], business: [] },
		},
		frontWellDone: {
			offTime: [],
			others: '正常12点左右入睡和7.30起床的感觉太好了，一切都尽在掌握，早上开局就学习1.5h，即使去康康家和妍妍帮忙搬家，没有机会学习，直到晚上回到家才重新学习，中间的每一分每一秒，都没有对完不成计划的焦虑，只有对已经早起学习的庆幸！',
		},
		toBeBetter: '12点是睡点，过了会睡不够哦，早点睡觉~',
		sleep: { bedtimes: [], wakeTimes: [] },
		sport: { schedule: [''], metrics: [], cardio: [] },
		movie: [],
		ted: '/',
		read: '/',
		improveMethods: { learning: '', tools: '' },
		wellDone:
			'搬家是一件很辛苦的事情，能够和妍妍做一顿饭，当然最后康康也做了一半，感觉只有我，专职厨房卫生卫士！和朋友相处很开心，可惜没约上互相一起学习，下次一定',
		nextWeek: '',
	},
	{
		date: '2025-06-23',
		frontOverview: {
			learning: {
				total: '49分钟',
				LTN: { questions: 0, time: '0分钟' },
				tools: ['线轴添加生活信息'],
				BOX1: [],
			},
			work: {
				tech: [
					'表格 黏贴时 元变量选择单元格不提供扩列黏贴，且屏蔽数字类型 70m',
					'表格 合并表头场景的表头[兼容有children情况]/单元格选中态[考虑 children+选中行]112m',
				],
				business: [
					'bug情况排查同步 24m',
					'方程表格黏贴后黄色展示区过大[index使用不正确]45m',
					'表格行列展示不全[css样式，表头高度非默认时需声明，否则表格展示不全] 73m',
					'表格快捷键上下移动添加[以为是bug，没想到是添加功能] 93m',
				],
			},
		},
		frontWellDone: {
			offTime: [],
			others: '将事项流程记录到 日历清单中，外置大脑，减少大脑需要记忆的边界情况',
		},
		toBeBetter: '昨天非常好！',
		sleep: { bedtimes: [], wakeTimes: [] },
		sport: { schedule: [''], metrics: [], cardio: [] },
		movie: [],
		ted: '/',
		read: '/',
		improveMethods: { learning: '', tools: '' },
		wellDone:
			'睡得晚，没有强迫自己早起；12点前有点犯困，但没有强迫自己熬夜，抱着阿秋入睡！身体的感觉最重要！睡眠很重要！',
		nextWeek: '',
	},
	{
		date: '2025-06-24',
		frontOverview: {
			learning: {
				total: '128分钟',
				LTN: { questions: 11, time: '126分钟' },
				tools: [],
				BOX1: [],
			},
			work: {
				tech: ['表格 合并表头 选中态 优化 150m'],
				business: [
					'给表格添加 delete 12m',
					'求解器默认选择 35m',
					'多流股新方案评审 35m、排查bug 57m、琐碎 bug 40m',
					'方程表 方程名称可清除 isClear 34m',
					'更改表格数据获取接口  20m',
				],
			},
		},
		frontWellDone: {
			offTime: [],
			others: '改多少 bug 就做多少 LTN 相对来说是一件蛮合理的事情，bug 会有意外花了很多时间的难点，LTN 也会突然遇到一题要花上很久的 - 天作之合，就这么短期实现试试！',
		},
		toBeBetter:
			'下班回家就洗澡！反正都要休息！不如做点家务和日常事项，不占用其他时间！',
		sleep: { bedtimes: ['23:30'], wakeTimes: [] },
		sport: { schedule: [''], metrics: [], cardio: [] },
		movie: [],
		ted: 'Round2：21、请假装成功 ，你就会真的成功！',
		read: '《布鲁克林有棵树》',
		improveMethods: { learning: '', tools: '' },
		wellDone: '顺从身体的感受，困了就睡觉，饿了就吃饭！睡得很早超级舒服！',
		nextWeek: '',
	},
	{
		date: '2025-06-30',
		frontOverview: {
			learning: {
				total: '37分钟',
				LTN: { questions: 0, time: '0分钟' },
				tools: ['月报设计'],
				BOX1: [],
			},
			work: {
				tech: [
					'表格 validate 回调参数新增全表数据',
					'CR 提前过代码 71m',
				],
				business: [
					'梳理bug及周计划同步 30m',
					'塔板水力开发完成 45m',
					'塔板水力联调 96m',
					'2h 周会 过代码+eslint',
				],
			},
		},
		frontWellDone: {
			offTime: [],
			others: '每日梳理工作计划越来越准确，再次声明，技术方向才是重要不紧急事项，工作中遇到时，需要高优、重点安排！例如 CodeReview！',
		},
		toBeBetter: '逐渐恢复学习和早睡吧，牙痛离开离开',
		sleep: { bedtimes: [], wakeTimes: [] },
		sport: { schedule: [''], metrics: [], cardio: [] },
		movie: [],
		ted: '/',
		read: '/',
		improveMethods: { learning: '', tools: '' },
		wellDone:
			'昨天最牛的事情是，睡了3h 依旧清醒上了一天班，太牛了，路过的蚂蚁都要佩服的程度 - 尊重身体的感受，可能以为药也好、疼痛也好，让我想要屏蔽身体感觉 - 但是睡不着了就不睡，起来正常生活，将缺失的睡眠需求在晚上补足，这是之前验证过的最有效的恢复生活节奏的方式！nice！现在依旧有效！',
		nextWeek: '',
	},
	{
		date: '2025-07-05',
		frontOverview: {
			learning: {
				total: '173分钟',
				LTN: { questions: 0, time: '0分钟' },
				tools: ['月报热力图区分类型'],
				BOX1: [],
			},
			work: { tech: [], business: [] },
		},
		frontWellDone: {
			offTime: [],
			others: '早上起来就猛猛学习，真好，明确周末的学习计划，可以让自己比较有目的性！',
		},
		toBeBetter: '睡眠没有深度睡眠，尝试硬熬看看',
		sleep: { bedtimes: [], wakeTimes: ['15:00'] },
		sport: { schedule: [''], metrics: [], cardio: [] },
		movie: [],
		ted: '/',
		read: '/',
		improveMethods: { learning: '', tools: '' },
		wellDone:
			'买了花，虽然不知道这花能活多久，但是家里有鲜花，真的让人愉快！早上起床换上漂亮衣服，可以开启一天好心情！',
		nextWeek: '',
	},
]
export function processWeekData({ rawData }: RawDayData): FinalOutput {
	// 计算总学习时长
	// const calculateTotalLearning = () => {
	// 	const total = rawData.reduce((sum, day) => {
	// 		return sum + (day.frontDuration ? parseInt(day.frontDuration) : 0)
	// 	}, 0)
	// 	return `${total}分钟`
	// }

	// 处理睡眠时间数组
	// const processSleepTimes = () => {
	// 	return rawData
	// 		.filter((day) => day.sleepTime)
	// 		.map((day) => day.sleepTime!.split(' ')[0])
	// }

	return {
		date: '',
		frontDuration: 'string',
		ltnDuration: 'string',
		sleepTime: 'string',
		frontIssue: 'string',
		workIssue: 'string',
		sport: 'string',
		entertain: 'string',
		ted: 'string',
		reading: 'string',
		good: [],
		better: 'string',
		startTime: new Date(),
		endTime: new Date(),
	}
}
