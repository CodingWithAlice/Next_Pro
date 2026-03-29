-- 罐子满额关闭：分配金额达到所需金额时自动 status=completed，仅通过「按真实消费调整」可重开
ALTER TABLE `piggy_bank_jar`
MODIFY COLUMN `status` enum('active','abandoned','completed') NOT NULL DEFAULT 'active';
