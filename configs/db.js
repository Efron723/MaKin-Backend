import 'mysql2'
import { Sequelize } from 'sequelize'
import colors from 'colors'
import 'dotenv/config.js'
import applyModels from '../db-helpers/sequelize/models-setup.js'

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    timezone: '+08:00',
    define: {
      freezeTableName: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    },
  }
)

const ready = sequelize
  .authenticate()
  .then(() => {
    console.log(colors.bgGreen('INFO - 資料庫已連線 Database connected.'))
    return applyModels(sequelize)
  })
  .then(() => {
    console.log(
      colors.bgGreen('INFO - 所有模型已載入完成(如果表不存在建立該表)')
    )
  })
  .catch((error) => {
    console.log(
      colors.bgRed(
        'ERROR - 無法連線至資料庫 Unable to connect to the database.'
      )
    )
    console.error(error)
  })

export default sequelize
export { ready }
