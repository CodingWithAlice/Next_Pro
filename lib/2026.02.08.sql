-- 零钱罐子 - 梦想罐子表
CREATE TABLE IF NOT EXISTS `piggy_bank_jar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `balance` decimal(12,2) NOT NULL DEFAULT 0,
  `monthly_repayment` decimal(10,2) DEFAULT NULL COMMENT '月还款目标',
  `target_amount` decimal(12,2) DEFAULT NULL COMMENT '目标金额',
  `status` enum('active','abandoned') NOT NULL DEFAULT 'active',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='梦想罐子';

-- 待分配池
CREATE TABLE IF NOT EXISTS `piggy_bank_pool` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `balance` decimal(12,2) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='待分配池';

-- 初始化待分配池（仅当表为空时）
INSERT INTO `piggy_bank_pool` (`balance`, `created_at`, `updated_at`)
SELECT 0, NOW(), NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `piggy_bank_pool` LIMIT 1);
