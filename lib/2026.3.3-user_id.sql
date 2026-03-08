SET @main_user_id = 9301;

-- 1. 添加 user_id 列
ALTER TABLE routine_type           ADD COLUMN user_id INT NOT NULL DEFAULT 9301;
ALTER TABLE daily_time_record      ADD COLUMN user_id INT NOT NULL DEFAULT 9301;
ALTER TABLE daily_issue_record     ADD COLUMN user_id INT NOT NULL DEFAULT 9301;
ALTER TABLE month_issue_record     ADD COLUMN user_id INT NOT NULL DEFAULT 9301;
ALTER TABLE books_record           ADD COLUMN user_id INT NOT NULL DEFAULT 9301;
ALTER TABLE ltn_serial_time        ADD COLUMN user_id INT NOT NULL DEFAULT 9301;
ALTER TABLE ted_list               ADD COLUMN user_id INT NOT NULL DEFAULT 9301;
ALTER TABLE ted_record             ADD COLUMN user_id INT NOT NULL DEFAULT 9301;
ALTER TABLE sport_records          ADD COLUMN user_id INT NOT NULL DEFAULT 9301;
ALTER TABLE piggy_bank_jar         ADD COLUMN user_id INT NOT NULL DEFAULT 9301;
ALTER TABLE piggy_bank_pool        ADD COLUMN user_id INT NOT NULL DEFAULT 9301;
ALTER TABLE running_plans          ADD COLUMN user_id INT NOT NULL DEFAULT 9301;


-- 3. daily_time_record：删除原唯一索引，添加 (user_id, date, day_sort) 唯一索引
ALTER TABLE daily_time_record DROP INDEX date_day_sort_unique;
ALTER TABLE daily_time_record ADD UNIQUE INDEX user_date_day_sort_unique (user_id, date, day_sort);

-- 4. daily_issue_record：删除 date 上的唯一约束，添加 (user_id, date) 唯一索引
ALTER TABLE daily_issue_record DROP INDEX date;
ALTER TABLE daily_issue_record ADD UNIQUE INDEX user_date_unique (user_id, date);
