-- 2026 年计划测试数据。已有相同标题的不重复插入。
-- 其他年份、其他用户不在这里写，页面里按 user_id + plan_year 另加。

INSERT INTO year_plan_item (
	user_id, plan_year, group_key, sort_order, title, kind, scene, ref_id,
	target_value, result_text, stages_json, created_at, updated_at
)
SELECT
	v.user_id, v.plan_year, v.group_key, v.sort_order, v.title, v.kind, v.scene, v.ref_id,
	v.target_value, v.result_text, v.stages_json, NOW(), NOW()
FROM (
	SELECT 9301 AS user_id, 2026 AS plan_year, 'sport' AS group_key, 0 AS sort_order, '今年完成跑步计划 3' AS title, 'run' AS kind, 'sport' AS scene, NULL AS ref_id, NULL AS target_value, NULL AS result_text, NULL AS stages_json
	UNION ALL SELECT 9301, 2026, 'sport', 1, '今年开启跑步计划 4（心率 150 以下跑 10km，课表未定）', 'run', 'sport', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'sport', 2, '150 天运动打卡', 'sport_days', NULL, NULL, 150, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'sport', 3, '体重 69kg 到 65kg', 'note', NULL, NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'sport', 4, '体脂 29% 到 26%', 'note', NULL, NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'sport', 5, '多睡觉', 'note', NULL, NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'travel', 6, '约尔太太 cos（4.18，已完成）', 'jar', 'piggy', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'travel', 7, '4 月风筝节（已划掉）', 'jar', 'piggy', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'travel', 8, '5.1 火山徒步（已完成）', 'jar', 'piggy', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'travel', 9, '6.17 端午邮轮（已完成）', 'jar', 'piggy', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'travel', 10, '9 月富士山（已划掉，政治问题）', 'jar', 'piggy', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'travel', 11, '黄山 / 其他山', 'jar', 'piggy', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'travel', 12, '鼻子微创', 'jar', 'piggy', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'travel', 13, '8 月洗牙', 'jar', 'piggy', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'travel', 14, '种睫毛', 'jar', 'piggy', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'travel', 15, '非洲大迁徙', 'jar', 'piggy', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'travel', 16, '内蒙古那达慕', 'jar', 'piggy', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'travel', 17, '梁静茹演唱会', 'jar', 'piggy', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'travel', 18, 'livehouse / 音乐节', 'jar', 'piggy', NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'media', 19, 'Friday movie night，一年 24 部', 'movie_count', NULL, NULL, 24, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'reading', 20, '整体读书', 'book_count', NULL, NULL, 20, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'ted', 21, '进行到 Round 5（Round 3 于 4.15 结束）', 'ted_round', NULL, NULL, 5, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'work', 22, 'B 站更新 4 条', 'note', NULL, NULL, NULL, NULL, NULL
	UNION ALL SELECT 9301, 2026, 'work', 23, '换一份工作，或赚更多钱', 'checklist', NULL, NULL, NULL, NULL, '[]'
	UNION ALL SELECT 9301, 2026, 'work', 24, '前端分享会 4 次以上', 'checklist', NULL, NULL, NULL, NULL, '[]'
	UNION ALL SELECT 9301, 2026, 'work', 25, '网站更新日志，以及移动端优化', 'checklist', NULL, NULL, NULL, NULL, '[{"id":"changelog","title":"更新日志","done":false},{"id":"mobile","title":"移动端优化","done":false}]'
	UNION ALL SELECT 9301, 2026, 'work', 26, '寻找产品设计的可能性', 'checklist', NULL, NULL, NULL, NULL, '[]'
	UNION ALL SELECT 9301, 2026, 'work', 27, 'Q3 对话式配置、新手引导、模板市场、付费机制', 'checklist', NULL, NULL, NULL, NULL, '[{"id":"chat-config","title":"对话式配置","done":false},{"id":"onboarding","title":"新手引导","done":false},{"id":"templates","title":"模板市场","done":false},{"id":"pay","title":"付费机制","done":false}]'
	UNION ALL SELECT 9301, 2026, 'work', 28, 'Q3 第一批外部用户邀请', 'checklist', NULL, NULL, NULL, NULL, '[{"id":"invite","title":"第一批外部用户邀请","done":false}]'
	UNION ALL SELECT 9301, 2026, 'work', 29, '继续每日复盘', 'note', NULL, NULL, NULL, '就是现在每天的日报', NULL
	UNION ALL SELECT 9301, 2026, 'work', 30, 'LTN 累计金币', 'ltn_coins', NULL, NULL, 1500, NULL, NULL
) v
LEFT JOIN year_plan_item existing
	ON existing.user_id = v.user_id AND existing.plan_year = v.plan_year AND existing.title = v.title
WHERE existing.id IS NULL;
