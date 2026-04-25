-- 梦想罐子：相册图片（不单独建表，存 JSON 数组字符串）
ALTER TABLE piggy_bank_jar
	ADD COLUMN image_urls TEXT NULL COMMENT '相册图片URL列表(JSON数组字符串)';

