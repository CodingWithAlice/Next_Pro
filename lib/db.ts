import { Sequelize, DataTypes, ModelDefined, Optional } from 'sequelize'
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
		show: DataTypes.BOOLEAN,
	},
	{
		tableName: 'routine_type',
		timestamps: false,
		underscored: true,
	}
)

export const TimeModal = sequelize.define(
	'daily_time_record',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		routineTypeId: DataTypes.INTEGER,
		date: {
			type: DataTypes.DATE,
			field: 'date', // 显式指定字段
		},
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
				fields: ['date', 'day_sort'], // 为 date 和 sort 字段组合设置唯一索引
			},
		],
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
			unique: true,
			field: 'date', // 显式指定字段
		},
	},
	{
		tableName: 'daily_issue_record',
		timestamps: false,
		underscored: true,
	}
)

interface SerialAttributes {
	id: number
	serialNumber: number
	startTime: Date
	endTime: Date
	created_at: Date
	updated_at: Date
	frontOverview: string
	frontWellDone: string
	toBeBetter: string
	sleep: string
	sport: string
	movie: string
	ted: string
	read: string
	improveMethods: string
	wellDone: string
	nextWeek: string
}

type SerialCreationAttributes = Optional<
	SerialAttributes,
	| 'id'
	| 'serialNumber'
	| 'startTime'
	| 'endTime'
	| 'created_at'
	| 'updated_at'
	| 'frontOverview'
	| 'frontWellDone'
	| 'toBeBetter'
	| 'sleep'
	| 'sport'
	| 'movie'
	| 'ted'
	| 'read'
	| 'improveMethods'
	| 'wellDone'
	| 'nextWeek'
>

export const SerialModal: ModelDefined<
	SerialAttributes,
	SerialCreationAttributes
> = sequelize.define(
	'ltn_serial_time',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		serialNumber: DataTypes.INTEGER,
		startTime: DataTypes.DATE,
		endTime: DataTypes.DATE,
		created_at: DataTypes.DATE,
		updated_at: DataTypes.DATE,
		frontOverview: DataTypes.STRING,
		frontWellDone: DataTypes.STRING,
		toBeBetter: DataTypes.STRING,
		sleep: DataTypes.STRING,
		sport: DataTypes.STRING,
		movie: DataTypes.STRING,
		ted: DataTypes.STRING,
		read: DataTypes.STRING,
		improveMethods: DataTypes.STRING,
		wellDone: DataTypes.STRING,
		nextWeek: DataTypes.STRING,
	},
	{
		tableName: 'ltn_serial_time',
		timestamps: true,
		underscored: true,
	}
)

// 关联关系1 每日 - 时间和事件 关联
IssueModal.hasMany(TimeModal, {
	foreignKey: 'date',
	sourceKey: 'date',
})
TimeModal.belongsTo(IssueModal, {
	foreignKey: 'date',
	targetKey: 'date',
})

// 关联关系2 - 每日时间 和 事项类别 关联
RoutineTypeModal.hasMany(TimeModal, {
	foreignKey: 'routineTypeId', // 多的相关联外键
	sourceKey: 'id', // 一的关联字段
})
TimeModal.belongsTo(RoutineTypeModal, {
	foreignKey: 'routineTypeId', // 多的那个
	targetKey: 'id', // 一个那个的主键
})
