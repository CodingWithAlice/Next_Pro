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

// 运动类型缓存
let sportCategoriesCache: string[] | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 缓存 5 分钟

/**
 * 获取运动课程类型列表（带缓存）
 */
async function getSportCategories(): Promise<string[]> {
	const now = Date.now();
	
	// 如果缓存有效，直接返回
	if (sportCategoriesCache && now < cacheExpiry) {
		return sportCategoriesCache;
	}

	try {
		const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
		const response = await fetch(`${baseUrl}/api/routine-types?sport=true&show=true`, {
			cache: 'no-store',
		});
		
		if (!response.ok) {
			throw new Error('Failed to fetch sport categories');
		}
		
		const data = await response.json();
		
		if (data.success && data.data) {
			sportCategoriesCache = data.data.map((item: any) => item.type);
			cacheExpiry = now + CACHE_DURATION;
			return sportCategoriesCache!; // 使用非空断言，因为上面刚赋值
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
 * @returns 解析结果，含 records 与未识别的课程名列表 unrecognizedClasses
 */
export async function parseSportText(text: string): Promise<ParseSportResult> {
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

	const sportCategories = await getSportCategories();
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
function parseSingleRecord(
	text: string,
	sportCategories: string[],
	unrecognizedCollector: string[]
): ParsedSportRecord | null {
	// 提取备注（括号内容）
	const notesMatch = text.match(/[（(]([^）)]+)[）)]/);
	const notes = notesMatch ? notesMatch[1] : null;
	const cleanText = text.replace(/[（(][^）)]+[）)]/g, '').trim();

	// 尝试匹配跑步
	const runningMatch = cleanText.match(/(匀速跑|变速跑|跑步|户外匀速跑|热身)\s*(\d+\.?\d*)\s*(km|公里)?/i);
	if (runningMatch && runningMatch[2]) {
		const category = runningMatch[1].includes('变速') ? '变速跑' : '匀速跑';
		const value = parseFloat(runningMatch[2]);
		if (!isNaN(value) && value > 0) {
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

