-- 扩展 piggy_bank_pool：支持 status（待分配/已分配）、remark
-- 原 balance 转为 amount，待分配=可分配额度，已分配=历史记录

ALTER TABLE `piggy_bank_pool` ADD COLUMN `amount` decimal(12,2) NOT NULL DEFAULT 0 AFTER `id`;
ALTER TABLE `piggy_bank_pool` ADD COLUMN `status` enum('pending','allocated') NOT NULL DEFAULT 'pending' COMMENT 'pending=待分配 allocated=已分配';
ALTER TABLE `piggy_bank_pool` ADD COLUMN `remark` varchar(200) DEFAULT NULL COMMENT '备注';

UPDATE `piggy_bank_pool` SET `amount` = `balance`, `status` = 'pending';

ALTER TABLE `piggy_bank_pool` DROP COLUMN `balance`;
