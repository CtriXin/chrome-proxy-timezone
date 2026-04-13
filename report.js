const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const DEFAULT_API_BASE = 'https://proxy-api.evilsngx.workers.dev';
const SYSTEM_THEME_MEDIA = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
let currentUiLang = 'zh';
let appState = {
  apiBase: DEFAULT_API_BASE,
  latestReport: null,
  runId: 0
};

const TEXT = {
  zh: {
    title: 'Atlas 网络诊断中心',
    subtitle: '一个页面看完出口 IP、Claude 可达性、DNS、WebRTC、设备指纹与修复建议。',
    overview: '总览',
    risk: '风险与身份',
    claude: 'Claude 安全可达性',
    privacy: 'DNS / WebRTC',
    device: '设备与指纹',
    network: '状态',
    recommend: '修复建议',
    currentExitIp: '当前出口 IP',
    refreshSnapshot: '刷新快照',
    runFull: '重新扫描',
    exportJson: '导出 JSON',
    settings: '设置',
    safeProbe: '所有 Claude 探测都只访问公开页面或静态资源，不发送 prompt、cookie 或会话数据。',
    scanning: '检测中...',
    probeFailed: '检测失败',
    timeout: '请求超时',
    snapshotOnly: '缓存快照',
    justNow: '刚刚',
    secondsAgo: '秒前',
    minutesAgo: '分钟前',
    hoursAgo: '小时前',
    activeTab: '当前页面',
    snapshotAge: '快照时间',
    exitState: '快照状态',
    exitStable: '与上次快照一致',
    exitChanged: '与上次快照不同',
    timezone: '时区',
    language: '建议语言',
    country: '国家/地区',
    city: '城市',
    trustScore: '信用评分',
    isp: '服务商 / 组织',
    asn: 'ASN',
    reverseDns: '反向 DNS',
    hostPtr: '主机检测 (PTR)',
    fakeIp: '假 IP',
    chinaDns: '中国 DNS',
    dnsResolver: 'DNS 解析器',
    dnsStatus: 'DNS 状态',
    webrtcPrivate: 'WebRTC 私网 IP',
    webrtcPublic: 'WebRTC 公网 IP',
    webrtcStatus: 'WebRTC 状态',
    pageTimezone: '页面时区',
    pageLanguage: '页面语言',
    webgl: 'WebGL',
    platform: '系统平台',
    ua: 'User-Agent',
    screen: '屏幕',
    networkInfo: '网络信息',
    canvas: 'Canvas Hash',
    claudeWeb: 'Claude Web',
    claudeAsset: 'Claude 静态资源',
    anthropicApi: 'Anthropic API',
    claudeTrace: 'Claude Trace IP',
    cloudflareTrace: 'Cloudflare Trace IP',
    github: 'GitHub',
    edgeStatus: '边缘探测',
    browserStatus: '浏览器探活',
    workerColo: '边缘节点',
    workerRegion: '边缘区域',
    tls: 'TLS',
    reachable: '可达',
    unauthorized: '可达但未授权',
    notDetected: '未检测到',
    protected: '未发现明显泄露',
    detected: '已检测到',
    unsupported: '不支持',
    yes: '是',
    no: '否',
    workerUnavailable: '边缘 API 不可用',
    scoreExcellent: '极度纯净',
    scoreGood: '可信',
    scoreWatch: '需关注',
    scoreRisky: '高风险',
    recClaudeGood: 'Claude 公共入口可达，未发现明显路由阻断。',
    recClaudeWarn: 'Claude 检测存在失败项，优先检查节点、代理鉴权或地区限制。',
    recDnsWarn: 'DNS 地理或运营商与出口不一致，建议切换节点后复测。',
    recDnsGood: 'DNS Resolver 与出口地区接近，未见明显漂移。',
    recWebrtcWarn: 'WebRTC 暴露了本地或额外地址，建议继续收紧策略。',
    recWebrtcGood: '未暴露异常 WebRTC 地址。',
    recStable: '出口 IP 与上次一致，可继续沿用当前配置。',
    recChanged: '出口 IP 已变化，建议重新校准 timezone / language。',
    rec404: 'Anthropic API 根路径出现 404 通常表示域名在线，但该路径不是有效 API 入口。',
    recEmpty: '当前没有明显异常，可以继续使用当前配置。'
  },
  en: {
    title: 'Atlas Network Diagnostics',
    subtitle: 'See exit IP, Claude reachability, DNS, WebRTC, browser fingerprint, and remediation in one page.',
    overview: 'Overview',
    risk: 'Risk & Identity',
    claude: 'Claude Safe Reachability',
    privacy: 'DNS / WebRTC',
    device: 'Device & Fingerprint',
    network: 'Status',
    recommend: 'Recommendations',
    currentExitIp: 'Current Exit IP',
    refreshSnapshot: 'Refresh Snapshot',
    runFull: 'Rescan',
    exportJson: 'Export JSON',
    settings: 'Settings',
    safeProbe: 'All Claude probes only hit public pages or static assets. No prompt, cookie, or session payload is sent.',
    scanning: 'Scanning...',
    probeFailed: 'Probe failed',
    timeout: 'Request timeout',
    snapshotOnly: 'Cached Snapshot',
    justNow: 'just now',
    secondsAgo: 's ago',
    minutesAgo: 'm ago',
    hoursAgo: 'h ago',
    activeTab: 'Active Tab',
    snapshotAge: 'Snapshot Age',
    exitState: 'Exit State',
    exitStable: 'Same as last snapshot',
    exitChanged: 'Changed from last snapshot',
    timezone: 'Timezone',
    language: 'Suggested Lang',
    country: 'Country',
    city: 'City',
    trustScore: 'Trust Score',
    isp: 'ISP / Org',
    asn: 'ASN',
    reverseDns: 'Reverse DNS',
    hostPtr: 'Host (PTR)',
    fakeIp: 'Fake IP',
    chinaDns: 'China DNS',
    dnsResolver: 'DNS Resolver',
    dnsStatus: 'DNS Status',
    webrtcPrivate: 'WebRTC Private IPs',
    webrtcPublic: 'WebRTC Public IPs',
    webrtcStatus: 'WebRTC Status',
    pageTimezone: 'Page Timezone',
    pageLanguage: 'Page Language',
    webgl: 'WebGL',
    platform: 'Platform',
    ua: 'User-Agent',
    screen: 'Screen',
    networkInfo: 'Network Info',
    canvas: 'Canvas Hash',
    claudeWeb: 'Claude Web',
    claudeAsset: 'Claude Asset',
    anthropicApi: 'Anthropic API',
    claudeTrace: 'Claude Trace IP',
    cloudflareTrace: 'Cloudflare Trace IP',
    github: 'GitHub',
    edgeStatus: 'Worker Edge',
    browserStatus: 'Browser Reachability',
    workerColo: 'Worker Colo',
    workerRegion: 'Worker Region',
    tls: 'TLS',
    reachable: 'Reachable',
    unauthorized: 'Reachable but unauthorized',
    notDetected: 'Not detected',
    protected: 'No obvious leak',
    detected: 'Detected',
    unsupported: 'Unsupported',
    yes: 'Yes',
    no: 'No',
    workerUnavailable: 'Worker API unavailable',
    scoreExcellent: 'Extremely clean',
    scoreGood: 'Trusted',
    scoreWatch: 'Needs review',
    scoreRisky: 'High risk',
    recClaudeGood: 'Claude public entry points are reachable with no obvious route block.',
    recClaudeWarn: 'Some Claude probes failed. Check node, proxy auth, or region limits first.',
    recDnsWarn: 'DNS geo or provider differs from exit. Re-test after switching node.',
    recDnsGood: 'DNS resolver geo looks close to exit geo. No obvious drift.',
    recWebrtcWarn: 'WebRTC exposed local or extra addresses. Tighten policy further.',
    recWebrtcGood: 'No unusual WebRTC address exposure detected.',
    recStable: 'Exit IP is unchanged. Current spoofing profile can stay.',
    recChanged: 'Exit IP changed. Re-align timezone and language if needed.',
    rec404: 'Anthropic API root returning 404 usually means the host is online, but that path is not a valid API entry.',
    recEmpty: 'No major issue detected. Current profile looks usable.'
  }
};

const SECURITY_KEYS = [
  ['is_vpn', 'VPN'],
  ['is_proxy', 'Proxy'],
  ['is_tor', 'Tor'],
  ['is_datacenter', 'Datacenter'],
  ['is_relay', 'Relay'],
  ['is_anonymous', 'Anonymous'],
  ['is_attacker', 'Attacker'],
  ['is_abuser', 'Abuser'],
  ['is_threats', 'Threats'],
  ['is_bogon', 'Bogon'],
  ['is_spam', 'Spam'],
  ['is_batch', 'Batch'],
  ['is_scanner', 'Scanner'],
  ['is_botnet', 'Botnet']
];

function t(key) {
  return TEXT[currentUiLang][key] || key;
}

function resolveTheme(theme) {
  if (theme === 'auto') return SYSTEM_THEME_MEDIA?.matches ? 'dark' : 'light';
  return theme === 'light' ? 'light' : 'dark';
}

function getThemeIcon(theme) {
  if (theme === 'auto') return '◐';
  return theme === 'light' ? '☀️' : '🌙';
}

function getNextTheme(theme) {
  if (theme === 'dark') return 'auto';
  if (theme === 'auto') return 'light';
  return 'dark';
}

function row(label, value, cls = '') {
  return `<div class="row"><div class="label">${safeText(label)}</div><div class="value ${cls}">${safeText(value)}</div></div>`;
}

function safeText(value) {
  return String(value == null ? '--' : value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function withTimeout(promise, timeoutMs = 7000, fallback = { error: 'timeout' }) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
  ]);
}

function ageText(ts) {
  if (!ts) return '--';
  const diff = Math.max(0, Date.now() - ts);
  if (diff < 5000) return t('justNow');
  if (diff < 60000) return `${Math.round(diff / 1000)} ${t('secondsAgo')}`;
  if (diff < 3600000) return `${Math.round(diff / 60000)} ${t('minutesAgo')}`;
  return `${Math.round(diff / 3600000)} ${t('hoursAgo')}`;
}

function cacheSuffix(meta) {
  if (!meta?.cached) return '';
  return ` · ${t('snapshotOnly')} ${ageText(meta.at)}`;
}

function yesNo(value) {
  return value == null ? '--' : (value ? t('yes') : t('no'));
}

function parseTraceValue(text) {
  if (!text) return '--';
  const match = String(text).match(/(?:^|\n)ip=([^\n]+)/);
  return match ? match[1].trim() : '--';
}

function parseDnsGeo(geo) {
  if (!geo) return { country: '', provider: '' };
  const [country, ...rest] = String(geo).split(' - ');
  return { country: (country || '').trim(), provider: rest.join(' - ').trim() };
}

function probeLabel(result) {
  if (!result || result.error === 'timeout') return t('timeout');
  if (!result || result.ok === false) return t('probeFailed');
  if (result.status === 401 || result.status === 403 || result.status === 404) return `${t('unauthorized')} (HTTP ${result.status})`;
  return `${t('reachable')} (HTTP ${result.status || 200})`;
}

function probeClass(result) {
  if (!result || result.ok === false) return 'danger';
  if ([401, 403, 404].includes(result.status)) return 'warn';
  return 'success';
}

function getTrustMeta(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return { value: 0, label: '--', color: 'var(--muted)' };
  if (n >= 85) return { value: n, label: t('scoreExcellent'), color: 'var(--success)' };
  if (n >= 65) return { value: n, label: t('scoreGood'), color: 'var(--success)' };
  if (n >= 45) return { value: n, label: t('scoreWatch'), color: 'var(--warn)' };
  return { value: n, label: t('scoreRisky'), color: 'var(--danger)' };
}

function evaluateDnsSafety(dnsData, riskData) {
  const dnsGeo = dnsData?.dns?.geo || dnsData?.geo || '';
  const dnsIp = dnsData?.dns?.ip || dnsData?.ip || '--';
  const exitCountry = riskData?.country || '';
  const dnsInfo = parseDnsGeo(dnsGeo);
  const provider = (dnsInfo.provider || '').toLowerCase();
  const privateDns = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/.test(String(dnsIp));
  const trustedProvider = /cloudflare|google|quad9|nextdns|adguard/.test(provider);
  const sameCountry = !!exitCountry && dnsInfo.country === exitCountry;

  if (privateDns) return { safe: false, text: `${t('detected')} (${dnsGeo || dnsIp})` };
  if (sameCountry || trustedProvider) return { safe: true, text: `${t('protected')} (${dnsGeo || dnsIp})` };
  if (!dnsGeo) return { safe: false, text: t('probeFailed') };
  return { safe: false, text: `${t('detected')} (${dnsGeo})` };
}

function evaluateWebRtcSafety(data, exitIp = '') {
  if (!data || data.error) return { safe: false, text: data?.error === 'unsupported_tab' ? t('unsupported') : t('probeFailed') };
  if (!data.supported) return { safe: true, text: t('unsupported') };
  if (data.privateIps?.length) return { safe: false, text: `${t('detected')} (${data.privateIps.join(', ')})` };
  if (data.publicIps?.length) {
    const mismatch = exitIp && !data.publicIps.includes(exitIp);
    return { safe: !mismatch, text: `${mismatch ? t('detected') : t('protected')} (${data.publicIps.join(', ')})` };
  }
  return { safe: true, text: t('notDetected') };
}

function mergeRisk(primary = {}, cross = null, fallbackIp = '') {
  const ipapi = cross?.ipapiis?.ok === false ? null : cross?.ipapiis;
  const ipsb = cross?.ipsb?.ok === false ? null : cross?.ipsb;
  return {
    ...primary,
    ip: primary.ip || ipapi?.ip || ipsb?.ip || fallbackIp,
    country: primary.country || ipapi?.country || ipsb?.country || '',
    countryCode: primary.countryCode || ipapi?.countryCode || ipsb?.countryCode || '',
    region: primary.region || ipapi?.region || ipsb?.region || '',
    city: primary.city || ipapi?.city || ipsb?.city || '',
    asn: primary.asn || ipapi?.asn || ipsb?.asn || '',
    asOrganization: primary.asOrganization || ipapi?.org || ipapi?.isp || ipsb?.org || ipsb?.isp || '',
    timezone: primary.timezone || ipapi?.timezone || '',
    __meta: primary.__meta || null
  };
}

function setTheme(theme) {
  const resolved = resolveTheme(theme);
  document.body.className = resolved;
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(resolved);
  try {
    localStorage.setItem('atlas_theme_pref', theme);
    localStorage.setItem('atlas_theme', resolved);
  } catch (error) {}
  $('#themeToggle').innerText = getThemeIcon(theme);
}

function setBusy(btn, busy, text) {
  if (!btn) return;
  if (busy) {
    btn.dataset.originalText = btn.dataset.originalText || btn.innerText;
    btn.innerText = text || t('scanning');
    btn.disabled = true;
    return;
  }
  btn.disabled = false;
  btn.innerText = btn.dataset.originalText || btn.innerText;
}

function renderStaticText() {
  if ($('#logoEyebrow')) $('#logoEyebrow').innerText = (t('appName') || 'Atlas Proxy').toUpperCase();
  $('#reportTitle').innerText = t('title');
  $('#reportSubtitle').innerText = t('subtitle');
  $('#overviewLabel').innerText = t('currentExitIp');
  $('#overviewHeading').innerText = t('overview');
  $('#riskHeading').innerText = t('risk');
  $('#claudeHeading').innerText = t('claude');
  $('#privacyHeading').innerText = t('privacy');
  $('#deviceHeading').innerText = t('device');
  $('#networkHeading').innerText = t('network');
  $('#recommendHeading').innerText = t('recommend');
  $('#refreshLightBtn').innerText = t('refreshSnapshot');
  $('#refreshFullBtn').innerText = t('runFull');
  $('#exportJsonBtn').innerText = t('exportJson');
  $('#openOptionsBtn').innerText = t('settings');
  $('#safeProbeNote').innerText = t('safeProbe');
  $('#uiLangToggle').innerText = currentUiLang === 'zh' ? 'English' : '中文';
  const labels = ['overview', 'risk', 'claude', 'privacy', 'device', 'network'];
  $$('.route-link').forEach((el, idx) => { el.innerText = t(labels[idx]); });
}

function sendRuntimeMessage(message) {
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

function queryActiveTab() {
  return new Promise((resolve) => chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => resolve(tabs[0] || null)));
}

function injectProbeBridge(tabId) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript({ target: { tabId }, files: ['content-scripts/page-main.js'], world: 'MAIN' }, () => {
      if (chrome.runtime.lastError) {
        resolve({ error: chrome.runtime.lastError.message });
        return;
      }
      chrome.scripting.executeScript({ target: { tabId }, files: ['content-scripts/bridge.js'] }, () => {
        if (chrome.runtime.lastError) {
          resolve({ error: chrome.runtime.lastError.message });
          return;
        }
        resolve({ ok: true });
      });
    });
  });
}

function sendToActiveTab(message) {
  return new Promise(async (resolve) => {
    const tab = await queryActiveTab();
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
      const injected = await injectProbeBridge(tab.id);
      if (injected.error) {
        resolve({ error: injected.error });
        return;
      }
      response = await send();
    }
    resolve(response || { error: 'empty_response' });
  });
}

function probeUrl(url, options = {}) {
  return sendRuntimeMessage({ action: 'probeEndpoint', url, options });
}

async function fetchWorkerJson(path) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`${appState.apiBase}${path}`, { cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function renderHero(snapshot = {}, tab = null, changed = false) {
  $('#heroIp').innerText = snapshot.currentExitIp || '--';
  $('#heroGeo').innerText = [snapshot.ipCountry, snapshot.ipCity, snapshot.ipTimezone].filter(Boolean).join(' / ') || '--';
  $('#heroBadge').innerText = changed ? t('exitChanged') : t('exitStable');
  $('#heroMeta').innerText = `${t('activeTab')}: ${tab?.url || '--'}`;
  $('#heroNote').innerText = changed ? t('recChanged') : t('recStable');
}

function renderOverview(snapshot = {}, tab = null, changed = false) {
  $('#overviewRows').innerHTML = [
    row(t('activeTab'), tab?.url || '--'),
    row(t('snapshotAge'), ageText(snapshot.lastContextRefreshAt || snapshot.lastExitProbeAt)),
    row(t('exitState'), changed ? t('exitChanged') : t('exitStable')),
    row(t('timezone'), snapshot.ipTimezone || '--'),
    row(t('language'), snapshot.ipLanguage || '--'),
    row(t('country'), snapshot.ipCountry || '--'),
    row(t('city'), snapshot.ipCity || '--')
  ].join('');
}

function renderRiskCard(risk = {}) {
  const meta = getTrustMeta(risk.trust_score);
  const circumference = 2 * Math.PI * 52;
  const filled = circumference * Math.max(0, Math.min(100, meta.value)) / 100;
  const circle = $('#scoreCircle');
  circle.style.stroke = meta.color;
  circle.style.strokeDasharray = `${filled} ${circumference}`;
  $('#scoreValue').innerText = Number.isFinite(Number(risk.trust_score)) ? Math.round(Number(risk.trust_score)) : '--';
  $('#scoreLabel').innerText = `${meta.label}${cacheSuffix(risk.__meta)}`;
  $('#riskRows').innerHTML = [
    row(t('trustScore'), risk.trust_score != null ? `${risk.trust_score}/100` : '--', 'mono'),
    row(t('isp'), risk.asOrganization || '--'),
    row(t('asn'), risk.asn ? `AS${risk.asn}` : '--', 'mono'),
    row(t('reverseDns'), risk.reverseDns || '--'),
    row(t('hostPtr'), risk.hostPtr || '--'),
    row(t('fakeIp'), yesNo(risk.fakeIp)),
    row(t('chinaDns'), risk.chinaDns || '--')
  ].join('');
  const typeBadges = [];
  if (risk.raw?.mobile) typeBadges.push(['Mobile', 'good']);
  if (risk.is_datacenter || risk.raw?.hosting) typeBadges.push(['Datacenter', 'warn']);
  if (risk.is_proxy || risk.is_vpn || risk.raw?.proxy) typeBadges.push(['Proxy-likely', 'danger']);
  if (!typeBadges.length) typeBadges.push(['Residential', 'good']);
  SECURITY_KEYS.forEach(([key, label]) => {
    if (risk[key]) typeBadges.push([label, 'danger']);
  });
  $('#riskBadges').innerHTML = typeBadges.map(([label, tone]) => `<span class="badge ${tone}">${safeText(label)}</span>`).join('');
}

function renderClaudeCard(data) {
  const { claudeWeb, claudeAsset, anthropicApi, claudeTraceIp, claudeRisk } = data;
  $('#claudeRows').innerHTML = [
    row(t('claudeWeb'), probeLabel(claudeWeb), probeClass(claudeWeb)),
    row(t('claudeAsset'), probeLabel(claudeAsset), probeClass(claudeAsset)),
    row(t('anthropicApi'), probeLabel(anthropicApi), probeClass(anthropicApi)),
    row(t('claudeTrace'), claudeTraceIp || '--', claudeTraceIp && claudeTraceIp !== '--' ? 'mono' : 'danger'),
    row(t('trustScore'), claudeRisk?.trust_score != null ? `${claudeRisk.trust_score}/100${cacheSuffix(claudeRisk.__meta)}` : '--', 'mono'),
    row(t('isp'), claudeRisk?.asOrganization || '--'),
    row(t('reverseDns'), claudeRisk?.reverseDns || '--')
  ].join('');
}

function renderNetworkCard(data) {
  const { cfTraceIp, githubProbe, workerStatus, workerContext } = data;
  const edgeMap = {};
  (workerStatus?.results || []).forEach((item) => { edgeMap[item.id] = item; });
  $('#networkRows').innerHTML = [
    row(t('browserStatus') + ' · ' + t('cloudflareTrace'), cfTraceIp || '--', cfTraceIp && cfTraceIp !== '--' ? 'success mono' : 'danger'),
    row(t('browserStatus') + ' · ' + t('github'), githubProbe?.ok ? `${githubProbe.latency}ms` : probeLabel(githubProbe), probeClass(githubProbe) + (githubProbe?.ok ? ' mono' : '')),
    row(t('edgeStatus') + ' · ' + t('claudeWeb'), edgeMap.claude_web?.ok ? `HTTP ${edgeMap.claude_web.status} · ${edgeMap.claude_web.latency}ms` : t('workerUnavailable'), edgeMap.claude_web?.ok ? 'success mono' : 'warn'),
    row(t('edgeStatus') + ' · ' + t('anthropicApi'), edgeMap.anthropic_api?.ok ? `HTTP ${edgeMap.anthropic_api.status} · ${edgeMap.anthropic_api.latency}ms` : t('workerUnavailable'), edgeMap.anthropic_api?.ok ? 'warn mono' : 'warn'),
    row(t('workerColo'), workerContext?.worker?.colo || '--'),
    row(t('workerRegion'), [workerContext?.worker?.country, workerContext?.worker?.city].filter(Boolean).join(' / ') || '--'),
    row(t('tls'), workerContext?.worker?.tlsVersion || '--')
  ].join('');
}

function renderPrivacyCard(data) {
  const dnsEval = evaluateDnsSafety(data.dnsRes?.data, data.risk);
  const webrtcEval = evaluateWebRtcSafety(data.webrtcRes, data.risk?.ip);
  $('#privacyRows').innerHTML = [
    row(t('dnsResolver'), data.dnsRes?.data?.dns?.ip || data.dnsRes?.data?.ip || '--', 'mono'),
    row(t('dnsStatus'), `${dnsEval.text}${cacheSuffix(data.dnsRes?.meta)}`, dnsEval.safe ? 'success' : 'warn'),
    row(t('webrtcPrivate'), data.webrtcRes?.error === 'unsupported_tab' ? t('unsupported') : (data.webrtcRes?.privateIps?.join(', ') || t('notDetected')), data.webrtcRes?.privateIps?.length ? 'warn mono' : 'success mono'),
    row(t('webrtcPublic'), data.webrtcRes?.error === 'unsupported_tab' ? t('unsupported') : (data.webrtcRes?.publicIps?.join(', ') || t('notDetected')), data.webrtcRes?.publicIps?.length ? 'mono' : 'success mono'),
    row(t('webrtcStatus'), webrtcEval.text, webrtcEval.safe ? 'success' : 'warn')
  ].join('');
}

function renderDeviceCard(data) {
  const pageEnv = data.pageEnv || {};
  const webgl = data.webgl || {};
  const webglText = webgl?.status === 'ok' ? webgl.value : (webgl?.status === 'unsupported' || webgl?.error === 'unsupported_tab' ? t('unsupported') : t('probeFailed'));
  const tab = data.tab;
  $('#deviceRows').innerHTML = [
    row(t('pageTimezone'), pageEnv?.timezone || (pageEnv?.error === 'unsupported_tab' ? t('unsupported') : t('probeFailed'))),
    row(t('pageLanguage'), pageEnv?.language || (pageEnv?.error === 'unsupported_tab' ? t('unsupported') : t('probeFailed'))),
    row(t('webgl'), webglText),
    row(t('platform'), navigator.platform || '--'),
    row(t('ua'), navigator.userAgent || '--'),
    row(t('screen'), `${window.screen?.width || 0}x${window.screen?.height || 0}`),
    row(t('networkInfo'), navigator.connection ? `${navigator.connection.effectiveType || '--'} / ${navigator.connection.rtt || '--'}ms` : '--'),
    row(t('activeTab'), tab?.url || '--')
  ].join('');
}

function renderRecommendations(data) {
  const tips = [];
  const dnsEval = evaluateDnsSafety(data.dnsRes?.data, data.risk);
  const webrtcEval = evaluateWebRtcSafety(data.webrtcRes, data.risk?.ip);
  const claudeGood = data.claudeWeb?.ok && data.claudeAsset?.ok;
  tips.push({ tone: claudeGood ? 'good' : 'warn', text: claudeGood ? t('recClaudeGood') : t('recClaudeWarn') });
  tips.push({ tone: dnsEval.safe ? 'good' : 'warn', text: dnsEval.safe ? t('recDnsGood') : t('recDnsWarn') });
  tips.push({ tone: webrtcEval.safe ? 'good' : 'warn', text: webrtcEval.safe ? t('recWebrtcGood') : t('recWebrtcWarn') });
  tips.push({ tone: data.changed ? 'warn' : 'good', text: data.changed ? t('recChanged') : t('recStable') });
  if (data.anthropicApi?.status === 404) tips.push({ tone: 'warn', text: t('rec404') });
  $('#recommendRows').innerHTML = (tips.length ? tips : [{ tone: 'good', text: t('recEmpty') }])
    .map((item) => `<div class="tip ${item.tone}">${safeText(item.text)}</div>`).join('');
}

async function run(mode = 'full') {
  const runId = ++appState.runId;
  const lightBtn = $('#refreshLightBtn');
  const fullBtn = $('#refreshFullBtn');
  setBusy(lightBtn, true, t('scanning'));
  setBusy(fullBtn, true, t('scanning'));

  const [tab, snapshotRes] = await Promise.all([
    queryActiveTab(),
    sendRuntimeMessage({ action: mode === 'snapshot' ? 'getExitSnapshot' : 'probeExit', mode: mode === 'snapshot' ? 'light' : mode })
  ]);
  if (runId !== appState.runId) return;

  const snapshot = snapshotRes?.snapshot || {};
  const changed = !!snapshotRes?.changed;
  renderHero(snapshot, tab, changed);
  renderOverview(snapshot, tab, changed);

  if (mode === 'snapshot') {
    setBusy(lightBtn, false);
    setBusy(fullBtn, false);
    return;
  }

  const [riskRes, crossRes, dnsRes, webrtcRes, pageEnv, webgl, cfTrace, claudeTrace, githubProbe, claudeWeb, claudeAsset, anthropicApi, workerStatus, workerContext] = await Promise.all([
    withTimeout(sendRuntimeMessage({ action: 'fetchIprisk', ip: '' }), 7000, { error: 'timeout' }),
    withTimeout(sendRuntimeMessage({ action: 'fetchIpCrossCheck', ip: '' }), 3000, { data: null }),
    withTimeout(sendRuntimeMessage({ action: 'fetchDnsLeak' }), 5000, { error: 'timeout' }),
    withTimeout(sendToActiveTab({ action: 'pageProbe', probeType: 'webrtc' }), 4500, { error: 'timeout' }),
    withTimeout(sendToActiveTab({ action: 'pageProbe', probeType: 'pageEnv' }), 4500, { error: 'timeout' }),
    withTimeout(sendToActiveTab({ action: 'pageProbe', probeType: 'webgl' }), 4500, { error: 'timeout' }),
    withTimeout(sendRuntimeMessage({ action: 'fetchTrace', url: 'https://www.cloudflare.com/cdn-cgi/trace' }), 3500, { error: 'timeout' }),
    withTimeout(sendRuntimeMessage({ action: 'fetchTrace', url: 'https://claude.ai/cdn-cgi/trace' }), 3500, { error: 'timeout' }),
    withTimeout(probeUrl('https://github.com/'), 4500, { error: 'timeout' }),
    withTimeout(probeUrl('https://claude.ai/login'), 4500, { error: 'timeout' }),
    withTimeout(probeUrl('https://claude.ai/favicon.ico'), 4500, { error: 'timeout' }),
    withTimeout(probeUrl('https://api.anthropic.com/'), 4500, { error: 'timeout' }),
    withTimeout(fetchWorkerJson('/api/status'), 5000, { results: [], error: 'timeout' }),
    withTimeout(fetchWorkerJson('/api/context'), 5000, { worker: {}, error: 'timeout' })
  ]);
  if (runId !== appState.runId) return;

  const risk = mergeRisk({ ...(riskRes?.data || {}), __meta: riskRes?.meta || null }, crossRes?.data || null, snapshot.currentExitIp || '');
  renderRiskCard(risk);

  const claudeTraceIp = parseTraceValue(claudeTrace?.text);
  let claudeRisk = null;
  if (claudeTraceIp && claudeTraceIp !== '--') {
    const [claudeRiskRes, claudeCrossRes] = await Promise.all([
      withTimeout(sendRuntimeMessage({ action: 'fetchIprisk', ip: claudeTraceIp }), 7000, { error: 'timeout' }),
      withTimeout(sendRuntimeMessage({ action: 'fetchIpCrossCheck', ip: claudeTraceIp }), 3000, { data: null })
    ]);
    claudeRisk = mergeRisk({ ...(claudeRiskRes?.data || {}), __meta: claudeRiskRes?.meta || null }, claudeCrossRes?.data || null, claudeTraceIp);
  }
  if (runId !== appState.runId) return;

  renderClaudeCard({ claudeWeb, claudeAsset, anthropicApi, claudeTraceIp, claudeRisk });
  renderNetworkCard({ cfTraceIp: parseTraceValue(cfTrace?.text), githubProbe, workerStatus, workerContext });
  renderPrivacyCard({ dnsRes, risk, webrtcRes });
  renderDeviceCard({ pageEnv, webgl, tab });
  renderRecommendations({ dnsRes, risk, webrtcRes, claudeWeb, claudeAsset, anthropicApi, changed });

  appState.latestReport = {
    snapshot,
    changed,
    tab,
    risk,
    dns: dnsRes,
    webrtc: webrtcRes,
    pageEnv,
    webgl,
    claude: { claudeWeb, claudeAsset, anthropicApi, claudeTraceIp, claudeRisk },
    network: { cfTrace, workerStatus, workerContext, githubProbe },
    generatedAt: new Date().toISOString()
  };

  setBusy(lightBtn, false);
  setBusy(fullBtn, false);
}

function exportJson() {
  const payload = appState.latestReport || { generatedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'atlas-network-report.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function init() {
  const prefs = await chrome.storage.local.get(['theme', 'uiLang']);
  currentUiLang = (prefs.uiLang || (navigator.language.startsWith('zh') ? 'zh' : 'en')) === 'en' ? 'en' : 'zh';
  appState.apiBase = DEFAULT_API_BASE;
  setTheme(prefs.theme || 'dark');
  renderStaticText();
  await run('snapshot');
  run('full').catch(() => {});

  $('#uiLangToggle').onclick = () => chrome.storage.local.set({ uiLang: currentUiLang === 'zh' ? 'en' : 'zh' });
  $('#themeToggle').onclick = async () => {
    const prefs = await chrome.storage.local.get(['theme']);
    const next = getNextTheme(prefs.theme || 'dark');
    chrome.storage.local.set({ theme: next });
  };
  $('#openOptionsBtn').onclick = () => chrome.runtime.openOptionsPage();
  $('#exportJsonBtn').onclick = () => exportJson();
  $('#refreshLightBtn').onclick = () => run('light');
  $('#refreshFullBtn').onclick = () => run('full');
  $$('.route-link').forEach((btn) => {
    btn.onclick = () => {
      $$('.route-link').forEach((item) => item.classList.toggle('active', item === btn));
      const target = document.getElementById(btn.dataset.section);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  });

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local') return;
    if (changes.theme) setTheme(changes.theme.newValue || 'dark');
    if (changes.uiLang) {
      currentUiLang = (changes.uiLang.newValue || 'zh') === 'en' ? 'en' : 'zh';
      renderStaticText();
      await run('snapshot');
      run('full').catch(() => {});
    }
  });

  if (SYSTEM_THEME_MEDIA) {
    const syncAutoTheme = async () => {
      const prefs = await chrome.storage.local.get(['theme']);
      if ((prefs.theme || 'dark') === 'auto') setTheme('auto');
    };
    if (typeof SYSTEM_THEME_MEDIA.addEventListener === 'function') SYSTEM_THEME_MEDIA.addEventListener('change', syncAutoTheme);
    else if (typeof SYSTEM_THEME_MEDIA.addListener === 'function') SYSTEM_THEME_MEDIA.addListener(syncAutoTheme);
  }
}

document.addEventListener('DOMContentLoaded', init);
