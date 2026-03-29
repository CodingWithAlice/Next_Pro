import dayjs from 'dayjs'

/** 与月报 weekList 一致；供 API / 组件共用，不依赖 React */
export type MonthTableWeekRow = {
	serialNumber: number
	startTime: string
	endTime: string
	frontOverview: string
	sleep: string
	sport: string
	movie: string
	ted: string
	read: string
	improveMethods: string
	id: number
}

function formatSerialNumber(num: number): string {
	const str = num + ''
	const source = ['〇', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨']
	let res = ''
	Array(str.length)
		.fill(1)
		.forEach((_it, index) => {
			res += source[+str[index]]
		})
	return res
}

function getGapTime(
	startTime: string | dayjs.Dayjs,
	endTime: string | dayjs.Dayjs,
	type: 'hour' | 'minute' | 'day' = 'day'
) {
	return dayjs(endTime).diff(dayjs(startTime), type)
}

function sortWeeks(weeks: MonthTableWeekRow[]) {
	return [...weeks].sort((a, b) => a.serialNumber - b.serialNumber)
}

export function periodCaption(it: MonthTableWeekRow): string {
	const sn = `LTN ${formatSerialNumber(it.serialNumber)}`
	const st = it.startTime.slice(5, 10)
	const en = it.endTime.slice(5, 10)
	const days = getGapTime(it.startTime, it.endTime)
	return `【${sn} · ${st}～${en} · ${days}天】`
}

/** 工作段落起点：常见「二、工作体验」或「一、工作体验 技术方向」（与「一、学习体验」区分） */
function findWorkExperienceStart(t: string): number {
	const i2 = t.indexOf('二、工作体验')
	const re1 = /一[、.．]工作体验/
	const m1 = t.match(re1)
	const i1 = m1?.index !== undefined ? m1.index : -1
	if (i2 === -1 && i1 === -1) return -1
	if (i2 === -1) return i1
	if (i1 === -1) return i2
	return Math.min(i2, i1)
}

/**
 * 「技术方向」大段里，用户常在表格等工作项之后用「1、在线工具」「2、博客」等写学习，需并入学习体验。
 * 从首次出现的此类标题起截断，前半为工作·技术，后半为学习。
 */
const LEARNING_SUB_IN_TECH_PATTERNS: RegExp[] = [
	/(?:^|\n)\s*\d+[、.．]在线工具[：:]?/m,
	/(?:^|\n)\s*\d+[、.．]博客整理[：:]?/m,
	/(?:^|\n)\s*\d+[、.．]BOX1[：:]?/m,
	/(?:^|\n)\s*\d+[、.．]LTN[：:]?/m,
	/(?:^|\n)\s*\d+[、.．]B站[：:]?/m,
]

function findFirstLearningSubsectionInTechBlock(tech: string): number {
	let cut = -1
	for (const re of LEARNING_SUB_IN_TECH_PATTERNS) {
		const m = tech.search(re)
		if (m !== -1 && (cut === -1 || m < cut)) cut = m
	}
	return cut
}

function splitTechIntoWorkAndLearning(tech: string): {
	workTech: string
	learningTail: string
} {
	const s = tech.trim()
	if (!s) return { workTech: '', learningTail: '' }
	const cut = findFirstLearningSubsectionInTechBlock(s)
	if (cut === -1) return { workTech: s, learningTail: '' }
	return {
		workTech: s.slice(0, cut).trim(),
		learningTail: s.slice(cut).trim(),
	}
}

/**
 * 将「学习任务」正文拆成：学习体验、工作·技术向、工作·非技术向。
 * - 工作起点：「二、工作体验」或「一、工作体验」
 * - 技术/非技术：「非技术方向」
 * - 技术段内若出现「1、在线工具」等学习子块，并入学习体验
 */
export function splitLearningTask(frontOverview: string): {
	study: string
	tech: string
	nonTech: string
} {
	const t = (frontOverview || '').trim()
	if (!t) return { study: '', tech: '', nonTech: '' }

	const workStart = findWorkExperienceStart(t)
	if (workStart === -1) {
		return { study: t, tech: '', nonTech: '' }
	}

	let study = t.slice(0, workStart).trim()
	const work = t.slice(workStart).trim()

	const nt = '非技术方向'
	const ntIdx = work.indexOf(nt)
	let tech: string
	let nonTech: string
	if (ntIdx === -1) {
		tech = work
		nonTech = ''
	} else {
		tech = work.slice(0, ntIdx).trim()
		nonTech = work.slice(ntIdx).trim()
	}

	const { workTech, learningTail } = splitTechIntoWorkAndLearning(tech)
	if (learningTail) {
		study = [study, learningTail].filter(Boolean).join('\n\n')
	}

	return relocateThirdStudySections(study, workTech, nonTech)
}

/** 文中「三、学习体验」常写在「非技术」工作段落之后，易被整块划入非技术；需并入学习体验 */
const THIRD_STUDY_MARK = /三[、.．]学习体验/

function extractThirdStudyFromWorkSegment(segment: string): {
	rest: string
	extracted: string
} {
	const s = (segment || '').trim()
	if (!s) return { rest: '', extracted: '' }
	const m = s.search(THIRD_STUDY_MARK)
	if (m === -1) return { rest: s, extracted: '' }
	return {
		rest: s.slice(0, m).trim(),
		extracted: s.slice(m).trim(),
	}
}

function relocateThirdStudySections(
	study: string,
	tech: string,
	nonTech: string
): { study: string; tech: string; nonTech: string } {
	const extra: string[] = []
	let t = tech
	let nt = nonTech

	const fromTech = extractThirdStudyFromWorkSegment(t)
	t = fromTech.rest
	if (fromTech.extracted) extra.push(fromTech.extracted)

	const fromNt = extractThirdStudyFromWorkSegment(nt)
	nt = fromNt.rest
	if (fromNt.extracted) extra.push(fromNt.extracted)

	const mergedStudy = [study, ...extra].filter(Boolean).join('\n\n')
	return { study: mergedStudy, tech: t, nonTech: nt }
}

function stripDuplicateSectionHeading(
	body: string,
	kind: 'study' | 'tech' | 'nonTech'
): string {
	let s = (body || '').trim()
	if (!s) return ''
	if (kind === 'study') {
		s = s.replace(/^一[、.]学习体验[^\n\r]*/m, '').trim()
		s = s.replace(/^三[、.．]学习体验[^\n\r]*/m, '').trim()
	}
	if (kind === 'tech') {
		s = s.replace(/^二[、.．]工作体验[^\n\r]*/m, '').trim()
		s = s.replace(/^一[、.．]工作体验[^\n\r]*/m, '').trim()
	}
	if (kind === 'nonTech') {
		s = s.replace(/^非技术方向[^\n\r]*/m, '').trim()
	}
	return s
}

/**
 * 合并学习任务：先按三个方向分块，每块内按周期顺序罗列（与用户每周期内划分一致，不按条目重组）。
 */
export function aggregateLearningTasks(weeks: MonthTableWeekRow[]): string {
	const sorted = sortWeeks(weeks)
	const studyBlocks: string[] = []
	const techBlocks: string[] = []
	const nonTechBlocks: string[] = []

	for (const w of sorted) {
		const raw = splitLearningTask(w.frontOverview || '')
		const cap = periodCaption(w)
		const study = stripDuplicateSectionHeading(raw.study, 'study')
		const tech = stripDuplicateSectionHeading(raw.tech, 'tech')
		const nonTech = stripDuplicateSectionHeading(raw.nonTech, 'nonTech')
		if (study) studyBlocks.push(`${cap}\n${study}`)
		if (tech) techBlocks.push(`${cap}\n${tech}`)
		if (nonTech) nonTechBlocks.push(`${cap}\n${nonTech}`)
	}

	const line = '—'.repeat(32)
	const parts: string[] = []

	if (studyBlocks.length) {
		parts.push(
			`【学习体验】\n（以下按周期顺序罗列各周期该部分记录）\n${line}\n\n${studyBlocks.join('\n\n')}`
		)
	}
	if (techBlocks.length) {
		parts.push(
			`【工作·技术向】\n（以下按周期顺序罗列各周期该部分记录）\n${line}\n\n${techBlocks.join('\n\n')}`
		)
	}
	if (nonTechBlocks.length) {
		parts.push(
			`【工作·非技术向】\n（以下按周期顺序罗列各周期该部分记录）\n${line}\n\n${nonTechBlocks.join('\n\n')}`
		)
	}

	return parts.join('\n\n\n') || '（暂无学习任务正文）'
}
