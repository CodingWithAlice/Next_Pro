-- 为 books_record 表添加图片URL字段
ALTER TABLE books_record
ADD COLUMN image_url VARCHAR(500) DEFAULT NULL COMMENT '图片URL或上传文件路径';

