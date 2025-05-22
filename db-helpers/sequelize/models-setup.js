import * as fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default async function applyModels(sequelize) {
  const modelsPath = path.join(__dirname, '../../models')
  console.log('🛠 Models path:', modelsPath)

  if (!fs.existsSync(modelsPath)) {
    console.error(`❌ Models 資料夾不存在：${modelsPath}`)
    return
  }

  const filenames = await fs.promises.readdir(modelsPath)

  for (const filename of filenames) {
    try {
      const item = await import(pathToFileURL(path.join(modelsPath, filename)))
      if (typeof item.default === 'function') {
        item.default(sequelize)
        console.log(`✅ 載入模型：${filename}`)
      } else {
        console.warn(`⚠️ 模型檔案 ${filename} 沒有 default export function`)
      }
    } catch (err) {
      console.error(`❌ 載入模型 ${filename} 失敗：`, err)
    }
  }
}
