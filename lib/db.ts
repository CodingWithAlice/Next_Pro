import { Sequelize, DataTypes } from 'sequelize';
import mysql2 from 'mysql2'

// const pool = mysql.createPool({
//   host: '127.0.0.1',
//   user: 'root',
//   password: 'localhost',
//   database: 'Daily',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// })

export const sequelize = new Sequelize('Daily', 'root', 'localhost', {
  host: 'localhost',
  dialect: 'mysql',
  dialectModule: mysql2,
})

export const RoutineTypeModal = sequelize.define('routine_type', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: DataTypes.STRING,
  des: DataTypes.STRING,
})
