-- 新建 ltn_topic_level 表 用于存储当前题目定级
CREATE TABLE `ltn_topic_level` (
  `id` tinyint NOT NULL AUTO_INCREMENT COMMENT '级别ID',
  `desc` varchar(20) NOT NULL COMMENT '级别描述',
  `basic_duration` smallint NOT NULL COMMENT '基础间隔（天）',
  `max_duration` smallint NOT NULL COMMENT '最大间隔（天）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目分级配置表';

-- 插入数据
INSERT INTO `ltn_topic_level` (`id`, `desc`, `basic_duration`, `max_duration`) VALUES
(1, 'L1-核心架构', 7, 28),
(2, 'L2-高频API', 8, 32),
(3, 'L3-工作辅助', 9, 38),
(4, 'L4-冷门知识', 11, 42),
(5, 'L5-兴趣扩展', 13, 54);

-- 添加关联字段
ALTER TABLE `ltn_topic_list`
ADD COLUMN `level_id` tinyint NOT NULL DEFAULT 3 COMMENT '关联ltn_topic_level.id',
ADD COLUMN `custom_duration` smallint NULL COMMENT '自定义间隔（覆盖基础值）';

-- 添加外键约束
ALTER TABLE `ltn_topic_list`
ADD CONSTRAINT `fk_topic_level`
FOREIGN KEY (`level_id`) REFERENCES `ltn_topic_level` (`id`);