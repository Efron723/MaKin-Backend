import * as fs from 'fs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import createError from 'http-errors'
import express from 'express'
import logger from 'morgan'
import path from 'path'
import session from 'express-session'
import sessionMemoryStore from 'session-memory-store' // 使用 session-memory-store 模組
import axios from 'axios'
import dotenv from 'dotenv'
import querystring from 'querystring'
import { fileURLToPath, pathToFileURL } from 'url'

// 配置 dotenv
dotenv.config()

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET
const redirect_uri = 'https://makin-backend.vercel.app/callback'

// 修正 ESM 中的 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 讓 console.log 呈現檔案與行號
import { extendLog } from '#utils/tool.js'
import 'colors'
extendLog()

// 創建 Express 應用程式
const app = express()

// CORS 設定
app.use(
  cors({
    origin: ['https://makin-sound.vercel.app', 'https://accounts.spotify.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
)

// 設定視圖引擎
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// 記錄 HTTP 請求
app.use(logger('dev'))
// 解析 POST 與 PUT 請求的 JSON 格式資料
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
// 解析 Cookie 標頭
app.use(cookieParser())
// 提供靜態檔案
app.use(express.static(path.join(__dirname, 'public')))

// 使用 session-memory-store
const MemoryStore = sessionMemoryStore(session)
app.use(
  session({
    store: new MemoryStore(), // 使用 MemoryStore
    name: 'SESSION_ID',
    secret: process.env.SESSION_SECRET || 'default_secret',
    cookie: {
      maxAge: 30 * 86400000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
    resave: false,
    saveUninitialized: false,
  })
)

// Spotify 認證路由
app.get('/login', (req, res) => {
  const scope =
    'streaming user-read-email user-read-private ugc-image-upload user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-follow-modify user-follow-read user-read-playback-position user-top-read user-read-recently-played user-library-modify user-library-read'

  const authUrl =
    'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: spotify_client_id,
      scope: scope,
      redirect_uri: redirect_uri,
    })
  res.redirect(authUrl)
})

app.get('/callback', async (req, res) => {
  const code = req.query.code || null
  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
        client_id: spotify_client_id,
        client_secret: spotify_client_secret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    const { access_token, refresh_token } = response.data
    res.redirect(
      `https://makin-sound.vercel.app/auth/callback#access_token=${access_token}&refresh_token=${refresh_token}`
    )
  } catch (error) {
    res.send(error)
  }
})

// 載入路由檔案
const apiPath = '/api' // 預設路由
const routePath = path.join(__dirname, 'routes')

;(async () => {
  try {
    const filenames = await fs.promises.readdir(routePath)

    for (const filename of filenames) {
      const item = await import(pathToFileURL(path.join(routePath, filename)))
      const slug = filename.split('.')[0]
      app.use(`${apiPath}/${slug === 'index' ? '' : slug}`, item.default)
    }
  } catch (error) {
    console.error('Error loading routes:', error)
  }
})()

// 捕捉 404 錯誤
app.use((req, res, next) => {
  next(createError(404))
})

// 錯誤處理
app.use((err, req, res, next) => {
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  res.status(err.status || 500)
  res.status(500).send({ error: err })
})

export default app
