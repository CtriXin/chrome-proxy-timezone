let authCache = new Map();
let API_BASE = 'https://proxy-api.evilsngx.workers.dev';
let runtimeRefreshTimer = null;
const LIGHT_PROBE_TTL_MS = 30 * 1000;
const FULL_CONTEXT_TTL_MS = 5 * 60 * 1000;
const MINI_PROFILE_ID = 'atlas-mini';
const MINI_PROXY_TARGET = { scheme: 'http', host: '127.0.0.1', port: 2080 };
const MINI_PROXY_ENABLED = false;
const IPRISK_CACHE_KEY = 'ipRiskCacheV1';
const DNS_CACHE_KEY = 'dnsLeakCacheV1';
const WARM_IPRISK_TIMEOUT_MS = 15000;
const WARM_DNS_TIMEOUT_MS = 12000;
const warmIpriskTasks = new Map();
let warmDnsTask = null;

const COUNTRY_LANGUAGE_MAP = {
  CN: 'zh-CN',
  TW: 'zh-TW',
  HK: 'zh-TW',
  US: 'en-US',
  GB: 'en-GB',
  AU: 'en-GB',
  CA: 'en-US',
  SG: 'en-US',
  JP: 'ja-JP',
  KR: 'ko-KR',
  FR: 'fr-FR',
  DE: 'de-DE',
  ES: 'es-ES',
  MX: 'es-ES',
  AR: 'es-ES',
  IN: 'hi-IN',
  VN: 'vi-VN',
  RU: 'ru-RU'
};

const TIMEZONE_LANGUAGE_MAP = {
  'Asia/Shanghai': 'zh-CN',
  'Asia/Hong_Kong': 'zh-TW',
  'Asia/Taipei': 'zh-TW',
  'Asia/Tokyo': 'ja-JP',
  'Asia/Seoul': 'ko-KR',
  'Asia/Singapore': 'en-US',
  'Europe/London': 'en-GB',
  'Europe/Paris': 'fr-FR',
  'Europe/Berlin': 'de-DE',
  'Europe/Madrid': 'es-ES',
  'Europe/Moscow': 'ru-RU',
  'Asia/Kolkata': 'hi-IN',
  'Asia/Bangkok': 'vi-VN',
  'America/New_York': 'en-US',
  'America/Chicago': 'en-US',
  'America/Los_Angeles': 'en-US',
  'America/Phoenix': 'en-US'
};

// Service worker 唤醒后恢复状态
function restoreState() {
  if (chrome.privacy && chrome.privacy.network) {
    chrome.privacy.network.webRTCIPHandlingPolicy.get({}, (res) => {
      if (res.value !== 'disable_non_proxied_udp') {
        chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: 'disable_non_proxied_udp' });
      }
    });
  }
  applyProxy();
  updateIcon();
}

// 首次加载时恢复代理状态
restoreState();

// Manifest V3 里代理鉴权需要 webRequestAuthProvider + asyncCallback。
chrome.webRequest.onAuthRequired.addListener(handleAuth, { urls: ['<all_urls>'] }, ['asyncBlocking']);

chrome.runtime.onInstalled.addListener(() => {
  // 安全调用 privacy API
  if (chrome.privacy && chrome.privacy.network) {
    chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: 'disable_non_proxied_udp' });
  }
  
  chrome.storage.local.get(['proxyMode', 'proxyProfiles'], (res) => {
    const defaults = {};
    if (res.proxyProfiles === undefined) {
      defaults.proxyProfiles = [{ id: 'p1', name: 'Default', scheme: 'http', host: '', port: '', user: '', pass: '' }];
      defaults.activeProfileId = 'p1';
    }
    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults, () => { applyProxy(); updateIcon(); });
    } else {
      applyProxy(); updateIcon();
    }
  });
});

chrome.storage.onChanged.addListener((changes) => {
  const proxyChanged = changes.proxyMode || changes.proxyProfiles || changes.activeProfileId || changes.proxyBypass || changes.rules;
  if (proxyChanged) applyProxy();
  updateIcon();
});

function updateIcon() {
  chrome.storage.local.get(['proxyMode'], (res) => {
    const mode = res.proxyMode || 'system';
    const badgeText = mode.charAt(0).toUpperCase();
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: mode === 'direct' ? '#94a3b8' : '#7c3aed' });
  });
}

function applyProxy() {
  chrome.storage.local.get(['proxyMode', 'proxyProfiles', 'activeProfileId', 'proxyBypass', 'rules'], (res) => {
    updateAuthCache(res);
    const mode = res.proxyMode || 'system';
    if (mode === 'system') {
      chrome.proxy.settings.clear({ scope: 'regular' }, () => scheduleRuntimeContextRefresh());
      return;
    }
    if (mode === 'direct') {
      chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' }, () => scheduleRuntimeContextRefresh());
      return;
    }
    const profiles = (res.proxyProfiles || []).filter((item) => item.id !== MINI_PROFILE_ID);
    const desiredActiveId = (!MINI_PROXY_ENABLED && res.activeProfileId === MINI_PROFILE_ID)
      ? (profiles[0]?.id || '')
      : (res.activeProfileId || profiles[0]?.id);
    if (!MINI_PROXY_ENABLED && res.activeProfileId === MINI_PROFILE_ID && desiredActiveId) {
      chrome.storage.local.set({ activeProfileId: desiredActiveId });
    }
    const active = profiles.find(p => p.id === desiredActiveId);
    if (!active || !active.host) {
      if (MINI_PROXY_ENABLED && mode === 'manual' && res.activeProfileId === MINI_PROFILE_ID) {
        const bypassList = (res.proxyBypass || '').split(',').map(s => s.trim()).filter(Boolean);
        chrome.proxy.settings.set({
          value: {
            mode: 'fixed_servers',
            rules: { singleProxy: { ...MINI_PROXY_TARGET }, bypassList }
          },
          scope: 'regular'
        }, () => scheduleRuntimeContextRefresh());
        return;
      }
      chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' }, () => scheduleRuntimeContextRefresh());
      return;
    }

    const bypassList = (res.proxyBypass || '').split(',').map(s => s.trim()).filter(Boolean);
    const scheme = active.scheme || 'http';
    
    if (mode === 'manual') {
      const port = Number.parseInt(active.port, 10);
      const singleProxy = { scheme, host: active.host };
      if (Number.isFinite(port)) singleProxy.port = port;
      chrome.proxy.settings.set({
        value: {
          mode: 'fixed_servers',
          rules: { singleProxy, bypassList }
        },
        scope: 'regular'
      }, () => scheduleRuntimeContextRefresh());
      return;
    }

    const ruleChecks = (res.rules || []).map((r) => {
      if (r.profileId === MINI_PROFILE_ID) {
        if (!MINI_PROXY_ENABLED) return '';
        return buildPacRuleCheck(r, `${toPacProxyToken(MINI_PROXY_TARGET.scheme)} ${MINI_PROXY_TARGET.host}:${MINI_PROXY_TARGET.port}`);
      }
      const p = profiles.find((x) => x.id === r.profileId);
      return p && p.host ? buildPacRuleCheck(r, `${toPacProxyToken(p.scheme)} ${p.host}:${p.port}`) : '';
    }).filter(Boolean).join('\n');
    const pac = `function FindProxyForURL(url, host) {
      ${bypassList.map(h => `if (shExpMatch(host, "${h}")) return "DIRECT";`).join('\n')}
      ${ruleChecks}
      return "DIRECT";
    }`;
    chrome.proxy.settings.set({ value: { mode: 'pac_script', pacScript: { data: pac } }, scope: 'regular' }, () => scheduleRuntimeContextRefresh());
  });
}

function scheduleRuntimeContextRefresh(delay = 450) {
  clearTimeout(runtimeRefreshTimer);
  runtimeRefreshTimer = setTimeout(() => {
    probeExitSnapshot('force').catch(() => {
      refreshRuntimeContext().catch(() => {});
    });
  }, delay);
}

function inferLanguageFromIp(countryCode, timezone) {
  if (countryCode && COUNTRY_LANGUAGE_MAP[countryCode]) return COUNTRY_LANGUAGE_MAP[countryCode];
  if (timezone && TIMEZONE_LANGUAGE_MAP[timezone]) return TIMEZONE_LANGUAGE_MAP[timezone];
  return 'en-US';
}

function persistIpContext(data = {}) {
  const nextState = {};
  if (data.ip) nextState.currentExitIp = data.ip;
  if (data.timezone) nextState.ipTimezone = data.timezone;
  if (data.country) nextState.ipCountry = data.country;
  if (data.countryCode) nextState.ipCountryCode = data.countryCode;
  if (data.city) nextState.ipCity = data.city;
  nextState.lastContextRefreshAt = Date.now();

  const inferredLanguage = inferLanguageFromIp(data.countryCode, data.timezone);
  if (inferredLanguage) nextState.ipLanguage = inferredLanguage;

  if (Object.keys(nextState).length > 0) chrome.storage.local.set(nextState);
}

async function fetchRiskProfile(ip = '', timeoutMs = 6500) {
  const data = await fetchJson(`${API_BASE}/api/risk?ip=${encodeURIComponent(ip)}`, timeoutMs);
  const targetIp = String(data?.ip || ip || '').trim();
  if (!targetIp.includes(':')) return data;
  try {
    const cross = await fetchIpCrossCheck(targetIp);
    return mergeIpv6RiskGeo(data, cross);
  } catch (error) {
    return data;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, timeoutMs = 6500) {
  const res = await fetchWithTimeout(url, {
    cache: 'no-store',
    redirect: 'follow',
    credentials: 'omit'
  }, timeoutMs);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function normalizeIpApiIs(data = {}) {
  if (data.ip === undefined || data.error) throw new Error(data.reason || 'ipapi.is failed');
  const location = data.location || {};
  const company = data.company || {};
  const asn = data.asn || {};
  return {
    ok: true,
    provider: 'ipapi.is',
    ip: data.ip || '',
    country: location.country || data.country || '',
    countryCode: location.country_code || data.country_code || '',
    region: location.state || data.region || '',
    city: location.city || data.city || '',
    postal: location.zip || data.zip || '',
    timezone: location.timezone || data.timezone || '',
    latitude: location.latitude ?? data.latitude ?? null,
    longitude: location.longitude ?? data.longitude ?? null,
    asn: String(asn.asn || data.asn || '').replace(/^AS/i, ''),
    org: company.name || asn.org || data.org || '',
    isp: company.name || asn.org || data.org || '',
    type: company.type || asn.type || data.connection_type || ''
  };
}

function mergeIpv6RiskGeo(primary = {}, cross = null) {
  const ipapi = cross?.ipapiis;
  const currentIp = String(primary?.ip || ipapi?.ip || '').trim();
  if (!currentIp.includes(':') || !ipapi || ipapi.ok === false) return primary;
  return {
    ...primary,
    ip: primary.ip || ipapi.ip,
    country: ipapi.country || primary.country,
    countryCode: ipapi.countryCode || primary.countryCode,
    region: ipapi.region || primary.region,
    city: ipapi.city || primary.city,
    zip: ipapi.postal || primary.zip,
    timezone: ipapi.timezone || primary.timezone,
    asn: ipapi.asn || primary.asn,
    asOrganization: ipapi.org || ipapi.isp || primary.asOrganization,
    lat: Number.isFinite(Number(ipapi.latitude)) ? Number(ipapi.latitude) : primary.lat,
    lon: Number.isFinite(Number(ipapi.longitude)) ? Number(ipapi.longitude) : primary.lon
  };
}

function normalizeIpSb(data = {}) {
  if (!data.ip) throw new Error(data.reason || 'api.ip.sb failed');
  return {
    ok: true,
    provider: 'api.ip.sb',
    ip: data.ip || '',
    country: data.country || '',
    countryCode: data.country_code || '',
    region: data.region || '',
    city: data.city || '',
    postal: data.postal || '',
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    asn: String(data.asn || '').replace(/^AS/i, ''),
    org: data.org || '',
    isp: data.org || '',
    network: data.network || ''
  };
}

async function fetchIpCrossCheck(ip = '') {
  const normalizedIp = String(ip || '').trim();
  const ipapiIsUrl = normalizedIp
    ? `https://api.ipapi.is/?q=${encodeURIComponent(normalizedIp)}`
    : 'https://api.ipapi.is/';
  const ipSbUrl = normalizedIp
    ? `https://api.ip.sb/geoip/${encodeURIComponent(normalizedIp)}`
    : 'https://api.ip.sb/geoip';

  const [ipapiis, ipsb] = await Promise.allSettled([
    fetchJson(ipapiIsUrl).then(normalizeIpApiIs),
    fetchJson(ipSbUrl).then(normalizeIpSb)
  ]);

  return {
    ipapiis: ipapiis.status === 'fulfilled'
      ? ipapiis.value
      : { ok: false, provider: 'ipapi.is', error: ipapiis.reason?.message || 'fetch_failed' },
    ipsb: ipsb.status === 'fulfilled'
      ? ipsb.value
      : { ok: false, provider: 'api.ip.sb', error: ipsb.reason?.message || 'fetch_failed' }
  };
}

async function probeEndpoint(url, options = {}) {
  const controller = new AbortController();
  const startedAt = Date.now();
  const timer = setTimeout(() => controller.abort(), options.timeout || 8000);

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      cache: 'no-store',
      redirect: 'follow',
      credentials: 'omit',
      signal: controller.signal
    });
    return {
      ok: true,
      status: res.status,
      finalUrl: res.url,
      latency: Date.now() - startedAt
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      latency: Date.now() - startedAt
    };
  } finally {
    clearTimeout(timer);
  }
}

async function refreshRuntimeContext() {
  const data = await fetchRiskProfile('');
  persistIpContext(data);
  return data;
}

function parseTrace(text = '') {
  const map = {};
  String(text).split('\n').forEach((line) => {
    const idx = line.indexOf('=');
    if (idx > 0) map[line.slice(0, idx)] = line.slice(idx + 1);
  });
  return map;
}

async function fetchExitTrace() {
  const res = await fetchWithTimeout('https://www.cloudflare.com/cdn-cgi/trace', {
    cache: 'no-store',
    redirect: 'follow',
    credentials: 'omit'
  }, 4500);
  const text = await res.text();
  const trace = parseTrace(text);
  return {
    ip: trace.ip || '',
    raw: text
  };
}

async function getLocalState(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

async function setLocalState(nextState) {
  return new Promise((resolve) => chrome.storage.local.set(nextState, resolve));
}

function normalizeCacheIp(ip = '') {
  return String(ip || '').trim() || '__current__';
}

async function readIpriskCache(ip = '') {
  const state = await getLocalState([IPRISK_CACHE_KEY]);
  const cache = state?.[IPRISK_CACHE_KEY] || {};
  return cache[normalizeCacheIp(ip)] || null;
}

async function writeIpriskCache(ip = '', data = {}) {
  const state = await getLocalState([IPRISK_CACHE_KEY]);
  const cache = state?.[IPRISK_CACHE_KEY] || {};
  const key = normalizeCacheIp(data?.ip || ip);
  cache[key] = {
    ip: data?.ip || ip || '',
    data,
    at: Date.now()
  };
  await setLocalState({ [IPRISK_CACHE_KEY]: cache });
  if (!ip && data?.ip) {
    cache.__current__ = cache[key];
    await setLocalState({ [IPRISK_CACHE_KEY]: cache });
  }
  return cache[key];
}

async function readDnsCache() {
  const state = await getLocalState([DNS_CACHE_KEY]);
  return state?.[DNS_CACHE_KEY] || null;
}

async function writeDnsCache(data = {}) {
  const entry = { data, at: Date.now() };
  await setLocalState({ [DNS_CACHE_KEY]: entry });
  return entry;
}

function warmIpriskCache(ip = '') {
  const key = normalizeCacheIp(ip);
  if (warmIpriskTasks.has(key)) return warmIpriskTasks.get(key);
  const task = (async () => {
    try {
      const data = await fetchRiskProfile(ip, WARM_IPRISK_TIMEOUT_MS);
      await writeIpriskCache(ip, data);
      if (!ip) persistIpContext(data);
      return data;
    } finally {
      warmIpriskTasks.delete(key);
    }
  })();
  warmIpriskTasks.set(key, task);
  return task;
}

function warmDnsCache() {
  if (warmDnsTask) return warmDnsTask;
  warmDnsTask = (async () => {
    try {
      const data = await fetchJson(`${API_BASE}/api/dns`, WARM_DNS_TIMEOUT_MS);
      await writeDnsCache(data);
      return data;
    } finally {
      warmDnsTask = null;
    }
  })();
  return warmDnsTask;
}

async function getExitSnapshot() {
  return getLocalState([
    'currentExitIp',
    'ipCountry',
    'ipCity',
    'ipTimezone',
    'ipLanguage',
    'lastExitProbeAt',
    'lastContextRefreshAt'
  ]);
}

async function probeExitSnapshot(mode = 'light') {
  const snapshot = await getExitSnapshot();
  const now = Date.now();
  const lightFresh = snapshot.lastExitProbeAt && (now - snapshot.lastExitProbeAt < LIGHT_PROBE_TTL_MS);
  const fullFresh = snapshot.lastContextRefreshAt && (now - snapshot.lastContextRefreshAt < FULL_CONTEXT_TTL_MS);

  if (lightFresh && mode !== 'force') {
    return { snapshot, changed: false, refreshed: false };
  }

  const trace = await fetchExitTrace();
  const currentExitIp = trace.ip || snapshot.currentExitIp || '';
  await new Promise((resolve) => chrome.storage.local.set({
    currentExitIp,
    lastExitProbeAt: now
  }, resolve));

  const changed = !!trace.ip && trace.ip !== snapshot.currentExitIp;
  if (mode === 'full' || mode === 'force' || changed || !fullFresh || !snapshot.ipCountry || !snapshot.ipTimezone) {
    const data = await refreshRuntimeContext();
    return {
      snapshot: {
        ...snapshot,
        currentExitIp: data.ip || currentExitIp,
        ipCountry: data.country || snapshot.ipCountry,
        ipCity: data.city || snapshot.ipCity,
        ipTimezone: data.timezone || snapshot.ipTimezone
      },
      changed,
      refreshed: true
    };
  }

  return {
    snapshot: {
      ...snapshot,
      currentExitIp,
      lastExitProbeAt: now
    },
    changed,
    refreshed: false
  };
}

function toPacProxyToken(scheme) {
  switch ((scheme || 'http').toLowerCase()) {
    case 'https':
      return 'HTTPS';
    case 'socks4':
      return 'SOCKS4';
    case 'socks5':
      return 'SOCKS5';
    case 'http':
    default:
      return 'PROXY';
  }
}

function buildPacRuleCheck(rule, profileToken) {
  const pattern = String(rule?.pattern || '').trim();
  if (!pattern) return '';
  const type = String(rule?.type || 'wildcard').toLowerCase();
  if (type === 'suffix') {
    return `if (host === "${pattern}" || dnsDomainIs(host, ".${pattern}")) return "${profileToken}; DIRECT";`;
  }
  if (type === 'domain') {
    return `if (host === "${pattern}") return "${profileToken}; DIRECT";`;
  }
  if (type === 'keyword') {
    return `if (host.indexOf("${pattern}") !== -1) return "${profileToken}; DIRECT";`;
  }
  return `if (shExpMatch(host, "${pattern}")) return "${profileToken}; DIRECT";`;
}

function handleAuth(details, asyncCallback) {
  if (!details.isProxy) return asyncCallback({});
  const key = `${details.proxyServer.host}:${details.proxyServer.port}`;
  const auth = authCache.get(key);
  if (!auth) return asyncCallback({});
  asyncCallback({ authCredentials: { username: auth.user, password: auth.pass } });
}

function updateAuthCache(res) {
  authCache.clear();
  (res.proxyProfiles || []).forEach(p => {
    if (p.user) authCache.set(`${p.host}:${p.port}`, { user: p.user, pass: p.pass });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchIprisk') {
    (async () => {
      const targetIp = String(request.ip || '').trim();
      try {
        const data = await fetchRiskProfile(targetIp);
        await writeIpriskCache(targetIp, data);
        persistIpContext(data);
        sendResponse({ data, meta: { cached: false, stale: false, at: Date.now() } });
      } catch (err) {
        warmIpriskCache(targetIp).catch(() => {});
        const cached = await readIpriskCache(targetIp);
        if (cached?.data) {
          sendResponse({
            data: cached.data,
            meta: {
              cached: true,
              stale: true,
              at: cached.at || 0,
              ageMs: cached.at ? Math.max(0, Date.now() - cached.at) : null,
              warming: true
            },
            error: err.message
          });
          return;
        }
        sendResponse({ error: err.message, meta: { warming: true } });
      }
    })();
    return true;
  }
  if (request.action === 'fetchTrace') {
    fetchWithTimeout(request.url, {
      cache: 'no-store',
      redirect: 'follow',
      credentials: 'omit'
    }, 4500).then(r => r.text()).then(text => sendResponse({ text })).catch(err => sendResponse({ error: err.message }));
    return true;
  }
  if (request.action === 'getChinaIp') {
    getChinaIp().then(sendResponse);
    return true;
  }
  if (request.action === 'fetchDnsLeak') {
    (async () => {
      try {
        const data = await fetchJson(`${API_BASE}/api/dns`, 4500);
        await writeDnsCache(data);
        sendResponse({ data, meta: { cached: false, stale: false, at: Date.now() } });
      } catch (err) {
        warmDnsCache().catch(() => {});
        const cached = await readDnsCache();
        if (cached?.data) {
          sendResponse({
            data: cached.data,
            meta: {
              cached: true,
              stale: true,
              at: cached.at || 0,
              ageMs: cached.at ? Math.max(0, Date.now() - cached.at) : null,
              warming: true
            },
            error: err.message
          });
          return;
        }
        sendResponse({ error: err.message, meta: { warming: true } });
      }
    })();
    return true;
  }
  if (request.action === 'fetchIpCrossCheck') {
    fetchIpCrossCheck(request.ip || '').then((data) => sendResponse({ data })).catch((err) => sendResponse({ error: err.message }));
    return true;
  }
  if (request.action === 'getExitSnapshot') {
    getExitSnapshot().then((snapshot) => sendResponse({ snapshot })).catch((err) => sendResponse({ error: err.message }));
    return true;
  }
  if (request.action === 'probeExit') {
    probeExitSnapshot(request.mode || 'light').then(sendResponse).catch((err) => sendResponse({ error: err.message }));
    return true;
  }
  if (request.action === 'probeEndpoint') {
    probeEndpoint(request.url, request.options || {}).then(sendResponse);
    return true;
  }
});

async function getChinaIp() {
  try {
    const res = await fetch('https://whois.pconline.com.cn/ipJson.jsp?json=true');
    const buf = await res.arrayBuffer();
    return JSON.parse(new TextDecoder('gbk').decode(buf));
  } catch (e) { return {}; }
}
