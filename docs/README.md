# OpenQuant · Redesign

针对量化盯盘平台的重新设计。**纸色 / 青涨品红跌 / 衬线大标题 / ⌘K 呼出菜单**。

## 入口

打开 `index.html`，从 8 张卡片跳到任意子页面：

| # | 页面 | 文件 |
|---|---|---|
| 01 | Design System | `design-system.html` |
| 02 | 盯盘主界面 | `dashboard.html` |
| 03 | K 线 / 个股详情 | `kline.html` |
| 04 | Agents & 策略 | `agents.html` |
| 05 | 学习中心 | `learn.html` |
| 06 | 移动端 | `mobile.html` |
| 07 | 登录 | `login.html` |
| 08 | 设置 | `settings.html` |

## 部署到 GitHub Pages

把整个 `docs/` 目录推到仓库后，在 **Settings → Pages**：

- Source: `Deploy from a branch`
- Branch: `main` （或 `design`）
- Folder: `/docs`

保存后 1–2 分钟，访问 `https://<user>.github.io/openquant/`。

## 推送命令

```bash
cd openquant-design
git init
git remote add origin https://github.com/overrize/openquant.git
git checkout -b design
git add .
git commit -m "redesign: paper aesthetic + 8 surfaces"
git push -u origin design
```

## 设计原则

1. **熵减** — 每多一个元素都要为信息增益负责
2. **克制** — 颜色只在涨跌、警告、当前选择时出现
3. **等宽对齐** — 数字 tabular-nums + SF Mono，跳动不撑行
4. **动画即信号** — 只有有意义的变化才动
5. **不预设情绪** — 青/品红代替红绿，色弱友好
6. **纸与屏** — 纸色底 + 衬线大标题，像读早报

— v2.0 · 2026
