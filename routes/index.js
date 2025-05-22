import express from 'express'
import { ready } from '../configs/db.js' // 你之前 export 的連線 Promise

const router = express.Router()

router.get('/', async (req, res, next) => {
  let dbStatus = '資料庫尚未連線'

  try {
    await ready
    dbStatus = '🐳 資料庫已成功連線'
  } catch (error) {
    dbStatus = '👻 資料庫連線失敗'
  }

  res.render('index', {
    title: 'Backend API',
    dbStatus, // 傳給模板
  })
})

export default router
