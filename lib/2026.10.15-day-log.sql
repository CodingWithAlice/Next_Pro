-- 当场记录。保存某一天的晨昏日志后只删除这一天。
-- work / front 要放下一天的句子，从 VARCHAR(255) 放宽到 TEXT。

CREATE TABLE IF NOT EXISTS day_log (
	id INT NOT NULL AUTO_INCREMENT,
	user_id INT NOT NULL,
	date DATE NOT NULL,
	routine_type_id INT NOT NULL,
	started_at DATETIME NOT NULL,
	ended_at DATETIME NULL,
	duration_min INT NULL,
	note VARCHAR(500) NULL,
	PRIMARY KEY (id),
	KEY idx_day_log_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='当场记录，写入晨昏日志后按天删除';

ALTER TABLE daily_issue_record MODIFY COLUMN work TEXT NULL;
ALTER TABLE daily_issue_record MODIFY COLUMN front TEXT NULL;
