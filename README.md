# 量化盯盘

实时盯盘网站：**美股** + **A股** + **加密货币** 行情，支持实时价格与涨跌幅。

## 功能

- **美股**：通过 Finnhub WebSocket 实时成交价，REST 拉取前收价计算涨跌幅
- **A股**：通过东方财富网（push2.eastmoney.com）接口轮询实时行情，无需 API Key
- **加密货币**：通过 Binance WebSocket 实时价格与涨跌幅（无需 API Key）
- **贵金属·原油**：东方财富国内期货（沪金 元/克、沪银 元/千克、原油 元/桶），无需 API Key
- 涨跌颜色与价格更新闪烁效果
- 深色仪表盘风格

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置美股 API Key（可选）

- 加密货币无需配置，打开即可用。
- 美股需 [Finnhub](https://finnhub.io/register) 免费注册获取 API Key。
- 启动后点击右上角「设置」填入 Key 并保存。

### 3. 启动开发服务器

```bash
npm run dev
```

浏览器打开控制台显示的地址（一般为 `http://localhost:5173`）。

### 4. 构建生产版本

```bash
npm run build
npm run preview
```

### 5. 安装为 App（PWA）

当前项目已是 **PWA**，部署到 **HTTPS** 后：

- **手机/平板**：在浏览器中打开站点，使用「添加到主屏幕」或「安装应用」，即可像原生 App 一样使用，功能与网页一致。
- **桌面 Chrome**：地址栏右侧会出现「安装」图标，可安装为独立窗口应用。

无需打包或上架应用商店，安装后即可离线打开壳（具体行情仍需联网）。

## 数据源说明

| 类型     | 数据源        | 说明 |
|----------|---------------|------|
| 美股     | Finnhub       | 免费注册，WebSocket 实时成交 + REST 前收价 |
| A股      | 东方财富网     | 无需 Key，轮询 push2.eastmoney.com 个股接口（约 8 秒刷新）；K 线优先用 [Ashare](https://github.com/mpquant/Ashare) 同源（腾讯→新浪→东方财富） |
| 贵金属·原油 | 东方财富网   | 无需 Key，push2 期货/次主连（沪金 元/克、沪银 元/千克、原油 元/桶） |
| 加密货币 | Binance 公开流 | 无需 Key，直接连接 Binance WebSocket |

## 默认标的

- **美股**：AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, AMD
- **A股**：贵州茅台、中国平安、招商银行、五粮液、比亚迪、宁德时代（可在 `src/types.ts` 的 `CN_STOCK_SYMBOLS` 中修改，格式为 `{ secid: '1.600519', code: '600519', name: '贵州茅台' }`，沪市 secid 以 1. 开头，深市以 0. 开头）
- **加密货币**：BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT
- **贵金属·原油**：沪金次主连(113.aus)、沪银次主连(113.ags)、原油次主连(142.scs)，单位 元/克、元/千克、元/桶（见 `COMMODITY_SYMBOLS` / `COMMODITY_UNITS`）

修改 `src/types.ts` 中的 `STOCK_SYMBOLS`、`CN_STOCK_SYMBOLS`、`CRYPTO_SYMBOLS` 与 `COMMODITY_SYMBOLS` 可自定义列表。做成 App 的路线图见 `docs/APP_PLAN.md`。

## 技术栈

- Vite + React 18 + TypeScript
- Tailwind CSS
- Finnhub / Yahoo（美股 K 线）、腾讯+新浪+东方财富（A 股 K 线，兼容 [Ashare](https://github.com/mpquant/Ashare) 数据源）、Binance WebSocket

## 分享与发布（给别人使用）

### 免费发布成网站（私人仓库也适用）—— 推荐 Vercel / Netlify

**GitHub Pages 对私人仓库需付费**，用下面两种方式可以**免费**构建并发布，且**支持私人仓库**：

#### 用 Vercel（推荐，步骤最少）

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录。
2. 点击 **Add New… → Project**，选择你的**私人仓库**（如 `openquant`）。
3. 保持默认即可（Framework 自动识别为 Vite）：
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. 点 **Deploy**，等一两分钟。
5. 会得到一个地址：`https://你的项目名.vercel.app`，把链接发给别人即可打开使用。之后每次推送到 `main` 会自动重新部署。

#### 用 Netlify

1. 打开 [netlify.com](https://netlify.com)，用 GitHub 登录。
2. **Add new site → Import an existing project**，选 GitHub 后选择本仓库。
3. 填写：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. 部署完成后会得到 `https://随机名.netlify.app`，可改自定义子域名。

以上两种都**不收费**，私人仓库也可用，构建出的站点可随意分享链接给别人用。

---

### 其他方式

- **分享仓库**：把对方加为 Collaborator，对方 `git clone` 后 `npm install && npm run dev` 本地运行。
- **GitHub Pages**：仅当仓库为 **Public** 时免费；若改为公开仓库，可用仓库里自带的 `.github/workflows/deploy-pages.yml` 自动部署到 `https://用户名.github.io/仓库名/`。

## 注意事项

- Finnhub 免费版有调用频率限制，标的不宜过多。
- Binance 为海外站，国内访问可能需网络环境支持。
