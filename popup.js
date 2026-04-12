const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// --- 全局共享数据源 ( Single Source of Truth ) ---
const DATA = {
  timezones: [
    { v: "ip", n: "optIpLocation" },
    { v: "Pacific/Honolulu", n: "UTC-10 (Honolulu)" },
    { v: "America/Anchorage", n: "UTC-9 (Anchorage)" },
    { v: "America/Los_Angeles", n: "UTC-8 (Los Angeles/Vancouver)" },
    { v: "America/Phoenix", n: "UTC-7 (Phoenix/Denver)" },
    { v: "America/Chicago", n: "UTC-6 (Chicago/Mexico City)" },
    { v: "America/New_York", n: "UTC-5 (New York/Toronto)" },
    { v: "America/Sao_Paulo", n: "UTC-3 (Sao Paulo/Buenos Aires)" },
    { v: "Europe/London", n: "UTC+0 (London/Lisbon)" },
    { v: "Europe/Paris", n: "UTC+1 (Paris/Berlin/Rome/Madrid)" },
    { v: "Africa/Johannesburg", n: "UTC+2 (JNB/Cairo/Jerusalem)" },
    { v: "Europe/Moscow", n: "UTC+3 (Moscow/Istanbul/Riyadh)" },
    { v: "Asia/Dubai", n: "UTC+4 (Dubai/Baku)" },
    { v: "Asia/Karachi", n: "UTC+5 (Karachi/Tashkent)" },
    { v: "Asia/Kolkata", n: "UTC+5:30 (Mumbai/New Delhi)" },
    { v: "Asia/Dhaka", n: "UTC+6 (Dhaka/Almaty)" },
    { v: "Asia/Bangkok", n: "UTC+7 (Bangkok/Jakarta/Hanoi)" },
    { v: "Asia/Singapore", n: "UTC+8 (Singapore/Kuala Lumpur)" },
    { v: "Asia/Shanghai", n: "UTC+8 (Shanghai/Beijing/Hong Kong)" },
    { v: "Asia/Tokyo", n: "UTC+9 (Tokyo/Seoul)" },
    { v: "Australia/Sydney", n: "UTC+10 (Sydney/Melbourne)" },
    { v: "Pacific/Auckland", n: "UTC+12 (Auckland/Fiji)" },
    { v: "UTC", n: "UTC (Universal)" }
  ],
  languages: [
    { v: "zh-CN", n: "简体中文 (zh-CN)" },
    { v: "zh-TW", n: "繁體中文 (zh-TW)" },
    { v: "en-US", n: "English (en-US)" },
    { v: "en-GB", n: "English (en-GB)" },
    { v: "ja-JP", n: "日本語 (ja-JP)" },
    { v: "ko-KR", n: "한국어 (ko-KR)" },
    { v: "fr-FR", n: "Français (fr-FR)" },
    { v: "de-DE", n: "Deutsch (de-DE)" },
    { v: "es-ES", n: "Español (es-ES)" },
    { v: "hi-IN", n: "हिन्दी (hi-IN)" },
    { v: "vi-VN", n: "Tiếng Việt (vi-VN)" },
    { v: "ru-RU", n: "Русский (ru-RU)" }
  ]
};

// --- 统一 i18n 逻辑 ---
function i18n(key) {
  return chrome.i18n.getMessage(key) || key;
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
    DATA.timezones.forEach(tz => {
      const opt = document.createElement('option');
      opt.value = tz.v;
      opt.innerText = (tz.v === 'ip') ? i18n(tz.n) : tz.n;
      tzSel.appendChild(opt);
    });
  }
  const langSel = $('#langSelect');
  if (langSel) {
    langSel.innerHTML = `<option value="">${i18n('optDefault')}</option>`;
    DATA.languages.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.v; opt.innerText = l.n;
      langSel.appendChild(opt);
    });
  }
}

// --- 状态管理 ---
async function loadSettings() {
  const res = await chrome.storage.local.get(['proxyMode', 'proxyProfiles', 'activeProfileId', 'theme', 'timezone', 'language', 'ipTimezone']);
  
  applyI18n();
  initSelects();
  
  $('#proxyMode').value = res.proxyMode || 'system';
  $('#tzSelect').value = res.timezone || '';
  $('#langSelect').value = res.language || '';
  
  // 更新 Follow IP 文本
  const followIpOpt = $('#tzSelect').querySelector('option[value="ip"]');
  if (followIpOpt && res.ipTimezone) {
    followIpOpt.innerText = `${i18n('optIpLocation')} (${res.ipTimezone})`;
  }

  const sel = $('#activeProfile');
  sel.innerHTML = '';
  (res.proxyProfiles || []).forEach(p => {
    const opt = new Option(p.name || `${p.host}:${p.port}`, p.id);
    sel.add(opt);
  });
  sel.value = res.activeProfileId || '';
  $('#profileRow').style.display = (res.proxyMode === 'manual' || res.proxyMode === 'auto') ? 'flex' : 'none';
  
  fetchInitialIp();
  updateTheme(res.theme || 'dark');
}

function updateTheme(theme) {
  document.body.className = theme;
  $('#themeToggle').textContent = theme === 'light' ? '🌙' : '☀️';
}

function fetchInitialIp() {
  $('#hero-ip').innerText = i18n('scanning');
  chrome.runtime.sendMessage({ action: 'fetchIprisk', ip: '' }, (res) => {
    if (res?.data) {
      $('#hero-ip').innerText = res.data.ip;
      $('#hero-geo').innerText = `${res.data.country}, ${res.data.city}`;
      const opt = $('#tzSelect').querySelector('option[value="ip"]');
      if (opt && res.data.timezone) opt.innerText = `${i18n('optIpLocation')} (${res.data.timezone})`;
    }
  });
}

// --- 探测逻辑 (客户端直连，防 IP 漂移) ---
async function runClaudeChecks() {
  const start = Date.now();
  fetch('https://claude.ai/favicon.ico', { mode: 'no-cors', cache: 'no-store', credentials: 'omit' })
    .then(() => {
      $('#claudeAiStatus').innerText = 'Operational';
      $('#claudeAiStatus').style.color = 'var(--success)';
      $('#claudeLatencyText').innerText = (Date.now() - start) + 'ms';
    })
    .catch(() => {
      $('#claudeAiStatus').innerText = 'Blocked';
      $('#claudeAiStatus').style.color = 'var(--danger)';
    });

  fetch('https://api.anthropic.com/v1/messages', { method: 'OPTIONS', mode: 'no-cors', cache: 'no-store' })
    .then(() => {
      $('#claudeCodeStatus').innerText = 'Operational';
      $('#claudeCodeStatus').style.color = 'var(--success)';
    })
    .catch(() => {
      $('#claudeCodeStatus').innerText = 'Blocked';
      $('#claudeCodeStatus').style.color = 'var(--danger)';
    });

  // 同时获取风险分
  chrome.runtime.sendMessage({ action: 'fetchIprisk', ip: '' }, res => {
    if (res?.data) {
      updateClaudeScore(res.data.trust_score);
      $('#attr-country').innerText = res.data.country;
      $('#attr-city').innerText = res.data.city || '--';
      $('#attr-isp').innerText = res.data.asOrganization;
      $('#attr-reverseDns').innerText = res.data.reverseDns || '--';
      $('#attr-hostPtr').innerText = res.data.hostPtr || '--';
      $('#attr-fakeIp').innerText = res.data.fakeIp != null ? (res.data.fakeIp ? 'Yes' : 'No') : '--';
      $('#attr-chinaDns').innerText = res.data.chinaDns || '--';

      // 渲染安全标签
      const box = $('#safety-badges'); box.innerHTML = '';
      SECURITY_KEYS.forEach(({ key, label }) => {
        const span = document.createElement('span');
        span.className = 'badge ' + (res.data[key] ? 'badge-red' : 'badge-green');
        span.innerText = (res.data[key] ? '✗ ' : '✓ ') + i18n(label);
        box.appendChild(span);
      });
    }
  });
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
  if (score >= 90) return i18n('scoreTrustworthy');
  if (score >= 70) return i18n('scoreGood');
  if (score >= 40) return i18n('scoreFair');
  if (score >= 20) return i18n('scorePoor');
  return i18n('scoreBad');
}

function updateClaudeScore(s) {
  $('#claudeScoreCircle').style.strokeDasharray = `${s}, 100`;
  $('#claudeScoreValue').innerText = s;
  const label = $('#claudeScoreLabel');
  if (label) label.innerText = getScoreLabel(s);
}

// --- 实时同步核心逻辑 ( chrome.storage.onChanged ) ---
const POPUP_FIELDS = ['proxyMode', 'proxyProfiles', 'activeProfileId', 'theme', 'timezone', 'language', 'ipTimezone', 'uiLang'];
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (POPUP_FIELDS.some(f => f in changes)) loadSettings();
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
  fetchInitialIp();
}

// --- 事件绑定 ---
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

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

  $('#proxyMode').onchange = e => chrome.storage.local.set({ proxyMode: e.target.value });
  $('#activeProfile').onchange = e => chrome.storage.local.set({ activeProfileId: e.target.value });
  $('#tzSelect').onchange = e => chrome.storage.local.set({ timezone: e.target.value });
  $('#langSelect').onchange = e => chrome.storage.local.set({ language: e.target.value });
  $('#themeToggle').onclick = () => {
    chrome.storage.local.get(['theme'], r => {
      const next = r.theme === 'light' ? 'dark' : 'light';
      chrome.storage.local.set({ theme: next });
    });
  };
  $('#headerSettings').onclick = () => chrome.runtime.openOptionsPage();
});

// --- Popup 关闭时清理 ---
window.addEventListener('unload', () => {
  abortPendingFetch();
  window.removeEventListener('offline', handleOffline);
  window.removeEventListener('online', handleOnline);
});
