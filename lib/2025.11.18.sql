CREATE TABLE sport_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('running', 'resistance', 'hiking', 'class') NOT NULL COMMENT '运动类型',
    date DATE NOT NULL COMMENT '运动日期',
    value DECIMAL(8,2) NOT NULL COMMENT '运动量值：跑步km/抗阻kg/徒步km/课程分钟',
    category VARCHAR(50) NOT NULL COMMENT '运动分类',
    sub_info VARCHAR(200) DEFAULT NULL COMMENT '补充信息',
    duration INT DEFAULT NULL COMMENT '运动时长(分钟)',
    notes TEXT DEFAULT NULL COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_date (date),
    INDEX idx_type (type),
    INDEX idx_type_date (type, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运动记录表';