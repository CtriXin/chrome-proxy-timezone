const diagnosticsState = {
  uiLang: 'zh',
  theme: 'dark',
  selectedTabId: null,
  selectedTabUrl: '',
  availableTabs: [],
  routingLabLoaded: false,
  latestRisk: null,
  latestRiskDisplay: null,
  latestClaudeRisk: null,
  latestCross: null,
  latestSnapshot: null,
  latestRoutingRows: [],
  routingFilterCategory: 'all',
  routingOnlyAbnormal: false
};

const ROUTING_TARGETS = [
  { id: 'bytedance', name: 'ByteDance', url: 'https://www.bytedance.com/', traceUrl: '', category: 'CN' },
  { id: 'taobao', name: 'Taobao', url: 'https://www.taobao.com/', traceUrl: '', category: 'CN' },
  { id: 'wechat', name: 'WeChat', url: 'https://weixin.qq.com/', traceUrl: '', category: 'CN' },
  { id: 'zhihu', name: 'Zhihu', url: 'https://www.zhihu.com/', traceUrl: '', category: 'CN' },
  { id: 'bilibili', name: 'Bilibili', url: 'https://www.bilibili.com/', traceUrl: '', category: 'CN' },
  { id: 'cloudflare', name: 'Cloudflare', url: 'https://www.cloudflare.com/', traceUrl: 'https://www.cloudflare.com/cdn-cgi/trace', category: 'Global' },
  { id: 'notion', name: 'Notion', url: 'https://www.notion.so/', traceUrl: 'https://www.notion.so/cdn-cgi/trace', category: 'Global' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', traceUrl: 'https://www.perplexity.ai/cdn-cgi/trace', category: 'AI' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/', traceUrl: '', category: 'Global' },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/generate_204', traceUrl: '', category: 'Global' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/login', traceUrl: 'https://claude.ai/cdn-cgi/trace', category: 'AI' },
  { id: 'anthropic', name: 'Anthropic', url: 'https://api.anthropic.com/', traceUrl: '', category: 'AI' },
  { id: 'openai', name: 'OpenAI', url: 'https://openai.com/', traceUrl: 'https://openai.com/cdn-cgi/trace', category: 'AI' },
  { id: 'discord', name: 'Discord', url: 'https://discord.com/', traceUrl: '', category: 'Social' },
  { id: 'x', name: 'X', url: 'https://x.com/', traceUrl: 'https://x.com/cdn-cgi/trace', category: 'Social' },
  { id: 'reddit', name: 'Reddit', url: 'https://www.reddit.com/', traceUrl: '', category: 'Social' }
];

const ROUTING_CARD_IDS = ['cloudflare', 'claude', 'openai', 'x', 'github', 'youtube', 'bytedance', 'discord'];

const SECURITY_KEYS = [
  'is_vpn',
  'is_proxy',
  'is_tor',
  'is_datacenter',
  'is_relay',
  'is_anonymous',
  'is_attacker',
  'is_abuser',
  'is_threats',
  'is_bogon',
  'is_spam',
  'is_batch',
  'is_scanner',
  'is_botnet'
];

const SIGNAL_PANEL_FIELDS = [
  { key: 'hosting', labelKey: 'hosting', pick: (risk) => !!risk?.raw?.hosting, noteKey: 'signalHostingNote' },
  { key: 'mobile', labelKey: 'mobile', pick: (risk) => !!risk?.raw?.mobile, noteKey: 'signalMobileNote' },
  { key: 'proxy', labelKey: 'proxyFlag', pick: (risk) => !!risk?.is_proxy || !!risk?.raw?.proxy, noteKey: 'signalProxyNote' },
  { key: 'vpn', labelKey: 'vpnFlag', pick: (risk) => !!risk?.is_vpn, noteKey: 'signalVpnNote' },
  { key: 'tor', labelKey: 'torFlag', pick: (risk) => !!risk?.is_tor, noteKey: 'signalTorNote' }
];

const BADGE_LABEL_KEYS = {
  is_vpn: 'vpnFlag',
  is_proxy: 'proxyFlag',
  is_tor: 'torFlag',
  is_datacenter: 'dataCenter',
  is_relay: 'relayFlag',
  is_anonymous: 'anonymousFlag',
  is_attacker: 'attackerFlag',
  is_abuser: 'abuserFlag',
  is_threats: 'threatFlag',
  is_bogon: 'bogonFlag',
  is_spam: 'spamFlag',
  is_batch: 'batchFlag',
  is_scanner: 'scannerFlag',
  is_botnet: 'botnetFlag'
};

const DIAG_TEXT = {
  zh: {
    menu: '诊断中心',
    routingMenu: '分流实验室',
    title: '本地诊断中心',
    subtitle: '直接使用扩展自身的 background 与 page probe 数据，不走额外 worker 页面。',
    refreshLight: '刷新快照',
    refreshFull: '完整检测',
    refreshFullBusy: '完整检测中...',
    refreshLightBusy: '刷新中...',
    overview: '出口总览',
    overviewCurrent: '当前出口',
    overviewChina: '国内出口',
    overviewGlobal: '外网出口',
    overviewCf: 'Cloudflare',
    overviewClaude: 'Claude AI',
    overviewOpenDetail: '查看详情',
    overviewSnapshot: '来自当前快照',
    overviewReachable: '出口探测正常',
    overviewMismatch: '出口与当前快照不一致',
    focusTrust: 'Trust Score',
    focusClaude: 'Claude 可达性',
    focusDns: 'DNS 泄露',
    focusWebrtc: 'WebRTC 泄露',
    focusEnv: '时区 / 语言',
    focusHealthy: '正常',
    focusAttention: '关注',
    focusRisk: '风险',
    claude: 'Claude 可达性',
    network: '网络探测',
    privacy: '隐私与泄露',
    targetPageEnv: '目标页环境',
    localDeviceEnv: '本机环境',
    ipDetail: 'IP 详情',
    ipDetailOpen: '查看 IP 详情',
    securityTitle: '安全快照',
    crossTitle: '多源交叉校验',
    crossStatus: '多源一致性',
    crossMismatch: '不一致字段',
    crossGood: '主数据与外部源高度一致',
    crossWarn: '主数据与外部源部分不一致',
    crossBad: '主数据与外部源差异明显',
    crossSourcePrimary: 'Primary',
    crossSourceAlt1: 'ipapi.is',
    crossSourceAlt2: 'api.ip.sb',
    crossUnavailable: '外部源暂不可用',
    scoreExcellent: '非常干净',
    scoreGood: '较干净',
    scoreWatch: '需要观察',
    scoreRisky: '高风险',
    scoreExcellentDesc: '出口画像很自然，适合多数场景。',
    scoreGoodDesc: '整体可用，但仍建议结合站点特征复测。',
    scoreWatchDesc: '存在一定代理/机房信号，建议谨慎使用。',
    scoreRiskyDesc: '风险特征明显，容易触发站点风控。',
    trustTypeResidential: 'Residential-likely',
    trustTypeDatacenter: 'Datacenter',
    trustTypeProxy: 'Proxy-likely',
    trustTypeMobile: 'Mobile',
    recommendation: '结论与建议',
    targetTab: '检测目标页面',
    refreshTabs: '刷新标签页',
    noTabSelected: '未选择页面',
    targetHint: '这里选中的页面，就是时区 / 语言 / WebRTC / WebGL 实际检测对象。',
    targetFromPopup: '已默认锁定 popup 打开时的页面',
    claudeHint: '这里是出口级连通性探测，与所选页面无关；所选页面只影响时区 / 语言 / WebRTC / WebGL。',
    claudeWebLabel: 'Claude 公共入口',
    anthropicApiLabel: 'Anthropic API 根路径',
    anonymousRejected: '匿名访问被拒绝',
    rootPathNoPage: '根路径无页面',
    route: '路由一致性',
    reachable: '可达',
    failed: '失败',
    unauthorized: '可达但未授权',
    unknown: '未知',
    stable: '稳定',
    changed: '已变化',
    snapshotOnly: '缓存快照',
    probing: '探测中...',
    sampling: '采样中',
    completed: '完成',
    snapshotAge: '快照时间',
    exitIp: '出口 IP',
    country: '国家/地区',
    city: '城市',
    timezone: '时区',
    language: '语言',
    trustScore: 'Trust Score',
    isp: 'ISP / Org',
    asn: 'ASN',
    reverseDns: 'Reverse DNS',
    dnsResolver: 'DNS 出口',
    dnsStatus: 'DNS 状态',
    webrtcPrivate: 'WebRTC 私网 IP',
    webrtcPublic: 'WebRTC 公网 IP',
    webrtcStatus: 'WebRTC 状态',
    browserTimezone: '页面时区',
    browserLanguage: '页面语言',
    targetPage: '目标页',
    webgl: 'WebGL',
    canvas: 'Canvas 指纹',
    platform: '系统 / 浏览器',
    networkInfo: 'Network Info',
    claudeWeb: 'Claude Web',
    anthropicApi: 'Anthropic API',
    cloudflare: 'Cloudflare',
    google: 'Google',
    github: 'GitHub',
    traceCf: 'Cloudflare Trace',
    traceClaude: 'Claude Trace',
    routeSame: '与当前出口一致',
    routeMismatch: '与当前出口不一致',
    routeUnavailable: 'Trace 不可用',
    dnsProtected: '未发现明显 DNS 漂移',
    dnsWarning: 'Resolver 地理或运营商异常',
    webrtcProtected: '未发现明显 WebRTC 泄露',
    webrtcWarning: '发现 WebRTC 地址暴露',
    claudeProtected: 'Claude 公共入口可达',
    claudeWarning: 'Claude 有探测项失败',
    noIssue: '当前没有发现明显异常。',
    routingTitle: '分流实验室',
    routingSubtitle: '做网站连通性卡片和分流矩阵；只有带 trace/echo 的目标才会显示 Verified。',
    routingRun: '执行分流测试',
    routingRunBusy: '分流测试中...',
    loadingHint: '正在探测多个目标，请稍候...',
    routingCardsTitle: '网络连通性',
    routingTableTitle: '网站分流矩阵',
    routingTableHint: 'Verified 表示目标提供 trace/echo 类证据；Inferred 表示依据规则命中与连通性推断，不伪造精确 IP。',
    routingCategoryLabel: '分类筛选',
    routingOnlyAbnormal: '只看异常分流',
    routingColSite: '站点',
    routingColCategory: '分类',
    routingColStatus: '状态',
    routingColLatency: '延迟',
    routingColExit: '观测出口',
    routingColGeo: '地理',
    routingColRoute: '路由依据',
    routingColNode: '规则节点',
    routingColConfidence: '可信度',
    verified: 'Verified',
    inferred: 'Inferred',
    routeDirect: 'Direct',
    routeManual: 'Manual',
    routeSystem: 'System',
    routeAutoMiss: 'Auto (未命中规则)',
    routeViaProfile: '经节点',
    routeMatchedRule: '命中规则',
    routeNoNode: '无特定节点',
    abnormalSplit: '异常分流',
    region: '区域',
    district: '区域细分',
    zip: '邮编',
    countryCode: '国家代码',
    hostPtr: 'Host PTR',
    fakeIp: '虚假 IP',
    chinaDns: '中国 DNS',
    mobile: '移动网络',
    hosting: '机房 / 托管',
    proxyFlag: '代理特征',
    vpnFlag: 'VPN 特征',
    relayFlag: 'Relay',
    attackerFlag: 'Attacker',
    abuserFlag: 'Abuser',
    bogonFlag: 'Bogon',
    spamFlag: 'Spam',
    batchFlag: 'Batch',
    scannerFlag: 'Scanner',
    botnetFlag: 'Botnet',
    dataCenter: '数据中心',
    torFlag: 'Tor 网络',
    anonymousFlag: '匿名网络',
    threatFlag: '威胁记录',
    clean: '未检出',
    probeFailed: '检测失败',
    unsupported: '不支持',
    needWebPage: '需要打开一个普通网页标签页',
    notDetected: '未检测到',
    yes: '是',
    no: '否',
    mapUnavailable: '地图暂不可用',
    basicInfo: '基础信息',
    riskRating: '风险评级',
    securitySignals: '安全信号',
    geoCoord: '坐标',
    sourceError: '数据源异常',
    signalHostingNote: '常见于机房、云主机或托管网络。',
    signalMobileNote: '移动网络通常更接近真实用户环境。',
    signalProxyNote: '代理特征越强，越容易触发风控。',
    signalVpnNote: 'VPN 特征会提升被重点审查概率。',
    signalTorNote: 'Tor 网络通常直接触发高风险判断。',
    justNow: '刚刚',
    secondsAgo: '秒前',
    minutesAgo: '分钟前'
  },
  en: {
    menu: 'Diagnostics',
    routingMenu: 'Routing Lab',
    title: 'Local Diagnostics',
    subtitle: 'Use extension background and page probe data directly, without the extra worker page.',
    refreshLight: 'Refresh Snapshot',
    refreshFull: 'Run Full Scan',
    refreshFullBusy: 'Running Full Scan...',
    refreshLightBusy: 'Refreshing...',
    overview: 'Exit Overview',
    overviewCurrent: 'Current Exit',
    overviewChina: 'China Exit',
    overviewGlobal: 'Global Exit',
    overviewCf: 'Cloudflare',
    overviewClaude: 'Claude AI',
    overviewOpenDetail: 'View Detail',
    overviewSnapshot: 'From current snapshot',
    overviewReachable: 'Probe looks healthy',
    overviewMismatch: 'Observed exit differs from snapshot',
    focusTrust: 'Trust Score',
    focusClaude: 'Claude Reachability',
    focusDns: 'DNS Leak',
    focusWebrtc: 'WebRTC Leak',
    focusEnv: 'Timezone / Language',
    focusHealthy: 'Healthy',
    focusAttention: 'Watch',
    focusRisk: 'Risk',
    claude: 'Claude Reachability',
    network: 'Network Probe',
    privacy: 'Privacy & Leak',
    targetPageEnv: 'Target Page Environment',
    localDeviceEnv: 'Local Device Environment',
    ipDetail: 'IP Detail',
    ipDetailOpen: 'Open IP Detail',
    securityTitle: 'Security Snapshot',
    crossTitle: 'Cross-source Check',
    crossStatus: 'Cross-source Consistency',
    crossMismatch: 'Mismatch Fields',
    crossGood: 'Primary source aligns closely with external sources',
    crossWarn: 'Primary source only partially aligns with external sources',
    crossBad: 'Primary source differs notably from external sources',
    crossSourcePrimary: 'Primary',
    crossSourceAlt1: 'ipapi.is',
    crossSourceAlt2: 'api.ip.sb',
    crossUnavailable: 'External sources unavailable',
    scoreExcellent: 'Excellent',
    scoreGood: 'Good',
    scoreWatch: 'Needs Review',
    scoreRisky: 'Risky',
    scoreExcellentDesc: 'The exit profile looks natural for most scenarios.',
    scoreGoodDesc: 'Generally usable, but still re-test on important sites.',
    scoreWatchDesc: 'Some proxy/datacenter signals are present.',
    scoreRiskyDesc: 'Strong risk signals detected and likely to trigger checks.',
    trustTypeResidential: 'Residential-likely',
    trustTypeDatacenter: 'Datacenter',
    trustTypeProxy: 'Proxy-likely',
    trustTypeMobile: 'Mobile',
    recommendation: 'Conclusion & Advice',
    targetTab: 'Detection Target Page',
    refreshTabs: 'Refresh Tabs',
    noTabSelected: 'No page selected',
    targetHint: 'The selected page is the real target for timezone / language / WebRTC / WebGL checks.',
    targetFromPopup: 'Defaulted to the page that opened popup',
    claudeHint: 'These are exit-level probes and do not depend on the selected page. The selected page only affects timezone / language / WebRTC / WebGL.',
    claudeWebLabel: 'Claude Public Entry',
    anthropicApiLabel: 'Anthropic API Root',
    anonymousRejected: 'anonymous request rejected',
    rootPathNoPage: 'root path has no page',
    route: 'Route Consistency',
    reachable: 'Reachable',
    failed: 'Failed',
    unauthorized: 'Reachable but unauthorized',
    unknown: 'Unknown',
    stable: 'Stable',
    changed: 'Changed',
    snapshotOnly: 'Cached Snapshot',
    probing: 'Probing...',
    sampling: 'Sampling',
    completed: 'Done',
    snapshotAge: 'Snapshot Age',
    exitIp: 'Exit IP',
    country: 'Country',
    city: 'City',
    timezone: 'Timezone',
    language: 'Language',
    trustScore: 'Trust Score',
    isp: 'ISP / Org',
    asn: 'ASN',
    reverseDns: 'Reverse DNS',
    dnsResolver: 'DNS Resolver',
    dnsStatus: 'DNS Status',
    webrtcPrivate: 'WebRTC Private IPs',
    webrtcPublic: 'WebRTC Public IPs',
    webrtcStatus: 'WebRTC Status',
    browserTimezone: 'Page Timezone',
    browserLanguage: 'Page Language',
    targetPage: 'Target Page',
    webgl: 'WebGL',
    canvas: 'Canvas Hash',
    platform: 'OS / Browser',
    networkInfo: 'Network Info',
    claudeWeb: 'Claude Web',
    anthropicApi: 'Anthropic API',
    cloudflare: 'Cloudflare',
    google: 'Google',
    github: 'GitHub',
    traceCf: 'Cloudflare Trace',
    traceClaude: 'Claude Trace',
    routeSame: 'Matches exit IP',
    routeMismatch: 'Differs from exit IP',
    routeUnavailable: 'Trace unavailable',
    dnsProtected: 'No obvious DNS drift detected',
    dnsWarning: 'Resolver geo or provider looks abnormal',
    webrtcProtected: 'No obvious WebRTC leak detected',
    webrtcWarning: 'WebRTC exposed addresses',
    claudeProtected: 'Claude public entry looks reachable',
    claudeWarning: 'Some Claude probes failed',
    noIssue: 'No obvious issue detected.',
    routingTitle: 'Routing Lab',
    routingSubtitle: 'Build connectivity cards and a split matrix. Only targets with trace/echo evidence are marked Verified.',
    routingRun: 'Run Routing Lab',
    routingRunBusy: 'Running Routing Lab...',
    loadingHint: 'Probing multiple targets, please wait...',
    routingCardsTitle: 'Network Connectivity',
    routingTableTitle: 'Site Split Matrix',
    routingTableHint: 'Verified means the target exposes trace/echo style evidence. Inferred means the row is derived from rule matching plus reachability; no fake exact IP is shown.',
    routingCategoryLabel: 'Category Filter',
    routingOnlyAbnormal: 'Only show abnormal split',
    routingColSite: 'Site',
    routingColCategory: 'Category',
    routingColStatus: 'Status',
    routingColLatency: 'Latency',
    routingColExit: 'Observed Exit',
    routingColGeo: 'Geo',
    routingColRoute: 'Route Basis',
    routingColNode: 'Rule Node',
    routingColConfidence: 'Confidence',
    verified: 'Verified',
    inferred: 'Inferred',
    routeDirect: 'Direct',
    routeManual: 'Manual',
    routeSystem: 'System',
    routeAutoMiss: 'Auto (no rule match)',
    routeViaProfile: 'via profile',
    routeMatchedRule: 'Matched Rule',
    routeNoNode: 'No specific node',
    abnormalSplit: 'Abnormal Split',
    region: 'Region',
    district: 'District',
    zip: 'ZIP',
    countryCode: 'Country Code',
    hostPtr: 'Host PTR',
    fakeIp: 'Fake IP',
    chinaDns: 'China DNS',
    mobile: 'Mobile',
    hosting: 'Hosting',
    proxyFlag: 'Proxy Signal',
    vpnFlag: 'VPN Signal',
    relayFlag: 'Relay',
    attackerFlag: 'Attacker',
    abuserFlag: 'Abuser',
    bogonFlag: 'Bogon',
    spamFlag: 'Spam',
    batchFlag: 'Batch',
    scannerFlag: 'Scanner',
    botnetFlag: 'Botnet',
    dataCenter: 'Datacenter',
    torFlag: 'Tor',
    anonymousFlag: 'Anonymous',
    threatFlag: 'Threats',
    clean: 'Clean',
    probeFailed: 'Probe Failed',
    unsupported: 'Unsupported',
    needWebPage: 'Open a normal web page tab first',
    notDetected: 'Not Detected',
    yes: 'Yes',
    no: 'No',
    mapUnavailable: 'Map unavailable',
    basicInfo: 'Basic Info',
    riskRating: 'Risk Rating',
    securitySignals: 'Security Signals',
    geoCoord: 'Coordinates',
    sourceError: 'Source Error',
    signalHostingNote: 'Common for datacenter, cloud VM, or hosted networks.',
    signalMobileNote: 'Mobile exits often look closer to a real-user environment.',
    signalProxyNote: 'Strong proxy signals are easier to flag by risk systems.',
    signalVpnNote: 'VPN signals increase the chance of extra review.',
    signalTorNote: 'Tor usually lands in a high-risk bucket immediately.',
    justNow: 'just now',
    secondsAgo: 's ago',
    minutesAgo: 'm ago'
  }
};

function escapeText(value) {
  if (typeof escapeHtml === 'function') return escapeHtml(value);
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function diagText(key) {
  return (DIAG_TEXT[diagnosticsState.uiLang] || DIAG_TEXT.en)[key] || key;
}

function diag$(selector) {
  return document.querySelector(selector);
}

function diagId(id) {
  return document.getElementById(id);
}

function diagSetHtml(id, html) {
  const el = diagId(id);
  if (el) el.innerHTML = html;
}

function diagSetText(id, text) {
  const el = diagId(id);
  if (el) el.innerText = text;
}

function diagSetClassText(id, text, className) {
  const el = diagId(id);
  if (!el) return;
  el.innerText = text;
  if (className) el.className = className;
}

function setBusyButton(buttonId, busy, busyText, idleText) {
  const button = diagId(buttonId);
  if (!button) return;
  if (busy) {
    button.dataset.idleText = idleText || button.dataset.idleText || button.innerText;
    button.innerText = busyText;
    button.disabled = true;
    return;
  }
  button.disabled = false;
  button.innerText = idleText || button.dataset.idleText || button.innerText;
}

function diagRow(label, value, cls = '') {
  return `<div class="diag-row"><div class="diag-label">${escapeText(label)}</div><div class="diag-value ${cls}">${escapeText(value)}</div></div>`;
}

function yesNoText(value) {
  return value ? diagText('yes') : diagText('no');
}

function diagSendRuntime(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (res) => {
      if (chrome.runtime.lastError) {
        resolve({ error: chrome.runtime.lastError.message });
        return;
      }
      resolve(res || {});
    });
  });
}

function diagProbeUrl(url) {
  return diagSendRuntime({ action: 'probeEndpoint', url, options: {} });
}

function wildcardToRegExp(pattern) {
  const escaped = String(pattern || '')
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

function countryCodeToFlag(code) {
  const value = String(code || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(value)) return '';
  return String.fromCodePoint(...value.split('').map((char) => 127397 + char.charCodeAt(0)));
}

function prependFlag(text, countryCode) {
  const clean = String(text || '').trim();
  const flag = countryCodeToFlag(countryCode);
  if (!clean) return flag || '--';
  return flag ? `${flag} ${clean}` : clean;
}

function parseTraceValue(text) {
  if (!text) return '';
  const match = String(text).match(/(?:^|\n)ip=([^\n]+)/);
  return match ? match[1].trim() : '';
}

function parseDnsGeo(geo) {
  if (!geo) return { country: '', provider: '' };
  const [country, ...rest] = String(geo).split(' - ');
  return { country: (country || '').trim(), provider: rest.join(' - ').trim() };
}

function diagAgeText(ts) {
  if (!ts) return '--';
  const diff = Math.max(0, Date.now() - ts);
  if (diff < 5000) return diagText('justNow');
  if (diff < 60000) return `${Math.round(diff / 1000)} ${diagText('secondsAgo')}`;
  return `${Math.round(diff / 60000)} ${diagText('minutesAgo')}`;
}

function getTrustScoreMeta(score) {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) {
    return { tone: 'neutral', label: '--', desc: '--', value: 0 };
  }
  if (numeric >= 85) return { tone: 'good', label: diagText('scoreExcellent'), desc: diagText('scoreExcellentDesc'), value: numeric };
  if (numeric >= 65) return { tone: 'good', label: diagText('scoreGood'), desc: diagText('scoreGoodDesc'), value: numeric };
  if (numeric >= 45) return { tone: 'warn', label: diagText('scoreWatch'), desc: diagText('scoreWatchDesc'), value: numeric };
  return { tone: 'bad', label: diagText('scoreRisky'), desc: diagText('scoreRiskyDesc'), value: numeric };
}

function getTrustTypeTags(risk = {}) {
  const tags = [];
  if (risk.raw?.mobile) tags.push({ text: diagText('trustTypeMobile'), tone: 'good' });
  if (risk.is_datacenter || risk.raw?.hosting) tags.push({ text: diagText('trustTypeDatacenter'), tone: 'warn' });
  if (risk.is_proxy || risk.is_vpn || risk.raw?.proxy) tags.push({ text: diagText('trustTypeProxy'), tone: 'bad' });
  if (!tags.length) tags.push({ text: diagText('trustTypeResidential'), tone: 'good' });
  return tags;
}

function diagCacheSuffix(meta) {
  if (!meta?.cached) return '';
  return ` · ${diagText('snapshotOnly')} ${diagAgeText(meta.at)}${meta?.warming ? ' · refreshing' : ''}`;
}

function renderTrustScore(score, risk = null) {
  const meta = getTrustScoreMeta(score);
  const valueEl = diagId('diagTrustScoreValue');
  const labelEl = diagId('diagTrustScoreLabel');
  const badgeEl = diagId('diagTrustScoreBadge');
  const barEl = diagId('diagTrustScoreBar');
  const tagsEl = diagId('diagTrustTypeTags');
  if (valueEl) valueEl.innerText = Number.isFinite(Number(score)) ? String(Math.round(Number(score))) : '--';
  if (labelEl) labelEl.innerText = `${meta.desc}${diagCacheSuffix(risk?.__meta)}`;
  if (badgeEl) {
    badgeEl.innerText = meta.label;
    badgeEl.className = `diag-score-badge ${meta.tone}`;
  }
  if (barEl) {
    barEl.className = `diag-score-fill ${meta.tone}`;
    barEl.style.width = `${Math.max(0, Math.min(100, meta.value))}%`;
  }
  if (tagsEl) {
    const tags = risk ? getTrustTypeTags(risk) : [];
    tagsEl.innerHTML = tags.map((tag) => `<span class="diag-badge ${tag.tone === 'good' ? 'good' : tag.tone === 'warn' ? 'warn' : 'bad'}">${escapeText(tag.text)}</span>`).join('');
  }
}

function statusTone(level) {
  if (level === 'bad') return 'bad';
  if (level === 'warn') return 'warn';
  return 'good';
}

function compactOrg(value) {
  const text = String(value || '').trim();
  return text.length > 42 ? `${text.slice(0, 42)}...` : text;
}

function buildOverviewCard(card) {
  const tone = statusTone(card.tone);
  const dotTone = tone === 'good' ? '' : tone;
  const action = card.action
    ? `<div class="diag-overview-actions"><button class="diag-overview-action" type="button" data-diag-action="${escapeText(card.action)}">${escapeText(card.actionLabel || diagText('overviewOpenDetail'))}</button></div>`
    : '';
  return `
    <div class="diag-overview-card ${tone}">
      <div class="diag-overview-head">
        <div class="diag-overview-title">
          <span class="diag-overview-title-dot ${dotTone}"></span>
          <div class="diag-overview-name">${escapeText(card.title)}</div>
        </div>
        <div class="diag-overview-status">${escapeText(card.status)}</div>
      </div>
      <div class="diag-overview-ip">${escapeText(card.ip || '--')}</div>
      <div class="diag-overview-meta">
        <div class="diag-overview-primary">${escapeText(card.primary || '--')}</div>
        <div>${escapeText(card.secondary || '--')}</div>
        <div class="diag-overview-note">${escapeText(card.note || '--')}</div>
      </div>
      ${action}
    </div>
  `;
}

function buildFocusCard(card) {
  const tone = statusTone(card.tone);
  return `
    <div class="diag-focus-card ${tone}">
      <div class="diag-focus-label">${escapeText(card.label)}</div>
      <div class="diag-focus-value ${tone}">${escapeText(card.value)}</div>
      <div class="diag-focus-copy">${escapeText(card.copy)}</div>
      <div class="diag-focus-subcopy">${escapeText(card.subcopy)}</div>
    </div>
  `;
}

function renderOverviewDeck(cards) {
  diagSetHtml('diagOverviewDeck', cards.map(buildOverviewCard).join(''));
}

function renderFocusCards(cards) {
  diagSetHtml('diagFocusCards', cards.map(buildFocusCard).join(''));
}

function securityBadge(label, active) {
  return `<span class="diag-badge ${active ? 'bad' : 'good'}">${escapeText(label)}: ${escapeText(active ? diagText('yes') : diagText('clean'))}</span>`;
}

function makeMapUrl(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '';
  return `https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${lon},${lat}&z=4&l=map&size=650,320&pt=${lon},${lat},pm2rdm`;
}

function formatCoord(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '--';
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

function getRiskLatLon(risk = {}, cross = null) {
  const candidates = [
    [risk.lat, risk.lon],
    [cross?.ipapiis?.latitude, cross?.ipapiis?.longitude],
    [cross?.ipsb?.latitude, cross?.ipsb?.longitude]
  ];
  for (const [lat, lon] of candidates) {
    const nLat = Number(lat);
    const nLon = Number(lon);
    if (Number.isFinite(nLat) && Number.isFinite(nLon)) return { lat: nLat, lon: nLon };
  }
  return { lat: Number.NaN, lon: Number.NaN };
}

function firstFilled(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    return value;
  }
  return '';
}

function mergeRiskDisplay(primary = {}, cross = null, snapshot = null) {
  const base = primary && typeof primary === 'object' ? { ...primary } : {};
  const alt1 = cross?.ipapiis?.ok === false ? null : cross?.ipapiis;
  const alt2 = cross?.ipsb?.ok === false ? null : cross?.ipsb;
  const coord = getRiskLatLon(base, cross);
  const lat = Number(base.lat);
  const lon = Number(base.lon);

  return {
    ...base,
    ip: firstFilled(base.ip, snapshot?.currentExitIp, alt1?.ip, alt2?.ip),
    country: firstFilled(base.country, snapshot?.ipCountry, alt1?.country, alt2?.country),
    countryCode: firstFilled(base.countryCode, alt1?.countryCode, alt2?.countryCode),
    region: firstFilled(base.region, alt1?.region, alt2?.region),
    city: firstFilled(base.city, snapshot?.ipCity, alt1?.city, alt2?.city),
    zip: firstFilled(base.zip, alt1?.postal, alt2?.postal),
    timezone: firstFilled(base.timezone, snapshot?.ipTimezone),
    asn: firstFilled(base.asn, alt1?.asn, alt2?.asn),
    asOrganization: firstFilled(base.asOrganization, base.org, alt1?.org, alt1?.isp, alt2?.org, alt2?.isp),
    reverseDns: firstFilled(base.reverseDns),
    hostPtr: firstFilled(base.hostPtr),
    lat: Number.isFinite(lat) ? lat : coord.lat,
    lon: Number.isFinite(lon) ? lon : coord.lon
  };
}

function buildSignalPanels(risk = {}) {
  return SIGNAL_PANEL_FIELDS.map((field) => {
    const active = !!field.pick(risk);
    return `
      <div class="diag-signal-card ${active ? 'bad' : 'good'}">
        <div class="diag-signal-title">${escapeText(diagText(field.labelKey))}</div>
        <div class="diag-signal-value ${active ? 'bad' : 'good'}">${escapeText(active ? diagText('yes') : diagText('no'))}</div>
        <div class="diag-signal-note">${escapeText(diagText(field.noteKey))}</div>
      </div>
    `;
  }).join('');
}

function summarizeOrg(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getCrossCheckSummary(risk = {}, cross = null) {
  if (!cross) {
    return { tone: 'neutral', text: diagText('crossUnavailable'), matches: 0, total: 0, mismatches: [] };
  }

  const rows = [
    { label: diagText('country'), primary: risk.countryCode || risk.country, alt1: cross.ipapiis?.countryCode || cross.ipapiis?.country, alt2: cross.ipsb?.countryCode || cross.ipsb?.country },
    { label: diagText('city'), primary: risk.city, alt1: cross.ipapiis?.city, alt2: cross.ipsb?.city },
    { label: diagText('asn'), primary: risk.asn ? `AS${risk.asn}` : '', alt1: cross.ipapiis?.asn ? `AS${cross.ipapiis.asn}` : '', alt2: cross.ipsb?.asn ? `AS${cross.ipsb.asn}` : '' },
    { label: diagText('isp'), primary: risk.asOrganization, alt1: cross.ipapiis?.org || cross.ipapiis?.isp, alt2: cross.ipsb?.org || cross.ipsb?.isp }
  ];

  let matched = 0;
  let total = 0;
  const mismatches = [];
  rows.forEach((row) => {
    const base = String(row.primary || '').trim();
    if (!base) return;
    const options = [row.alt1, row.alt2].filter(Boolean).map((item) => String(item).trim());
    if (!options.length) return;
    total += 1;
    let rowMatched = false;
    if (row.label === diagText('isp')) {
      const baseOrg = summarizeOrg(base);
      rowMatched = options.some((item) => summarizeOrg(item).includes(baseOrg) || baseOrg.includes(summarizeOrg(item)));
    } else {
      rowMatched = options.includes(base);
    }
    if (rowMatched) matched += 1;
    else mismatches.push(row.label);
  });

  if (!total) return { tone: 'neutral', text: diagText('crossUnavailable'), matches: 0, total: 0, mismatches: [] };
  const ratio = matched / total;
  if (ratio >= 0.75) return { tone: 'good', text: diagText('crossGood'), matches: matched, total, mismatches };
  if (ratio >= 0.4) return { tone: 'warn', text: diagText('crossWarn'), matches: matched, total, mismatches };
  return { tone: 'bad', text: diagText('crossBad'), matches: matched, total, mismatches };
}

function renderCrossSourceBlock(title, data) {
  if (!data || data.ok === false) {
    return `
      <div class="diag-cross-card">
        <div class="diag-cross-card-head">
          <div class="diag-cross-card-title">${escapeText(title)}</div>
          <span class="diag-badge bad">${escapeText(diagText('sourceError'))}</span>
        </div>
        <div class="diag-cross-card-body">${escapeText(data?.error || diagText('crossUnavailable'))}</div>
      </div>
    `;
  }

  const rows = [
    [diagText('country'), data.countryCode || data.country || '--'],
    [diagText('city'), data.city || '--'],
    [diagText('asn'), data.asn ? `AS${data.asn}` : '--'],
    [diagText('isp'), data.org || data.isp || '--']
  ];

  return `
    <div class="diag-cross-card">
      <div class="diag-cross-card-head">
        <div class="diag-cross-card-title">${escapeText(title)}</div>
        <span class="diag-badge good">${escapeText(data.ip || '--')}</span>
      </div>
      <div class="diag-cross-card-body">
        ${rows.map((row) => `<div>${escapeText(row[0])}: <strong>${escapeText(row[1])}</strong></div>`).join('')}
      </div>
    </div>
  `;
}

function renderCrossCheck(prefix, risk = null, cross = null) {
  const summary = getCrossCheckSummary(risk || {}, cross);
  const summaryId = prefix ? `${prefix}CrossSummary` : 'diagCrossSummary';
  const rowsId = prefix ? `${prefix}CrossRows` : 'diagCrossRows';
  const sourcesId = prefix ? `${prefix}CrossSources` : 'diagCrossSources';

  diagSetClassText(summaryId, summary.text, `diag-cross-summary ${summary.tone}`);
  diagSetHtml(rowsId, [
    diagRow(diagText('crossStatus'), summary.total ? `${summary.matches}/${summary.total}` : '--', summary.tone === 'good' ? 'success' : summary.tone === 'warn' ? 'warn' : summary.tone === 'bad' ? 'danger' : ''),
    diagRow(diagText('crossMismatch'), summary.mismatches?.length ? summary.mismatches.join(', ') : '--', summary.mismatches?.length ? 'warn' : 'success'),
    diagRow(diagText('country'), risk?.countryCode || risk?.country || '--'),
    diagRow(diagText('city'), risk?.city || '--'),
    diagRow(diagText('isp'), risk?.asOrganization || '--')
  ].join(''));

  diagSetHtml(sourcesId, [
    renderCrossSourceBlock(diagText('crossSourcePrimary'), {
      ok: true,
      ip: risk?.ip,
      countryCode: risk?.countryCode,
      country: risk?.country,
      city: risk?.city,
      asn: risk?.asn,
      org: risk?.asOrganization
    }),
    renderCrossSourceBlock(diagText('crossSourceAlt1'), cross?.ipapiis),
    renderCrossSourceBlock(diagText('crossSourceAlt2'), cross?.ipsb)
  ].join(''));

  return summary;
}

function buildDiagOverviewCards({
  snapshot,
  risk,
  claudeRisk,
  cfTraceIp,
  claudeTraceIp,
  chinaIp,
  googleFmt
}) {
  const riskIp = risk?.ip || snapshot?.currentExitIp || '--';
  const riskGeo = prependFlag([risk?.country || snapshot?.ipCountry, risk?.city || snapshot?.ipCity].filter(Boolean).join(' / '), risk?.countryCode || '');
  const riskOrg = compactOrg(risk?.asOrganization || '--');
  const globalTone = cfTraceIp && risk?.ip && cfTraceIp !== risk.ip ? 'warn' : 'good';
  const claudeView = claudeRisk || risk || {};
  const claudeGeo = prependFlag([claudeView.country, claudeView.city].filter(Boolean).join(' / '), claudeView.countryCode || '');
  const claudeOrg = compactOrg(claudeView.asOrganization || risk?.asOrganization || '--');

  return [
    {
      title: diagText('overviewCurrent'),
      status: diagText('overviewSnapshot'),
      ip: riskIp,
      primary: riskGeo,
      secondary: riskOrg,
      note: diagText('overviewReachable'),
      tone: 'good',
      action: 'open-ip-detail',
      actionLabel: diagText('overviewOpenDetail')
    },
    {
      title: diagText('overviewGlobal'),
      status: googleFmt?.cls === 'danger' ? diagText('failed') : diagText('reachable'),
      ip: riskIp,
      primary: riskGeo,
      secondary: riskOrg,
      note: googleFmt?.text || diagText('overviewReachable'),
      tone: googleFmt?.cls === 'danger' ? 'bad' : 'good'
    },
    {
      title: diagText('overviewChina'),
      status: chinaIp?.ip ? diagText('reachable') : diagText('failed'),
      ip: chinaIp?.ip || '--',
      primary: prependFlag([chinaIp?.pro, chinaIp?.city].filter(Boolean).join(' / ') || '--', chinaIp?.proCode || ''),
      secondary: compactOrg(chinaIp?.addr || '--'),
      note: chinaIp?.ip === risk?.ip ? diagText('routeSame') : (chinaIp?.ip ? diagText('routeMismatch') : diagText('probeFailed')),
      tone: chinaIp?.ip ? (chinaIp.ip === risk?.ip ? 'good' : 'warn') : 'bad'
    },
    {
      title: diagText('overviewCf'),
      status: cfTraceIp ? diagText('reachable') : diagText('failed'),
      ip: cfTraceIp || '--',
      primary: prependFlag([risk?.country, risk?.asOrganization].filter(Boolean).join(' / '), risk?.countryCode || ''),
      secondary: compactOrg(risk?.asOrganization || '--'),
      note: cfTraceIp && risk?.ip && cfTraceIp === risk.ip ? diagText('routeSame') : (cfTraceIp ? diagText('routeMismatch') : diagText('probeFailed')),
      tone: cfTraceIp ? globalTone : 'bad'
    },
    {
      title: diagText('overviewClaude'),
      status: claudeTraceIp ? diagText('reachable') : googleFmt?.text || diagText('failed'),
      ip: claudeTraceIp || claudeView.ip || riskIp,
      primary: claudeGeo || riskGeo,
      secondary: claudeOrg,
      note: claudeTraceIp
        ? (claudeTraceIp === risk?.ip ? diagText('routeSame') : diagText('routeMismatch'))
        : (googleFmt?.text || diagText('probeFailed')),
      tone: claudeTraceIp ? (claudeTraceIp === risk?.ip ? 'good' : 'warn') : 'warn'
    }
  ];
}

function buildDiagFocusCards({
  risk,
  dnsEval,
  webrtcEval,
  claudeFmt,
  apiFmt,
  pageEnv,
  snapshot
}) {
  const trustMeta = getTrustScoreMeta(risk?.trust_score);
  const timezoneAligned = !!snapshot?.ipTimezone && pageEnv?.timezone === snapshot.ipTimezone;
  const languageAligned = !!snapshot?.ipLanguage && String(pageEnv?.language || '').startsWith(String(snapshot.ipLanguage || ''));
  const envTone = timezoneAligned && languageAligned ? 'good' : ((timezoneAligned || languageAligned) ? 'warn' : 'bad');
  const envCopy = timezoneAligned && languageAligned
    ? diagText('focusHealthy')
    : (timezoneAligned || languageAligned ? diagText('focusAttention') : diagText('focusRisk'));

  return [
    {
      label: diagText('focusTrust'),
      value: Number.isFinite(Number(risk?.trust_score)) ? `${Math.round(Number(risk.trust_score))}` : '--',
      copy: trustMeta.label,
      subcopy: trustMeta.desc,
      tone: trustMeta.tone === 'neutral' ? 'warn' : trustMeta.tone
    },
    {
      label: diagText('focusClaude'),
      value: claudeFmt?.cls === 'danger' || apiFmt?.cls === 'danger' ? diagText('focusAttention') : diagText('focusHealthy'),
      copy: claudeFmt?.text || '--',
      subcopy: apiFmt?.text || '--',
      tone: claudeFmt?.cls === 'danger' || apiFmt?.cls === 'danger' ? 'warn' : 'good'
    },
    {
      label: diagText('focusDns'),
      value: dnsEval?.safe ? diagText('focusHealthy') : diagText('focusAttention'),
      copy: dnsEval?.text || '--',
      subcopy: dnsEval?.safe ? diagText('dnsProtected') : diagText('dnsWarning'),
      tone: dnsEval?.safe ? 'good' : 'warn'
    },
    {
      label: diagText('focusWebrtc'),
      value: webrtcEval?.safe ? diagText('focusHealthy') : diagText('focusRisk'),
      copy: webrtcEval?.text || '--',
      subcopy: webrtcEval?.safe ? diagText('webrtcProtected') : diagText('webrtcWarning'),
      tone: webrtcEval?.safe ? 'good' : 'bad'
    },
    {
      label: diagText('focusEnv'),
      value: envCopy,
      copy: `${diagText('timezone')}: ${pageEnv?.timezone || '--'}`,
      subcopy: `${diagText('language')}: ${pageEnv?.language || '--'}`,
      tone: envTone
    }
  ];
}

function renderIpModal() {
  const risk = diagnosticsState.latestRiskDisplay || diagnosticsState.latestRisk;
  const cross = diagnosticsState.latestCross;
  if (!risk) return;

  const meta = getTrustScoreMeta(risk.trust_score);
  const coord = getRiskLatLon(risk, cross);
  const mapUrl = makeMapUrl(coord.lat, coord.lon);
  const map = diagId('diagIpModalMap');
  const fallback = diagId('diagIpModalMapFallback');
  const mapMeta = diagId('diagIpModalMapMeta');
  const riskBadge = diagId('diagIpModalRiskBadge');

  diagSetText('diagIpModalTitle', risk.ip || '--');
  diagSetText('diagIpModalSubtitle', [risk.country, risk.region, risk.city, risk.asOrganization].filter(Boolean).join(' / ') || '--');
  if (riskBadge) {
    riskBadge.innerText = meta.label;
    riskBadge.className = `diag-score-badge ${meta.tone}`;
  }
  if (map && fallback) {
    if (mapUrl) {
      map.onerror = () => {
        map.style.display = 'none';
        fallback.style.display = 'flex';
        fallback.innerText = diagText('mapUnavailable');
      };
      map.src = mapUrl;
      map.style.display = 'block';
      fallback.style.display = 'none';
    } else {
      map.removeAttribute('src');
      map.style.display = 'none';
      fallback.style.display = 'flex';
      fallback.innerText = diagText('mapUnavailable');
    }
  }
  if (mapMeta) mapMeta.innerText = `${diagText('geoCoord')}: ${formatCoord(coord.lat, coord.lon)}`;

  diagSetHtml('diagIpModalBasicRows', [
    diagRow(diagText('countryCode'), risk.countryCode || '--'),
    diagRow(diagText('country'), risk.country || '--'),
    diagRow(diagText('region'), risk.region || '--'),
    diagRow(diagText('city'), risk.city || '--'),
    diagRow(diagText('district'), risk.district || '--'),
    diagRow(diagText('zip'), risk.zip || '--'),
    diagRow(diagText('timezone'), risk.timezone || diagnosticsState.latestSnapshot?.ipTimezone || '--'),
    diagRow(diagText('asn'), risk.asn ? `AS${risk.asn}` : '--', 'mono'),
    diagRow(diagText('isp'), risk.asOrganization || '--'),
    diagRow(diagText('reverseDns'), risk.reverseDns || '--'),
    diagRow(diagText('hostPtr'), risk.hostPtr || '--')
  ].join(''));

  diagSetHtml('diagIpModalRiskPanel', `
    <div class="diag-risk-hero">
      <div class="diag-risk-score">${escapeText(Number.isFinite(Number(risk.trust_score)) ? String(Math.round(Number(risk.trust_score))) : '--')}</div>
      <div class="diag-score-total">/100</div>
    </div>
    <div class="diag-score-tags">${getTrustTypeTags(risk).map((tag) => `<span class="diag-badge ${tag.tone === 'good' ? 'good' : tag.tone === 'warn' ? 'warn' : 'bad'}">${escapeText(tag.text)}</span>`).join('')}</div>
    <div class="diag-score-bar"><div class="diag-score-fill ${meta.tone}" style="width:${Math.max(0, Math.min(100, Number(meta.value || 0)))}%"></div></div>
    <div class="diag-risk-copy">${escapeText(meta.desc)}</div>
    <div class="diag-rows">
      ${diagRow(diagText('fakeIp'), yesNoText(risk.fakeIp))}
      ${diagRow(diagText('chinaDns'), risk.chinaDns || '--')}
      ${diagRow(diagText('mobile'), yesNoText(risk.raw?.mobile))}
      ${diagRow(diagText('hosting'), yesNoText(risk.raw?.hosting))}
    </div>
  `);

  diagSetHtml('diagIpModalSignalPanels', buildSignalPanels(risk));
  diagSetHtml('diagIpModalBadges', SECURITY_KEYS.map((key) => securityBadge(diagText(BADGE_LABEL_KEYS[key] || key), !!risk[key])).join(''));
  renderCrossCheck('diagIpModal', risk, cross);
}

function openIpModal() {
  if (!diagnosticsState.latestRiskDisplay && !diagnosticsState.latestRisk) return;
  renderIpModal();
  const modal = diagId('diagIpModal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
  document.body.style.overflow = 'hidden';
}

function closeIpModal() {
  const modal = diagId('diagIpModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}

function matchRouteForHost(hostname, config) {
  const mode = config.proxyMode || 'system';
  const profiles = Array.isArray(config.proxyProfiles) ? config.proxyProfiles : [];
  const active = profiles.find((item) => item.id === config.activeProfileId) || profiles[0];

  if (mode === 'direct') return { basis: diagText('routeDirect'), node: diagText('routeNoNode'), matchedRule: '' };
  if (mode === 'system') return { basis: diagText('routeSystem'), node: diagText('routeNoNode'), matchedRule: '' };
  if (mode === 'manual') {
    return {
      basis: active ? `${diagText('routeManual')} · ${diagText('routeViaProfile')} ${active.name || active.host || active.id}` : diagText('routeManual'),
      node: active?.name || active?.host || active?.id || diagText('routeNoNode'),
      matchedRule: ''
    };
  }

  const rules = Array.isArray(config.rules) ? config.rules : [];
  for (const rule of rules) {
    try {
      if (wildcardToRegExp(rule.pattern).test(hostname)) {
        const profile = profiles.find((item) => item.id === rule.profileId);
        return {
          basis: profile ? `Auto · ${diagText('routeViaProfile')} ${profile.name || profile.host || profile.id}` : `Auto · ${rule.pattern}`,
          node: profile?.name || profile?.host || profile?.id || diagText('routeNoNode'),
          matchedRule: rule.pattern || ''
        };
      }
    } catch (error) {}
  }

  return { basis: diagText('routeAutoMiss'), node: diagText('routeNoNode'), matchedRule: '' };
}

function latencyTone(latency) {
  if (!Number.isFinite(latency)) return 'bad';
  if (latency <= 180) return 'good';
  if (latency <= 450) return 'mid';
  return 'bad';
}

function qualityScore(latency) {
  if (!Number.isFinite(latency)) return { tone: 'bad', active: 1 };
  if (latency <= 90) return { tone: 'good', active: 5 };
  if (latency <= 180) return { tone: 'good', active: 4 };
  if (latency <= 360) return { tone: 'mid', active: 3 };
  if (latency <= 720) return { tone: 'mid', active: 2 };
  return { tone: 'bad', active: 1 };
}

function buildDots(latency) {
  const score = qualityScore(latency);
  return new Array(5).fill(0).map((_, index) => {
    const cls = index < score.active ? `routing-dot active ${score.tone}` : 'routing-dot';
    return `<span class="${cls}"></span>`;
  }).join('');
}

function buildProgressDots(results, total, scanIndex = -1) {
  return new Array(total).fill(0).map((_, index) => {
    if (index < results.length) {
      const result = results[index];
      if (result?.ok && Number.isFinite(result.latency)) {
        const tone = latencyTone(result.latency);
        return `<span class="routing-dot active ${tone}"></span>`;
      }
      return '<span class="routing-dot failed"></span>';
    }
    if (index === scanIndex) return '<span class="routing-dot pending scanning"></span>';
    return '<span class="routing-dot"></span>';
  }).join('');
}

async function sampleProbe(url, attempts = 5, onProgress = null) {
  const results = [];
  for (let index = 0; index < attempts; index += 1) {
    if (onProgress) onProgress({ phase: 'before', attempt: index + 1, attempts, results: results.slice() });
    const result = await diagProbeUrl(url);
    results.push(result);
    if (onProgress) onProgress({ phase: 'after', attempt: index + 1, attempts, result, results: results.slice() });
  }

  const successes = results.filter((item) => item && item.ok && Number.isFinite(item.latency));
  const latencies = successes.map((item) => item.latency).sort((a, b) => a - b);
  const medianLatency = latencies.length ? latencies[Math.floor(latencies.length / 2)] : Number.NaN;
  const representative = successes.length
    ? successes.find((item) => item.latency === medianLatency) || successes[0]
    : (results.find((item) => item) || { ok: false, error: 'probe_failed' });

  return {
    representative: {
      ...representative,
      latency: Number.isFinite(medianLatency) ? medianLatency : representative.latency
    },
    attempts,
    successes: successes.length,
    results
  };
}

function formatProbe(result, kind = 'generic') {
  if (!result) return { text: diagText('unknown'), cls: 'neutral' };
  if (result.error || result.ok === false) return { text: diagText('failed'), cls: 'danger' };
  if (result.status === 401 || result.status === 403) {
    return { text: `${diagText('reachable')} (HTTP ${result.status}, ${result.latency || '--'}ms · ${diagText('anonymousRejected')})`, cls: 'success' };
  }
  if (result.status === 404 && kind === 'anthropic_api') {
    return { text: `${diagText('reachable')} (HTTP 404, ${result.latency || '--'}ms · ${diagText('rootPathNoPage')})`, cls: 'success' };
  }
  return { text: `${diagText('reachable')} (HTTP ${result.status || 200}, ${result.latency || '--'}ms)`, cls: 'success' };
}

function confidenceChip(text, tone) {
  return `<span class="routing-chip ${tone}">${escapeText(text)}</span>`;
}

function categoryChip(category) {
  const tone = String(category || 'neutral').toLowerCase();
  return `<span class="routing-chip ${tone}">${escapeText(category)}</span>`;
}

function isRoutingAbnormal(entry, exitIp) {
  if (!entry) return false;
  if (!entry.ok) return true;
  if (entry.traceIp && exitIp && entry.traceIp !== exitIp) return true;
  return false;
}

function applyRoutingFilters() {
  const category = diagnosticsState.routingFilterCategory;
  const onlyAbnormal = diagnosticsState.routingOnlyAbnormal;
  const stateMap = new Map(diagnosticsState.latestRoutingRows.map((entry) => [entry.id, entry]));
  document.querySelectorAll('.routing-row, .routing-card').forEach((node) => {
    const entryId = node.getAttribute('data-routing-id') || '';
    const entryCategory = node.getAttribute('data-category') || '';
    const entry = stateMap.get(entryId);
    const showCategory = category === 'all' || entryCategory === category;
    const showAbnormal = !onlyAbnormal || !!entry?.abnormal;
    node.classList.toggle('hidden', !(showCategory && showAbnormal));
  });
}

function renderRoutingFilters() {
  const container = diagId('routingCategoryFilters');
  if (!container) return;
  const categories = ['all', 'CN', 'Global', 'AI', 'Social'];
  container.innerHTML = categories.map((category) => {
    const active = diagnosticsState.routingFilterCategory === category;
    const label = category === 'all' ? 'All' : category;
    return `<button class="routing-filter-chip ${active ? 'active' : ''}" type="button" data-routing-category="${escapeText(category)}">${escapeText(label)}</button>`;
  }).join('');
}

async function renderRoutingLab() {
  setBusyButton('runRoutingLabBtn', true, `${diagText('routingRunBusy')} 0/${ROUTING_TARGETS.length}`, diagText('routingRun'));
  diagSetText('routingSubtitle', diagText('loadingHint'));
  const config = await chrome.storage.local.get(['proxyMode', 'proxyProfiles', 'activeProfileId', 'rules']);
  const snapshotRes = await diagSendRuntime({ action: 'probeExit', mode: 'light' });
  const exitRiskRes = await diagSendRuntime({ action: 'fetchIprisk', ip: '' });
  const snapshot = snapshotRes?.snapshot || {};
  const exitRisk = exitRiskRes?.data || {};
  const exitIp = snapshot.currentExitIp || '--';
  const exitCountryCode = exitRisk.countryCode || '';
  const exitGeo = prependFlag([exitRisk.country || snapshot.ipCountry, exitRisk.asOrganization].filter(Boolean).join(' / '), exitCountryCode);
  diagnosticsState.latestRoutingRows = [];

  renderRoutingFilters();

  diagSetHtml('routingCards', ROUTING_TARGETS.filter((target) => ROUTING_CARD_IDS.includes(target.id)).map((target) => `
    <div class="routing-card" id="routing-card-${target.id}" data-category="${escapeText(target.category)}" data-routing-id="${escapeText(target.id)}">
      <div class="routing-card-meta">
        ${categoryChip(target.category)}
        <span id="routing-card-status-${target.id}" class="routing-chip neutral">${escapeText(`${diagText('sampling')} 0/5`)}</span>
      </div>
      <div class="routing-card-top">
        <div class="routing-card-name">${escapeText(target.name)}</div>
        <div id="routing-card-latency-${target.id}" class="routing-card-latency pending">--</div>
      </div>
      <div class="routing-dots" id="routing-card-dots-${target.id}">${buildProgressDots([], 5, 0)}</div>
      <div class="routing-card-foot">
        <div id="routing-card-note-${target.id}" class="mini-muted">${escapeText(diagText('probing'))}</div>
        <div id="routing-card-node-${target.id}" class="routing-mini-node">--</div>
      </div>
    </div>
  `).join(''));

  diagSetHtml('routingTableBody', ROUTING_TARGETS.map((target) => {
    const routeDecision = matchRouteForHost(new URL(target.url).host, config);
    return `
      <tr id="routing-row-${target.id}" class="routing-row" data-category="${escapeText(target.category)}" data-routing-id="${escapeText(target.id)}">
        <td>${escapeText(target.name)}</td>
        <td>${categoryChip(target.category)}</td>
        <td id="routing-status-${target.id}">${escapeText(diagText('probing'))}</td>
        <td id="routing-latency-${target.id}">--</td>
        <td id="routing-exit-${target.id}">--</td>
        <td id="routing-geo-${target.id}">--</td>
        <td id="routing-route-${target.id}">${escapeText(routeDecision.basis)}</td>
        <td id="routing-node-${target.id}">${escapeText(routeDecision.node)}</td>
        <td id="routing-confidence-${target.id}">${confidenceChip(diagText('inferred'), 'neutral')}</td>
      </tr>
    `;
  }).join(''));

  applyRoutingFilters();

  let completedTargets = 0;
  await Promise.all(ROUTING_TARGETS.map(async (target) => {
    const routeDecision = matchRouteForHost(new URL(target.url).host, config);
    const isCard = ROUTING_CARD_IDS.includes(target.id);
    const [probePack, traceRes] = await Promise.all([
      sampleProbe(target.url, 5, ({ phase, attempt, attempts, results, result }) => {
        if (!isCard) return;
        const statusEl = diagId(`routing-card-status-${target.id}`);
        const dotsEl = diagId(`routing-card-dots-${target.id}`);
        const noteEl = diagId(`routing-card-note-${target.id}`);
        const latencyEl = diagId(`routing-card-latency-${target.id}`);
        if (statusEl) {
          statusEl.innerText = phase === 'after' && attempt === attempts
            ? `${diagText('completed')} ${attempts}/${attempts}`
            : `${diagText('sampling')} ${Math.min(attempt, attempts)}/${attempts}`;
          statusEl.className = `routing-chip ${phase === 'after' && attempt === attempts ? 'good' : 'neutral'}`;
        }
        if (dotsEl) {
          const scanIndex = phase === 'before' ? attempt - 1 : (attempt < attempts ? attempt : -1);
          dotsEl.innerHTML = buildProgressDots(results || [], attempts, scanIndex);
        }
        if (noteEl) noteEl.innerText = routeDecision.matchedRule ? `${diagText('routeMatchedRule')}: ${routeDecision.matchedRule}` : routeDecision.basis;
        if (latencyEl && phase === 'after' && result?.ok && Number.isFinite(result.latency)) latencyEl.innerText = `${result.latency}ms`;
      }),
      target.traceUrl ? diagSendRuntime({ action: 'fetchTrace', url: target.traceUrl }) : Promise.resolve({})
    ]);

    const probeRes = probePack.representative;
    const statusFmt = formatProbe(probeRes, target.id === 'anthropic' ? 'anthropic_api' : 'generic');
    const latency = probeRes?.latency;
    const traceIp = parseTraceValue(traceRes?.text);
    let observedExit = traceIp || exitIp;
    let geoText = traceIp ? '--' : exitGeo;
    let observedCountryCode = traceIp ? '' : exitCountryCode;
    let confidence = traceIp ? confidenceChip(diagText('verified'), 'good') : confidenceChip(diagText('inferred'), 'neutral');
    let riskForTrace = null;

    if (traceIp) {
      const traceRiskRes = await diagSendRuntime({ action: 'fetchIprisk', ip: traceIp });
      riskForTrace = traceRiskRes?.data || null;
      observedCountryCode = riskForTrace?.countryCode || '';
      geoText = riskForTrace ? prependFlag([riskForTrace.country, riskForTrace.asOrganization].filter(Boolean).join(' / '), observedCountryCode) : '--';
      observedExit = traceIp;
    }

    const entry = {
      id: target.id,
      category: target.category,
      ok: !!probeRes?.ok,
      traceIp,
      abnormal: false
    };
    entry.abnormal = isRoutingAbnormal(entry, exitIp);
    diagnosticsState.latestRoutingRows.push(entry);

    const statusTone = statusFmt.cls === 'danger' ? 'bad' : statusFmt.cls === 'warn' ? 'mid' : 'good';
    const row = diagId(`routing-row-${target.id}`);
    const rowStatus = diagId(`routing-status-${target.id}`);
    const rowLatency = diagId(`routing-latency-${target.id}`);
    const rowExit = diagId(`routing-exit-${target.id}`);
    const rowGeo = diagId(`routing-geo-${target.id}`);
    const rowRoute = diagId(`routing-route-${target.id}`);
    const rowNode = diagId(`routing-node-${target.id}`);
    const rowConfidence = diagId(`routing-confidence-${target.id}`);
    if (row) row.classList.toggle('abnormal', entry.abnormal);
    if (rowStatus) rowStatus.innerHTML = `<span class="routing-chip ${statusTone}">${escapeText(statusFmt.text)}</span>`;
    if (rowLatency) rowLatency.innerText = Number.isFinite(latency) ? `${latency}ms (${probePack.successes}/${probePack.attempts})` : '--';
    if (rowExit) rowExit.innerText = prependFlag(observedExit, observedCountryCode);
    if (rowGeo) rowGeo.innerText = geoText;
    if (rowRoute) rowRoute.innerText = routeDecision.matchedRule ? `${routeDecision.basis} · ${diagText('routeMatchedRule')} ${routeDecision.matchedRule}` : routeDecision.basis;
    if (rowNode) rowNode.innerText = routeDecision.node;
    if (rowConfidence) rowConfidence.innerHTML = traceIp
      ? confidence
      : entry.abnormal
        ? confidenceChip(diagText('abnormalSplit'), 'mid')
        : confidenceChip(diagText('inferred'), 'neutral');

    if (isCard) {
      const card = diagId(`routing-card-${target.id}`);
      const cardLatency = diagId(`routing-card-latency-${target.id}`);
      const cardDots = diagId(`routing-card-dots-${target.id}`);
      const cardNode = diagId(`routing-card-node-${target.id}`);
      const cardStatus = diagId(`routing-card-status-${target.id}`);
      const cardNote = diagId(`routing-card-note-${target.id}`);
      if (card) card.classList.toggle('abnormal', entry.abnormal);
      if (cardLatency) {
        cardLatency.innerText = Number.isFinite(latency) ? `${latency}ms` : diagText('probeFailed');
        cardLatency.className = `routing-card-latency ${latencyTone(latency)}`;
      }
      if (cardDots) cardDots.innerHTML = buildDots(latency);
      if (cardNode) cardNode.innerText = routeDecision.node;
      if (cardStatus) {
        cardStatus.innerText = `${diagText('completed')} 5/5`;
        cardStatus.className = `routing-chip ${entry.abnormal ? 'mid' : 'good'}`;
      }
      if (cardNote) {
        const detail = traceIp
          ? `${prependFlag(traceIp, observedCountryCode)} · ${traceIp === exitIp ? diagText('routeSame') : diagText('routeMismatch')}`
          : statusFmt.text;
        cardNote.innerText = detail;
      }
    }

    completedTargets += 1;
    setBusyButton('runRoutingLabBtn', true, `${diagText('routingRunBusy')} ${completedTargets}/${ROUTING_TARGETS.length}`, diagText('routingRun'));
  }));

  diagnosticsState.routingLabLoaded = true;
  applyRoutingFilters();
  diagSetText('routingSubtitle', diagText('routingSubtitle'));
  setBusyButton('runRoutingLabBtn', false, '', diagText('routingRun'));
}

function evaluateDns(dnsData, riskData) {
  const dnsGeo = dnsData?.dns?.geo || dnsData?.geo || '';
  const dnsIp = dnsData?.dns?.ip || dnsData?.ip || '--';
  const exitCountry = riskData?.country || '';
  const dnsInfo = parseDnsGeo(dnsGeo);
  const provider = (dnsInfo.provider || '').toLowerCase();
  const privateDns = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/.test(String(dnsIp));
  const sameCountry = !!exitCountry && dnsInfo.country === exitCountry;
  const trustedProvider = /cloudflare|google|quad9|nextdns|adguard/.test(provider);

  if (privateDns) return { safe: false, text: `${diagText('dnsWarning')} (${dnsGeo || dnsIp})` };
  if (sameCountry || trustedProvider) return { safe: true, text: `${diagText('dnsProtected')} (${dnsGeo || dnsIp})` };
  if (!dnsGeo) return { safe: false, text: diagText('probeFailed') };
  return { safe: false, text: `${diagText('dnsWarning')} (${dnsGeo})` };
}

function evaluateWebRtc(webrtcRes, exitIp) {
  if (!webrtcRes || webrtcRes.error) return { safe: false, text: webrtcRes?.error === 'unsupported_tab' ? diagText('needWebPage') : diagText('probeFailed') };
  if (!webrtcRes.supported) return { safe: true, text: diagText('unsupported') };
  if (webrtcRes.privateIps?.length) return { safe: false, text: `${diagText('webrtcWarning')} (${webrtcRes.privateIps.join(', ')})` };
  if (webrtcRes.publicIps?.length) {
    const mismatch = exitIp && !webrtcRes.publicIps.includes(exitIp);
    return {
      safe: !mismatch,
      text: mismatch
        ? `${diagText('webrtcWarning')} (${webrtcRes.publicIps.join(', ')})`
        : `${diagText('webrtcProtected')} (${webrtcRes.publicIps.join(', ')})`
    };
  }
  return { safe: true, text: diagText('notDetected') };
}

function hashString(input) {
  let hash = 2166136261;
  const str = String(input || '');
  for (let index = 0; index < str.length; index += 1) {
    hash ^= str.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (`0000000${(hash >>> 0).toString(16)}`).slice(-8).toUpperCase();
}

function computeCanvasHash() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');
    if (!ctx) return diagText('unsupported');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#22c55e';
    ctx.font = '18px Inter';
    ctx.fillText('Atlas Diagnostics', 12, 32);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(navigator.userAgent.slice(0, 24), 12, 54);
    return hashString(canvas.toDataURL());
  } catch (error) {
    return diagText('probeFailed');
  }
}

function diagQueryProbeTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      const candidates = (tabs || []).filter((tab) => /^https?:/i.test(tab.url || ''));
      if (!candidates.length) {
        resolve(null);
        return;
      }

      if (diagnosticsState.selectedTabId) {
        const selected = candidates.find((tab) => tab.id === diagnosticsState.selectedTabId);
        if (selected) {
          diagnosticsState.selectedTabUrl = selected.url || '';
          resolve(selected);
          return;
        }
      }

      candidates.sort((a, b) => ((b.lastAccessed || 0) - (a.lastAccessed || 0)));
      diagnosticsState.selectedTabId = candidates[0]?.id || null;
      diagnosticsState.selectedTabUrl = candidates[0]?.url || '';
      resolve(candidates[0] || null);
    });
  });
}

function diagInjectProbeBridge(tabId) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript({ target: { tabId, allFrames: false }, files: ['content-scripts/page-main.js'], world: 'MAIN' }, () => {
      if (chrome.runtime.lastError) {
        resolve({ error: chrome.runtime.lastError.message });
        return;
      }
      chrome.scripting.executeScript({ target: { tabId, allFrames: false }, files: ['content-scripts/bridge.js'] }, () => {
        if (chrome.runtime.lastError) {
          resolve({ error: chrome.runtime.lastError.message });
          return;
        }
        resolve({ ok: true });
      });
    });
  });
}

function diagSendToActiveTab(message) {
  return new Promise(async (resolve) => {
    const tab = await diagQueryProbeTab();
    if (!tab || !tab.id || !/^https?:/i.test(tab.url || '')) {
      resolve({ error: 'unsupported_tab' });
      return;
    }

    const send = () => new Promise((innerResolve) => {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          innerResolve({ error: chrome.runtime.lastError.message });
          return;
        }
        innerResolve(response || null);
      });
    });

    let response = await send();
    if (!response || response.error === 'Could not establish connection. Receiving end does not exist.') {
      const injected = await diagInjectProbeBridge(tab.id);
      if (injected.error) {
        resolve({ error: injected.error });
        return;
      }
      response = await send();
    }

    resolve(response || { error: 'empty_response' });
  });
}

function collectLocalDevice() {
  const nav = navigator;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  return {
    platform: `${nav.platform || '--'} / ${nav.userAgentData?.brands?.map((x) => x.brand).join(', ') || nav.userAgent}`,
    network: conn ? [conn.effectiveType, conn.rtt ? `${conn.rtt}ms` : '', conn.downlink ? `${conn.downlink}Mb/s` : ''].filter(Boolean).join(' / ') : diagText('unsupported'),
    canvas: computeCanvasHash()
  };
}

async function collectPageEnvironment() {
  const pageEnv = await diagSendToActiveTab({ action: 'pageProbe', probeType: 'pageEnv' });
  const webgl = await diagSendToActiveTab({ action: 'pageProbe', probeType: 'webgl' });
  return {
    timezone: pageEnv?.timezone || (pageEnv?.error === 'unsupported_tab' ? diagText('needWebPage') : diagText('probeFailed')),
    language: pageEnv?.language || (pageEnv?.error === 'unsupported_tab' ? diagText('needWebPage') : diagText('probeFailed')),
    webgl: webgl?.status === 'ok' ? webgl.value : (webgl?.error === 'unsupported_tab' ? diagText('needWebPage') : (webgl?.status === 'unsupported' ? diagText('unsupported') : diagText('probeFailed')))
  };
}

function formatTabOption(tab) {
  const title = String(tab.title || tab.url || '--').trim();
  const shortTitle = title.length > 48 ? `${title.slice(0, 48)}...` : title;
  let host = '';
  try {
    host = new URL(tab.url).host;
  } catch (error) {}
  return host ? `${shortTitle} - ${host}` : shortTitle;
}

function renderTabOptions() {
  const select = diagId('diagTabSelect');
  const hint = diagId('diagTargetHint');
  if (!select) return;

  select.innerHTML = '';
  if (!diagnosticsState.availableTabs.length) {
    select.add(new Option(diagText('needWebPage'), ''));
    select.disabled = true;
    if (hint) hint.innerText = diagText('needWebPage');
    return;
  }

  select.disabled = false;
  diagnosticsState.availableTabs.forEach((tab) => select.add(new Option(formatTabOption(tab), String(tab.id))));

  const selectedExists = diagnosticsState.availableTabs.some((tab) => tab.id === diagnosticsState.selectedTabId);
  if (!selectedExists) {
    diagnosticsState.selectedTabId = diagnosticsState.availableTabs[0].id;
    diagnosticsState.selectedTabUrl = diagnosticsState.availableTabs[0].url || '';
  }

  select.value = String(diagnosticsState.selectedTabId || '');
  const activeTab = diagnosticsState.availableTabs.find((tab) => tab.id === diagnosticsState.selectedTabId);
  if (hint) {
    hint.innerText = activeTab
      ? `${diagText('targetHint')} ${diagText('targetFromPopup')}: ${activeTab.url || ''}`
      : diagText('needWebPage');
  }
}

async function refreshProbeTabs(preferredTabId = null) {
  const storage = await chrome.storage.local.get(['lastProbeTabId', 'lastProbeTabUrl']);
  const tabs = await new Promise((resolve) => {
    chrome.tabs.query({}, (items) => resolve((items || []).filter((tab) => /^https?:/i.test(tab.url || ''))));
  });

  diagnosticsState.availableTabs = tabs;
  const preferred = preferredTabId || storage.lastProbeTabId;
  const matched = tabs.find((tab) => tab.id === preferred);
  if (matched) {
    diagnosticsState.selectedTabId = matched.id;
    diagnosticsState.selectedTabUrl = matched.url || storage.lastProbeTabUrl || '';
  } else if (tabs.length) {
    tabs.sort((a, b) => ((b.lastAccessed || 0) - (a.lastAccessed || 0)));
    diagnosticsState.selectedTabId = tabs[0].id;
    diagnosticsState.selectedTabUrl = tabs[0].url || '';
  } else {
    diagnosticsState.selectedTabId = null;
    diagnosticsState.selectedTabUrl = '';
  }

  renderTabOptions();
}

function renderSnapshotPlaceholders(targetPageUrl) {
  renderOverviewDeck([
    {
      title: diagText('overviewCurrent'),
      status: diagText('snapshotOnly'),
      ip: diagnosticsState.latestSnapshot?.currentExitIp || '--',
      primary: prependFlag([diagnosticsState.latestSnapshot?.ipCountry, diagnosticsState.latestSnapshot?.ipCity].filter(Boolean).join(' / '), ''),
      secondary: diagnosticsState.latestSnapshot?.ipTimezone || '--',
      note: diagText('snapshotOnly'),
      tone: 'good',
      action: 'open-ip-detail',
      actionLabel: diagText('overviewOpenDetail')
    },
    {
      title: diagText('overviewGlobal'),
      status: diagText('snapshotOnly'),
      ip: diagnosticsState.latestSnapshot?.currentExitIp || '--',
      primary: '--',
      secondary: '--',
      note: diagText('snapshotOnly'),
      tone: 'warn'
    },
    {
      title: diagText('overviewChina'),
      status: diagText('snapshotOnly'),
      ip: '--',
      primary: '--',
      secondary: '--',
      note: diagText('snapshotOnly'),
      tone: 'warn'
    },
    {
      title: diagText('overviewCf'),
      status: diagText('snapshotOnly'),
      ip: '--',
      primary: '--',
      secondary: '--',
      note: diagText('snapshotOnly'),
      tone: 'warn'
    },
    {
      title: diagText('overviewClaude'),
      status: diagText('snapshotOnly'),
      ip: '--',
      primary: '--',
      secondary: '--',
      note: diagText('snapshotOnly'),
      tone: 'warn'
    }
  ]);
  renderFocusCards([
    { label: diagText('focusTrust'), value: '--', copy: diagText('snapshotOnly'), subcopy: diagText('snapshotOnly'), tone: 'warn' },
    { label: diagText('focusClaude'), value: '--', copy: diagText('snapshotOnly'), subcopy: diagText('snapshotOnly'), tone: 'warn' },
    { label: diagText('focusDns'), value: '--', copy: diagText('snapshotOnly'), subcopy: diagText('snapshotOnly'), tone: 'warn' },
    { label: diagText('focusWebrtc'), value: '--', copy: diagText('snapshotOnly'), subcopy: diagText('snapshotOnly'), tone: 'warn' },
    { label: diagText('focusEnv'), value: '--', copy: diagText('snapshotOnly'), subcopy: diagText('snapshotOnly'), tone: 'warn' }
  ]);
  renderTrustScore(Number.NaN, null);
  diagSetHtml('diagClaudeRows', diagRow(diagText('claudeWebLabel'), diagText('snapshotOnly')) + diagRow(diagText('anthropicApiLabel'), diagText('snapshotOnly')));
  diagSetHtml('diagIpDetailRows', diagRow(diagText('trustScore'), diagText('snapshotOnly')) + diagRow(diagText('isp'), diagText('snapshotOnly')));
  diagSetHtml('diagSecurityRows', diagRow(diagText('vpnFlag'), diagText('snapshotOnly')) + diagRow(diagText('proxyFlag'), diagText('snapshotOnly')));
  diagSetHtml('diagSignalPanels', '');
  diagSetHtml('diagSecurityBadges', '');
  diagSetHtml('diagNetworkRows', diagRow(diagText('traceCf'), diagText('snapshotOnly')) + diagRow(diagText('traceClaude'), diagText('snapshotOnly')));
  diagSetHtml('diagPrivacyRows', diagRow(diagText('dnsStatus'), diagText('snapshotOnly')) + diagRow(diagText('webrtcStatus'), diagText('snapshotOnly')));
  diagSetHtml('diagTargetPageRows', [
    diagRow(diagText('targetPage'), targetPageUrl || '--'),
    diagRow(diagText('browserTimezone'), diagText('snapshotOnly')),
    diagRow(diagText('browserLanguage'), diagText('snapshotOnly')),
    diagRow(diagText('webrtcStatus'), diagText('snapshotOnly')),
    diagRow(diagText('webgl'), diagText('snapshotOnly'))
  ].join(''));
  diagSetHtml('diagDeviceRows', [
    diagRow(diagText('platform'), diagText('snapshotOnly')),
    diagRow(diagText('networkInfo'), diagText('snapshotOnly')),
    diagRow(diagText('canvas'), diagText('snapshotOnly'))
  ].join(''));
  diagSetHtml('diagRecommendRows', `<div class="diag-tip">${escapeText(diagText('snapshotOnly'))}</div>`);
  renderCrossCheck('', null, null);
}

async function renderDiagnostics(mode = 'full') {
  const buttonLight = diagId('runDiagLightBtn');
  const buttonFull = diagId('runDiagFullBtn');
  if (buttonLight) buttonLight.disabled = true;
  if (buttonFull) buttonFull.disabled = true;
  if (mode === 'light') setBusyButton('runDiagLightBtn', true, diagText('refreshLightBusy'), diagText('refreshLight'));
  if (mode === 'full') setBusyButton('runDiagFullBtn', true, diagText('refreshFullBusy'), diagText('refreshFull'));
  if (mode !== 'snapshot') diagSetText('diagSubtitle', diagText('loadingHint'));

  await refreshProbeTabs(diagnosticsState.selectedTabId);

  const snapshotMessage = mode === 'snapshot'
    ? diagSendRuntime({ action: 'probeExit', mode: 'light' })
    : diagSendRuntime({ action: 'probeExit', mode: mode === 'light' ? 'light' : 'full' });

  const [snapshotRes, probeTab] = await Promise.all([snapshotMessage, diagQueryProbeTab()]);
  const snapshot = snapshotRes?.snapshot || {};
  diagnosticsState.latestSnapshot = snapshot;
  const currentIp = snapshot.currentExitIp || '--';

  diagSetHtml('diagOverviewRows', [
    diagRow(diagText('exitIp'), currentIp, 'mono'),
    diagRow(diagText('country'), snapshot.ipCountry || '--'),
    diagRow(diagText('city'), snapshot.ipCity || '--'),
    diagRow(diagText('timezone'), snapshot.ipTimezone || '--'),
    diagRow(diagText('language'), snapshot.ipLanguage || '--'),
    diagRow(diagText('snapshotAge'), diagAgeText(snapshot.lastContextRefreshAt || snapshot.lastExitProbeAt)),
    diagRow(mode === 'snapshot' ? diagText('snapshotOnly') : diagText('route'), snapshotRes?.changed ? diagText('changed') : diagText('stable'), snapshotRes?.changed ? 'warn' : 'success')
  ].join(''));

  if (mode === 'snapshot') {
    diagnosticsState.latestRisk = null;
    diagnosticsState.latestRiskDisplay = null;
    diagnosticsState.latestClaudeRisk = null;
    diagnosticsState.latestCross = null;
    renderSnapshotPlaceholders(probeTab?.url || diagnosticsState.selectedTabUrl || '--');
    if (buttonLight) buttonLight.disabled = false;
    if (buttonFull) buttonFull.disabled = false;
    setBusyButton('runDiagLightBtn', false, '', diagText('refreshLight'));
    setBusyButton('runDiagFullBtn', false, '', diagText('refreshFull'));
    diagSetText('diagSubtitle', diagText('subtitle'));
    return;
  }

  const [riskRes, crossRes, dnsRes, webrtcRes, pageEnv, localDevice, cfTrace, claudeTrace, claudeWeb, anthropicApi, cfProbe, googleProbe, githubProbe, chinaIpRes] = await Promise.all([
    diagSendRuntime({ action: 'fetchIprisk', ip: '' }),
    diagSendRuntime({ action: 'fetchIpCrossCheck', ip: '' }),
    diagSendRuntime({ action: 'fetchDnsLeak' }),
    diagSendToActiveTab({ action: 'pageProbe', probeType: 'webrtc' }),
    collectPageEnvironment(),
    Promise.resolve(collectLocalDevice()),
    diagSendRuntime({ action: 'fetchTrace', url: 'https://www.cloudflare.com/cdn-cgi/trace' }),
    diagSendRuntime({ action: 'fetchTrace', url: 'https://claude.ai/cdn-cgi/trace' }),
    diagProbeUrl('https://claude.ai/login'),
    diagProbeUrl('https://api.anthropic.com/'),
    diagProbeUrl('https://www.cloudflare.com/cdn-cgi/trace'),
    diagProbeUrl('https://www.google.com/generate_204'),
    diagProbeUrl('https://github.com/'),
    diagSendRuntime({ action: 'getChinaIp' })
  ]);

  const risk = riskRes?.data || {};
  const cross = crossRes?.data || null;
  diagnosticsState.latestRisk = risk;
  const displayRisk = mergeRiskDisplay(risk, cross, snapshot);
  displayRisk.__meta = riskRes?.meta || null;
  diagnosticsState.latestRiskDisplay = displayRisk;
  diagnosticsState.latestCross = cross;

  const dnsEval = evaluateDns(dnsRes?.data, displayRisk);
  const webrtcEval = evaluateWebRtc(webrtcRes, displayRisk.ip);
  const cfTraceIp = parseTraceValue(cfTrace?.text);
  const claudeTraceIp = parseTraceValue(claudeTrace?.text);
  const claudeFmt = formatProbe(claudeWeb, 'claude_web');
  const apiFmt = formatProbe(anthropicApi, 'anthropic_api');
  const cfFmt = formatProbe(cfProbe);
  const googleFmt = formatProbe(googleProbe);
  const githubFmt = formatProbe(githubProbe);
  const chinaIp = chinaIpRes || {};
  let claudeRisk = null;
  let claudeCross = null;
  if (claudeTraceIp) {
    const [claudeRiskRes, claudeCrossRes] = await Promise.all([
      diagSendRuntime({ action: 'fetchIprisk', ip: claudeTraceIp }),
      diagSendRuntime({ action: 'fetchIpCrossCheck', ip: claudeTraceIp })
    ]);
    claudeCross = claudeCrossRes?.data || null;
    claudeRisk = mergeRiskDisplay(claudeRiskRes?.data || { ip: claudeTraceIp }, claudeCross, { currentExitIp: claudeTraceIp });
    claudeRisk.__meta = claudeRiskRes?.meta || null;
  }
  diagnosticsState.latestClaudeRisk = claudeRisk;
  const trustRisk = claudeRisk?.trust_score != null ? claudeRisk : displayRisk;
  renderTrustScore(trustRisk?.trust_score, trustRisk);
  const claudeRouteText = claudeTraceIp
    ? `${claudeTraceIp} · ${claudeTraceIp === displayRisk.ip ? diagText('routeSame') : diagText('routeMismatch')}`
    : diagText('routeUnavailable');

  renderOverviewDeck(buildDiagOverviewCards({
    snapshot,
    risk: displayRisk,
    claudeRisk,
    cfTraceIp,
    claudeTraceIp,
    chinaIp,
    googleFmt
  }));
  renderFocusCards(buildDiagFocusCards({
    risk: displayRisk,
    dnsEval,
    webrtcEval,
    claudeFmt,
    apiFmt,
    pageEnv,
    snapshot
  }));

  diagSetHtml('diagClaudeRows', [
    diagRow(diagText('claudeWebLabel'), claudeFmt.text, claudeFmt.cls),
    diagRow(diagText('anthropicApiLabel'), apiFmt.text, apiFmt.cls),
    diagRow(diagText('traceClaude'), claudeRouteText, claudeTraceIp ? (claudeTraceIp === displayRisk.ip ? 'success mono' : 'warn mono') : 'danger'),
    diagRow(diagText('trustScore'), claudeRisk?.trust_score != null ? `${claudeRisk.trust_score}/100${diagCacheSuffix(claudeRisk?.__meta)}` : (displayRisk.trust_score != null ? `${displayRisk.trust_score}/100${diagCacheSuffix(displayRisk?.__meta)}` : '--'), 'mono'),
    diagRow(diagText('isp'), claudeRisk?.asOrganization || displayRisk.asOrganization || '--'),
    diagRow(diagText('reverseDns'), claudeRisk?.reverseDns || displayRisk.reverseDns || '--')
  ].join(''));

  diagSetHtml('diagIpDetailRows', [
    diagRow(diagText('countryCode'), displayRisk.countryCode || '--'),
    diagRow(diagText('region'), displayRisk.region || '--'),
    diagRow(diagText('city'), displayRisk.city || '--'),
    diagRow(diagText('district'), displayRisk.district || '--'),
    diagRow(diagText('zip'), displayRisk.zip || '--'),
    diagRow(diagText('asn'), displayRisk.asn ? `AS${displayRisk.asn}` : '--', 'mono'),
    diagRow(diagText('isp'), displayRisk.asOrganization || '--'),
    diagRow(diagText('reverseDns'), displayRisk.reverseDns || '--'),
    diagRow(diagText('hostPtr'), displayRisk.hostPtr || '--'),
    diagRow(diagText('trustScore'), displayRisk.trust_score != null ? `${displayRisk.trust_score}/100${diagCacheSuffix(displayRisk?.__meta)}` : '--', 'mono'),
    diagRow(diagText('fakeIp'), yesNoText(displayRisk.fakeIp)),
    diagRow(diagText('chinaDns'), displayRisk.chinaDns || '--')
  ].join(''));

  diagSetHtml('diagSecurityRows', [
    diagRow(diagText('vpnFlag'), yesNoText(displayRisk.is_vpn)),
    diagRow(diagText('proxyFlag'), yesNoText(displayRisk.is_proxy)),
    diagRow(diagText('torFlag'), yesNoText(displayRisk.is_tor)),
    diagRow(diagText('dataCenter'), yesNoText(displayRisk.is_datacenter)),
    diagRow(diagText('anonymousFlag'), yesNoText(displayRisk.is_anonymous)),
    diagRow(diagText('threatFlag'), yesNoText(displayRisk.is_threats)),
    diagRow(diagText('mobile'), yesNoText(displayRisk.raw?.mobile)),
    diagRow(diagText('hosting'), yesNoText(displayRisk.raw?.hosting))
  ].join(''));
  diagSetHtml('diagSignalPanels', buildSignalPanels(displayRisk));
  diagSetHtml('diagSecurityBadges', SECURITY_KEYS.map((key) => securityBadge(diagText(BADGE_LABEL_KEYS[key] || key), !!displayRisk[key])).join(''));

  diagSetHtml('diagNetworkRows', [
    diagRow(diagText('traceCf'), cfTraceIp || diagText('probeFailed'), cfTraceIp ? 'success mono' : 'danger'),
    diagRow(diagText('traceClaude'), claudeTraceIp || diagText('probeFailed'), claudeTraceIp ? 'success mono' : 'danger'),
    diagRow(diagText('cloudflare'), cfFmt.text, cfFmt.cls),
    diagRow(diagText('google'), googleFmt.text, googleFmt.cls),
    diagRow(diagText('github'), githubFmt.text, githubFmt.cls)
  ].join(''));

  diagSetHtml('diagPrivacyRows', [
    diagRow(diagText('dnsResolver'), dnsRes?.data?.dns?.ip || dnsRes?.data?.ip || '--', 'mono'),
    diagRow(diagText('dnsStatus'), `${dnsEval.text}${diagCacheSuffix(dnsRes?.meta)}`, dnsEval.safe ? 'success' : 'warn'),
    diagRow(diagText('webrtcPrivate'), webrtcRes?.error === 'unsupported_tab' ? diagText('needWebPage') : (webrtcRes?.privateIps?.join(', ') || diagText('notDetected')), webrtcRes?.privateIps?.length ? 'warn mono' : 'success mono'),
    diagRow(diagText('webrtcPublic'), webrtcRes?.error === 'unsupported_tab' ? diagText('needWebPage') : (webrtcRes?.publicIps?.join(', ') || diagText('notDetected')), webrtcRes?.publicIps?.length ? 'mono' : 'success mono'),
    diagRow(diagText('webrtcStatus'), webrtcEval.text, webrtcEval.safe ? 'success' : 'warn')
  ].join(''));

  diagSetHtml('diagTargetPageRows', [
    diagRow(diagText('targetPage'), probeTab?.url || diagnosticsState.selectedTabUrl || '--'),
    diagRow(diagText('browserTimezone'), pageEnv.timezone),
    diagRow(diagText('browserLanguage'), pageEnv.language),
    diagRow(diagText('webrtcPrivate'), webrtcRes?.error === 'unsupported_tab' ? diagText('needWebPage') : (webrtcRes?.privateIps?.join(', ') || diagText('notDetected')), webrtcRes?.privateIps?.length ? 'warn mono' : 'success mono'),
    diagRow(diagText('webrtcPublic'), webrtcRes?.error === 'unsupported_tab' ? diagText('needWebPage') : (webrtcRes?.publicIps?.join(', ') || diagText('notDetected')), webrtcRes?.publicIps?.length ? 'mono' : 'success mono'),
    diagRow(diagText('webrtcStatus'), webrtcEval.text, webrtcEval.safe ? 'success' : 'warn'),
    diagRow(diagText('webgl'), pageEnv.webgl)
  ].join(''));

  diagSetHtml('diagDeviceRows', [
    diagRow(diagText('platform'), localDevice.platform),
    diagRow(diagText('networkInfo'), localDevice.network),
    diagRow(diagText('canvas'), localDevice.canvas, 'mono')
  ].join(''));

  const crossSummary = renderCrossCheck('', risk, cross);
  const recommendations = [];
  recommendations.push(claudeFmt.cls === 'danger' || apiFmt.cls === 'danger' ? diagText('claudeWarning') : diagText('claudeProtected'));
  recommendations.push(dnsEval.safe ? diagText('dnsProtected') : diagText('dnsWarning'));
  recommendations.push(webrtcEval.safe ? diagText('webrtcProtected') : diagText('webrtcWarning'));
  recommendations.push(crossSummary.text || diagText('crossUnavailable'));
  diagSetHtml('diagRecommendRows', recommendations.map((item) => `<div class="diag-tip">${escapeText(item)}</div>`).join(''));

  if (diagId('diagIpModal')?.classList.contains('open')) renderIpModal();
  if (buttonLight) buttonLight.disabled = false;
  if (buttonFull) buttonFull.disabled = false;
  setBusyButton('runDiagLightBtn', false, '', diagText('refreshLight'));
  setBusyButton('runDiagFullBtn', false, '', diagText('refreshFull'));
  diagSetText('diagSubtitle', diagText('subtitle'));
}

function renderDiagnosticsStatic() {
  diagSetText('diagMenuText', diagText('menu'));
  diagSetText('routingMenuText', diagText('routingMenu'));
  diagSetText('diagTitle', diagText('title'));
  diagSetText('diagSubtitle', diagText('subtitle'));
  diagSetText('runDiagLightBtn', diagText('refreshLight'));
  diagSetText('runDiagFullBtn', diagText('refreshFull'));
  diagSetText('diagTargetLabel', diagText('targetTab'));
  diagSetText('diagRefreshTabsBtn', diagText('refreshTabs'));
  diagSetText('diagTargetHint', diagText('targetHint'));
  diagSetText('diagOverviewTitle', diagText('overview'));
  diagSetText('diagClaudeTitle', diagText('claude'));
  diagSetText('diagClaudeHint', diagText('claudeHint'));
  diagSetText('diagIpDetailTitle', diagText('ipDetail'));
  diagSetText('diagSecurityTitle', diagText('securityTitle'));
  diagSetText('diagCrossTitle', diagText('crossTitle'));
  diagSetText('diagNetworkTitle', diagText('network'));
  diagSetText('diagPrivacyTitle', diagText('privacy'));
  diagSetText('diagTargetPageTitle', diagText('targetPageEnv'));
  diagSetText('diagDeviceTitle', diagText('localDeviceEnv'));
  diagSetText('diagRecommendTitle', diagText('recommendation'));
  diagSetText('routingTitle', diagText('routingTitle'));
  diagSetText('routingSubtitle', diagText('routingSubtitle'));
  diagSetText('runRoutingLabBtn', diagText('routingRun'));
  diagSetText('routingCardsTitle', diagText('routingCardsTitle'));
  diagSetText('routingTableTitle', diagText('routingTableTitle'));
  diagSetText('routingTableHint', diagText('routingTableHint'));
  diagSetText('routingCategoryLabel', diagText('routingCategoryLabel'));
  diagSetText('routingOnlyAbnormalLabel', diagText('routingOnlyAbnormal'));
  diagSetText('routingColSite', diagText('routingColSite'));
  diagSetText('routingColCategory', diagText('routingColCategory'));
  diagSetText('routingColStatus', diagText('routingColStatus'));
  diagSetText('routingColLatency', diagText('routingColLatency'));
  diagSetText('routingColExit', diagText('routingColExit'));
  diagSetText('routingColGeo', diagText('routingColGeo'));
  diagSetText('routingColRoute', diagText('routingColRoute'));
  diagSetText('routingColNode', diagText('routingColNode'));
  diagSetText('routingColConfidence', diagText('routingColConfidence'));
  diagSetText('diagModalBasicTitle', diagText('basicInfo'));
  diagSetText('diagModalRiskTitle', diagText('riskRating'));
  diagSetText('diagModalSignalsTitle', diagText('securitySignals'));
  diagSetText('diagModalCrossTitle', diagText('crossTitle'));
  renderTrustScore(Number.NaN, null);
  renderRoutingFilters();
}

function bindDiagnosticsEvents() {
  const lightBtn = diagId('runDiagLightBtn');
  const fullBtn = diagId('runDiagFullBtn');
  const tabSelect = diagId('diagTabSelect');
  const refreshTabsBtn = diagId('diagRefreshTabsBtn');
  const runRoutingLabBtn = diagId('runRoutingLabBtn');
  const overviewDeck = diagId('diagOverviewDeck');
  const closeModalBtn = diagId('diagIpModalClose');
  const modal = diagId('diagIpModal');
  const onlyAbnormal = diagId('routingOnlyAbnormal');
  const categoryContainer = diagId('routingCategoryFilters');

  if (lightBtn) lightBtn.onclick = () => renderDiagnostics('light');
  if (fullBtn) fullBtn.onclick = () => renderDiagnostics('full');
  if (refreshTabsBtn) refreshTabsBtn.onclick = async () => refreshProbeTabs(diagnosticsState.selectedTabId);
  if (runRoutingLabBtn) runRoutingLabBtn.onclick = async () => renderRoutingLab();
  if (overviewDeck) {
    overviewDeck.addEventListener('click', (event) => {
      const target = event.target.closest('[data-diag-action]');
      if (!target) return;
      if (target.getAttribute('data-diag-action') === 'open-ip-detail') openIpModal();
    });
  }
  if (closeModalBtn) closeModalBtn.onclick = closeIpModal;
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target instanceof HTMLElement && event.target.dataset.closeIpModal === 'true') closeIpModal();
    });
  }
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeIpModal();
  });
  if (onlyAbnormal) {
    onlyAbnormal.onchange = (event) => {
      diagnosticsState.routingOnlyAbnormal = !!event.target.checked;
      applyRoutingFilters();
    };
  }
  if (categoryContainer) {
    categoryContainer.addEventListener('click', (event) => {
      const target = event.target.closest('[data-routing-category]');
      if (!target) return;
      diagnosticsState.routingFilterCategory = target.getAttribute('data-routing-category') || 'all';
      renderRoutingFilters();
      applyRoutingFilters();
    });
  }
  if (tabSelect) {
    tabSelect.onchange = async (event) => {
      diagnosticsState.selectedTabId = Number(event.target.value) || null;
      const matched = diagnosticsState.availableTabs.find((tab) => tab.id === diagnosticsState.selectedTabId);
      diagnosticsState.selectedTabUrl = matched?.url || '';
      await chrome.storage.local.set({
        lastProbeTabId: diagnosticsState.selectedTabId,
        lastProbeTabUrl: diagnosticsState.selectedTabUrl
      });
      renderTabOptions();
    };
  }
}

async function initOptionsDiagnostics() {
  const prefs = await chrome.storage.local.get(['uiLang', 'theme', 'lastProbeTabId', 'lastProbeTabUrl']);
  diagnosticsState.uiLang = (prefs.uiLang || 'zh').startsWith('zh') ? 'zh' : 'en';
  diagnosticsState.theme = prefs.theme || 'dark';
  diagnosticsState.selectedTabId = prefs.lastProbeTabId || null;
  diagnosticsState.selectedTabUrl = prefs.lastProbeTabUrl || '';
  renderDiagnosticsStatic();
  bindDiagnosticsEvents();
  await refreshProbeTabs(diagnosticsState.selectedTabId);

  const openOnDiagnostics = location.hash === '#section-diagnostics';
  await renderDiagnostics(openOnDiagnostics ? 'full' : 'snapshot');

  window.addEventListener('atlas:section-activated', async (event) => {
    if (event.detail?.sectionId === 'section-diagnostics') await renderDiagnostics('full');
    if (event.detail?.sectionId === 'section-routinglab') await renderRoutingLab();
  });

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local') return;
    if (changes.uiLang) {
      diagnosticsState.uiLang = (changes.uiLang.newValue || 'zh').startsWith('zh') ? 'zh' : 'en';
      renderDiagnosticsStatic();
      renderTabOptions();
      await renderDiagnostics('snapshot');
      if (diagnosticsState.routingLabLoaded) await renderRoutingLab();
    }
    if (changes.theme) diagnosticsState.theme = changes.theme.newValue || 'dark';
    if (changes.lastProbeTabId || changes.lastProbeTabUrl) {
      diagnosticsState.selectedTabId = changes.lastProbeTabId?.newValue || diagnosticsState.selectedTabId;
      diagnosticsState.selectedTabUrl = changes.lastProbeTabUrl?.newValue || diagnosticsState.selectedTabUrl;
      await refreshProbeTabs(diagnosticsState.selectedTabId);
    }
  });
}

document.addEventListener('DOMContentLoaded', initOptionsDiagnostics);
