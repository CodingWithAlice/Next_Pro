import { Sequelize, DataTypes } from 'sequelize'
import mysql2 from 'mysql2'

export const sequelize = new Sequelize('Daily', 'root', 'localhost', {
	host: 'localhost',
	dialect: 'mysql',
	dialectModule: mysql2,
})

export const RoutineTypeModal = sequelize.define(
	'routine_type',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		type: DataTypes.STRING,
		des: DataTypes.STRING,
	},
	{
		tableName: 'routine_type',
		timestamps: false,
		underscored: true,
	}
)

export const DailyModal = sequelize.define(
	'daily_time_record',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		routineTypeId: DataTypes.INTEGER,
		date: DataTypes.DATE,
		startTime: DataTypes.TIME,
		endTime: DataTypes.TIME,
		daySort: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		duration: DataTypes.INTEGER,
		weekday: DataTypes.STRING,
		interval: DataTypes.INTEGER,
	},
	{
		tableName: 'daily_time_record',
		timestamps: false,
		underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['date', 'day_sort'] // 为 date 和 sort 字段组合设置唯一索引
            }
        ]
	}
)

export const IssueModal = sequelize.define(
	'daily_issue_record',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		better: DataTypes.STRING,
		front: DataTypes.STRING,
		good1: DataTypes.STRING,
		good2: DataTypes.STRING,
		good3: DataTypes.STRING,
		reading: DataTypes.STRING,
		sport: DataTypes.STRING,
		ted: DataTypes.STRING,
		video: DataTypes.STRING,
		date: {
            type: DataTypes.DATE,
            unique: true
        }
	},
	{
		tableName: 'daily_issue_record',
		timestamps: false,
		underscored: true,
	}
)
