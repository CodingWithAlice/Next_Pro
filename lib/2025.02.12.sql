-- 合并 SerialModal 和 WeekModal ，也就是 ltn_serial_time 和 week_issue_record 表，将 ltn_serial_time 表的数据迁移到 week_issue_record 表中

-- 1、查询
SELECT 
    ltn_serial_time.*,  -- 选择 A 表的所有列
    week_issue_record.*   -- 选择 B 表的所有列
FROM 
    ltn_serial_time
LEFT JOIN 
    week_issue_record ON ltn_serial_time.serial_number = week_issue_record.serial_number;
-- 2、在 ltn_serial_time 添加 week_issue_record 表的所有属性
ALTER TABLE `ltn_serial_time` 
ADD COLUMN  `front_overview` text COMMENT '前端概况',
ADD COLUMN  `front_well_done` text COMMENT '前端做得棒的地方',
ADD COLUMN  `to_be_better` text COMMENT '可以做得更好的地方',
ADD COLUMN  `sleep` text COMMENT '睡眠情况',
ADD COLUMN  `sport` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '运动情况',
ADD COLUMN  `movie` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '电影',
ADD COLUMN  `ted` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '电影',
ADD COLUMN  `read` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '电影',
ADD COLUMN  `improve_methods` text COMMENT '学习方法复盘和改进',
ADD COLUMN  `well_done` text COMMENT '本周期做得不错的地方',
ADD COLUMN  `next_week` text COMMENT '下周主要学习的内容'

-- 3、将 week_issue_record 表的数据迁移到 ltn_serial_time 表中
UPDATE ltn_serial_time
JOIN week_issue_record ON ltn_serial_time.serial_number = week_issue_record.serial_number
SET 
    ltn_serial_time.front_overview = week_issue_record.front_overview,
    ltn_serial_time.front_well_done = week_issue_record.front_well_done,
    ltn_serial_time.to_be_better = week_issue_record.to_be_better,
    ltn_serial_time.sleep = week_issue_record.sleep,
    ltn_serial_time.sport = week_issue_record.sport,
    ltn_serial_time.movie = week_issue_record.movie,
    ltn_serial_time.ted = week_issue_record.ted,
    ltn_serial_time.read = week_issue_record.read,
    ltn_serial_time.improve_methods = week_issue_record.improve_methods,
    ltn_serial_time.well_done = week_issue_record.well_done,
    ltn_serial_time.next_week = week_issue_record.next_week
WHERE ltn_serial_time.serial_number IS NOT NULL AND week_issue_record.serial_number IS NOT NULL;

-- 4、先把 week_issue_record 对应的 WeekModal 替换
-- 5、删除 week_issue_record 表