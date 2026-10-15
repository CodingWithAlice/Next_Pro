/** 左侧上下班的默认时段。请求时读 config.env，不写进前端包。 */

const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/

function readClock(name: string, fallback: string): string {
	const raw = process.env[name]
	if (raw == null) return fallback
	const matched = String(raw).trim().match(TIME_PATTERN)
	if (!matched) return fallback
	const hour = Number(matched[1])
	const minute = Number(matched[2])
	if (hour > 23 || minute > 59) return fallback
	return `${String(hour).padStart(2, '0')}:${matched[2]}`
}

function readLateWeekdays(): number[] {
	const raw = process.env.WORK_LATE_WEEKDAYS
	if (raw == null || String(raw).trim() === '') return [1, 3]
	const days = String(raw)
		.split(',')
		.map((item) => Number(item.trim()))
		.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
	return days.length ? days : [1, 3]
}

/** 周一是 1，周日是 0。用日历日，不走 UTC 解析。 */
export function weekdayOf(date: string): number {
	const matched = date.match(/^(\d{4})-(\d{2})-(\d{2})/)
	if (!matched) return new Date().getDay()
	const year = Number(matched[1])
	const month = Number(matched[2])
	const day = Number(matched[3])
	return new Date(year, month - 1, day).getDay()
}

export function workWindowForDate(date: string): { start: string; end: string } {
	const start = readClock('WORK_START', '09:00')
	const end = readClock('WORK_END', '18:00')
	const lateEnd = readClock('WORK_LATE_END', '20:00')
	const lateDays = readLateWeekdays()
	const weekday = weekdayOf(date)
	return {
		start,
		end: lateDays.includes(weekday) ? lateEnd : end,
	}
}
