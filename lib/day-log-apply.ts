/** 把当场记录收成晨昏日志能用的时间和工作草稿。不读数据库。 */

export interface DayLogInput {
	routineTypeId: number
	startedAt: string
	endedAt: string | null
	durationMin: number | null
	note: string | null
}

export interface TimeDraft {
	routineTypeId: number
	start: string
	end: string
	duration: number
}

const DAY_MINUTES = 24 * 60

export function roundDurationTo5(minutes: number): number {
	if (!Number.isFinite(minutes) || minutes <= 0) return 0
	return Math.round(minutes / 5) * 5
}

export function snapMinuteOfDay(minuteOfDay: number): number {
	const normalized = ((Math.round(minuteOfDay) % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES
	const snapped = Math.round(normalized / 5) * 5
	return snapped === DAY_MINUTES ? 0 : snapped
}

function clockMinutes(log: DayLogInput): number {
	if (!log.endedAt) return 0
	const start = new Date(log.startedAt).getTime()
	const end = new Date(log.endedAt).getTime()
	if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
	return Math.round((end - start) / 60000)
}

export function segmentMinutes(log: DayLogInput): number {
	if (log.durationMin != null && Number.isFinite(log.durationMin)) {
		return roundDurationTo5(log.durationMin)
	}
	return roundDurationTo5(clockMinutes(log))
}

function pad(value: number): string {
	return String(value).padStart(2, '0')
}

function formatAt(date: string, minuteOfDay: number): string {
	const extraDays = Math.floor(minuteOfDay / DAY_MINUTES)
	const within = ((minuteOfDay % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES
	const [year, month, day] = date.split('-').map(Number)
	const base = new Date(year, month - 1, day + extraDays)
	const hour = Math.floor(within / 60)
	const minute = within % 60
	return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())} ${pad(hour)}:${pad(minute)}:00`
}

function minuteOfStarted(log: DayLogInput): number {
	const started = new Date(log.startedAt)
	return started.getHours() * 60 + started.getMinutes()
}

export function buildWorkText(logs: DayLogInput[], workTypeId: number): string | null {
	const lines = logs
		.filter((log) => log.routineTypeId === workTypeId && log.endedAt)
		.slice()
		.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
		.map((log) => {
			const minutes = segmentMinutes(log)
			const note = (log.note || '').trim()
			return note ? `${note} ${minutes}m` : `${minutes}m`
		})
	if (!lines.length) return null
	return `1、技术方向：\n2、业务方向：\n${lines.join('\n')}`
}

export function buildTimeDraft(opts: {
	date: string
	logs: DayLogInput[]
	workTypeId: number
	workStart: string
	workEnd: string
}): TimeDraft[] {
	const finished = opts.logs.filter((log) => log.endedAt)
	if (!finished.length) return []

	const drafts: TimeDraft[] = [
		{
			routineTypeId: opts.workTypeId,
			start: `${opts.date} ${opts.workStart}:00`,
			end: `${opts.date} ${opts.workStart}:00`,
			duration: 0,
		},
		{
			routineTypeId: opts.workTypeId,
			start: `${opts.date} ${opts.workEnd}:00`,
			end: `${opts.date} ${opts.workEnd}:00`,
			duration: 0,
		},
	]

	finished
		.filter((log) => log.routineTypeId !== opts.workTypeId)
		.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
		.forEach((log) => {
			const startMin = snapMinuteOfDay(minuteOfStarted(log))
			const duration = segmentMinutes(log)
			drafts.push({
				routineTypeId: log.routineTypeId,
				start: formatAt(opts.date, startMin),
				end: formatAt(opts.date, startMin + duration),
				duration,
			})
		})

	return drafts
}
