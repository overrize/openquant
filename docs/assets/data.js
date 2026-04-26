// Shared mock data for OpenQuant prototypes. No network calls.
window.OQ_DATA = (function () {
  const rng = (seed) => {
    let s = seed;
    return () => (s = (s * 9301 + 49297) % 233280) / 233280;
  };
  const r = rng(42);

  const stocks = [
    // A股
    { id:'600519', name:'贵州茅台', mkt:'A股', ccy:'CNY', price:1487.24, prev:1462.64, chg:24.60, pct:1.68 },
    { id:'601318', name:'中国平安', mkt:'A股', ccy:'CNY', price:57.92, prev:58.52, chg:-0.60, pct:-1.03 },
    { id:'600036', name:'招商银行', mkt:'A股', ccy:'CNY', price:39.52, prev:39.91, chg:-0.39, pct:-0.98 },
    { id:'000858', name:'五粮液', mkt:'A股', ccy:'CNY', price:101.86, prev:103.44, chg:-1.58, pct:-1.53 },
    { id:'002594', name:'比亚迪', mkt:'A股', ccy:'CNY', price:235.78, prev:229.10, chg:6.68, pct:2.92 },
    { id:'300750', name:'宁德时代', mkt:'A股', ccy:'CNY', price:244.20, prev:253.98, chg:-9.78, pct:-3.85 },
    // US
    { id:'AAPL', name:'Apple', mkt:'美股', ccy:'USD', price:231.44, prev:228.77, chg:2.67, pct:1.17 },
    { id:'NVDA', name:'NVIDIA', mkt:'美股', ccy:'USD', price:892.55, prev:865.34, chg:27.21, pct:3.14 },
    { id:'TSLA', name:'Tesla', mkt:'美股', ccy:'USD', price:182.66, prev:190.22, chg:-7.56, pct:-3.97 },
    { id:'MSFT', name:'Microsoft', mkt:'美股', ccy:'USD', price:431.02, prev:428.15, chg:2.87, pct:0.67 },
    // Crypto
    { id:'BTC', name:'Bitcoin', mkt:'加密', ccy:'USDT', price:68234.12, prev:66842.55, chg:1391.57, pct:2.08 },
    { id:'ETH', name:'Ethereum', mkt:'加密', ccy:'USDT', price:3542.80, prev:3580.22, chg:-37.42, pct:-1.04 },
    { id:'SOL', name:'Solana', mkt:'加密', ccy:'USDT', price:178.45, prev:169.80, chg:8.65, pct:5.09 },
    { id:'DOGE', name:'Dogecoin', mkt:'加密', ccy:'USDT', price:0.1622, prev:0.1685, chg:-0.0063, pct:-3.74 },
    // 期货
    { id:'AUS', name:'沪金次主连', mkt:'期货', ccy:'元/克', price:778.32, prev:774.50, chg:3.82, pct:0.49 },
    { id:'SCS', name:'原油次主连', mkt:'期货', ccy:'元/桶', price:532.60, prev:541.20, chg:-8.60, pct:-1.59 },
    // 港股
    { id:'0700.HK', name:'腾讯控股', mkt:'港股', ccy:'HKD', price:362.80, prev:358.40, chg:4.40, pct:1.23 },
    { id:'9988.HK', name:'阿里巴巴-W', mkt:'港股', ccy:'HKD', price:76.50, prev:78.05, chg:-1.55, pct:-1.99 },
  ];

  // sparkline points (24 each)
  stocks.forEach(s => {
    const pts = [];
    let v = s.prev;
    for (let i=0;i<24;i++) {
      v += (r()-0.48) * s.prev * 0.012;
      pts.push(v);
    }
    pts[pts.length-1] = s.price;
    s.spark = pts;
  });

  const news = [
    { time:'14:32', src:'路透社', tag:'宏观', title:'美联储Waller：通胀进展放缓，暂不宜降息', summary:'鹰派信号进一步推高美债收益率，风险资产承压；关注明日CPI数据。', impact:'美股', tone:'down' },
    { time:'13:48', src:'彭博', tag:'科技', title:'英伟达Blackwell超大客户订单超预期 Q3指引上调', summary:'四大云厂商合计下单达历史高位，AI芯片景气延续；供应链台积电CoWoS产能成瓶颈。', impact:'NVDA', tone:'up' },
    { time:'13:10', src:'证券时报', tag:'A股', title:'证监会：下一步将研究推出长期资金入市新政', summary:'险资、养老金权益投资比例有望进一步放宽；利好大盘蓝筹与高股息。', impact:'A股', tone:'up' },
    { time:'12:40', src:'CoinDesk', tag:'加密', title:'比特币现货ETF连续5日净流入 本周累计+12亿美元', summary:'机构配置需求回暖，BTC/ETH比价企稳，山寨季指数升至64。', impact:'BTC', tone:'up' },
    { time:'11:22', src:'界面', tag:'新能源', title:'宁德时代电池新品"麒麟2.0"发布 能量密度提升18%', summary:'同时宣布与蔚来、理想达成长期供货协议；上游锂价预期回暖。', impact:'300750', tone:'up' },
    { time:'10:05', src:'华尔街日报', tag:'宏观', title:'日本央行暗示7月可能加息 日元短线拉升', summary:'套息交易平仓风险上升，亚洲新兴市场波动加剧。', impact:'外汇', tone:'flat' },
  ];

  const signals = [
    { sym:'NVDA', side:'BUY', score:0.82, reason:'RSI突破60 + 成交放量 + LLM情绪+0.6', time:'14:28' },
    { sym:'TSLA', side:'SELL', score:-0.71, reason:'跌破20日均线 + 财报前避险', time:'14:12' },
    { sym:'BTC', side:'HOLD', score:0.34, reason:'多头动能持续但接近阻力', time:'14:01' },
    { sym:'600519', side:'BUY', score:0.58, reason:'北向资金连续3日净买入', time:'13:45' },
  ];

  const chatHistory = [
    { role:'user', text:'茅台今天为什么涨？' },
    { role:'ai', text:'贵州茅台今日+1.68%（1487.24），主要驱动：①北向资金净买入4.2亿，为本周最高；②白酒板块整体+1.3%，受一季报预期催化；③技术面突破5日/10日均线压制。', cards:[{kind:'quote', id:'600519'}] },
    { role:'user', text:'如果我买1手持到周五预期收益？' },
    { role:'ai', text:'基于20日历史波动率(σ=24.8%)和当前动能因子，模型估计周五收盘价区间 1472–1528（80%置信），期望收益 +0.9%。注意：风险敞口约 ±2.4%，建议设置止损 1452。', cards:[{kind:'scenario'}] },
  ];

  return { stocks, news, signals, chatHistory };
})();
