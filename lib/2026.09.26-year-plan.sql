-- 年计划条目。按 user_id + plan_year 读取，不写死某一年。
-- 表已存在时这条不会改结构，也不会插入数据。

CREATE TABLE IF NOT EXISTS year_plan_item (
	id INT NOT NULL AUTO_INCREMENT,
	user_id INT NOT NULL COMMENT '用户',
	plan_year INT NOT NULL COMMENT '计划年份',
	group_key VARCHAR(32) NOT NULL COMMENT '大类：sport travel media reading ted work other',
	sort_order INT NOT NULL DEFAULT 0 COMMENT '同一年内的排序',
	title VARCHAR(200) NOT NULL COMMENT '计划标题',
	kind VARCHAR(32) NOT NULL COMMENT 'jar 零钱罐子；run 跑步计划；sport_days 运动天数；movie_count 电影部数；book_count 阅读本数；ted_round TED 当前轮；ltn_coins LTN 金币；note 无数据源；checklist 阶段勾选',
	scene VARCHAR(32) NULL COMMENT '关联场景。jar 为 piggy，run 为 sport，其余为空',
	ref_id INT NULL COMMENT '关联的罐子 id 或跑步计划中的一行 id。一条最多一个，可以先空着',
	target_value DECIMAL(12, 2) NULL COMMENT '统计类的今年目标。天数、部数、本数、轮次、金币',
	result_text TEXT NULL COMMENT '无数据源的结果句。写了内容即视为完成',
	stages_json TEXT NULL COMMENT '阶段勾选。JSON 数组，每项含 id、title、done',
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (id),
	KEY idx_year_plan_user_year (user_id, plan_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='年计划条目';
