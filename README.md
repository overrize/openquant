# 量化盯盘

实时盯盘网站：**美股** + **A股** + **加密货币** 行情，支持实时价格与涨跌幅。

## 功能

- **美股**：通过 Finnhub WebSocket 实时成交价，REST 拉取前收价计算涨跌幅
- **A股**：通过东方财富网（push2.eastmoney.com）接口轮询实时行情，无需 API Key
- **加密货币**：通过 Binance WebSocket 实时价格与涨跌幅（无需 API Key）
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

## 数据源说明

| 类型     | 数据源        | 说明 |
|----------|---------------|------|
| 美股     | Finnhub       | 免费注册，WebSocket 实时成交 + REST 前收价 |
| A股      | 东方财富网     | 无需 Key，轮询 push2.eastmoney.com 个股接口（约 4 秒刷新） |
| 加密货币 | Binance 公开流 | 无需 Key，直接连接 Binance WebSocket |

## 默认标的

- **美股**：AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, AMD
- **A股**：贵州茅台、中国平安、招商银行、五粮液、比亚迪、宁德时代（可在 `src/types.ts` 的 `CN_STOCK_SYMBOLS` 中修改，格式为 `{ secid: '1.600519', code: '600519', name: '贵州茅台' }`，沪市 secid 以 1. 开头，深市以 0. 开头）
- **加密货币**：BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT

修改 `src/types.ts` 中的 `STOCK_SYMBOLS`、`CN_STOCK_SYMBOLS` 与 `CRYPTO_SYMBOLS` 可自定义列表。

## 技术栈

- Vite + React 18 + TypeScript
- Tailwind CSS
- Finnhub WebSocket / REST、东方财富 push2 接口、Binance WebSocket

## 注意事项

- Finnhub 免费版有调用频率限制，标的不宜过多。
- Binance 为海外站，国内访问可能需网络环境支持。
