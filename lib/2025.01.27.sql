-- 创建 ltn_cycle_time 表
CREATE TABLE ltn_cycle_time (
    start_time DATE COMMENT '记录的开始时间',
    end_time DATE COMMENT '记录的结束时间',
    serial_number VARCHAR(25) COMMENT 'LTN周期序号',
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);