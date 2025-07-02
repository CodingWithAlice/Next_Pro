-- 插入 work 字段
ALTER TABLE `daily_issue_record`
ADD COLUMN `work` text COMMENT '工作'

-- 修改 duration 字段
ALTER TABLE ltn_cycle_list 
MODIFY COLUMN duration INT;