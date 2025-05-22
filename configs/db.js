import { Sequelize } from 'sequelize'

// 讀取.env檔用
import 'dotenv/config.js'

import applyModels from '#db-helpers/sequelize/models-setup.js'

// 資料庫連結資訊
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

// 啟動時測試連線
sequelize
  .authenticate()
  .then(() => {
    console.log('INFO - 資料庫已連線 Database connected.'.bgGreen)
  })
  .catch((error) => {
    console.log(
      'ERROR - 無法連線至資料庫 Unable to connect to the database.'.bgRed
    )
    console.error(error)
  })

// 載入models中的各檔案
await applyModels(sequelize)
await sequelize.sync({})

console.log(
  'INFO - 所有模型已載入完成(如果表不存在建立該表) All models were synchronized successfully.'
    .bgGreen
)

// 輸出模組
export default sequelize
