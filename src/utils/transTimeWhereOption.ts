import dayjs from 'dayjs'
import { Op } from 'sequelize'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc);

function transOneDateToWhereOptions(date: string) {
	// 日期转换 - startOf('date') 东八区自动减去 8小时
	const dateObj = new Date(date)
    const startDate = dayjs.utc(dateObj).startOf('day').toDate()
	const endDate = dayjs.utc(dateObj).endOf('day').toDate()
	// 方法1：使用 DATE_FORMAT 来转换成 YYYY-MM-DD 匹配是否和 参数相等
	// const where1 = Sequelize.where(
	// 	Sequelize.fn('DATE_FORMAT', Sequelize.col('date'), '%Y-%m-%d'),
	// 	'=',
	// 	date
	// )
	// const where3 = Sequelize.where(
	// 	Sequelize.fn('DATE', Sequelize.col('date')),
	// 	'=',
	// 	date
	// )
	// 方法2：使用 Op.between 来匹配日期范围
	const where2 = {
		date: {
			[Op.between]: [startDate, endDate],
		},
	}

	return where2
}

function transTwoDateToWhereOptions(start: string | Date, end: string | Date) {
	const startObj = new Date(start)
	const endObj = new Date(end)
	const startDate = dayjs.utc(startObj).startOf('day').toDate()
	const endDate = dayjs.utc(endObj).endOf('day').toDate()
	return {
		date: {
			[Op.between]: [startDate, endDate],
		},
	}
}

export { transOneDateToWhereOptions, transTwoDateToWhereOptions }
