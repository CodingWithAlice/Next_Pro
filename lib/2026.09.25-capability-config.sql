CREATE TABLE IF NOT EXISTS capability_config (
	id INT NOT NULL AUTO_INCREMENT,
	user_id INT NOT NULL,
	enabled_json TEXT NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (id),
	UNIQUE KEY uniq_capability_user (user_id)
);
