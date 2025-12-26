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
 * 解析运动文本为运动记录数组
 * @param text 运动文本
 * @returns 解析后的运动记录数组
 */
export function parseSportText(text: string): ParsedSportRecord[] {
	if (!text || typeof text !== 'string') {
		return [];
	}

	// 预处理：去除空行，处理特殊标记
	const lines = text
		.split('\n')
		.map(line => line.trim())
		.filter(line => line && line !== '休' && line !== '/');

	if (lines.length === 0) {
		return [];
	}

	const records: ParsedSportRecord[] = [];

	// 处理每一行
	for (const line of lines) {
		// 按 +、、、, 分割组合记录
		const items = line.split(/[+、,]/).map(item => item.trim()).filter(item => item);

		for (const item of items) {
			const record = parseSingleRecord(item);
			if (record) {
				records.push(record);
			}
		}
	}

	return records;
}

/**
 * 解析单条运动记录
 */
function parseSingleRecord(text: string): ParsedSportRecord | null {
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

	// 尝试匹配课程 - 支持 "跳操 30min有氧"、"爬坡 25min" 等格式
	const classMatch = cleanText.match(/(跳操|搏击|瑜伽|踏板课|乒乓球|蹦床课|杠铃课|跳舞|舞力全开|有氧操|尊巴|肚皮舞|舞蹈课|跳大绳|团课|翘臀美腿团课|杠铃减脂|杠零臀腿|搏击课|搏击操|瑜伽课|爬坡|爬楼|爬楼梯)\s*(\d+)\s*(min|m|分钟|h|小时)/i);
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

	// 尝试匹配游泳（记录为备注）
	const swimMatch = cleanText.match(/游泳\s*(\d+)\s*(米|m)/i);
	if (swimMatch) {
		// 游泳暂不支持，记录为备注
		return {
			type: 'class',
			value: 0,
			category: '其他',
			notes: `游泳${swimMatch[1]}${swimMatch[2]}` + (notes ? `、${notes}` : ''),
		};
	}

	// 无法识别的记录，返回 null
	return null;
}

