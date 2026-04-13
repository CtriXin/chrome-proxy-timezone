const $ = (id) => document.getElementById(id) || document.querySelector(id);
const $$ = (s) => document.querySelectorAll(s);
const MINI_PROFILE_ID = 'atlas-mini';
const MINI_PROFILE = { id: MINI_PROFILE_ID, name: 'Atlas Mini', host: '127.0.0.1', port: '2080', scheme: 'http' };
const MINI_PROXY_ENABLED = false;
const DEFAULT_IP_ALERT_INTERVAL_MIN = 3;
const SYSTEM_THEME_MEDIA = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const RULE_TYPES = [
  { value: 'suffix', labelKey: 'ruleSuffix' },
  { value: 'domain', labelKey: 'ruleDomain' },
  { value: 'keyword', labelKey: 'ruleKeyword' },
  { value: 'wildcard', labelKey: 'ruleWildcard' }
];
const RULE_PRESETS = [
  {
    key: 'claude-core',
    label: { zh: 'Claude 基础', en: 'Claude Core' },
    description: {
      zh: '覆盖 Claude Web / API / 控制台核心域名，适合最小可用分流。',
      en: 'Routes the core Claude Web / API / console domains.'
    },
    rules: [
      { type: 'suffix', pattern: 'anthropic.com' },
      { type: 'domain', pattern: 'claude.ai' },
      { type: 'domain', pattern: 'api.anthropic.com' },
      { type: 'domain', pattern: 'console.anthropic.com' },
      { type: 'domain', pattern: 'cdn.anthropic.com' },
      { type: 'domain', pattern: 'claudeusercontent.com' },
      { type: 'domain', pattern: 'mcp.anthropic.com' }
    ]
  },
  {
    key: 'claude-full',
    label: { zh: 'Claude 全量', en: 'Claude Full' },
    description: {
      zh: '在核心域名之外，额外纳入常见上报与静态资源域名，适合更稳的 Claude 访问。',
      en: 'Adds common telemetry and static domains on top of the core Claude set.'
    },
    rules: [
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
    ]
  },
  {
    key: 'openai',
    label: { zh: 'OpenAI / ChatGPT', en: 'OpenAI / ChatGPT' },
    description: {
      zh: '覆盖 ChatGPT、OpenAI Platform、API 与静态资源常见域名。',
      en: 'Routes common ChatGPT, Platform, API, and static asset domains.'
    },
    rules: [
      { type: 'suffix', pattern: 'openai.com' },
      { type: 'domain', pattern: 'chatgpt.com' },
      { type: 'domain', pattern: 'auth.openai.com' },
      { type: 'domain', pattern: 'api.openai.com' },
      { type: 'domain', pattern: 'platform.openai.com' },
      { type: 'domain', pattern: 'files.oaiusercontent.com' },
      { type: 'domain', pattern: 'cdn.oaistatic.com' },
      { type: 'domain', pattern: 'persistent.oaistatic.com' },
      { type: 'keyword', pattern: 'oaiusercontent' }
    ]
  },
  {
    key: 'google-ai',
    label: { zh: 'Google AI / Gemini', en: 'Google AI / Gemini' },
    description: {
      zh: '覆盖 Gemini、AI Studio 与 Google AI API 相关域名。',
      en: 'Routes Gemini, AI Studio, and Google AI API domains.'
    },
    rules: [
      { type: 'domain', pattern: 'gemini.google.com' },
      { type: 'domain', pattern: 'aistudio.google.com' },
      { type: 'domain', pattern: 'ai.google.dev' },
      { type: 'domain', pattern: 'makersuite.google.com' },
      { type: 'domain', pattern: 'generativelanguage.googleapis.com' },
      { type: 'domain', pattern: 'alkalimakersuite-pa.clients6.google.com' }
    ]
  }
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
    navBackup: "Backup & Sync", navDiagnostics: "Diagnostics", navRouting: "Routing Lab", navOptions: "Settings",
    navMini: "Atlas Mini", btnImportSource: "Import Source",
    ruleSourceHint: "Supports SwitchyOmega style (*.google.com) and explicit formats (DOMAIN-SUFFIX, DOMAIN, DOMAIN-KEYWORD).",
    miniTitle: "Atlas Mini Subscriptions", miniSubtitle: "Configure node sources for Atlas Mini popup here.",
    miniBadge: "POPUP ENTRY", labelCurrentSub: "Current Subscription", labelSubName: "Subscription Name",
    labelSubUa: "User-Agent", labelSubUrl: "Subscription URL", btnNewSub: "New", btnSaveSub: "Save",
    btnDeleteSub: "Delete", btnSyncMini: "Sync to Mini",
    sectionBackup: "Backup & Restore", diagTitle: "Local Diagnostics", diagSubtitle: "Use extension background and page probe data directly.",
    diagRefreshLight: "Refresh Snapshot", diagRefreshFull: "Run Full Scan", testNode: "⚡ Test Connection", navSystem: "SYSTEM",
    ruleSuffix: "DOMAIN-SUFFIX", ruleDomain: "DOMAIN", ruleKeyword: "DOMAIN-KEYWORD", ruleWildcard: "WILDCARD",
    btnLoadPreset: "Import Preset", ipAlertTitle: "IP Change Alert", ipAlertDesc: "Probe exit IP in the background and warn with the extension badge when it changes.", ipAlertInterval: "Check Interval", ipAlertStatus: "Current Status",
    apiConfigTitle: "Custom API Key", apiConfigDesc: "Use your own AbuseIPDB API Key so risk scoring uses your own quota and reduces load on the default public endpoint.",
    abuseKeyLabel: "AbuseIPDB API Key", clearCustomApi: "Clear API Key",
    apiGuideTitle: "How to get it", apiGuideStep1: "Create or sign in to your AbuseIPDB account.",
    apiGuideStep2: "Open API Settings in your account page and copy your API Key.",
    apiGuideStep3: "Paste it here, then Save & Apply. Popup risk scoring will prefer your own quota.",
    apiGuideLinkLabel: "Get it at:"
  },
  zh: {
    appName: "Atlas 代理", statusSystem: "系统代理", statusDirect: "直接连接", statusManual: "手动模式", statusAuto: "自动规则",
    tabQuick: "主页", labelMode: "全局模式", labelProfile: "当前节点", labelTz: "地理时区", labelLang: "浏览器语言",
    btnSaveApply: "保存并应用", labelProfileInfo: "节点详细信息", labelAlias: "别名", labelProtocol: "协议",
    labelHost: "IP / 域名", labelPort: "端口", labelUser: "用户名", labelPass: "密码",
    btnPaste: "📋 从剪贴板粘贴", btnUpdate: "更新当前节点", btnDelete: "删除当前节点", btnNewProfile: "+ 新建节点",
    btnAddRule: "+ 添加规则", labelBypass: "绕过列表", labelGlobalSettings: "通用设置",
    optDefault: "默认 (不修改)", optIpLocation: "根据 IP 自动跟随", btnExport: "导出 JSON", btnImport: "导入 JSON",
    navBackup: "导入 / 导出", navDiagnostics: "诊断中心", navRouting: "分流实验室", navOptions: "设置",
    navMini: "Atlas Mini", btnImportSource: "从源码导入",
    ruleSourceHint: "支持 SwitchyOmega 风格 (*.google.com) 或显式格式 (DOMAIN-SUFFIX, DOMAIN, DOMAIN-KEYWORD)。",
    miniTitle: "Atlas Mini 订阅与节点源", miniSubtitle: "这里就是 popup 里“未配置订阅”对应的网页端配置入口。",
    miniBadge: "POPUP 配置入口", labelCurrentSub: "当前订阅", labelSubName: "订阅名称",
    labelSubUa: "User-Agent", labelSubUrl: "订阅 URL", btnNewSub: "新建空白", btnSaveSub: "保存订阅",
    btnDeleteSub: "删除订阅", btnSyncMini: "同步到 Atlas Mini",
    sectionBackup: "导入 / 导出", diagTitle: "本地诊断中心", diagSubtitle: "直接使用扩展后台与页面探针数据，不依赖外部展示页。",
    diagRefreshLight: "刷新快照", diagRefreshFull: "完整扫描", testNode: "⚡ 测试连接", navSystem: "系统",
    ruleSuffix: "域名后缀", ruleDomain: "精确域名", ruleKeyword: "关键字", ruleWildcard: "通配符",
    btnLoadPreset: "导入预设", ipAlertTitle: "IP 突变告警", ipAlertDesc: "后台定时检测出口 IP，变化后用扩展角标提醒。", ipAlertInterval: "检测间隔", ipAlertStatus: "当前状态",
    apiConfigTitle: "自定义 API Key", apiConfigDesc: "可以填写你自己的 AbuseIPDB API Key，风险评分会优先走你的配额，减少默认公共接口压力。",
    abuseKeyLabel: "AbuseIPDB API Key", clearCustomApi: "清空 API Key",
    apiGuideTitle: "获取方式", apiGuideStep1: "去 AbuseIPDB 注册或登录账号。",
    apiGuideStep2: "进入账号页的 API Settings，创建并复制 API Key。",
    apiGuideStep3: "粘贴到这里后保存并应用，popup 的风险评分会优先使用你的配额。",
    apiGuideLinkLabel: "获取地址："
  }
};

let state = {
  proxyMode: 'system', profiles: [], activeProfileId: '', selectedProfileId: '',
  rules: [], proxyBypass: '', timezone: '', language: '', ipTimezone: '', uiLang: 'zh',
  miniSubscriptions: [], miniSelectedSubId: '', ruleEditMode: 'visual',
  ipAlertEnabled: true, ipAlertIntervalMin: DEFAULT_IP_ALERT_INTERVAL_MIN, ipAlertState: null,
  profileLatencyMap: {}, abuseIpDbKey: ''
};

function i18n(key) {
  return TRANSLATIONS[state.uiLang][key] || key;
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

function applyI18n() {
  $$('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = i18n(key);
    if (msg) {
      if (el.tagName === 'INPUT' && el.type === 'button') el.value = msg;
      else el.innerText = msg;
    }
  });
  document.title = i18n('appName') + ' - ' + i18n('navOptions');
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
  if ($('loadRulePresetBtn')) $('loadRulePresetBtn').innerText = i18n('btnLoadPreset');
  if ($('ipAlertConfigTitle')) $('ipAlertConfigTitle').innerText = i18n('ipAlertTitle');
  if ($('ipAlertConfigDesc')) $('ipAlertConfigDesc').innerText = i18n('ipAlertDesc');
  if ($('ipAlertIntervalLabel')) $('ipAlertIntervalLabel').innerText = i18n('ipAlertInterval');
  if ($('ipAlertStatusLabel')) $('ipAlertStatusLabel').innerText = i18n('ipAlertStatus');
  if ($('apiConfigTitle')) $('apiConfigTitle').innerText = i18n('apiConfigTitle');
  if ($('apiConfigDesc')) $('apiConfigDesc').innerText = i18n('apiConfigDesc');
  if ($('abuseKeyLabel')) $('abuseKeyLabel').innerText = i18n('abuseKeyLabel');
  if ($('clearCustomApiBtn')) $('clearCustomApiBtn').innerText = i18n('clearCustomApi');
  if ($('apiGuideTitle')) $('apiGuideTitle').innerText = i18n('apiGuideTitle');
  if ($('apiGuideStep1')) $('apiGuideStep1').innerText = i18n('apiGuideStep1');
  if ($('apiGuideStep2')) $('apiGuideStep2').innerText = i18n('apiGuideStep2');
  if ($('apiGuideStep3')) $('apiGuideStep3').innerText = i18n('apiGuideStep3');
  if ($('apiGuideLinkLabel')) $('apiGuideLinkLabel').innerText = i18n('apiGuideLinkLabel');
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
  return RULE_TYPES.map((item) => `<option value="${item.value}"${item.value === selected ? ' selected' : ''}>${i18n(item.labelKey)}</option>`).join('');
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

function decodeProxyComponent(value = '') {
  try {
    return decodeURIComponent(String(value || ''));
  } catch (error) {
    return String(value || '');
  }
}

function extractProxySpecFromText(input = '') {
  const text = String(input || '').trim();
  if (!text) return '';
  const curlMatch = text.match(/(?:^|\s)(?:--proxy|-x)\s+(?:"([^"]+)"|'([^']+)'|(\S+))/i);
  return (curlMatch && (curlMatch[1] || curlMatch[2] || curlMatch[3])) || text;
}

function parseProxyClipboardText(input = '') {
  let spec = extractProxySpecFromText(input).trim();
  if (!spec) return null;
  spec = spec.replace(/^['"]|['"]$/g, '').trim();
  spec = spec.replace(/[;,]+$/, '').trim();

  const compactMatch = spec.match(/^([^:\s]+):(\d+):([^:\s]+):(.+)$/);
  if (compactMatch && !spec.includes('@') && !spec.includes('://')) {
    return {
      scheme: 'http',
      host: compactMatch[1],
      port: compactMatch[2],
      user: decodeProxyComponent(compactMatch[3]),
      pass: decodeProxyComponent(compactMatch[4])
    };
  }

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(spec)) {
    spec = `http://${spec}`;
  }

  let url;
  try {
    url = new URL(spec);
  } catch (error) {
    return null;
  }

  const rawScheme = String(url.protocol || '').replace(':', '').toLowerCase();
  const scheme = rawScheme === 'socks5h' || rawScheme === 'socks' ? 'socks5' : rawScheme;
  if (!['http', 'https', 'socks5'].includes(scheme)) return null;
  if (!url.hostname || !url.port) return null;

  return {
    scheme,
    host: url.hostname,
    port: url.port,
    user: decodeProxyComponent(url.username),
    pass: decodeProxyComponent(url.password)
  };
}

function fillProfileFormFromProxy(parsed = null) {
  if (!parsed) return;
  $('pScheme').value = parsed.scheme || 'http';
  $('pHost').value = parsed.host || '';
  $('pPort').value = parsed.port || '';
  $('pUser').value = parsed.user || '';
  $('pPass').value = parsed.pass || '';
  if (!$('pName').value.trim() || $('pName').value === 'New Node') {
    $('pName').value = parsed.host || '';
  }
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

function getRulePresetByKey(key = '') {
  return RULE_PRESETS.find((item) => item.key === key) || RULE_PRESETS[0];
}

function renderRulePresetPicker() {
  const select = $('rulePresetSelect');
  const hint = $('rulePresetHint');
  if (!select || !hint) return;
  const currentValue = select.value || RULE_PRESETS[0].key;
  select.innerHTML = '';
  RULE_PRESETS.forEach((preset) => {
    select.add(new Option(preset.label[state.uiLang] || preset.label.en, preset.key));
  });
  if (RULE_PRESETS.some((preset) => preset.key === currentValue)) select.value = currentValue;
  const preset = getRulePresetByKey(select.value);
  hint.innerText = `${preset.description[state.uiLang] || preset.description.en} · ${preset.rules.length} ${state.uiLang === 'zh' ? '条规则' : 'rules'}`;
}

function formatIpAlertStatus(alertState = null) {
  if (!alertState?.active || !alertState.previousIp || !alertState.currentIp) {
    return state.uiLang === 'zh' ? '当前未发现出口切换。' : 'No exit change detected.';
  }
  const prevGeo = [alertState.previousCountry, alertState.previousCity].filter(Boolean).join(' / ');
  const nextGeo = [alertState.currentCountry, alertState.currentCity].filter(Boolean).join(' / ');
  const prev = prevGeo ? `${alertState.previousIp} (${prevGeo})` : alertState.previousIp;
  const next = nextGeo ? `${alertState.currentIp} (${nextGeo})` : alertState.currentIp;
  return state.uiLang === 'zh' ? `最近一次变化：${prev} -> ${next}` : `Latest change: ${prev} -> ${next}`;
}

function getProfileLatencyEntry(profileId = '') {
  return (state.profileLatencyMap || {})[profileId] || null;
}

function shouldWarnMissingCredentials(profile = null) {
  if (!profile?.host) return false;
  const host = String(profile.host).trim().toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
  if (host.startsWith('10.') || host.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
  return !String(profile.user || '').trim() || !String(profile.pass || '').trim();
}

function getLatencyTone(latency) {
  if (!Number.isFinite(Number(latency))) return 'bad';
  const value = Number(latency);
  if (value <= 250) return 'good';
  if (value <= 800) return 'warn';
  return 'bad';
}

function formatRelativeTime(ts = 0) {
  const delta = Math.max(0, Date.now() - Number(ts || 0));
  const sec = Math.round(delta / 1000);
  if (sec < 10) return state.uiLang === 'zh' ? '刚刚' : 'just now';
  if (sec < 60) return state.uiLang === 'zh' ? `${sec} 秒前` : `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return state.uiLang === 'zh' ? `${min} 分钟前` : `${min}m ago`;
  const hour = Math.round(min / 60);
  if (hour < 48) return state.uiLang === 'zh' ? `${hour} 小时前` : `${hour}h ago`;
  const day = Math.round(hour / 24);
  return state.uiLang === 'zh' ? `${day} 天前` : `${day}d ago`;
}

function formatProfileLatencyLine(profileId = '') {
  const entry = getProfileLatencyEntry(profileId);
  const profile = getProfileById(profileId);
  const missingCreds = shouldWarnMissingCredentials(profile);
  if (!entry?.checkedAt && missingCreds) {
    return state.uiLang === 'zh'
      ? '未配置用户名或密码；如果该 proxy 需要鉴权，请先补全凭据。'
      : 'Username or password is missing for this proxy.';
  }
  if (!entry?.checkedAt) return state.uiLang === 'zh' ? '暂无测速记录。' : 'No latency record yet.';
  const when = formatRelativeTime(entry.checkedAt);
  if (entry.ok && Number.isFinite(Number(entry.latency))) {
    return state.uiLang === 'zh'
      ? `最近测速 ${Math.round(Number(entry.latency))}ms · ${when}${missingCreds ? ' · 未配置凭据' : ''}`
      : `Latest latency ${Math.round(Number(entry.latency))}ms · ${when}${missingCreds ? ' · missing credentials' : ''}`;
  }
  return state.uiLang === 'zh'
    ? `最近测速失败 · ${when}${missingCreds ? ' · 未配置凭据' : ''}`
    : `Latest probe failed · ${when}${missingCreds ? ' · missing credentials' : ''}`;
}

function renderProfileLatencyMeta(profileId = '', transient = '') {
  const el = $('profileLatencyMeta');
  if (!el) return;
  const entry = getProfileLatencyEntry(profileId);
  const profile = getProfileById(profileId);
  el.className = 'profile-latency-meta';
  if (transient) {
    el.innerText = transient;
    return;
  }
  el.innerText = formatProfileLatencyLine(profileId);
  if (!entry?.checkedAt && shouldWarnMissingCredentials(profile)) {
    el.classList.add('warn');
    return;
  }
  if (entry?.checkedAt) el.classList.add(getLatencyTone(entry.latency));
}

function renderIpAlertSettings() {
  const intervalSelect = $('ipAlertInterval');
  if (intervalSelect) {
    [...intervalSelect.options].forEach((opt) => {
      const value = Number(opt.value) || DEFAULT_IP_ALERT_INTERVAL_MIN;
      opt.innerText = state.uiLang === 'zh' ? `${value} 分钟` : `${value} min`;
    });
  }
  if ($('ipAlertEnabled')) $('ipAlertEnabled').checked = !!state.ipAlertEnabled;
  if (intervalSelect) intervalSelect.value = String(state.ipAlertIntervalMin || DEFAULT_IP_ALERT_INTERVAL_MIN);
  if (intervalSelect) intervalSelect.disabled = !state.ipAlertEnabled;
  if ($('ipAlertStatusText')) $('ipAlertStatusText').innerText = formatIpAlertStatus(state.ipAlertState);
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
    state.ipAlertEnabled = res.ipAlertEnabled !== false;
    state.ipAlertIntervalMin = Number(res.ipAlertIntervalMin) || DEFAULT_IP_ALERT_INTERVAL_MIN;
    state.ipAlertState = res.ipAlertState || null;
    state.profileLatencyMap = res.profileLatencyMap || {};
    state.abuseIpDbKey = res.abuseIpDbKey || '';
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
    if ($('abuseIpDbKey')) $('abuseIpDbKey').value = state.abuseIpDbKey;
    const ipLangOpt = $('language').querySelector('option[value="ip"]');
    if (ipLangOpt) ipLangOpt.innerText = res.ipLanguage ? `${i18n('optIpLocation')} (${res.ipLanguage})` : i18n('optIpLocation');
    const ipTzOpt = $('timezone').querySelector('option[value="ip"]');
    if (ipTzOpt) ipTzOpt.innerText = res.ipTimezone ? `${i18n('optIpLocation')} (${res.ipTimezone})` : i18n('optIpLocation');
    
    updateActiveGroup();
    renderSidebar();
    renderRules();
    renderRuleEditorLabels();
    renderRulePresetPicker();
    setRuleEditMode(state.ruleEditMode);
    loadProfileForm(state.selectedProfileId);
    renderProfileLatencyMeta(state.selectedProfileId);
    renderIpAlertSettings();
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
  const resolved = resolveTheme(theme);
  document.body.className = resolved;
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(resolved);
  try {
    localStorage.setItem('atlas_theme_pref', theme);
    localStorage.setItem('atlas_theme', resolved);
  } catch (error) {}
  $('themeBtn').innerText = getThemeIcon(theme);
}

function renderSidebar() {
  const list = $('profileList'); list.innerHTML = '';
  state.profiles.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'profile-item' + (p.id === state.selectedProfileId ? ' active' : '');
    const isActive = p.id === state.activeProfileId;
    div.innerHTML = `
      <div class="dot"></div>
      <div class="name">${escapeHtml(p.name || (state.uiLang === 'zh' ? '未命名' : 'Untitled'))}</div>
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
    renderProfileLatencyMeta('');
    return;
  }
  $('pName').value = p.name || '';
  $('pScheme').value = p.scheme || 'http';
  $('pHost').value = p.host || '';
  $('pPort').value = p.port || '';
  $('pUser').value = p.user || '';
  $('pPass').value = p.pass || '';
  renderProfileLatencyMeta(id);
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
  const zh = state.uiLang === 'zh';
  state.rules.forEach((r, idx) => {
    const div = document.createElement('div');
    div.className = 'rule-item';
    div.innerHTML = `
      <div>
        <div class="mini-label">${zh ? '类型' : 'Type'}</div>
        <select class="rule-type-select" data-idx="${idx}">${buildRuleTypeOptions(r.type)}</select>
      </div>
      <div>
        <div class="mini-label">${zh ? '模式' : 'Pattern'}</div>
        <input class="rule-pattern-input rule-pattern" data-idx="${idx}" value="${escapeAttr(r.pattern)}">
      </div>
      <div>
        <div class="mini-label">${zh ? '节点' : 'Node'}</div>
        <select class="rule-profile-select" data-idx="${idx}">${buildRuleProfileOptions(r.profileId)}</select>
      </div>
      <div>
        <div class="mini-label">${zh ? '操作' : 'Action'}</div>
        <button class="rule-del btn-ghost danger" data-idx="${idx}">${zh ? '删除' : 'Delete'}</button>
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
  $('loadRulePresetBtn').innerText = zh ? '导入预设' : 'Import Preset';
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
    renderProfileLatencyMeta(state.selectedProfileId, state.uiLang === 'zh' ? '节点已更新，保存并应用后会自动刷新测速记录。' : 'Node updated. Save and apply to refresh latency.');
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
  $('rulePresetSelect').onchange = () => renderRulePresetPicker();
  $('loadRulePresetBtn').onclick = () => {
    const targetProfileId = $('activeProfile').value || state.activeProfileId || state.profiles[0]?.id || '';
    const preset = getRulePresetByKey($('rulePresetSelect').value);
    mergePresetRules(preset.rules, targetProfileId);
    renderRules();
    alert(state.uiLang === 'zh'
      ? `已导入 ${preset.label.zh}。规则依据公开网络资料整理，IP-CIDR / ASN 兜底规则未纳入浏览器 PAC。`
      : `${preset.label.en} imported. The domain set is organized from public web data. IP-CIDR / ASN fallbacks are not included in browser PAC.`);
  };
  $('ipAlertEnabled').onchange = () => {
    state.ipAlertEnabled = !!$('ipAlertEnabled').checked;
    renderIpAlertSettings();
  };
  $('ipAlertInterval').onchange = () => {
    state.ipAlertIntervalMin = Number($('ipAlertInterval').value) || DEFAULT_IP_ALERT_INTERVAL_MIN;
    renderIpAlertSettings();
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
      language: $('language').value,
      abuseIpDbKey: $('abuseIpDbKey')?.value.trim() || '',
      ipAlertEnabled: !!$('ipAlertEnabled').checked,
      ipAlertIntervalMin: Number($('ipAlertInterval').value) || DEFAULT_IP_ALERT_INTERVAL_MIN
    };
    chrome.storage.local.set(data, () => {
      chrome.storage.local.remove(['customApiBase']);
      renderProfileLatencyMeta(state.selectedProfileId, state.uiLang === 'zh' ? '设置已保存，后台将刷新当前生效节点延迟。' : 'Settings saved. Background latency refresh queued.');
      chrome.runtime.sendMessage({ action: 'measureActiveProfileLatency', force: true, reason: 'save' }, () => {});
    });
  };

  $('themeBtn').onclick = () => {
    chrome.storage.local.get(['theme'], res => {
      const next = getNextTheme(res.theme || 'dark');
      chrome.storage.local.set({ theme: next });
    });
  };

  if ($('clearCustomApiBtn')) {
    $('clearCustomApiBtn').onclick = () => {
      if ($('abuseIpDbKey')) $('abuseIpDbKey').value = '';
      chrome.storage.local.remove(['customApiBase']);
    };
  }

  $('pasteBtn').onclick = async () => {
    const btn = $('pasteBtn');
    const defaultText = i18n('btnPaste');
    const zh = state.uiLang === 'zh';
    btn.disabled = true;
    btn.innerText = zh ? '读取中...' : 'Reading...';
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) throw new Error(zh ? '剪贴板为空' : 'Clipboard is empty');
      const parsed = parseProxyClipboardText(text);
      if (!parsed) throw new Error(zh ? '未识别出有效代理 URL' : 'No valid proxy URL found');
      fillProfileFormFromProxy(parsed);
      alert(zh ? '已从剪贴板填入节点信息' : 'Proxy fields filled from clipboard');
    } catch (error) {
      alert(error?.message || (zh ? '读取剪贴板失败，请检查浏览器权限' : 'Failed to read clipboard'));
    } finally {
      btn.disabled = false;
      btn.innerText = defaultText;
    }
  };

  $('uiLangToggle').onclick = () => {
    state.uiLang = state.uiLang === 'zh' ? 'en' : 'zh';
    chrome.storage.local.set({ uiLang: state.uiLang });
  };

  $('testNodeBtn').onclick = async () => {
    const btn = $('testNodeBtn');
    if (state.selectedProfileId !== state.activeProfileId) {
      renderProfileLatencyMeta(state.selectedProfileId, state.uiLang === 'zh' ? '只能测试当前生效节点；先把顶部“当前节点”切到这个节点再测。' : 'Only the active node can be tested. Switch the active node first.');
      return;
    }
    btn.innerText = state.uiLang === 'zh' ? '测试中...' : 'Testing...';
    btn.disabled = true;
    renderProfileLatencyMeta(state.selectedProfileId, state.uiLang === 'zh' ? '正在测试当前生效节点延迟...' : 'Testing active node latency...');
    try {
      chrome.runtime.sendMessage({ action: 'measureActiveProfileLatency', force: true, reason: 'manual' }, (res) => {
        state.profileLatencyMap = { ...(state.profileLatencyMap || {}) };
        if (res?.profileId && res?.entry) state.profileLatencyMap[res.profileId] = res.entry;
        updateActiveGroup();
        renderProfileLatencyMeta(state.selectedProfileId);
        btn.disabled = false;
        btn.innerText = state.uiLang === 'zh' ? '⚡ 测试连接' : '⚡ Test Connection';
      });
    } catch(e) {
      renderProfileLatencyMeta(state.selectedProfileId, state.uiLang === 'zh' ? '测速失败，请稍后重试。' : 'Latency probe failed. Please retry.');
      btn.disabled = false;
      btn.innerText = state.uiLang === 'zh' ? '⚡ 测试连接' : '⚡ Test Connection';
    }
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
  if ('theme' in changes || 'uiLang' in changes || 'ipTimezone' in changes || 'ipLanguage' in changes || 'timezone' in changes || 'language' in changes || 'miniSubscriptions' in changes || 'miniSubUrl' in changes || 'ipAlertEnabled' in changes || 'ipAlertIntervalMin' in changes || 'ipAlertState' in changes || 'profileLatencyMap' in changes || 'abuseIpDbKey' in changes) load();
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
  if (SYSTEM_THEME_MEDIA) {
    const syncAutoTheme = async () => {
      const prefs = await chrome.storage.local.get(['theme']);
      if ((prefs.theme || 'dark') === 'auto') applyTheme('auto');
    };
    if (typeof SYSTEM_THEME_MEDIA.addEventListener === 'function') SYSTEM_THEME_MEDIA.addEventListener('change', syncAutoTheme);
    else if (typeof SYSTEM_THEME_MEDIA.addListener === 'function') SYSTEM_THEME_MEDIA.addListener(syncAutoTheme);
  }
  $('activeProfile').addEventListener('change', () => {
    if (!MINI_PROXY_ENABLED) return;
    if ($('activeProfile').value === MINI_PROFILE_ID) {
      goMiniSection('当前节点已切到 Atlas Mini，这里就是它的配置入口。');
    }
  });
});
window.addEventListener('hashchange', activateSectionFromHash);
