let authCache = new Map();
let API_BASE = 'https://proxy-api.evilsngx.workers.dev';

function refreshConfig() {
  chrome.storage.local.get(['apiBase'], (res) => {
    if (res.apiBase) API_BASE = res.apiBase.replace(/\/$/, '');
  });
}
refreshConfig();

// 顶层注册监听
chrome.webRequest.onAuthRequired.addListener(handleAuth, { urls: ['<all_urls>'] }, ['asyncBlocking']);

chrome.runtime.onInstalled.addListener(() => {
  // 安全调用 privacy API
  if (chrome.privacy && chrome.privacy.network) {
    chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: 'disable_non_proxied_udp' });
  }
  
  chrome.storage.local.get(['proxyMode', 'proxyProfiles', 'apiBase'], (res) => {
    const defaults = {};
    if (!res.apiBase) defaults.apiBase = 'https://proxy-api.evilsngx.workers.dev';
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
  if (changes.apiBase) refreshConfig();
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
    if (mode === 'system') { chrome.proxy.settings.clear({ scope: 'regular' }); return; }
    if (mode === 'direct') { chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' }); return; }
    
    const profiles = res.proxyProfiles || [];
    const active = profiles.find(p => p.id === (res.activeProfileId || profiles[0]?.id));
    if (!active || !active.host) { chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' }); return; }

    const bypassList = (res.proxyBypass || '').split(',').map(s => s.trim()).filter(Boolean);
    const server = `${active.host}:${active.port}`;
    const scheme = active.scheme || 'http';
    
    let pac = '';
    if (mode === 'manual') {
      pac = `function FindProxyForURL(url, host) {
        ${bypassList.map(h => `if (shExpMatch(host, "${h}")) return "DIRECT";`).join('\n')}
        return "${scheme.toUpperCase()} ${server}; DIRECT";
      }`;
    } else {
      const ruleChecks = (res.rules || []).map(r => {
        const p = profiles.find(x => x.id === r.profileId);
        return p ? `if (shExpMatch(host, "${r.pattern}")) return "${p.scheme.toUpperCase()} ${p.host}:${p.port}; DIRECT";` : '';
      }).join('\n');
      pac = `function FindProxyForURL(url, host) {
        ${bypassList.map(h => `if (shExpMatch(host, "${h}")) return "DIRECT";`).join('\n')}
        ${ruleChecks}
        return "DIRECT";
      }`;
    }
    chrome.proxy.settings.set({ value: { mode: 'pac_script', pacScript: { data: pac } }, scope: 'regular' });
  });
}

function handleAuth(details) {
  if (!details.isProxy) return {};
  const key = `${details.proxyServer.host}:${details.proxyServer.port}`;
  const auth = authCache.get(key);
  return auth ? { authCredentials: { username: auth.user, password: auth.pass } } : {};
}

function updateAuthCache(res) {
  authCache.clear();
  (res.proxyProfiles || []).forEach(p => {
    if (p.user) authCache.set(`${p.host}:${p.port}`, { user: p.user, pass: p.pass });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchIprisk') {
    fetch(`${API_BASE}/api/risk?ip=${request.ip}`).then(r => r.json()).then(data => {
      if (data?.timezone) chrome.storage.local.set({ ipTimezone: data.timezone });
      sendResponse({ data });
    }).catch(err => sendResponse({ error: err.message }));
    return true;
  }
  if (request.action === 'fetchTrace') {
    fetch(request.url).then(r => r.text()).then(text => sendResponse({ text })).catch(err => sendResponse({ error: err.message }));
    return true;
  }
  if (request.action === 'getChinaIp') {
    getChinaIp().then(sendResponse);
    return true;
  }
  if (request.action === 'fetchDnsLeak') {
    fetch(`${API_BASE}/api/dns`).then(r => r.json()).then(data => sendResponse({ data })).catch(err => sendResponse({ error: err.message }));
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
