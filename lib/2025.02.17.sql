-- 新建 books_record 和 books_topic_record 表
CREATE TABLE books_record (
    first_time DATE COMMENT '首次阅读时间',
    second_time DATE COMMENT '第二次阅读时间',
    title VARCHAR(255) COMMENT '书名',
    plans TEXT COMMENT '行动计划',
    chapter_id INT COMMENT '对应章节信息 Id',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE books_topic_record (
    chapter_id INT COMMENT '章节信息 Id',
    sort INT COMMENT '章节Id',
    first_time_topic TEXT COMMENT '第一次阅读重点',
    second_time_topic TEXT COMMENT '第二次阅读重点',
    changes TEXT COMMENT '聚焦差异',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

-- 上述两表 少写了 id 为主键
ALTER TABLE books_record
ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY

ALTER TABLE books_topic_record
ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY