const $ = (id) => document.getElementById(id) || document.querySelector(id);
const $$ = (s) => document.querySelectorAll(s);
const MINI_PROFILE_ID = 'atlas-mini';
const MINI_PROFILE = { id: MINI_PROFILE_ID, name: 'Atlas Mini', host: '127.0.0.1', port: '2080', scheme: 'http' };
const MINI_PROXY_ENABLED = false;
const RULE_TYPES = [
  { value: 'suffix', label: 'DOMAIN-SUFFIX' },
  { value: 'domain', label: 'DOMAIN' },
  { value: 'keyword', label: 'DOMAIN-KEYWORD' },
  { value: 'wildcard', label: 'WILDCARD' }
];
const CLAUDE_RULE_PRESET = [
  { type: 'suffix', pattern: 'anthropic.com' },
  { type: 'domain', pattern: 'claude.ai' },
  { type: 'domain', pattern: 'claude.com' },
  { type: 'domain', pattern: 'clau.de' },
  { type: 'domain', pattern: 'claudemcpclient.com' },
  { type: 'domain', pattern: 'claudeusercontent.com' },
  { type: 'domain', pattern: 'cdn.anthropic.com' },
  { type: 'domain', pattern: 'mcp.anthropic.com' },
  { type: 'domain', pattern: 'console.anthropic.com' },
  { type: 'domain', pattern: 'workbench.anthropic.com' },
  { type: 'domain', pattern: 'api.anthropic.com' },
  { type: 'domain', pattern: 'anthropic.auth0.com' },
  { type: 'domain', pattern: 'anthropic-com.ghost.io' },
  { type: 'domain', pattern: 'anthropic.com.cdn.cloudflare.net' },
  { type: 'domain', pattern: 'servd-anthropic-website.b-cdn.net' },
  { type: 'domain', pattern: 'sentry.io' },
  { type: 'domain', pattern: 'statsigapi.net' },
  { type: 'domain', pattern: 'browser-intake-us5-datadoghq.com' },
  { type: 'keyword', pattern: 'datadog' },
  { type: 'keyword', pattern: 'sentry' }
];
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

const TRANSLATIONS = {
  en: {
    appName: "Atlas Proxy", statusSystem: "System", statusDirect: "Direct", statusManual: "Manual", statusAuto: "Auto",
    tabQuick: "Home", labelMode: "Global Mode", labelProfile: "Active Node", labelTz: "Timezone", labelLang: "Language",
    btnSaveApply: "Apply Changes", labelProfileInfo: "Node Info", labelAlias: "Alias", labelProtocol: "Protocol",
    labelHost: "IP / Domain", labelPort: "Port", labelUser: "Username", labelPass: "Password",
    btnPaste: "📋 Paste URL", btnUpdate: "Update Node", btnDelete: "Delete Node", btnNewProfile: "+ Add Profile",
    btnAddRule: "+ Add Rule", labelBypass: "Bypass List", labelGlobalSettings: "General Settings",
    optDefault: "Default", optIpLocation: "Follow IP", btnExport: "Export JSON", btnImport: "Import JSON",
    navBackup: "Backup & Sync", navDiagnostics: "Diagnostics", navRouting: "Routing Lab",
    sectionBackup: "Backup & Restore", diagTitle: "Local Diagnostics", diagSubtitle: "Use extension background and page probe data directly.",
    diagRefreshLight: "Refresh Snapshot", diagRefreshFull: "Run Full Scan", testNode: "⚡ Test Connection", navSystem: "SYSTEM"
  },
  zh: {
    appName: "Atlas 代理", statusSystem: "系统代理", statusDirect: "直接连接", statusManual: "手动模式", statusAuto: "自动规则",
    tabQuick: "主页", labelMode: "全局模式", labelProfile: "当前节点", labelTz: "地理时区", labelLang: "浏览器语言",
    btnSaveApply: "保存并应用", labelProfileInfo: "节点详细信息", labelAlias: "别名", labelProtocol: "协议",
    labelHost: "IP / 域名", labelPort: "端口", labelUser: "用户名", labelPass: "密码",
    btnPaste: "📋 从剪贴板粘贴", btnUpdate: "更新当前节点", btnDelete: "删除当前节点", btnNewProfile: "+ 新建节点",
    btnAddRule: "+ 添加规则", labelBypass: "绕过列表", labelGlobalSettings: "通用设置",
    optDefault: "默认 (不修改)", optIpLocation: "根据 IP 自动跟随", btnExport: "导出 JSON", btnImport: "导入 JSON",
    navBackup: "导入 / 导出", navDiagnostics: "诊断中心", navRouting: "分流实验室",
    sectionBackup: "导入 / 导出", diagTitle: "本地诊断中心", diagSubtitle: "直接使用扩展后台与页面探针数据，不依赖外部展示页。",
    diagRefreshLight: "刷新快照", diagRefreshFull: "完整扫描", testNode: "⚡ 测试连接", navSystem: "系统"
  }
};

let state = {
  proxyMode: 'system', profiles: [], activeProfileId: '', selectedProfileId: '',
  rules: [], proxyBypass: '', timezone: '', language: '', ipTimezone: '', uiLang: 'zh',
  miniSubscriptions: [], miniSelectedSubId: '', ruleEditMode: 'visual'
};

function i18n(key) {
  return TRANSLATIONS[state.uiLang][key] || key;
}

function applyI18n() {
  $$('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = i18n(key);
    if (msg) {
      if (el.tagName === 'INPUT' && el.type === 'button') el.value = msg;
      else el.innerText = msg;
    }
  });
}

function renderStaticLabels() {
  if ($('systemGroupTitle')) $('systemGroupTitle').innerText = i18n('navSystem');
  if ($('backupMenuText')) $('backupMenuText').innerText = i18n('navBackup');
  if ($('diagMenuText')) $('diagMenuText').innerText = i18n('navDiagnostics');
  if ($('routingMenuText')) $('routingMenuText').innerText = i18n('navRouting');
  if ($('backupTitle')) $('backupTitle').innerText = i18n('sectionBackup');
  if ($('diagTitle')) $('diagTitle').innerText = i18n('diagTitle');
  if ($('diagSubtitle')) $('diagSubtitle').innerText = i18n('diagSubtitle');
  if ($('runDiagLightBtn')) $('runDiagLightBtn').innerText = i18n('diagRefreshLight');
  if ($('runDiagFullBtn')) $('runDiagFullBtn').innerText = i18n('diagRefreshFull');
  if ($('testNodeBtn')) $('testNodeBtn').innerText = i18n('testNode');
}

function renderGroupedSelect(selectEl, groups = [], includeDefault = true) {
  if (!selectEl) return;
  const currentValue = selectEl.value;
  selectEl.innerHTML = includeDefault ? `<option value="">${i18n('optDefault')}</option>` : '';
  groups.forEach((group) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = group.label;
    group.options.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item.v;
      opt.innerText = item.v === 'ip' ? i18n(item.n) : item.n;
      optgroup.appendChild(opt);
    });
    selectEl.appendChild(optgroup);
  });
  if (currentValue) selectEl.value = currentValue;
}

function withMiniProfile(profiles = []) {
  const list = Array.isArray(profiles) ? profiles.slice() : [];
  if (MINI_PROXY_ENABLED && !list.some((item) => item.id === MINI_PROFILE_ID)) list.push({ ...MINI_PROFILE });
  return list;
}

function getProfileById(id) {
  if (MINI_PROXY_ENABLED && id === MINI_PROFILE_ID) return { ...MINI_PROFILE };
  return state.profiles.find((item) => item.id === id) || null;
}

function getProfileLabel(id) {
  const profile = getProfileById(id);
  return profile ? (profile.name || profile.host || profile.id) : (state.uiLang === 'zh' ? '未知节点' : 'Unknown');
}

function getRuleTypeLabel(type) {
  return (RULE_TYPES.find((item) => item.value === type) || RULE_TYPES[0]).label;
}

function normalizeRule(rule = {}, fallbackProfileId = '') {
  const nextType = ['suffix', 'domain', 'keyword', 'wildcard'].includes(rule.type) ? rule.type : 'wildcard';
  return {
    type: nextType,
    pattern: String(rule.pattern || '').trim(),
    profileId: rule.profileId || fallbackProfileId || state.activeProfileId || state.profiles[0]?.id || ''
  };
}

function escapeAttr(value) {
  return String(value == null ? '' : value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function buildRuleTypeOptions(selected = 'wildcard') {
  return RULE_TYPES.map((item) => `<option value="${item.value}"${item.value === selected ? ' selected' : ''}>${item.label}</option>`).join('');
}

function buildRuleProfileOptions(selected = '') {
  return withMiniProfile(state.profiles).map((p) => `<option value="${escapeAttr(p.id)}"${p.id === selected ? ' selected' : ''}>${escapeHtml(p.name || `${p.host}:${p.port}`)}</option>`).join('');
}

function exportRulesToSource(rules = []) {
  const lines = ['[SwitchyOmega Conditions]', '@with result', ''];
  rules.forEach((rule) => {
    const profileName = getProfileLabel(rule.profileId);
    if (rule.type === 'suffix') lines.push(`*.${rule.pattern} +${profileName}`);
    else if (rule.type === 'domain') lines.push(`${rule.pattern} +${profileName}`);
    else if (rule.type === 'keyword') lines.push(`DOMAIN-KEYWORD,${rule.pattern} +${profileName}`);
    else lines.push(`${rule.pattern} +${profileName}`);
  });
  return lines.join('\n');
}

function parseRuleTypeAndPattern(raw = '') {
  const input = String(raw || '').trim();
  if (!input) return null;
  const explicit = input.match(/^(DOMAIN-SUFFIX|DOMAIN|DOMAIN-KEYWORD|WILDCARD)\s*,\s*(.+)$/i);
  if (explicit) {
    const prefix = explicit[1].toUpperCase();
    const pattern = explicit[2].trim();
    if (prefix === 'DOMAIN-SUFFIX') return { type: 'suffix', pattern };
    if (prefix === 'DOMAIN') return { type: 'domain', pattern };
    if (prefix === 'DOMAIN-KEYWORD') return { type: 'keyword', pattern };
    return { type: 'wildcard', pattern };
  }
  if (input.startsWith('*.')) return { type: 'suffix', pattern: input.slice(2) };
  if (input.includes('*')) return { type: 'wildcard', pattern: input };
  return { type: 'domain', pattern: input };
}

function parseRuleSource(source = '') {
  const lines = String(source || '').split(/\r?\n/);
  const nameToId = new Map(withMiniProfile(state.profiles).map((item) => [item.name || `${item.host}:${item.port}`, item.id]));
  const nextRules = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('[') || trimmed.startsWith('@') || trimmed.startsWith('#') || trimmed.startsWith('//')) return;
    const match = trimmed.match(/^(.*?)\s+\+(.+)$/);
    const rawRule = match ? match[1].trim() : trimmed;
    const profileName = match ? match[2].trim() : '';
    const parsed = parseRuleTypeAndPattern(rawRule);
    if (!parsed || !parsed.pattern) return;
    const profileId = nameToId.get(profileName) || state.activeProfileId || state.profiles[0]?.id || '';
    nextRules.push(normalizeRule({ ...parsed, profileId }, profileId));
  });
  return nextRules;
}

function mergePresetRules(preset = [], profileId = '') {
  const targetId = profileId || $('activeProfile')?.value || state.activeProfileId || state.profiles[0]?.id || '';
  const existing = new Set(state.rules.map((item) => `${item.type}|${item.pattern}|${item.profileId}`));
  preset.forEach((rule) => {
    const next = normalizeRule({ ...rule, profileId: targetId }, targetId);
    const key = `${next.type}|${next.pattern}|${next.profileId}`;
    if (!existing.has(key)) {
      existing.add(key);
      state.rules.push(next);
    }
  });
}

function normalizeMiniSubscriptions(subs = [], legacyUrl = '') {
  const list = Array.isArray(subs) ? subs.filter((item) => item && item.url) : [];
  if (!list.length && legacyUrl) {
    return [{ id: 'legacy-current', name: '当前订阅', url: legacyUrl, ua: '' }];
  }
  return list;
}

function setMiniManagerStatus(text) {
  if ($('miniSubStatus')) $('miniSubStatus').innerText = text;
}

function renderMiniSubscriptionManager() {
  const select = $('miniSubscriptionSelect');
  if (!select) return;
  const list = state.miniSubscriptions || [];
  select.innerHTML = '';
  if (!list.length) {
    select.add(new Option('未配置订阅', ''));
    select.disabled = true;
    state.miniSelectedSubId = '';
    $('miniSubName').value = '';
    $('miniSubUa').value = '';
    $('miniSubUrlInput').value = '';
    setMiniManagerStatus('还没有配置 Atlas Mini 订阅。先填名称和 URL，再点“保存订阅”。');
    return;
  }

  list.forEach((item, index) => {
    select.add(new Option(item.name || `订阅 ${index + 1}`, item.id));
  });
  select.disabled = false;
  if (!list.some((item) => item.id === state.miniSelectedSubId)) {
    state.miniSelectedSubId = list[0].id;
  }
  select.value = state.miniSelectedSubId;
  loadMiniSubscriptionForm(state.miniSelectedSubId);
}

function loadMiniSubscriptionForm(id) {
  const entry = (state.miniSubscriptions || []).find((item) => item.id === id);
  if (!entry) {
    $('miniSubName').value = '';
    $('miniSubUa').value = '';
    $('miniSubUrlInput').value = '';
    return;
  }
  $('miniSubName').value = entry.name || '';
  $('miniSubUa').value = entry.ua || '';
  $('miniSubUrlInput').value = entry.url || '';
}

function saveMiniSubscriptions(selectedUrl = '') {
  const payload = {
    miniSubscriptions: state.miniSubscriptions,
    miniSubUrl: selectedUrl || ((state.miniSubscriptions.find((item) => item.id === state.miniSelectedSubId) || {}).url || '')
  };
  chrome.storage.local.set(payload);
}

async function syncMiniSubscription() {
  const entry = (state.miniSubscriptions || []).find((item) => item.id === state.miniSelectedSubId);
  if (!entry?.url) {
    setMiniManagerStatus('请先选择一个有效订阅。');
    return;
  }
  const btn = $('miniSubSyncBtn');
  btn.disabled = true;
  btn.innerText = '同步中...';
  setMiniManagerStatus('正在同步到 Atlas Mini...');
  try {
    const res = await fetch('http://127.0.0.1:28888/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: entry.url, ua: entry.ua || '' })
    });
    const data = await res.json();
    if (data.ok === false) throw new Error(data.error || '同步失败');
    chrome.storage.local.set({ miniSubUrl: entry.url });
    setMiniManagerStatus(`同步完成：${entry.name || '当前订阅'}，节点 ${Number(data.nodes) || 0} 个。`);
  } catch (error) {
    setMiniManagerStatus(`同步失败：${error.message}`);
  } finally {
    btn.disabled = false;
    btn.innerText = '同步到 Atlas Mini';
  }
}

function load() {
  chrome.storage.local.get(null, (res) => {
    state.uiLang = res.uiLang || (navigator.language.startsWith('zh') ? 'zh' : 'en');
    state.proxyMode = res.proxyMode === 'mini' ? 'manual' : (res.proxyMode || 'system');
    state.profiles = (Array.isArray(res.proxyProfiles) ? res.proxyProfiles : []).filter((item) => item.id !== MINI_PROFILE_ID);
    const fallbackProfileId = state.profiles[0]?.id || '';
    state.activeProfileId = (!MINI_PROXY_ENABLED && res.activeProfileId === MINI_PROFILE_ID)
      ? fallbackProfileId
      : (res.proxyMode === 'mini' ? fallbackProfileId : (res.activeProfileId || (state.profiles[0] ? state.profiles[0].id : '')));
    if ((!MINI_PROXY_ENABLED && res.activeProfileId === MINI_PROFILE_ID) || res.proxyMode === 'mini') {
      chrome.storage.local.set({ proxyMode: state.proxyMode, activeProfileId: fallbackProfileId });
    }
    state.rules = Array.isArray(res.rules) ? res.rules.map((rule) => normalizeRule(rule, state.activeProfileId || fallbackProfileId)) : [];
    state.proxyBypass = res.proxyBypass || '';
    state.timezone = res.timezone || '';
    state.language = res.language || '';
    state.ipTimezone = res.ipTimezone || '';
    state.miniSubscriptions = normalizeMiniSubscriptions(res.miniSubscriptions, res.miniSubUrl || '');
    state.miniSelectedSubId = (state.miniSubscriptions.find((item) => item.url === res.miniSubUrl) || state.miniSubscriptions[0] || {}).id || '';
    state.selectedProfileId = state.profiles.some((item) => item.id === state.activeProfileId)
      ? state.activeProfileId
      : (state.profiles[0] ? state.profiles[0].id : '');

    applyI18n();
    renderStaticLabels();
    renderGroupedSelect($('timezone'), [
      { label: 'Follow', options: [{ v: 'ip', n: 'optIpLocation' }] },
      ...TIMEZONE_GROUPS
    ]);
    renderGroupedSelect($('language'), LANGUAGE_GROUPS);
    $('proxyMode').value = state.proxyMode;
    $('proxyBypass').value = state.proxyBypass;
    $('timezone').value = state.timezone;
    $('language').value = state.language;
    const ipLangOpt = $('language').querySelector('option[value="ip"]');
    if (ipLangOpt) ipLangOpt.innerText = res.ipLanguage ? `${i18n('optIpLocation')} (${res.ipLanguage})` : i18n('optIpLocation');
    const ipTzOpt = $('timezone').querySelector('option[value="ip"]');
    if (ipTzOpt) ipTzOpt.innerText = res.ipTimezone ? `${i18n('optIpLocation')} (${res.ipTimezone})` : i18n('optIpLocation');
    
    updateActiveGroup();
    renderSidebar();
    renderRules();
    renderRuleEditorLabels();
    setRuleEditMode(state.ruleEditMode);
    loadProfileForm(state.selectedProfileId);
    if (MINI_PROXY_ENABLED) renderMiniSubscriptionManager();
    applyTheme(res.theme || 'dark');
    if (MINI_PROXY_ENABLED && state.activeProfileId === MINI_PROFILE_ID && (!location.hash || location.hash === '#section-node')) {
      goMiniSection('当前激活节点是 Atlas Mini，这里就是订阅配置入口。');
    }
    const miniNav = document.querySelector('[data-section="section-mini"]');
    if (miniNav) miniNav.style.display = MINI_PROXY_ENABLED ? '' : 'none';
    if ($('section-mini')) $('section-mini').style.display = 'none';
  });
}

function applyTheme(theme) {
  document.body.className = theme;
  $('themeBtn').innerText = theme === 'light' ? '🌙' : '☀️';
}

function renderSidebar() {
  const list = $('profileList'); list.innerHTML = '';
  state.profiles.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'profile-item' + (p.id === state.selectedProfileId ? ' active' : '');
    const isActive = p.id === state.activeProfileId;
    div.innerHTML = `
      <div class="dot"></div>
      <div class="name">${escapeHtml(p.name || 'Untitled')}</div>
      ${isActive ? `<span class="meta">${state.uiLang === 'zh' ? '当前' : 'Active'}</span>` : ''}
    `;
    div.onclick = () => { state.selectedProfileId = p.id; renderSidebar(); loadProfileForm(p.id); };
    list.appendChild(div);
  });
}

function loadProfileForm(id) {
  const p = state.profiles.find((x) => x.id === id);
  if (!p) {
    $('pName').value = '';
    $('pScheme').value = 'http';
    $('pHost').value = '';
    $('pPort').value = '';
    $('pUser').value = '';
    $('pPass').value = '';
    return;
  }
  $('pName').value = p.name || '';
  $('pScheme').value = p.scheme || 'http';
  $('pHost').value = p.host || '';
  $('pPort').value = p.port || '';
  $('pUser').value = p.user || '';
  $('pPass').value = p.pass || '';
}

function updateActiveGroup() {
  const sel = $('activeProfile'); const rSel = $('ruleProfile');
  if (!sel || !rSel) return;
  sel.innerHTML = ''; rSel.innerHTML = '';
  withMiniProfile(state.profiles).forEach((p) => {
    const opt = new Option(p.name || `${p.host}:${p.port}`, p.id);
    sel.add(opt); rSel.add(opt.cloneNode(true));
  });
  sel.value = state.activeProfileId;
  $('activeGroup').style.display = ($('proxyMode').value === 'manual' || $('proxyMode').value === 'auto') ? 'flex' : 'none';
}

function renderRules() {
  state.rules = state.rules.map((rule) => normalizeRule(rule));
  const list = $('ruleList'); list.innerHTML = '';
  state.rules.forEach((r, idx) => {
    const div = document.createElement('div');
    div.className = 'rule-item';
    div.innerHTML = `
      <div>
        <div class="mini-label">Type</div>
        <select class="rule-type-select" data-idx="${idx}">${buildRuleTypeOptions(r.type)}</select>
      </div>
      <div>
        <div class="mini-label">Pattern</div>
        <input class="rule-pattern-input rule-pattern" data-idx="${idx}" value="${escapeAttr(r.pattern)}">
      </div>
      <div>
        <div class="mini-label">Node</div>
        <select class="rule-profile-select" data-idx="${idx}">${buildRuleProfileOptions(r.profileId)}</select>
      </div>
      <div>
        <div class="mini-label">Action</div>
        <button class="rule-del btn-ghost danger" data-idx="${idx}">删除</button>
      </div>
    `;
    div.querySelector('.rule-del').onclick = () => { state.rules.splice(idx, 1); renderRules(); };
    div.querySelector('.rule-type-select').onchange = (event) => {
      state.rules[idx].type = event.target.value;
      updateRuleSourceFromState();
    };
    div.querySelector('.rule-pattern-input').oninput = (event) => {
      state.rules[idx].pattern = event.target.value.trim();
      updateRuleSourceFromState();
    };
    div.querySelector('.rule-profile-select').onchange = (event) => {
      state.rules[idx].profileId = event.target.value;
      updateRuleSourceFromState();
    };
    list.appendChild(div);
  });
  updateRuleSourceFromState();
}

function updateRuleSourceFromState() {
  const source = $('ruleSource');
  if (source) source.value = exportRulesToSource(state.rules.filter((item) => item.pattern));
}

function renderRuleEditorLabels() {
  if (!$('ruleVisualModeBtn')) return;
  const zh = state.uiLang === 'zh';
  $('ruleVisualModeBtn').innerText = zh ? '逐条编辑' : 'Visual';
  $('ruleSourceModeBtn').innerText = zh ? '源码模式' : 'Source';
  $('loadClaudePresetBtn').innerText = zh ? '导入 Claude 预设' : 'Import Claude Preset';
  $('copyRuleSourceBtn').innerText = zh ? '复制源码' : 'Copy Source';
  $('applyRuleSourceBtn').innerText = zh ? '从源码导入' : 'Import Source';
}

function setRuleEditMode(mode = 'visual') {
  state.ruleEditMode = mode === 'source' ? 'source' : 'visual';
  $('ruleVisualPanel').style.display = state.ruleEditMode === 'visual' ? '' : 'none';
  $('ruleSourcePanel').style.display = state.ruleEditMode === 'source' ? '' : 'none';
  $('ruleVisualModeBtn').classList.toggle('active', state.ruleEditMode === 'visual');
  $('ruleSourceModeBtn').classList.toggle('active', state.ruleEditMode === 'source');
  if (state.ruleEditMode === 'source') updateRuleSourceFromState();
}

function activateSection(sectionId) {
  if (!sectionId || !$(sectionId)) return;
  $$('.nav-menu-item').forEach((btn) => btn.classList.toggle('active', btn.dataset.section === sectionId));
  $$('.config-section').forEach((section) => section.classList.toggle('active', section.id === sectionId));
  if (location.hash !== `#${sectionId}`) history.replaceState({}, '', `#${sectionId}`);
  window.dispatchEvent(new CustomEvent('atlas:section-activated', { detail: { sectionId } }));
}

function activateSectionFromHash() {
  const sectionId = location.hash.replace(/^#/, '');
  if (!MINI_PROXY_ENABLED && sectionId === 'section-mini') {
    activateSection('section-general');
    return;
  }
  if (sectionId && $(sectionId)) {
    activateSection(sectionId);
    return;
  }
  activateSection('section-node');
}

function goMiniSection(reason = '') {
  activateSection('section-mini');
  if (reason) setMiniManagerStatus(reason);
}

function bind() {
  $$('.nav-menu-item').forEach(btn => {
    btn.onclick = () => activateSection(btn.dataset.section);
  });

  $('proxyMode').onchange = () => {
    state.proxyMode = $('proxyMode').value;
    updateActiveGroup();
    if (MINI_PROXY_ENABLED && state.proxyMode === 'manual' && $('activeProfile').value === MINI_PROFILE_ID) {
      goMiniSection('当前激活节点是 Atlas Mini，请在这里管理订阅并同步。');
    }
  };

  $('newProfileBtn').onclick = () => {
    const id = 'p' + Date.now();
    state.profiles.push({ id, name: 'New Node', scheme: 'http', host: '', port: '', user: '', pass: '' });
    state.selectedProfileId = id; renderSidebar(); loadProfileForm(id); updateActiveGroup();
  };

  $('updateProfileBtn').onclick = () => {
    const p = state.profiles.find(x => x.id === state.selectedProfileId);
    if (!p) return;
    p.name = $('pName').value; p.scheme = $('pScheme').value; p.host = $('pHost').value;
    p.port = $('pPort').value; p.user = $('pUser').value; p.pass = $('pPass').value;
    renderSidebar(); updateActiveGroup();
    alert(state.uiLang === 'zh' ? '节点已更新' : 'Node updated');
  };

  $('delProfileBtn').onclick = () => {
    if (state.profiles.length <= 1) return;
    state.profiles = state.profiles.filter(x => x.id !== state.selectedProfileId);
    state.selectedProfileId = state.profiles[0].id;
    renderSidebar(); loadProfileForm(state.selectedProfileId); updateActiveGroup();
  };

  $('addRuleBtn').onclick = () => {
    const pattern = $('rulePattern').value.trim();
    if (!pattern) return;
    state.rules.push(normalizeRule({
      pattern,
      profileId: $('ruleProfile').value,
      type: $('ruleType').value
    }, $('ruleProfile').value));
    $('rulePattern').value = ''; renderRules();
  };

  $('ruleVisualModeBtn').onclick = () => setRuleEditMode('visual');
  $('ruleSourceModeBtn').onclick = () => setRuleEditMode('source');
  $('applyRuleSourceBtn').onclick = () => {
    const parsed = parseRuleSource($('ruleSource').value);
    if (!parsed.length) {
      alert(state.uiLang === 'zh' ? '没有解析出有效规则' : 'No valid rules parsed');
      return;
    }
    state.rules = parsed;
    renderRules();
    setRuleEditMode('visual');
  };
  $('copyRuleSourceBtn').onclick = async () => {
    updateRuleSourceFromState();
    try {
      await navigator.clipboard.writeText($('ruleSource').value);
      alert(state.uiLang === 'zh' ? '规则源码已复制' : 'Rule source copied');
    } catch (error) {
      alert(state.uiLang === 'zh' ? '复制失败，请手动复制' : 'Copy failed, please copy manually');
    }
  };
  $('loadClaudePresetBtn').onclick = () => {
    const targetProfileId = $('activeProfile').value || state.activeProfileId || state.profiles[0]?.id || '';
    mergePresetRules(CLAUDE_RULE_PRESET, targetProfileId);
    renderRules();
    alert(state.uiLang === 'zh'
      ? '已导入 Claude 预设域名规则。规则依据公开网络资料整理，IP-CIDR / ASN 兜底规则未纳入浏览器 PAC。'
      : 'Claude preset imported. The domain set is organized from public web data. IP-CIDR / ASN fallbacks are not included in browser PAC.');
  };

  if (MINI_PROXY_ENABLED && $('miniSubscriptionSelect')) {
    $('miniSubscriptionSelect').onchange = () => {
      state.miniSelectedSubId = $('miniSubscriptionSelect').value;
      loadMiniSubscriptionForm(state.miniSelectedSubId);
      setMiniManagerStatus('已切换订阅，可直接保存或同步到 Atlas Mini。');
    };
  }

  if (MINI_PROXY_ENABLED && $('miniSubNewBtn')) {
    $('miniSubNewBtn').onclick = () => {
      state.miniSelectedSubId = '';
      $('miniSubscriptionSelect').value = '';
      $('miniSubName').value = '';
      $('miniSubUa').value = '';
      $('miniSubUrlInput').value = '';
      setMiniManagerStatus('已清空表单，填写后点“保存订阅”即可新增。');
    };
  }

  if (MINI_PROXY_ENABLED && $('miniSubSaveBtn')) {
    $('miniSubSaveBtn').onclick = () => {
      const name = $('miniSubName').value.trim();
      const url = $('miniSubUrlInput').value.trim();
      const ua = $('miniSubUa').value.trim();
      if (!name || !url) {
        setMiniManagerStatus('订阅名称和 URL 都不能为空。');
        return;
      }
      if (state.miniSelectedSubId) {
        state.miniSubscriptions = state.miniSubscriptions.map((item) => item.id === state.miniSelectedSubId ? { ...item, name, url, ua } : item);
      } else {
        state.miniSelectedSubId = `mini-${Date.now()}`;
        state.miniSubscriptions.push({ id: state.miniSelectedSubId, name, url, ua });
      }
      saveMiniSubscriptions(url);
      renderMiniSubscriptionManager();
      setMiniManagerStatus(`已保存订阅：${name}`);
    };
  }

  if (MINI_PROXY_ENABLED && $('miniSubDeleteBtn')) {
    $('miniSubDeleteBtn').onclick = () => {
      if (!state.miniSelectedSubId) {
        setMiniManagerStatus('当前没有可删除的订阅。');
        return;
      }
      const removing = state.miniSubscriptions.find((item) => item.id === state.miniSelectedSubId);
      state.miniSubscriptions = state.miniSubscriptions.filter((item) => item.id !== state.miniSelectedSubId);
      state.miniSelectedSubId = state.miniSubscriptions[0]?.id || '';
      saveMiniSubscriptions('');
      renderMiniSubscriptionManager();
      setMiniManagerStatus(`已删除订阅：${removing?.name || '未命名订阅'}`);
    };
  }

  if (MINI_PROXY_ENABLED && $('miniSubSyncBtn')) $('miniSubSyncBtn').onclick = () => { syncMiniSubscription(); };

  $('saveTopBtn').onclick = () => {
    if (state.ruleEditMode === 'source') {
      state.rules = parseRuleSource($('ruleSource').value);
      renderRules();
    }
    const data = {
      proxyMode: $('proxyMode').value,
      activeProfileId: $('activeProfile').value,
      proxyProfiles: state.profiles,
      rules: state.rules.filter((item) => item.pattern),
      proxyBypass: $('proxyBypass').value,
      timezone: $('timezone').value,
      language: $('language').value
    };
    chrome.storage.local.set(data, () => alert(state.uiLang === 'zh' ? '设置已保存' : 'Settings saved'));
  };

  $('themeBtn').onclick = () => {
    chrome.storage.local.get(['theme'], res => {
      const next = res.theme === 'light' ? 'dark' : 'light';
      chrome.storage.local.set({ theme: next });
    });
  };

  $('uiLangToggle').onclick = () => {
    state.uiLang = state.uiLang === 'zh' ? 'en' : 'zh';
    chrome.storage.local.set({ uiLang: state.uiLang });
  };

  $('testNodeBtn').onclick = async () => {
    const btn = $('testNodeBtn'); btn.innerText = state.uiLang === 'zh' ? '测试中...' : 'Testing...';
    try {
      const start = Date.now();
      await fetch('https://1.1.1.1/cdn-cgi/trace', { mode: 'no-cors', cache: 'no-store' });
      alert((state.uiLang === 'zh' ? '连接成功，延迟：' : 'Connected! Latency: ') + (Date.now() - start) + 'ms');
    } catch(e) { alert(state.uiLang === 'zh' ? '连接失败' : 'Connection failed'); }
    btn.innerText = state.uiLang === 'zh' ? '⚡ 测试连接' : '⚡ Test Connection';
  };

  $('exportBtn').onclick = () => {
    chrome.storage.local.get(null, res => {
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `atlas_config.json`; a.click();
    });
  };

  $('importBtn').onclick = () => $('importFile').click();
  $('importFile').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      chrome.storage.local.set(JSON.parse(ev.target.result), () => location.reload());
    };
    reader.readAsText(e.target.files[0]);
  };
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if ('theme' in changes || 'uiLang' in changes || 'ipTimezone' in changes || 'ipLanguage' in changes || 'timezone' in changes || 'language' in changes || 'miniSubscriptions' in changes || 'miniSubUrl' in changes) load();
  if ('proxyMode' in changes || 'activeProfileId' in changes || 'proxyProfiles' in changes) {
    state.proxyMode = changes.proxyMode?.newValue || state.proxyMode;
    state.activeProfileId = changes.activeProfileId?.newValue || state.activeProfileId;
    state.profiles = (changes.proxyProfiles?.newValue || state.profiles).filter((item) => item.id !== MINI_PROFILE_ID);
    if ($('proxyMode')) $('proxyMode').value = state.proxyMode;
    updateActiveGroup();
    renderSidebar();
    if (MINI_PROXY_ENABLED && state.activeProfileId === MINI_PROFILE_ID && location.hash !== '#section-mini') {
      goMiniSection('你现在选中的是 Atlas Mini，订阅入口已经切到这里。');
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  load();
  bind();
  activateSectionFromHash();
  $('activeProfile').addEventListener('change', () => {
    if (!MINI_PROXY_ENABLED) return;
    if ($('activeProfile').value === MINI_PROFILE_ID) {
      goMiniSection('当前节点已切到 Atlas Mini，这里就是它的配置入口。');
    }
  });
});
window.addEventListener('hashchange', activateSectionFromHash);
