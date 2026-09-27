-- 跑步计划与撸铁计划共用 running_plans。
-- target / current：跑步是次数，撸铁是容量 kg。
-- 已有行默认 sport_type = running，次数数值不变。

ALTER TABLE running_plans
	CHANGE COLUMN target_times target INT NOT NULL COMMENT '目标：跑步为次数，撸铁为容量kg',
	CHANGE COLUMN current_times current INT NOT NULL DEFAULT 0 COMMENT '当前：跑步为次数，撸铁为容量kg';

ALTER TABLE running_plans
	ADD COLUMN sport_type ENUM('running', 'resistance') NOT NULL DEFAULT 'running' COMMENT 'running=跑步 resistance=撸铁' AFTER plan_name;
