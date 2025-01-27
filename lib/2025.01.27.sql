-- 创建 ltn_serial_time 表
CREATE TABLE ltn_serial_time (
    start_time DATE COMMENT '记录的开始时间',
    end_time DATE COMMENT '记录的结束时间',
    serial_number INT COMMENT 'LTN周期序号',
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建 week_issue_record 表
CREATE TABLE week_issue_record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(25) COMMENT 'LTN周期序号',
    front_overview TEXT COMMENT '前端概况',
    front_well_done TEXT COMMENT '前端做得棒的地方',
    to_be_better TEXT COMMENT '可以做得更好的地方',
    sleep TEXT COMMENT '睡眠情况',
    sport TEXT COMMENT '运动情况',
    movie TEXT COMMENT '电影',
    improve_methods TEXT COMMENT '学习方法复盘和改进',
    well_done TEXT COMMENT '本周期做得不错的地方',
    next_week TEXT COMMENT '下周主要学习的内容',
);

-- 添加 create_at 和 update_at 字段
ALTER TABLE week_issue_record
ADD COLUMN  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

ALTER TABLE ltn_serial_time
ADD COLUMN  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP