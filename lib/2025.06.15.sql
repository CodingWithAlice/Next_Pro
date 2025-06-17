-- 添加关联字段
ALTER TABLE `ltn_serial_time`
ADD COLUMN `spool` TEXT COMMENT '线轴的文案'

-- 修改 books_record 表中字段
ALTER TABLE books_record 
CHANGE COLUMN plans record TEXT COMMENT '感受记录',
CHANGE COLUMN chapter_id tag TEXT COMMENT '标签，例如"电影"、"书籍"、"话剧"';
CHANGE COLUMN first_time recent DATE COMMENT '最近一次时间',
CHANGE COLUMN second_time last_time DATE COMMENT '上一次时间';

MODIFY COLUMN tag VARCHAR(10) COMMENT '标签，例如"电影"、"书籍"、"话剧"';

-- 删除表格
DROP TABLE books_topic_record;