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

CREATE TABLE running_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(50) NOT NULL COMMENT '计划名称：跑步计划1/2/3',
    run_type VARCHAR(20) NOT NULL COMMENT '跑步类型：匀速跑/变速跑/长跑',
    distance DECIMAL(5,2) NOT NULL COMMENT '距离(km)',
    target_times INT NOT NULL COMMENT '目标次数',
    current_times INT DEFAULT 0 COMMENT '当前完成次数',
    start_date DATE NOT NULL COMMENT '计划开始日期',
    end_date DATE NOT NULL COMMENT '计划结束日期',
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active' COMMENT '状态',
    target_heart_rate VARCHAR(20) DEFAULT NULL COMMENT '目标心率区间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_plan_name (plan_name),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='跑步计划表';