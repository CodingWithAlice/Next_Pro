-- 添加 sport 字段到 routine_type 表
ALTER TABLE `routine_type` 
ADD COLUMN `sport` TINYINT(1) DEFAULT 0 COMMENT '是否为运动相关的分类' AFTER `show`;

-- 插入运动课程类型数据（已去重优化）
INSERT INTO `routine_type` (`type`, `des`, `show`, `sport`) VALUES
-- 有氧课程类
('踏板课', '踏板课', 1, 1),
('蹦床课', '蹦床课', 1, 1),
('跳操', '跳操', 1, 1),
('尊巴课', '尊巴课', 1, 1),
('舞力全开', '舞力全开', 1, 1),
('跳大绳', '跳大绳', 1, 1),
-- 力量训练类
('杠铃课', '杠铃课', 1, 1),
-- 格斗类
('搏击课', '搏击课', 1, 1),
-- 舞蹈类
('舞蹈课', '舞蹈课', 1, 1),
-- 柔韧性类
('瑜伽课', '瑜伽课', 1, 1),
('普拉提', '普拉提', 1, 1),
-- 其他运动类
('乒乓球', '乒乓球', 1, 1),
('爬坡', '爬坡', 1, 1),
('爬楼', '爬楼', 1, 1)
ON DUPLICATE KEY UPDATE `sport` = VALUES(`sport`);
