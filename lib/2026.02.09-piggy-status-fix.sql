-- 修复 piggy_bank_jar 的 status 默认值，确保新罐子默认为 active
ALTER TABLE `piggy_bank_jar` 
MODIFY COLUMN `status` enum('active','abandoned') NOT NULL DEFAULT 'active';
