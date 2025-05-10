-- 新建 ted_list 表 用于存储 想要重刷的 TED 的列表
CREATE TABLE `ted_list` (
  `id` tinyint NOT NULL AUTO_INCREMENT COMMENT 'TED序号',
  `title` varchar(50) NOT NULL COMMENT 'TED标题',
  `times` smallint NOT NULL DEFAULT 0 COMMENT '次数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='TED标题列表';

-- 插入数据
INSERT INTO `ted_list` (`title`) VALUES
('如何解决焦虑'),
('不要因为“太渴望被关注”而失去了你的专注与创造力'),
('优秀的人是如何训练大脑的 | 学习思维方式！'),
('提升自信的技巧'),
('停止内耗！停止责怪自己！'),
('去运动吧，这是你对大脑最好的投资！'),
('为什么女性应该重视力量训练？'),
('如何停止过度思考'),
('社交媒体如何影响你的心理健康？'),
('如何让学习像打游戏一样让人上瘾？'),
('当你一直沉迷于垃圾快乐时，自律和自虐也救不了你'), 
('我如何实现一个又一个看似遥不可及的目标？'), 
('是什么拖住了你的行动？拖延症的根源 | 心理阻力'), 
('你有拖延症吗'), 
('做好奇宝宝，和恶习永别'), 
('做勇敢的女孩'), 
('做任何事情时，都要问自己三个问题！'), 
('你不必强迫自己积极向上'), 
('充满不确定性的未来，如何成为想要的自己? '), 
('成长的意义，就是寻找自己'), 
('请假装成功 ，你就会真的成功！'), 
('学会“毫不在意”，这能改变你的人生 '), 
('死亡教会我活着的意义'), 
('怎样成为一个精神强大的人'), 
('若想有所作为，请停止和别人比较！'), 
('为什么禁食能增强你的脑力？'), 
('真正的强大，是敢于面对那个脆弱、不完美的自己'), 
('我为什么可以天天这么快乐'), 
('我在100天的拒绝中学到了什么？'), 
('人生不只是要快乐'), 
('如何在没有信心、动力或治愈的情况下取得成功'), 
('性格的迷思 - 你究竟是谁')


-- 新建 ted_record 表 用于存储 TED听后感 记录
CREATE TABLE `ted_record` (
  `id` smallint NOT NULL AUTO_INCREMENT COMMENT '记录id',
  `ted_id` tinyint NOT NULL COMMENT 'TED ID',
  `record` TEXT COMMENT '感想',
  `date` DATE COMMENT '记录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='TED听后感';


-- 为 ted_record 添加唯一索引
ALTER TABLE ted_record
ADD UNIQUE KEY `ted_record` (`ted_id`, `date`);