// 运动类型
export type SportType = 'running' | 'resistance' | 'hiking' | 'class';

// 解析后的运动记录
export interface ParsedSportRecord {
	type: SportType;
	value: number;
	category: string;
	subInfo?: string | null;
	duration?: number | null;
	notes?: string | null;
}

/**
 * 获取运动课程类型列表（多用户：传入 userId 以使用该用户的类型，否则请求无认证会走主账号）
 * @param userId 当前用户 ID，用于请求 /api/routine-types 时携带 x-user-id
 */
async function getSportCategories(userId?: number): Promise<string[]> {
	try {
		const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		if (userId != null) {
			headers['x-user-id'] = String(userId);
		}
		const response = await fetch(`${baseUrl}/api/routine-types?sport=true`, {
			cache: 'no-store',
			headers,
		});
		
		if (!response.ok) {
			throw new Error('Failed to fetch sport categories');
		}
		
		const data = await response.json();
		
		if (data.success && data.data) {
			return data.data.map((item: any) => item.type);
		}
	} catch (error) {
		console.error('获取运动类型失败，使用默认列表:', error);
	}

	// 如果获取失败，返回默认列表（兜底）
	return [
		'踏板课', '蹦床课', '跳操', '尊巴课', '舞力全开', '跳大绳',
		'杠铃课',
		'搏击课',
		'舞蹈课',
		'瑜伽课', '普拉提',
		'乒乓球', '爬坡', '爬楼'
	];
}

/** 解析结果：仅使用已声明的运动类型，未识别的课程名会收集到 unrecognizedClasses */
export interface ParseSportResult {
	records: ParsedSportRecord[];
	unrecognizedClasses: string[];
}

/**
 * 解析运动文本为运动记录，仅匹配已声明的运动类型
 * @param text 运动文本
 * @param options.userId 当前用户 ID，用于按用户拉取运动类型列表（多用户必传，否则使用主账号类型）
 * @returns 解析结果，含 records 与未识别的课程名列表 unrecognizedClasses
 */
export async function parseSportText(
	text: string,
	options?: { userId?: number }
): Promise<ParseSportResult> {
	const empty: ParseSportResult = { records: [], unrecognizedClasses: [] };
	if (!text || typeof text !== 'string') {
		return empty;
	}

	// 预处理：去除空行，处理特殊标记
	const lines = text
		.split('\n')
		.map(line => line.trim())
		.filter(line => line && line !== '休' && line !== '/');

	if (lines.length === 0) {
		return empty;
	}

	const sportCategories = await getSportCategories(options?.userId);
	const records: ParsedSportRecord[] = [];
	const unrecognizedCollector: string[] = [];

	for (const line of lines) {
		const items = line.split(/[+、,]/).map(item => item.trim()).filter(item => item);

		for (const item of items) {
			const record = parseSingleRecord(item, sportCategories, unrecognizedCollector);
			if (record) {
				records.push(record);
			}
		}
	}

	return {
		records,
		unrecognizedClasses: [...new Set(unrecognizedCollector)],
	};
}

/**
 * 解析单条运动记录，仅使用已声明的类型；未识别的课程名写入 unrecognizedCollector
 */
/** 口语/别名统一到 routine_type 中的 type，便于匹配课程类正则 */
function normalizeSportAliases(input: string): string {
	return input.replace(/爬楼梯/g, '爬楼').trim();
}

function parseSingleRecord(
	text: string,
	sportCategories: string[],
	unrecognizedCollector: string[]
): ParsedSportRecord | null {
	// 提取备注（括号内容）
	const notesMatch = text.match(/[（(]([^）)]+)[）)]/);
	const notes = notesMatch ? notesMatch[1] : null;
	const cleanText = normalizeSportAliases(text.replace(/[（(][^）)]+[）)]/g, '').trim());

	// 尝试匹配跑步（含长跑）
	const runningMatch = cleanText.match(/(匀速跑|变速跑|长跑|跑步|户外匀速跑|热身)\s*(\d+\.?\d*)\s*(km|公里)?/i);
	if (runningMatch && runningMatch[2]) {
		const value = parseFloat(runningMatch[2]);
		if (!isNaN(value) && value > 0) {
			let category: string
			if (runningMatch[1].includes('长跑') || value > 5) {
				category = '长跑'
			} else if (runningMatch[1].includes('变速')) {
				category = '变速跑'
			} else {
				category = '匀速跑'
			}
			return {
				type: 'running',
				value,
				category,
				notes: notes || null,
			};
		}
	}

	// 尝试匹配抗阻（部位 + 重量）- 支持 "臀腿11000+" 这种格式（没有空格）
	const resistanceMatch = cleanText.match(/(臀腿|肩背|胸|背|全身|上肢|下肢|胸肌|腿臀|胸背|胸肩背|简单肩背|下肢正面|下肢背面|背面|肩部·全身|胸肌·全身|全身练)\s*(\d+)\s*(KG|kg|\+)?/i) ||
		cleanText.match(/(臀腿|肩背|胸|背|全身|上肢|下肢|胸肌|腿臀|胸背|胸肩背|简单肩背|下肢正面|下肢背面|背面|肩部·全身|胸肌·全身|全身练)(\d+)(KG|kg|\+)?/i);
	if (resistanceMatch) {
		const category = resistanceMatch[1];
		const value = parseInt(resistanceMatch[2], 10);
		
		// 提取台阶信息到备注
		const stepMatch = cleanText.match(/(\d+)\s*阶/);
		const stepNotes = stepMatch ? `爬${stepMatch[1]}阶` : null;
		const combinedNotes = [notes, stepNotes].filter(Boolean).join('、') || null;

		return {
			type: 'resistance',
			value,
			category,
			notes: combinedNotes || null,
		};
	}

	// 尝试匹配徒步 - 支持 "西湖散步 10km"、"散步 1h"、"散步7km/2h" 等格式
	const hikingMatch = cleanText.match(/(徒步|爬山|散步|暴走|毅行|古道|西湖|标毅线|老虎洞)(.*?)(\d+\.?\d*)\s*(km|公里|h|小时)/i) ||
		cleanText.match(/(徒步|爬山|散步|暴走|毅行|古道|西湖|标毅线|老虎洞)\s*(\d+\.?\d*)\s*(km|公里)/i);
	if (hikingMatch) {
		const location = hikingMatch[1];
		const value = parseFloat(hikingMatch[hikingMatch.length - 2]);
		const unit = hikingMatch[hikingMatch.length - 1]?.toLowerCase();
		
		// 如果是小时，需要从文本中提取距离，或者使用默认值
		let distance = value;
		if (unit === 'h' || unit === '小时') {
			// 尝试从文本中提取距离，如 "散步7km/2h"
			const distanceMatch = cleanText.match(/(\d+\.?\d*)\s*(km|公里)/i);
			if (distanceMatch) {
				distance = parseFloat(distanceMatch[1]);
			} else {
				// 如果没有距离，使用默认值或跳过
				return null;
			}
		}
		
		const subInfo = ['古道', '西湖', '老虎洞', '标毅线'].includes(location) ? location : null;
		const category = subInfo ? location : '徒步';

		return {
			type: 'hiking',
			value: distance,
			category,
			subInfo,
			notes: notes || null,
		};
	}

	// 爬楼（含「爬楼梯」别名）：库中类型为「爬楼」；裸数字时大数按台阶、≤180 按分钟，避免「爬楼 1030」被整条丢弃
	const stairCategory = '爬楼';
	if (sportCategories.includes(stairCategory)) {
		const stairMatch = cleanText.match(
			new RegExp(`^${stairCategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)(?:\\s*(阶|层|级|台阶))?\\s*$`, 'i')
		);
		if (stairMatch) {
			const n = parseInt(stairMatch[1], 10);
			if (!isNaN(n) && n > 0) {
				const hasStepSuffix = Boolean(stairMatch[2]);
				const asSteps = hasStepSuffix || n > 180;
				const stepNotes = asSteps ? `爬${n}阶` : null;
				const durationMin = asSteps ? Math.max(1, Math.round(n / 20)) : n;
				const combinedNotes = [notes, stepNotes].filter(Boolean).join('、') || null;
				return {
					type: 'class',
					value: durationMin,
					category: stairCategory,
					duration: durationMin,
					notes: combinedNotes || null,
				};
			}
		}
	}

	// 动态匹配课程 - 使用从数据库获取的类型列表
	// 转义特殊字符，构建正则表达式
	const escapedCategories = sportCategories.map(cat => 
		cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	);
	const categoryPattern = escapedCategories.join('|');
	const classRegex = new RegExp(`(${categoryPattern})\\s*(\\d+)\\s*(min|m|分钟|h|小时)`, 'i');
	
	const classMatch = cleanText.match(classRegex);
	if (classMatch) {
		const category = classMatch[1];
		let value = parseInt(classMatch[2], 10);
		const timeUnit = classMatch[3]?.toLowerCase();

		// 如果是小时，转换为分钟
		if (timeUnit === 'h' || timeUnit === '小时') {
			value = value * 60;
		}

		// 提取台阶信息到备注
		const stepMatch = cleanText.match(/(\d+)\s*阶/);
		const stepNotes = stepMatch ? `爬${stepMatch[1]}阶` : null;
		const combinedNotes = [notes, stepNotes].filter(Boolean).join('、') || null;

		return {
			type: 'class',
			value,
			category,
			duration: value, // 课程类型，value 就是时长
			notes: combinedNotes || null,
		};
	}

	// 游泳：未在课程类型中配置，只收集提示，不落表
	const swimMatch = cleanText.match(/游泳\s*(\d+)\s*(米|m)/i);
	if (swimMatch) {
		if (!unrecognizedCollector.includes('游泳')) {
			unrecognizedCollector.push('游泳');
		}
		return null;
	}

	// 形如「课程名 数字 min|分钟|h|小时」但课程名不在已声明列表中 → 收集提示，不落表
	const genericClassMatch = cleanText.match(/^(.+?)\s+(\d+)\s*(min|m|分钟|h|小时)/i);
	if (genericClassMatch) {
		const name = genericClassMatch[1].trim();
		if (!sportCategories.includes(name) && !unrecognizedCollector.includes(name)) {
			unrecognizedCollector.push(name);
		}
		return null;
	}

	return null;
}

