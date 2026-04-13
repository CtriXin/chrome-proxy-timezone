const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
let currentUiLang = 'zh';
let localeMessages = {};
const MINI_PROFILE_ID = 'atlas-mini';
const MINI_PROFILE = { id: MINI_PROFILE_ID, name: 'Atlas Mini' };
const MINI_DELAY_CACHE_TTL_MS = 10 * 60 * 1000;
const MINI_PROXY_ENABLED = false;
const HERO_SUMMARY_TTL_MS = 30 * 1000;
let popupInitialized = false;
let heroSummaryRunId = 0;
let heroSummaryCache = { key: '', at: 0, groups: [] };
let claudeCheckRunId = 0;
let auditRunId = 0;

const TIMEZONE_GROUPS = [
  {
    label: 'Americas',
    options: [
      { v: 'Pacific/Honolulu', n: 'UTC-10 (Honolulu)' },
      { v: 'America/Anchorage', n: 'UTC-9 (Anchorage)' },
      { v: 'America/Los_Angeles', n: 'UTC-8 (Los Angeles / Vancouver)' },
      { v: 'America/Phoenix', n: 'UTC-7 (Phoenix / Denver)' },
      { v: 'America/Chicago', n: 'UTC-6 (Chicago / Mexico City)' },
      { v: 'America/New_York', n: 'UTC-5 (New York / Toronto)' },
      { v: 'America/Halifax', n: 'UTC-4 (Halifax / Caracas)' },
      { v: 'America/Sao_Paulo', n: 'UTC-3 (Sao Paulo / Buenos Aires)' }
    ]
  },
  {
    label: 'Europe',
    options: [
      { v: 'Europe/London', n: 'UTC+0 (London / Dublin / Lisbon)' },
      { v: 'Europe/Paris', n: 'UTC+1 (Paris / Berlin / Rome / Madrid)' },
      { v: 'Europe/Athens', n: 'UTC+2 (Athens / Bucharest / Helsinki)' },
      { v: 'Europe/Moscow', n: 'UTC+3 (Moscow / Istanbul)' }
    ]
  },
  {
    label: 'Africa',
    options: [
      { v: 'Africa/Casablanca', n: 'UTC+0 (Casablanca)' },
      { v: 'Africa/Johannesburg', n: 'UTC+2 (Johannesburg / Cairo)' },
      { v: 'Africa/Nairobi', n: 'UTC+3 (Nairobi)' }
    ]
  },
  {
    label: 'Middle East',
    options: [
      { v: 'Asia/Jerusalem', n: 'UTC+2 (Jerusalem)' },
      { v: 'Asia/Riyadh', n: 'UTC+3 (Riyadh / Doha / Kuwait)' },
      { v: 'Asia/Dubai', n: 'UTC+4 (Dubai / Abu Dhabi)' }
    ]
  },
  {
    label: 'Asia',
    options: [
      { v: 'Asia/Karachi', n: 'UTC+5 (Karachi / Tashkent)' },
      { v: 'Asia/Kolkata', n: 'UTC+5:30 (Mumbai / New Delhi)' },
      { v: 'Asia/Dhaka', n: 'UTC+6 (Dhaka / Almaty)' },
      { v: 'Asia/Bangkok', n: 'UTC+7 (Bangkok / Jakarta / Hanoi)' },
      { v: 'Asia/Singapore', n: 'UTC+8 (Singapore / Kuala Lumpur)' },
      { v: 'Asia/Shanghai', n: 'UTC+8 (Shanghai / Beijing / Hong Kong)' },
      { v: 'Asia/Taipei', n: 'UTC+8 (Taipei)' },
      { v: 'Asia/Tokyo', n: 'UTC+9 (Tokyo / Seoul)' }
    ]
  },
  {
    label: 'Oceania',
    options: [
      { v: 'Australia/Perth', n: 'UTC+8 (Perth)' },
      { v: 'Australia/Sydney', n: 'UTC+10 (Sydney / Melbourne)' },
      { v: 'Pacific/Auckland', n: 'UTC+12 (Auckland / Fiji)' }
    ]
  },
  {
    label: 'UTC / Special',
    options: [
      { v: 'UTC', n: 'UTC (Universal)' }
    ]
  }
];

const LANGUAGE_GROUPS = [
  {
    label: 'Recommended',
    options: [
      { v: 'ip', n: 'optIpLocation' },
      { v: 'zh-CN', n: '简体中文 (zh-CN)' },
      { v: 'zh-TW', n: '繁體中文 (zh-TW)' },
      { v: 'en-US', n: 'English (en-US)' },
      { v: 'en-GB', n: 'English (en-GB)' },
      { v: 'ja-JP', n: '日本語 (ja-JP)' },
      { v: 'ko-KR', n: '한국어 (ko-KR)' }
    ]
  },
  {
    label: 'More',
    options: [
      { v: 'fr-FR', n: 'Français (fr-FR)' },
      { v: 'de-DE', n: 'Deutsch (de-DE)' },
      { v: 'es-ES', n: 'Español (es-ES)' },
      { v: 'it-IT', n: 'Italiano (it-IT)' },
      { v: 'pt-BR', n: 'Português (pt-BR)' },
      { v: 'ru-RU', n: 'Русский (ru-RU)' },
      { v: 'ar-SA', n: 'العربية (ar-SA)' },
      { v: 'hi-IN', n: 'हिन्दी (hi-IN)' },
      { v: 'th-TH', n: 'ไทย (th-TH)' },
      { v: 'vi-VN', n: 'Tiếng Việt (vi-VN)' },
      { v: 'id-ID', n: 'Bahasa Indonesia (id-ID)' },
      { v: 'tr-TR', n: 'Türkçe (tr-TR)' }
    ]
  }
];

// --- 全局共享数据源 ( Single Source of Truth ) ---
const DATA = {
  timezones: TIMEZONE_GROUPS,
  languages: LANGUAGE_GROUPS
};

// --- 统一 i18n 逻辑 ---
function i18n(key) {
  return localeMessages[key]?.message || chrome.i18n.getMessage(key) || key;
}

async function loadLocale(lang) {
  currentUiLang = lang === 'en' ? 'en' : 'zh';
  const localeDir = currentUiLang === 'en' ? 'en' : 'zh_CN';
  try {
    const res = await fetch(chrome.runtime.getURL(`_locales/${localeDir}/messages.json`));
    localeMessages = await res.json();
  } catch (error) {
    localeMessages = {};
  }
}

function applyI18n() {
  $$('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerText = i18n(key);
  });
}

// --- UI 组件生成 ---
function initSelects() {
  const tzSel = $('#tzSelect');
  if (tzSel) {
    tzSel.innerHTML = `<option value="">${i18n('optDefault')}</option>`;
    const followOpt = document.createElement('option');
    followOpt.value = 'ip';
    followOpt.innerText = i18n('optIpLocation');
    tzSel.appendChild(followOpt);
    DATA.timezones.forEach((group) => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = group.label;
      group.options.forEach((tz) => {
        const opt = document.createElement('option');
        opt.value = tz.v;
        opt.innerText = tz.n;
        optgroup.appendChild(opt);
      });
      tzSel.appendChild(optgroup);
    });
  }
  const langSel = $('#langSelect');
  if (langSel) {
    langSel.innerHTML = `<option value="">${i18n('optDefault')}</option>`;
    DATA.languages.forEach((group) => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = group.label;
      group.options.forEach((lang) => {
        const opt = document.createElement('option');
        opt.value = lang.v;
        opt.innerText = (lang.v === 'ip') ? i18n(lang.n) : lang.n;
        optgroup.appendChild(opt);
      });
      langSel.appendChild(optgroup);
    });
  }
}

function withMiniProfile(profiles = []) {
  const list = Array.isArray(profiles) ? profiles.slice() : [];
  if (MINI_PROXY_ENABLED && !list.some((item) => item.id === MINI_PROFILE_ID)) list.push({ ...MINI_PROFILE });
  return list;
}

// --- 状态管理 ---
async function loadSettings() {
  const res = await chrome.storage.local.get([
    'proxyMode', 'proxyProfiles', 'activeProfileId', 'theme', 'timezone', 'language',
    'ipTimezone', 'ipLanguage', 'uiLang', 'miniSubUrl', 'miniSubscriptions',
    'miniActiveNode', 'miniNodeDelays', 'miniNodeDelayAt', 'currentExitIp',
    'ipCountry', 'ipCity', 'lastExitProbeAt', 'lastContextRefreshAt'
  ]);
  const realProfiles = (res.proxyProfiles || []).filter((item) => item.id !== MINI_PROFILE_ID);
  if (res.proxyMode === 'mini' || (!MINI_PROXY_ENABLED && res.activeProfileId === MINI_PROFILE_ID)) {
    const fallbackProfileId = realProfiles[0]?.id || '';
    await chrome.storage.local.set({
      proxyMode: res.proxyMode === 'mini' ? 'manual' : (res.proxyMode || 'system'),
      activeProfileId: fallbackProfileId
    });
    res.proxyMode = res.proxyMode === 'mini' ? 'manual' : (res.proxyMode || 'system');
    res.activeProfileId = fallbackProfileId;
  }
  await loadLocale(res.uiLang || (navigator.language.startsWith('zh') ? 'zh' : 'en'));
  
  applyI18n();
  initSelects();
  $('#uiLangToggle').innerText = currentUiLang === 'zh' ? '中/En' : 'En/中';
  
  $('#proxyMode').value = res.proxyMode || 'system';
  $('#tzSelect').value = res.timezone || '';
  $('#langSelect').value = res.language || '';
  updateFollowIpOptions(res);
  applyHeroSnapshot(res);

  const sel = $('#activeProfile');
  sel.innerHTML = '';
  withMiniProfile(realProfiles).forEach(p => {
    const opt = new Option(p.name || `${p.host}:${p.port}`, p.id);
    sel.add(opt);
  });
  sel.value = res.activeProfileId || '';
  const useNodeMode = res.proxyMode === 'manual' || res.proxyMode === 'auto';
  const activeIsMini = MINI_PROXY_ENABLED && (res.activeProfileId || '') === MINI_PROFILE_ID && useNodeMode;
  $('#profileRow').style.display = useNodeMode ? 'flex' : 'none';
  $('#miniProxyRow').style.display = 'none';
  if (MINI_PROXY_ENABLED) {
    renderMiniSubscriptions(res);
    if (activeIsMini) checkMiniStatus();
  }

  updateTheme(res.theme || 'dark');
  if (!popupInitialized) {
    popupInitialized = true;
    fetchInitialIp().catch(() => {});
    return;
  }
  refreshHeroRouteSummary(res, { preferCache: true }).catch(() => {});
}

function updateTheme(theme) {
  document.body.className = theme;
  $('#themeToggle').textContent = theme === 'light' ? '🌙' : '☀️';
}

function getHeroCacheKey(snapshot = {}) {
  return [
    snapshot.currentExitIp || '',
    snapshot.ipCountry || '',
    snapshot.ipCity || '',
    snapshot.lastContextRefreshAt || 0
  ].join('|');
}

function updateFollowIpOptions(snapshot = {}) {
  const followIpOpt = $('#tzSelect')?.querySelector('option[value="ip"]');
  if (followIpOpt) {
    followIpOpt.innerText = snapshot.ipTimezone
      ? `${i18n('optIpLocation')} (${snapshot.ipTimezone})`
      : i18n('optIpLocation');
  }
  const followIpLangOpt = $('#langSelect')?.querySelector('option[value="ip"]');
  if (followIpLangOpt) {
    followIpLangOpt.innerText = snapshot.ipLanguage
      ? `${i18n('optIpLocation')} (${snapshot.ipLanguage})`
      : i18n('optIpLocation');
  }
}

function routeLabel(label) {
  if (currentUiLang !== 'zh') return label;
  const map = {
    Current: '当前',
    Cloudflare: 'Cloudflare',
    Claude: 'Claude',
    OpenAI: 'OpenAI',
    Social: '社交',
    China: '中国出口'
  };
  return map[label] || label;
}

function renderHeroRouteCards(groups = [], current = {}) {
  const preferredGroups = groups.slice().sort((a, b) => {
    if (a.highlight && !b.highlight) return -1;
    if (!a.highlight && b.highlight) return 1;
    return b.labels.length - a.labels.length;
  });
  const summaryLabel = $('#heroSummaryLabel');
  if (summaryLabel) {
    summaryLabel.innerText = preferredGroups.length <= 1
      ? (currentUiLang === 'zh' ? '当前出口 IP' : 'CURRENT EXIT IP')
      : (currentUiLang === 'zh' ? `${preferredGroups.length} 条出口路径` : `${preferredGroups.length} EXIT ROUTES`);
  }
  const heroIp = $('#hero-ip');
  const heroGeo = $('#hero-geo');
  if (preferredGroups.length <= 1) {
    const only = preferredGroups[0];
    if (heroIp) heroIp.innerText = only?.ip || current.currentExitIp || '--';
    if (heroGeo) heroGeo.innerText = only?.geo || [current.ipCountry, current.ipCity].filter(Boolean).join(', ') || i18n('heroDetecting');
  } else {
    if (heroIp) heroIp.innerText = currentUiLang === 'zh' ? `检测到 ${preferredGroups.length} 条路径` : `${preferredGroups.length} routes detected`;
    if (heroGeo) heroGeo.innerText = preferredGroups.map((group) => routeLabel(group.labels[0])).join(' / ');
  }

  const grid = $('#heroRouteGrid');
  if (!grid) return;
  if (!preferredGroups.length || preferredGroups.length <= 1) {
    grid.innerHTML = '';
    return;
  }
  grid.innerHTML = preferredGroups.map((group) => `
    <div class="hero-route-card ${group.highlight ? 'highlight' : ''} ${preferredGroups.length === 1 ? 'single' : ''}">
      <div class="hero-route-label">${group.labels.map((item) => routeLabel(item)).join(' / ')}</div>
      <div class="hero-route-ip mono">${group.ip}</div>
      ${group.geo ? `<div class="hero-route-meta">${group.geo}</div>` : `<div class="hero-route-meta">${i18n('scanning')}</div>`}
    </div>
  `).join('');
}

function applyHeroSnapshot(snapshot = {}) {
  updateFollowIpOptions(snapshot);
  const heroIp = $('#hero-ip');
  const heroGeo = $('#hero-geo');
  if (snapshot.currentExitIp) {
    if (heroIp) heroIp.innerText = snapshot.currentExitIp;
    if (heroGeo) heroGeo.innerText = [snapshot.ipCountry, snapshot.ipCity].filter(Boolean).join(', ') || i18n('heroDetecting');
    const grid = $('#heroRouteGrid');
    if (grid && !grid.children.length) {
      renderHeroRouteCards([{
        ip: snapshot.currentExitIp,
        labels: ['Current'],
        geo: [snapshot.ipCountry, snapshot.ipCity].filter(Boolean).join(', '),
        highlight: true
      }], snapshot);
    }
    return;
  }
  if (heroIp) heroIp.innerText = i18n('scanning');
  if (heroGeo) heroGeo.innerText = i18n('heroDetecting');
}

async function fetchInitialIp() {
  const snapshotRes = await sendRuntimeMessage({ action: 'getExitSnapshot' });
  const snapshot = snapshotRes?.snapshot || {};
  applyHeroSnapshot(snapshot);
  refreshHeroRouteSummary(snapshot, { preferCache: true }).catch(() => {});

  const probeRes = await sendRuntimeMessage({ action: 'probeExit', mode: 'light' });
  const next = probeRes?.snapshot || {};
  applyHeroSnapshot(next);
  refreshHeroRouteSummary(next, { force: !!probeRes?.changed }).catch(() => {});
}

async function forceRefreshExitHero() {
  const probeRes = await sendRuntimeMessage({ action: 'probeExit', mode: 'force' });
  const next = probeRes?.snapshot || {};
  applyHeroSnapshot(next);
  await refreshHeroRouteSummary(next, { force: true }).catch(() => {});
}

function renderMiniSubscriptions(res = {}) {
  const select = $('#miniSubSelect');
  if (!select) return;
  const subs = Array.isArray(res.miniSubscriptions) && res.miniSubscriptions.length
    ? res.miniSubscriptions
    : (res.miniSubUrl ? [{ id: 'current', name: '当前订阅', url: res.miniSubUrl }] : []);
  select.innerHTML = '';
  if (!subs.length) {
    select.add(new Option('未配置订阅', ''));
    select.disabled = true;
    $('#miniSubBtn').disabled = true;
    setMiniMeta('请先在网页端配置订阅，然后这里选择并刷新。');
    return;
  }
  subs.forEach((item, index) => {
    const label = item.name || `订阅 ${index + 1}`;
    const value = item.url || '';
    select.add(new Option(label, value));
  });
  if (res.miniSubUrl) select.value = res.miniSubUrl;
  select.disabled = false;
  $('#miniSubBtn').disabled = false;
}

function setStatus(el, text, colorVar) {
  if (!el) return;
  el.innerText = text;
  el.style.color = colorVar ? `var(${colorVar})` : '';
}

function setMiniStatus(text, colorVar) {
  setStatus($('#miniStatusText'), text, colorVar);
}

function setMiniMeta(text, colorVar = '') {
  const el = $('#miniNodeMeta');
  if (!el) return;
  el.innerText = text;
  el.style.color = colorVar ? `var(${colorVar})` : '';
}

function formatMiniDelay(delay) {
  return Number.isFinite(Number(delay)) ? `${Math.round(Number(delay))}ms` : 'timeout';
}

function getMiniDelayCache(storage = null) {
  const source = storage || {};
  const cache = source.miniNodeDelays || {};
  const ts = Number(source.miniNodeDelayAt || 0);
  const fresh = !!ts && (Date.now() - ts < MINI_DELAY_CACHE_TTL_MS);
  return { cache, ts, fresh };
}

function formatMiniCacheAge(ts) {
  if (!ts) return '';
  const diff = Math.max(0, Date.now() - ts);
  if (diff < 60 * 1000) return '刚刚';
  return `${Math.round(diff / 60000)} 分钟前`;
}

function buildMiniNodeLabel(name, cache = {}, fresh = false) {
  if (!fresh) return name;
  const delay = cache[name];
  return delay == null ? name : `${name} · ${formatMiniDelay(delay)}`;
}

function renderMiniNodeOptions(nodes = [], storage = {}, selectedValue = '') {
  const sel = $('#miniNodeSelect');
  if (!sel) return;
  const { cache, fresh } = getMiniDelayCache(storage);
  sel.innerHTML = '';
  nodes.forEach((name) => {
    sel.add(new Option(buildMiniNodeLabel(name, cache, fresh), name));
  });
  if (selectedValue && nodes.includes(selectedValue)) sel.value = selectedValue;
}

function formatRouteGeo(source = {}) {
  const parts = [source.country, source.region, source.city].filter(Boolean);
  return parts.join(', ');
}

async function refreshHeroRouteSummary(snapshot = null, options = {}) {
  const current = snapshot || (await sendRuntimeMessage({ action: 'getExitSnapshot' }))?.snapshot || {};
  const cacheKey = getHeroCacheKey(current);
  const cacheFresh = heroSummaryCache.key === cacheKey && (Date.now() - heroSummaryCache.at < HERO_SUMMARY_TTL_MS);
  if (options.preferCache && cacheFresh && heroSummaryCache.groups.length) {
    renderHeroRouteCards(heroSummaryCache.groups, current);
    return heroSummaryCache.groups;
  }

  const runId = ++heroSummaryRunId;
  const [cfTrace, claudeTrace, openaiTrace, socialTrace, chinaExit] = await Promise.all([
    withTimeout(sendRuntimeMessage({ action: 'fetchTrace', url: 'https://www.cloudflare.com/cdn-cgi/trace' }), 2500, { error: 'timeout' }),
    withTimeout(sendRuntimeMessage({ action: 'fetchTrace', url: 'https://claude.ai/cdn-cgi/trace' }), 2500, { error: 'timeout' }),
    withTimeout(sendRuntimeMessage({ action: 'fetchTrace', url: 'https://openai.com/cdn-cgi/trace' }), 2500, { error: 'timeout' }),
    withTimeout(sendRuntimeMessage({ action: 'fetchTrace', url: 'https://x.com/cdn-cgi/trace' }), 2500, { error: 'timeout' }),
    withTimeout(sendRuntimeMessage({ action: 'getChinaIp' }), 2200, {})
  ]);
  if (runId !== heroSummaryRunId) return [];
  const probes = [
    { label: 'Current', ip: current.currentExitIp || '--', geo: [current.ipCountry, current.ipCity].filter(Boolean).join(', '), highlight: true },
    { label: 'Cloudflare', ip: parseTraceValue(cfTrace?.text) || '' },
    { label: 'Claude', ip: parseTraceValue(claudeTrace?.text) || '' },
    { label: 'OpenAI', ip: parseTraceValue(openaiTrace?.text) || '' },
    { label: 'Social', ip: parseTraceValue(socialTrace?.text) || '' },
    { label: 'China', ip: chinaExit?.ip || '', geo: [chinaExit?.pro, chinaExit?.city].filter(Boolean).join(', ') }
  ].filter((item) => item.ip && item.ip !== '--');

  const groups = [];
  probes.forEach((item) => {
    const found = groups.find((group) => group.ip === item.ip);
    if (found) {
      found.labels.push(item.label);
      if (!found.geo && item.geo) found.geo = item.geo;
      if (item.highlight) found.highlight = true;
      return;
    }
    groups.push({
      ip: item.ip,
      labels: [item.label],
      geo: item.geo || '',
      highlight: !!item.highlight
    });
  });
  if (!groups.length) {
    heroSummaryCache = { key: cacheKey, at: Date.now(), groups: [] };
    renderHeroRouteCards([], current);
    return [];
  }

  renderHeroRouteCards(groups, current);
  const needsGeo = groups.some((group) => !group.geo && group.ip && group.ip !== '--');
  if (!needsGeo) {
    heroSummaryCache = { key: cacheKey, at: Date.now(), groups };
    return groups;
  }

  const enrichedGroups = await Promise.all(groups.map(async (group) => {
    if (group.geo || !group.ip || group.ip === '--') return group;
    try {
      const cross = await withTimeout(sendRuntimeMessage({ action: 'fetchIpCrossCheck', ip: group.ip }), 1800, { data: null });
      const ipapi = cross?.data?.ipapiis?.ok === false ? null : cross?.data?.ipapiis;
      const ipsb = cross?.data?.ipsb?.ok === false ? null : cross?.data?.ipsb;
      const geo = formatRouteGeo(ipapi || ipsb || {});
      return geo ? { ...group, geo } : group;
    } catch (error) {
      return group;
    }
  }));
  if (runId !== heroSummaryRunId) return groups;
  heroSummaryCache = { key: cacheKey, at: Date.now(), groups: enrichedGroups };
  renderHeroRouteCards(enrichedGroups, current);
  return enrichedGroups;
}

async function persistMiniDelayCache(results = []) {
  const cache = {};
  results.forEach((item) => {
    if (item?.name) cache[item.name] = Number.isFinite(item.delay) ? Math.round(item.delay) : null;
  });
  await chrome.storage.local.set({
    miniNodeDelays: cache,
    miniNodeDelayAt: Date.now()
  });
}

async function verifyMiniProxyRoute(nodeName) {
  const previous = await chrome.storage.local.get(['miniLastRouteFingerprint']);
  const [cfTrace, claudeTrace, openaiTrace] = await Promise.all([
    sendRuntimeMessage({ action: 'fetchTrace', url: 'https://www.cloudflare.com/cdn-cgi/trace' }),
    sendRuntimeMessage({ action: 'fetchTrace', url: 'https://claude.ai/cdn-cgi/trace' }),
    sendRuntimeMessage({ action: 'fetchTrace', url: 'https://openai.com/cdn-cgi/trace' })
  ]);
  const cfIp = parseTraceValue(cfTrace?.text) || '--';
  const claudeIp = parseTraceValue(claudeTrace?.text) || '--';
  const openaiIp = parseTraceValue(openaiTrace?.text) || '--';
  const fingerprint = `${cfIp}|${claudeIp}|${openaiIp}`;
  await chrome.storage.local.set({
    miniLastRouteFingerprint: {
      nodeName,
      fingerprint,
      cfIp,
      claudeIp,
      openaiIp,
      at: Date.now()
    }
  });
  if (previous?.miniLastRouteFingerprint?.fingerprint && previous.miniLastRouteFingerprint.fingerprint === fingerprint && previous.miniLastRouteFingerprint.nodeName !== nodeName) {
    setMiniMeta(`已切到 ${nodeName} · 但 CF/Claude/OpenAI 出口与 ${previous.miniLastRouteFingerprint.nodeName} 相同`, '--highlight');
    return;
  }
  setMiniMeta(`已切到 ${nodeName} · CF ${cfIp} · Claude ${claudeIp} · OpenAI ${openaiIp}`, '--success');
}

async function applyMiniNodeSwitch(nodeName, options = {}) {
  if (!nodeName) return false;
  setMiniMeta(`正在切换到 ${nodeName}...`);
  await chrome.storage.local.set({ miniActiveNode: nodeName });
  const res = await fetch('http://127.0.0.1:28888/switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proxy: nodeName })
  });
  const data = await res.json().catch(() => ({}));
  if (data.ok === false) throw new Error(data.error || '切换失败');
  if (options.refreshExit !== false) await forceRefreshExitHero().catch(() => {});
  if (options.verify !== false) await verifyMiniProxyRoute(nodeName).catch(() => {
    setMiniMeta(`当前节点：${nodeName}（已切换，出口验证稍后刷新）`, '--success');
  });
  return true;
}

async function fetchMiniDelay(name, timeoutMs = 2500) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`http://127.0.0.1:28888/delay?name=${encodeURIComponent(name)}`, { signal: ctrl.signal });
    const data = await res.json();
    return { name, delay: Number(data.delay), ok: Number.isFinite(Number(data.delay)) };
  } catch (error) {
    return { name, delay: Number.POSITIVE_INFINITY, ok: false };
  } finally {
    clearTimeout(timer);
  }
}

async function runMiniSpeedBatch(nodes, onProgress) {
  const queue = [...nodes];
  const results = [];
  const concurrency = Math.min(5, Math.max(1, queue.length));
  let completed = 0;

  async function worker() {
    while (queue.length) {
      const name = queue.shift();
      if (!name) return;
      const result = await fetchMiniDelay(name);
      results.push(result);
      completed += 1;
      if (onProgress) onProgress({ completed, total: nodes.length, result, results: results.slice() });
    }
  }

  await Promise.all(new Array(concurrency).fill(0).map(() => worker()));
  return results;
}

function pickBestMiniNode(results = []) {
  return results
    .filter((item) => Number.isFinite(item.delay))
    .sort((a, b) => a.delay - b.delay)[0] || null;
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
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => resolve(tabs[0] || null));
  });
}

function injectProbeBridge(tabId) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ['content-scripts/page-main.js'],
      world: 'MAIN'
    }, () => {
      if (chrome.runtime.lastError) {
        resolve({ error: chrome.runtime.lastError.message });
        return;
      }
      chrome.scripting.executeScript({
        target: { tabId, allFrames: false },
        files: ['content-scripts/bridge.js']
      }, () => {
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

const CONNECTIVITY_TARGETS = [
  { id: 'cloudflare', label: 'Cloudflare', url: 'https://www.cloudflare.com/cdn-cgi/trace' },
  { id: 'google', label: 'Google', url: 'https://www.google.com/generate_204' },
  { id: 'claude', label: 'Claude', url: 'https://claude.ai/login' },
  { id: 'anthropic', label: 'Anthropic API', url: 'https://api.anthropic.com/' }
];

function setButtonBusy(button, busy) {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.dataset.originalText || button.innerText;
    button.innerText = i18n('scanning');
    button.disabled = true;
    return;
  }
  button.disabled = false;
  button.innerText = button.dataset.originalText || button.innerText;
}

async function openLinkedReport() {
  const tab = await queryActiveTab();
  if (tab?.id && /^https?:/i.test(tab.url || '')) {
    await chrome.storage.local.set({
      lastProbeTabId: tab.id,
      lastProbeTabUrl: tab.url
    });
  }
  chrome.tabs.create({ url: chrome.runtime.getURL('report.html') });
}

async function probeUrl(url, options = {}) {
  return sendRuntimeMessage({ action: 'probeEndpoint', url, options });
}

function getProbeLabel(result) {
  return result.ok ? i18n('reachable') : i18n('probeFailed');
}

function getProbeColor(result) {
  return result.ok ? '--success' : '--danger';
}

function renderConnectivityList() {
  const list = $('#ping-list');
  if (!list) return;
  list.innerHTML = '';

  CONNECTIVITY_TARGETS.forEach((target) => {
    const row = document.createElement('div');
    row.className = 'ping-item';
    row.innerHTML = `
      <div class="ping-info">
        <div class="ping-name">${target.label}</div>
      </div>
      <div id="ping-${target.id}" class="ping-val">--</div>
    `;
    list.appendChild(row);
  });
}

function setConnectivityItem(targetId, text, colorVar) {
  setStatus($(`#ping-${targetId}`), text, colorVar);
}

function parseTraceValue(text) {
  if (!text) return '--';
  const ipMatch = text.match(/(?:^|\n)ip=([^\n]+)/);
  return ipMatch ? ipMatch[1].trim() : '--';
}

function withTimeout(promise, timeoutMs = 7000, fallback = { error: 'timeout' }) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
  ]);
}

function formatAgeShort(ageMs) {
  const ms = Number(ageMs || 0);
  if (!Number.isFinite(ms) || ms <= 0) return '刚刚';
  if (ms < 60 * 1000) return `${Math.max(1, Math.round(ms / 1000))}s`;
  if (ms < 60 * 60 * 1000) return `${Math.round(ms / 60000)}m`;
  return `${Math.round(ms / 3600000)}h`;
}

function pickFirstValue(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    return value;
  }
  return '';
}

function normalizePopupIpMeta(primary = null, cross = null, ip = '') {
  const ipapi = cross?.ipapiis?.ok === false ? null : cross?.ipapiis;
  const ipsb = cross?.ipsb?.ok === false ? null : cross?.ipsb;
  return {
    ip: pickFirstValue(primary?.ip, ipapi?.ip, ipsb?.ip, ip),
    country: pickFirstValue(primary?.country, ipapi?.country, ipsb?.country),
    city: pickFirstValue(primary?.city, ipapi?.city, ipsb?.city),
    asn: pickFirstValue(primary?.asn, ipapi?.asn, ipsb?.asn),
    asOrganization: pickFirstValue(primary?.asOrganization, ipapi?.org, ipapi?.isp, ipsb?.org, ipsb?.isp),
    reverseDns: pickFirstValue(primary?.reverseDns),
    hostPtr: pickFirstValue(primary?.hostPtr),
    fakeIp: primary?.fakeIp,
    chinaDns: pickFirstValue(primary?.chinaDns),
    trust_score: primary?.trust_score,
    countryCode: pickFirstValue(primary?.countryCode, ipapi?.countryCode, ipsb?.countryCode),
    region: pickFirstValue(primary?.region, ipapi?.region, ipsb?.region),
    raw: primary?.raw || {}
  };
}

function setClaudeScorePending(text = '等待权威评分...') {
  updateClaudeScore(Number.NaN);
  $('#claudeIpType').innerText = '--';
  const label = $('#claudeScoreLabel');
  if (label) label.innerText = text;
}

function renderClaudeIpBadge(ip, tone = 'badge-gray') {
  const box = $('#safety-badges');
  if (!box) return;
  box.innerHTML = '';
  const span = document.createElement('span');
  span.className = `badge ${tone}`;
  span.innerText = ip ? `IP ${ip}` : 'IP --';
  box.appendChild(span);
}

function renderClaudeRiskBadges(risk = {}, ip = '') {
  const box = $('#safety-badges');
  if (!box) return;
  box.innerHTML = '';
  if (ip) {
    const ipSpan = document.createElement('span');
    ipSpan.className = 'badge badge-gray';
    ipSpan.innerText = `IP ${ip}`;
    box.appendChild(ipSpan);
  }
  SECURITY_KEYS.forEach(({ key, label }) => {
    const span = document.createElement('span');
    span.className = `badge ${risk[key] ? 'badge-red' : 'badge-green'}`;
    span.innerText = `${risk[key] ? '✗' : '✓'} ${i18n(label)}`;
    box.appendChild(span);
  });
}

// --- 探测逻辑 (客户端直连，防 IP 漂移) ---
async function runClaudeChecks() {
  const runId = ++claudeCheckRunId;
  setStatus($('#claudeAiStatus'), i18n('scanning'));
  setStatus($('#claudeCodeStatus'), i18n('scanning'));
  setStatus($('#claudeLatencyText'), '--');
  setClaudeScorePending('等待 Claude Trace...');
  $('#attr-country').innerText = i18n('scanning');
  $('#attr-city').innerText = i18n('scanning');
  $('#attr-asn').innerText = i18n('scanning');
  $('#attr-isp').innerText = i18n('scanning');
  $('#attr-reverseDns').innerText = '--';
  $('#attr-hostPtr').innerText = '--';
  $('#attr-fakeIp').innerText = '--';
  $('#attr-chinaDns').innerText = '--';
  renderClaudeIpBadge('');

  const claudeAiPromise = withTimeout(probeUrl('https://claude.ai/login'), 4500, { ok: false, error: 'timeout' }).then((res) => {
    if (runId !== claudeCheckRunId) return res;
    setStatus($('#claudeAiStatus'), getProbeLabel(res), getProbeColor(res));
    setStatus($('#claudeLatencyText'), res.ok ? `${res.latency}ms` : '--');
    return res;
  });
  const claudeCodePromise = withTimeout(probeUrl('https://api.anthropic.com/'), 4500, { ok: false, error: 'timeout' }).then((res) => {
    if (runId !== claudeCheckRunId) return res;
    setStatus($('#claudeCodeStatus'), getProbeLabel(res), getProbeColor(res));
    return res;
  });

  const traceRes = await withTimeout(sendRuntimeMessage({ action: 'fetchTrace', url: 'https://claude.ai/cdn-cgi/trace' }), 3200, { error: 'timeout' });
  if (runId !== claudeCheckRunId) return;

  const claudeTraceIp = parseTraceValue(traceRes?.text);
  if (!claudeTraceIp || claudeTraceIp === '--') {
    setClaudeScorePending('未取得 Claude 出口 IP');
    $('#claudeIpType').innerText = currentUiLang === 'zh' ? 'Trace 失败' : 'Trace failed';
    await Promise.allSettled([claudeAiPromise, claudeCodePromise]);
    return;
  }

  renderClaudeIpBadge(claudeTraceIp);
  setClaudeScorePending('基础情报已就绪，正在请求权威评分...');
  $('#claudeIpType').innerText = currentUiLang === 'zh' ? 'Trace 已就绪' : 'Trace ready';

  const crossPromise = withTimeout(sendRuntimeMessage({ action: 'fetchIpCrossCheck', ip: claudeTraceIp }), 2500, { data: null, error: 'timeout' }).then((traceCrossRes) => {
    if (runId !== claudeCheckRunId) return null;
    const meta = normalizePopupIpMeta(null, traceCrossRes?.data || null, claudeTraceIp);
    $('#attr-country').innerText = meta.country || '--';
    $('#attr-city').innerText = meta.city || '--';
    $('#attr-asn').innerText = meta.asn || '--';
    $('#attr-isp').innerText = meta.asOrganization || '--';
    return meta;
  });

  const riskPromise = withTimeout(sendRuntimeMessage({ action: 'fetchIprisk', ip: claudeTraceIp }), 6500, { error: 'timeout' }).then((traceRiskRes) => {
    if (runId !== claudeCheckRunId) return null;
    const claudeRisk = traceRiskRes?.data || null;
    if (!claudeRisk) {
      const pendingText = traceRiskRes?.meta?.warming
        ? '权威评分超时，后台继续刷新...'
        : (traceRiskRes?.error === 'timeout' ? '权威评分超时' : '权威评分不可用');
      setClaudeScorePending(pendingText);
      $('#claudeIpType').innerText = currentUiLang === 'zh' ? '等待评分' : 'Awaiting score';
      renderClaudeIpBadge(claudeTraceIp);
      return null;
    }
    updateClaudeScore(claudeRisk.trust_score);
    if (traceRiskRes?.meta?.cached) {
      const ageText = formatAgeShort(traceRiskRes.meta.ageMs);
      const label = $('#claudeScoreLabel');
      if (label) label.innerText = traceRiskRes?.meta?.warming
        ? `权威缓存 · ${ageText} 前 · 后台刷新中`
        : `权威缓存 · ${ageText} 前`;
    }
    $('#claudeIpType').innerText = getIpTypeLabel(claudeRisk);
    $('#attr-reverseDns').innerText = claudeRisk.reverseDns || '--';
    $('#attr-hostPtr').innerText = claudeRisk.hostPtr || '--';
    $('#attr-fakeIp').innerText = claudeRisk.fakeIp != null ? (claudeRisk.fakeIp ? 'Yes' : 'No') : '--';
    $('#attr-chinaDns').innerText = claudeRisk.chinaDns || '--';
    renderClaudeRiskBadges(claudeRisk, claudeTraceIp);
    return claudeRisk;
  });

  await Promise.allSettled([claudeAiPromise, claudeCodePromise, crossPromise, riskPromise]);
}

// --- 安全检测标签完整列表 ---
const SECURITY_KEYS = [
  { key: 'is_vpn', label: 'vpn' },
  { key: 'is_proxy', label: 'proxy' },
  { key: 'is_tor', label: 'tor' },
  { key: 'is_datacenter', label: 'datacenter' },
  { key: 'is_relay', label: 'relay' },
  { key: 'is_anonymous', label: 'anonymous' },
  { key: 'is_attacker', label: 'attacker' },
  { key: 'is_abuser', label: 'abuser' },
  { key: 'is_threats', label: 'threats' },
  { key: 'is_bogon', label: 'bogon' },
  { key: 'is_spam', label: 'spam' },
  { key: 'is_batch', label: 'batch' },
  { key: 'is_scanner', label: 'scanner' },
  { key: 'is_botnet', label: 'botnet' }
];

function getScoreLabel(score) {
  if (!Number.isFinite(Number(score))) return '--';
  if (score >= 90) return i18n('scoreTrustworthy');
  if (score >= 70) return i18n('scoreGood');
  if (score >= 40) return i18n('scoreFair');
  if (score >= 20) return i18n('scorePoor');
  return i18n('scoreBad');
}

function getIpTypeLabel(risk = {}) {
  if (risk.raw?.mobile) return currentUiLang === 'zh' ? 'Mobile' : 'Mobile';
  if (risk.is_proxy || risk.is_vpn || risk.raw?.proxy) return 'Proxy-likely';
  if (risk.is_datacenter || risk.raw?.hosting) return 'Datacenter';
  return 'Residential';
}

function updateClaudeScore(s) {
  const numeric = Number(s);
  $('#claudeScoreCircle').style.strokeDasharray = `${Number.isFinite(numeric) ? numeric : 0}, 100`;
  $('#claudeScoreValue').innerText = Number.isFinite(numeric) ? Math.round(numeric) : '--';
  const label = $('#claudeScoreLabel');
  if (label) label.innerText = getScoreLabel(numeric);
}

async function runTraceChecks() {
  const button = $('#runTraceBtn');
  setButtonBusy(button, true);
  setStatus($('#trace-cf'), i18n('scanning'));
  setStatus($('#trace-claude'), i18n('scanning'));

  await Promise.all([
    withTimeout(sendRuntimeMessage({ action: 'fetchTrace', url: 'https://www.cloudflare.com/cdn-cgi/trace' }), 3200, { error: 'timeout' }).then((cfRes) => {
      setStatus($('#trace-cf'), cfRes?.text ? parseTraceValue(cfRes.text) : (cfRes?.error === 'timeout' ? '请求超时' : i18n('probeFailed')), cfRes?.text ? '' : '--danger');
    }),
    withTimeout(sendRuntimeMessage({ action: 'fetchTrace', url: 'https://claude.ai/cdn-cgi/trace' }), 3200, { error: 'timeout' }).then((claudeRes) => {
      setStatus($('#trace-claude'), claudeRes?.text ? parseTraceValue(claudeRes.text) : (claudeRes?.error === 'timeout' ? '请求超时' : i18n('probeFailed')), claudeRes?.text ? '' : '--danger');
    })
  ]);
  setButtonBusy(button, false);
}

async function runConnectivityChecks() {
  const button = $('#runConnectivityBtn');
  setButtonBusy(button, true);
  let completed = 0;
  await Promise.all(CONNECTIVITY_TARGETS.map(async (target) => {
    setConnectivityItem(target.id, i18n('scanning'));
    const result = await withTimeout(probeUrl(target.url, target.options), 4500, { ok: false, error: 'timeout' });
    completed += 1;
    if (button) button.innerText = `${i18n('scanning')} ${completed}/${CONNECTIVITY_TARGETS.length}`;
    const text = result.ok ? `${result.latency}ms` : (result?.error === 'timeout' ? '请求超时' : i18n('probeFailed'));
    setConnectivityItem(target.id, text, getProbeColor(result));
  }));

  setButtonBusy(button, false);
}

function getWebRtcStatus() {
  return sendToActiveTab({ action: 'pageProbe', probeType: 'webrtc' });
}

function getWebglFingerprint() {
  return sendToActiveTab({ action: 'pageProbe', probeType: 'webgl' });
}

function getPageEnvironment() {
  return sendToActiveTab({ action: 'pageProbe', probeType: 'pageEnv' });
}

function parseDnsGeo(geo) {
  if (!geo) return { country: '', provider: '' };
  const [country, ...rest] = String(geo).split(' - ');
  return { country: (country || '').trim(), provider: rest.join(' - ').trim() };
}

function evaluateDnsSafety(dnsData, riskData) {
  const dnsGeo = dnsData?.dns?.geo || dnsData?.geo || '';
  const dnsIp = dnsData?.dns?.ip || dnsData?.ip || '--';
  const exitCountry = riskData?.country || '';
  const dnsInfo = parseDnsGeo(dnsGeo);
  const provider = (dnsInfo.provider || '').toLowerCase();
  const dnsIpLower = String(dnsIp).toLowerCase();
  const privateDns = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/.test(dnsIpLower);
  const sameCountry = !!exitCountry && dnsInfo.country === exitCountry;
  const trustedProvider = /cloudflare|google|quad9|nextdns/.test(provider);

  if (privateDns) {
    return { safe: false, text: `${i18n('detected')} (${dnsGeo || dnsIp})` };
  }
  if (sameCountry || trustedProvider) {
    return { safe: true, text: `${i18n('protected')} (${dnsGeo || dnsIp})` };
  }
  if (!dnsGeo) {
    return { safe: false, text: i18n('probeFailed') };
  }
  return { safe: false, text: `${i18n('detected')} (${dnsGeo})` };
}

function evaluateWebRtcSafety(webrtcRes) {
  if (!webrtcRes || webrtcRes.error) return { safe: false, text: i18n('probeFailed') };
  if (!webrtcRes.supported) return { safe: true, text: i18n('unsupported') };
  if (webrtcRes.privateIps?.length) {
    return { safe: false, text: `${i18n('detected')} (${webrtcRes.privateIps.join(', ')})` };
  }
  if (webrtcRes.publicIps?.length) {
    return { safe: true, text: `${i18n('protected')} (${webrtcRes.publicIps.join(', ')})` };
  }
  return { safe: true, text: i18n('notDetected') };
}

async function runAuditChecks() {
  const runId = ++auditRunId;
  const button = $('#runAuditBtn');
  setButtonBusy(button, true);

  setStatus($('#dns-ip'), '--');
  setStatus($('#dns-status'), i18n('scanning'));
  setStatus($('#webrtc-res'), i18n('scanning'));
  setStatus($('#dev-tz'), i18n('scanning'));
  setStatus($('#dev-lang'), i18n('scanning'));
  setStatus($('#dev-webgl'), i18n('scanning'));
  runClaudeChecks().catch(() => {});
  runTraceChecks().catch(() => {});
  runConnectivityChecks().catch(() => {});

  const totalTasks = 3;
  let finishedTasks = 0;
  const finishTask = () => {
    if (runId !== auditRunId || !button) return;
    finishedTasks += 1;
    if (finishedTasks >= totalTasks) {
      setButtonBusy(button, false);
      return;
    }
    button.innerText = `${i18n('scanning')} ${finishedTasks}/${totalTasks}`;
  };

  const snapshotPromise = withTimeout(sendRuntimeMessage({ action: 'getExitSnapshot' }), 1200, { snapshot: {} });

  (async () => {
    try {
      const [dnsRes, snapshotRes] = await Promise.all([
        withTimeout(sendRuntimeMessage({ action: 'fetchDnsLeak' }), 3500, { error: 'timeout' }),
        snapshotPromise
      ]);
      if (runId !== auditRunId) return;
      const fallbackRisk = { country: snapshotRes?.snapshot?.ipCountry || '' };
      if (dnsRes?.data) {
        const dnsIp = dnsRes.data?.dns?.ip || dnsRes.data?.ip || '--';
        const dnsEval = evaluateDnsSafety(dnsRes.data, fallbackRisk);
        const dnsStatusText = dnsRes?.meta?.cached
          ? `${dnsEval.text} · 缓存 ${formatAgeShort(dnsRes.meta.ageMs)} 前${dnsRes?.meta?.warming ? ' · 后台刷新中' : ''}`
          : dnsEval.text;
        setStatus($('#dns-ip'), dnsIp);
        setStatus($('#dns-status'), dnsStatusText, dnsEval.safe ? '--success' : '--danger');
      } else {
        setStatus($('#dns-ip'), '--');
        setStatus($('#dns-status'), dnsRes?.meta?.warming ? '请求超时，后台继续刷新...' : (dnsRes?.error === 'timeout' ? '请求超时' : i18n('probeFailed')), '--danger');
      }
    } finally {
      finishTask();
    }
  })();

  (async () => {
    try {
      const webrtcRes = await withTimeout(getWebRtcStatus(), 3500, { error: 'timeout' });
      if (runId !== auditRunId) return;
      const webrtcEval = evaluateWebRtcSafety(webrtcRes);
      setStatus($('#webrtc-res'), webrtcEval.text, webrtcEval.safe ? '--success' : '--danger');
    } finally {
      finishTask();
    }
  })();

  (async () => {
    try {
      const [pageEnv, webgl] = await Promise.all([
        withTimeout(getPageEnvironment(), 3500, { error: 'timeout' }),
        withTimeout(getWebglFingerprint(), 3500, { error: 'timeout' })
      ]);
      if (runId !== auditRunId) return;
      if (pageEnv && !pageEnv.error) {
        setStatus($('#dev-tz'), pageEnv.timezone || '--');
        setStatus($('#dev-lang'), pageEnv.language || '--');
      } else {
        setStatus($('#dev-tz'), pageEnv?.error === 'unsupported_tab' ? i18n('unsupported') : (pageEnv?.error === 'timeout' ? '请求超时' : i18n('probeFailed')), '--danger');
        setStatus($('#dev-lang'), pageEnv?.error === 'unsupported_tab' ? i18n('unsupported') : (pageEnv?.error === 'timeout' ? '请求超时' : i18n('probeFailed')), '--danger');
      }

      if (webgl && !webgl.error) {
        const webglText = webgl.status === 'unsupported' ? i18n('unsupported') : webgl.status === 'failed' ? i18n('probeFailed') : (webgl.value || '--');
        setStatus($('#dev-webgl'), webglText, webgl.status === 'failed' ? '--danger' : '');
      } else {
        setStatus($('#dev-webgl'), webgl?.error === 'unsupported_tab' ? i18n('unsupported') : (webgl?.error === 'timeout' ? '请求超时' : i18n('probeFailed')), '--danger');
      }
    } finally {
      finishTask();
    }
  })();
}

// --- 实时同步核心逻辑 ( chrome.storage.onChanged ) ---
const POPUP_FIELDS = ['proxyMode', 'proxyProfiles', 'activeProfileId', 'theme', 'timezone', 'language', 'ipTimezone', 'uiLang', 'miniSubUrl', 'miniSubscriptions', 'miniActiveNode', 'miniNodeDelays', 'miniNodeDelayAt'];
const RUNTIME_FIELDS = ['ipLanguage', 'ipCountryCode', 'ipCountry', 'ipCity', 'ipTimezone', 'currentExitIp', 'lastContextRefreshAt', 'lastExitProbeAt'];
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (POPUP_FIELDS.some((field) => field in changes)) {
    loadSettings().catch(() => {});
    return;
  }
  if (RUNTIME_FIELDS.some((field) => field in changes)) {
    chrome.storage.local.get(['currentExitIp', 'ipCountry', 'ipCity', 'ipTimezone', 'ipLanguage', 'lastContextRefreshAt'], (res) => {
      applyHeroSnapshot(res || {});
      refreshHeroRouteSummary(res || {}, { preferCache: true }).catch(() => {});
    });
  }
});

// --- AbortController 清理 ---
let fetchController = null;
function abortPendingFetch() {
  if (fetchController) { fetchController.abort(); fetchController = null; }
}

// --- 离线/在线处理 ---
function handleOffline() {
  const dot = $('#statusDot');
  if (dot) dot.style.background = 'var(--danger)';
}
function handleOnline() {
  const dot = $('#statusDot');
  if (dot) dot.style.background = 'var(--success)';
  fetchInitialIp().catch(() => {});
}

// --- 事件绑定 ---
document.addEventListener('DOMContentLoaded', () => {
  loadSettings().catch(() => {});
  renderConnectivityList();

  // 离线/在线监听
  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);
  if (!navigator.onLine) handleOffline();

  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      $$('.nav-item').forEach(b => b.classList.toggle('active', b === btn));
      $$('.view').forEach(v => v.classList.toggle('active', v.id === `tab-${tab}`));
      if (tab === 'claude') runClaudeChecks();
    });
  });

  $('#proxyMode').onchange = async (e) => {
    chrome.storage.local.set({ proxyMode: e.target.value });
    setTimeout(() => { forceRefreshExitHero().catch(() => {}); }, 900);
  };
  $('#activeProfile').onchange = async (e) => {
    const nextId = e.target.value;
    const mode = $('#proxyMode').value;
    const patch = { activeProfileId: nextId };
    if (MINI_PROXY_ENABLED && nextId === MINI_PROFILE_ID && !['manual', 'auto'].includes(mode)) patch.proxyMode = 'manual';
    await chrome.storage.local.set(patch);
  };
  $('#tzSelect').onchange = e => chrome.storage.local.set({ timezone: e.target.value });
  $('#langSelect').onchange = e => chrome.storage.local.set({ language: e.target.value });
  $('#uiLangToggle').onclick = () => {
    chrome.storage.local.set({ uiLang: currentUiLang === 'zh' ? 'en' : 'zh' });
  };
  $('#themeToggle').onclick = () => {
    chrome.storage.local.get(['theme'], r => {
      const next = r.theme === 'light' ? 'dark' : 'light';
      chrome.storage.local.set({ theme: next });
    });
  };
  $('#headerReport').onclick = () => openLinkedReport();
  $('#headerSettings').onclick = () => chrome.runtime.openOptionsPage();
  $('#quickScanBtn').onclick = () => {
    const btn = $$('.nav-item')[3]; // Auditor tab
    btn.click();
    runAuditChecks();
  };
  $('#runTraceBtn').onclick = () => runTraceChecks();
  $('#runConnectivityBtn').onclick = () => runConnectivityChecks();
  $('#runAuditBtn').onclick = () => runAuditChecks();
  $('#checkChinaBtn').onclick = () => {
    $('#cn-status').innerText = i18n('scanning');
    chrome.runtime.sendMessage({ action: 'getChinaIp' }, res => {
      if (res && res.ip) {
        $('#cn-status').innerText = res.ip;
        $('#cn-detail').innerText = `${res.pro || ''} ${res.city || ''} ${res.addr || ''}`.trim();
      } else {
        $('#cn-status').innerText = '--';
        $('#cn-detail').innerText = currentUiLang === 'zh' ? '检测失败' : 'Detection failed';
      }
    });
  };

  // --- Mini Proxy 事件绑定 ---
  if (MINI_PROXY_ENABLED) $('#miniRefreshStatus').onclick = () => checkMiniStatus();
  if (MINI_PROXY_ENABLED) $('#miniSubBtn').onclick = async () => {
    const url = $('#miniSubSelect').value.trim();
    if (!url) {
      setMiniMeta('当前没有可用订阅。', '--highlight');
      return;
    }
    const btn = $('#miniSubBtn');
    btn.disabled = true; btn.innerText = '更新中...';
    setMiniMeta('正在刷新订阅...');
    try {
      await chrome.storage.local.set({ miniSubUrl: url });
      const res = await fetch('http://127.0.0.1:28888/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.ok) {
        await loadMiniNodes({ refreshExit: false });
        setMiniMeta(`订阅刷新完成 · 节点 ${Number(data.nodes) || 0} 个`, '--success');
        setTimeout(() => { forceRefreshExitHero().catch(() => {}); }, 1000);
      } else {
        setMiniMeta(`订阅失败：${data.error || '未知错误'}`, '--danger');
      }
    } catch (e) {
      setMiniMeta(`订阅请求失败：${e.message}`, '--danger');
    } finally {
      btn.disabled = false; btn.innerText = '更新订阅';
    }
  };
  if (MINI_PROXY_ENABLED) $('#miniNodeSelect').onchange = async (e) => {
    try {
      await applyMiniNodeSwitch(e.target.value);
    } catch (e) {
      setMiniMeta(`切换失败：${e.message}`, '--danger');
    }
  };
  if (MINI_PROXY_ENABLED) $('#miniSpeedAllBtn').onclick = async () => {
    const btn = $('#miniSpeedAllBtn');
    const select = $('#miniNodeSelect');
    const nodes = Array.from(select.options).map((opt) => opt.value).filter(Boolean);
    if (!nodes.length) return;
    const currentNode = select.value;
    btn.disabled = true;
    btn.innerText = `测速中 0/${nodes.length}`;
    setMiniMeta(`正在测速 ${nodes.length} 个节点...`);
    const results = await runMiniSpeedBatch(nodes, ({ completed, total, result }) => {
      btn.innerText = `测速中 ${completed}/${total}`;
      const suffix = result.ok ? `${result.delay}ms` : 'timeout';
      setMiniMeta(`最近完成：${result.name} · ${suffix}`);
    });
    results.sort((a, b) => a.delay - b.delay);
    await persistMiniDelayCache(results);
    select.innerHTML = '';
    results.forEach((item) => {
      const suffix = Number.isFinite(item.delay) ? `${item.delay}ms` : 'timeout';
      select.add(new Option(`${item.name} · ${suffix}`, item.name));
    });
    if (currentNode && results.some((item) => item.name === currentNode)) select.value = currentNode;
    setMiniMeta(results.map((item) => `${item.name}: ${Number.isFinite(item.delay) ? `${item.delay}ms` : 'timeout'}`).slice(0, 3).join('  | '), '--success');
    btn.disabled = false;
    btn.innerText = '全部测速';
  };
  if (MINI_PROXY_ENABLED) $('#miniAutoPickBtn').onclick = async () => {
    const btn = $('#miniAutoPickBtn');
    const storage = await chrome.storage.local.get(['miniNodeDelays', 'miniNodeDelayAt']);
    const nodes = Array.from($('#miniNodeSelect').options).map((opt) => opt.value).filter(Boolean);
    if (!nodes.length) return;
    btn.disabled = true;
    btn.innerText = '优选中...';
    try {
      let results = [];
      const { cache, fresh } = getMiniDelayCache(storage);
      if (fresh) {
        results = nodes.map((name) => ({
          name,
          delay: Number.isFinite(Number(cache[name])) ? Number(cache[name]) : Number.POSITIVE_INFINITY
        }));
        setMiniMeta(`使用 ${formatMiniCacheAge(storage.miniNodeDelayAt)} 的测速缓存自动优选...`);
      } else {
        setMiniMeta('没有可用测速缓存，正在先测速再优选...');
        results = await runMiniSpeedBatch(nodes, ({ completed, total, result }) => {
          btn.innerText = `优选中 ${completed}/${total}`;
          setMiniMeta(`最近完成：${result.name} · ${formatMiniDelay(result.delay)}`);
        });
        await persistMiniDelayCache(results);
      }
      const best = pickBestMiniNode(results);
      if (!best) throw new Error('没有找到可用低延迟节点');
      $('#miniNodeSelect').value = best.name;
      await applyMiniNodeSwitch(best.name);
      setMiniMeta(`已自动优选 ${best.name} · ${formatMiniDelay(best.delay)}`, '--success');
    } catch (error) {
      setMiniMeta(`自动优选失败：${error.message}`, '--danger');
    } finally {
      btn.disabled = false;
      btn.innerText = '自动优选最低延迟';
    }
  };
});

// --- Popup 关闭时清理 ---
window.addEventListener('unload', () => {
  abortPendingFetch();
  window.removeEventListener('offline', handleOffline);
  window.removeEventListener('online', handleOnline);
});

// --- Mini Proxy  helpers ---
async function checkMiniStatus() {
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch('http://127.0.0.1:28888/status', { method: 'GET', signal: ctrl.signal });
    const data = await res.json();
    if (data.coreReady) {
      setMiniStatus(data.mihomo === 'ok' ? '在线 · 已启动' : '在线 · 启动中', '--success');
      setMiniMeta(data.running ? '本地核心在线，可切换节点。' : '本地核心已准备。');
      await loadMiniNodes({ refreshExit: false });
    } else {
      setMiniStatus('核心未就绪 (首次使用会自动下载约20MB)', '--highlight');
      setMiniMeta('等待 Atlas Mini 核心就绪...', '--highlight');
      $('#miniNodeBox').style.display = 'none';
    }
  } catch (e) {
    setMiniStatus('Atlas Mini 未运行 · 请先启动本地程序', '--danger');
    setMiniMeta('本地 API 127.0.0.1:28888 不可达。', '--danger');
    $('#miniNodeBox').style.display = 'none';
  }
}

async function loadMiniNodes(options = {}) {
  try {
    const storage = await chrome.storage.local.get(['miniActiveNode', 'miniNodeDelays', 'miniNodeDelayAt']);
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 3000);
    setMiniMeta('正在加载节点...');
    const res = await fetch('http://127.0.0.1:28888/nodes', { signal: ctrl.signal });
    const data = await res.json();
    const sel = $('#miniNodeSelect');
    if (data.nodes && data.nodes.length) {
      const selectedValue = data.nodes.includes(storage.miniActiveNode) ? storage.miniActiveNode : data.nodes[0];
      renderMiniNodeOptions(data.nodes, storage, selectedValue);
      sel.value = selectedValue;
      await chrome.storage.local.set({ miniActiveNode: sel.value });
      const noSubscription = $('#miniSubSelect')?.disabled;
      const cacheText = getMiniDelayCache(storage).fresh ? ` · 延迟缓存 ${formatMiniCacheAge(storage.miniNodeDelayAt)}` : '';
      setMiniMeta(noSubscription
        ? `共 ${data.nodes.length} 个节点 · 当前 ${sel.value}${cacheText} · 如需刷新订阅请先去网页端添加`
        : `共 ${data.nodes.length} 个节点 · 当前 ${sel.value}${cacheText}`);
      if (options.refreshExit) await forceRefreshExitHero();
    } else {
      setMiniMeta('当前订阅没有返回可用节点。', '--highlight');
    }
    $('#miniNodeBox').style.display = data.nodes && data.nodes.length ? 'block' : 'none';
  } catch (e) {
    setMiniMeta(`加载节点失败：${e.message}`, '--danger');
    $('#miniNodeBox').style.display = 'none';
  }
}
