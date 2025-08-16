-- 插入 月报优化后新增的 字段
ALTER TABLE `month_issue_record`
ADD COLUMN `front_high_efficiency` text COMMENT '[效率峰值]可复用的方法论',
ADD COLUMN `front_low_efficiency` text COMMENT '[效率低谷]执行漏洞',
ADD COLUMN `process_month` text COMMENT '年度目标完成度'