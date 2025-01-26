import { Op } from 'sequelize';

function transDateToWhereOptions(date: Date) {
	// 日期转换
	const dateObj = new Date(date)
	const startDate = new Date(
		dateObj.getFullYear(),
		dateObj.getMonth(),
		dateObj.getDate()
	)
	const endDate = new Date(
		dateObj.getFullYear(),
		dateObj.getMonth(),
		dateObj.getDate(),
		23,
		59,
		59
	)
	return {
		where: {
			date: {
				[Op.between]: [startDate, endDate],
			},
		},
	}
}

export { transDateToWhereOptions }
