import dayjs from 'dayjs'
import { Op } from 'sequelize'

function transDateToWhereOptions(date: Date) {
	// 日期转换 - startOf('date') 东八区自动减去 8小时
	const dateObj = new Date(date)
	const startDate = dayjs(dateObj).startOf('date').add(8, 'hours').toDate();
	const endDate = dayjs(dateObj).add(1, 'day').startOf('date').add(8, 'hours').toDate();

	return {
		where: {
			date: {
				[Op.between]: [startDate, endDate],
			},
		},
	}
}

export { transDateToWhereOptions }
