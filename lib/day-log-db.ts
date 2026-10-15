import { QueryTypes } from 'sequelize'
import { DayLogModal, IssueModal, TimeModal, sequelize } from 'db'
import { transOneDateToWhereOptions } from 'utils'

let tableReady: Promise<void> | null = null

export function ensureDayLogTable(): Promise<void> {
	if (!tableReady) {
		tableReady = (async () => {
			await sequelize.query(
				`CREATE TABLE IF NOT EXISTS day_log (
					id INT NOT NULL AUTO_INCREMENT,
					user_id INT NOT NULL,
					date DATE NOT NULL,
					routine_type_id INT NOT NULL,
					started_at DATETIME NOT NULL,
					ended_at DATETIME NULL,
					duration_min INT NULL,
					note VARCHAR(500) NULL,
					PRIMARY KEY (id),
					KEY idx_day_log_user_date (user_id, date)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
				{ type: QueryTypes.RAW }
			)
			await sequelize.query(
				'ALTER TABLE daily_issue_record MODIFY COLUMN work TEXT NULL',
				{ type: QueryTypes.RAW }
			)
			await sequelize.query(
				'ALTER TABLE daily_issue_record MODIFY COLUMN front TEXT NULL',
				{ type: QueryTypes.RAW }
			)
		})().catch((error) => {
			tableReady = null
			throw error
		})
	}
	return tableReady
}

/** 左侧时间和右侧工作都已经写入这一天时，删掉这一天的当场记录。 */
export async function deleteDayLogWhenArchived(userId: number, date: string) {
	await ensureDayLogTable()
	const day = String(date).slice(0, 10)
	const where = { userId, ...transOneDateToWhereOptions(day) }
	const timeCount = await TimeModal.count({ where })
	if (!timeCount) return
	const issue = await IssueModal.findOne({ where })
	const work = String(issue?.get('work') || '').trim()
	if (!work) return
	await DayLogModal.destroy({ where: { userId, date: day } })
}
