-- 梦想罐子：梦想照片（每个罐子 1 张）
ALTER TABLE piggy_bank_jar
	ADD COLUMN image_url VARCHAR(500) NULL COMMENT '梦想照片URL';

