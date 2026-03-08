/**
 * 替代 cap copy：用 Node 将 dist 复制到 android assets/public，避免 Windows 上 ENOTEMPTY/EPERM
 * 执行后需再运行: npx cap update android
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const distDir = path.join(root, 'dist')
const publicDir = path.join(root, 'android/app/src/main/assets/public')

if (!fs.existsSync(distDir)) {
  console.error('dist/ 不存在，请先执行 npm run build')
  process.exit(1)
}

function rmRecursive(p) {
  if (!fs.existsSync(p)) return
  for (const name of fs.readdirSync(p)) {
    fs.rmSync(path.join(p, name), { recursive: true, force: true })
  }
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const name of fs.readdirSync(src)) {
    const srcPath = path.join(src, name)
    const destPath = path.join(dest, name)
    const stat = fs.statSync(srcPath)
    if (stat.isDirectory()) {
      copyRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

try {
  if (fs.existsSync(publicDir)) rmRecursive(publicDir)
  else fs.mkdirSync(publicDir, { recursive: true })
  copyRecursive(distDir, publicDir)
  console.log('Copied dist -> android/app/src/main/assets/public')
} catch (e) {
  if (e.code === 'EPERM' || e.message.includes('operation not permitted')) {
    console.error('')
    console.error('EPERM: 无法写入 android 目录。请先关闭 Android Studio 以及所有打开该目录的程序，再重试。')
    console.error('')
  }
  console.error(e.message)
  process.exit(1)
}
