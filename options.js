const $ = (id) => document.getElementById(id) || document.querySelector(id);
const $$ = (s) => document.querySelectorAll(s);

const TRANSLATIONS = {
  en: {
    appName: "Atlas Proxy", statusSystem: "System", statusDirect: "Direct", statusManual: "Manual", statusAuto: "Auto",
    tabQuick: "Home", labelMode: "Global Mode", labelProfile: "Active Node", labelTz: "Timezone", labelLang: "Language",
    btnSaveApply: "Apply Changes", labelProfileInfo: "Node Info", labelAlias: "Alias", labelProtocol: "Protocol",
    labelHost: "IP / Domain", labelPort: "Port", labelUser: "Username", labelPass: "Password",
    btnPaste: "📋 Paste URL", btnUpdate: "Update Node", btnDelete: "Delete Node", btnNewProfile: "+ Add Profile",
    btnAddRule: "+ Add Rule", labelBypass: "Bypass List", labelGlobalSettings: "General Settings",
    optDefault: "Default", optIpLocation: "Follow IP", btnExport: "Export JSON", btnImport: "Import JSON"
  },
  zh: {
    appName: "Atlas 代理", statusSystem: "系统代理", statusDirect: "直接连接", statusManual: "手动模式", statusAuto: "自动规则",
    tabQuick: "主页", labelMode: "全局模式", labelProfile: "当前节点", labelTz: "地理时区", labelLang: "浏览器语言",
    btnSaveApply: "保存并应用", labelProfileInfo: "节点详细信息", labelAlias: "别名", labelProtocol: "协议",
    labelHost: "IP / 域名", labelPort: "端口", labelUser: "用户名", labelPass: "密码",
    btnPaste: "📋 从剪贴板粘贴", btnUpdate: "更新当前节点", btnDelete: "删除当前节点", btnNewProfile: "+ 新建节点",
    btnAddRule: "+ 添加规则", labelBypass: "绕过列表", labelGlobalSettings: "通用设置",
    optDefault: "默认 (不修改)", optIpLocation: "根据 IP 自动跟随", btnExport: "导出 JSON", btnImport: "导入 JSON"
  }
};

let state = {
  proxyMode: 'system', profiles: [], activeProfileId: '', selectedProfileId: '',
  rules: [], proxyBypass: '', timezone: '', language: '', ipTimezone: '', uiLang: 'zh'
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

function load() {
  chrome.storage.local.get(null, (res) => {
    state.uiLang = res.uiLang || (navigator.language.startsWith('zh') ? 'zh' : 'en');
    state.proxyMode = res.proxyMode || 'system';
    state.profiles = Array.isArray(res.proxyProfiles) ? res.proxyProfiles : [];
    state.activeProfileId = res.activeProfileId || (state.profiles[0] ? state.profiles[0].id : '');
    state.rules = Array.isArray(res.rules) ? res.rules : [];
    state.proxyBypass = res.proxyBypass || '';
    state.timezone = res.timezone || '';
    state.language = res.language || '';
    state.ipTimezone = res.ipTimezone || '';
    state.selectedProfileId = state.activeProfileId || (state.profiles[0] ? state.profiles[0].id : '');

    applyI18n();
    $('proxyMode').value = state.proxyMode;
    $('proxyBypass').value = state.proxyBypass;
    $('timezone').value = state.timezone;
    $('language').value = state.language;
    $('apiBase').value = res.apiBase || '';
    
    updateActiveGroup();
    renderSidebar();
    renderRules();
    loadProfileForm(state.selectedProfileId);
    applyTheme(res.theme || 'dark');
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
  if (!p) return;
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
  state.profiles.forEach((p) => {
    const opt = new Option(p.name || `${p.host}:${p.port}`, p.id);
    sel.add(opt); rSel.add(opt.cloneNode(true));
  });
  sel.value = state.activeProfileId;
  $('activeGroup').style.display = ($('proxyMode').value === 'manual' || $('proxyMode').value === 'auto') ? 'flex' : 'none';
}

function renderRules() {
  const list = $('ruleList'); list.innerHTML = '';
  state.rules.forEach((r, idx) => {
    const p = state.profiles.find((x) => x.id === r.profileId);
    const div = document.createElement('div');
    div.className = 'rule-item';
    div.innerHTML = `
      <span class="rule-pattern">${escapeHtml(r.pattern)}</span>
      <span class="rule-arrow">➜</span>
      <span class="rule-target">${escapeHtml(p ? p.name : 'Unknown')}</span>
      <button class="rule-del" data-idx="${idx}">×</button>
    `;
    div.querySelector('.rule-del').onclick = () => { state.rules.splice(idx, 1); renderRules(); };
    list.appendChild(div);
  });
}

function bind() {
  $$('.nav-menu-item').forEach(btn => {
    btn.onclick = () => {
      const sid = btn.dataset.section;
      $$('.nav-menu-item').forEach(b => b.classList.remove('active'));
      $$('.config-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active'); $(sid).classList.add('active');
    };
  });

  $('proxyMode').onchange = () => {
    state.proxyMode = $('proxyMode').value;
    updateActiveGroup();
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
    alert('Node Updated');
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
    state.rules.push({ pattern, profileId: $('ruleProfile').value, type: 'wildcard' });
    $('rulePattern').value = ''; renderRules();
  };

  $('saveTopBtn').onclick = () => {
    const data = {
      proxyMode: $('proxyMode').value,
      activeProfileId: $('activeProfile').value,
      proxyProfiles: state.profiles,
      rules: state.rules,
      proxyBypass: $('proxyBypass').value,
      timezone: $('timezone').value,
      language: $('language').value,
      apiBase: $('apiBase').value
    };
    chrome.storage.local.set(data, () => alert('Settings Saved!'));
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
    const btn = $('testNodeBtn'); btn.innerText = 'Testing...';
    try {
      const start = Date.now();
      await fetch('https://1.1.1.1/cdn-cgi/trace', { mode: 'no-cors', cache: 'no-store' });
      alert('Connected! Latency: ' + (Date.now() - start) + 'ms');
    } catch(e) { alert('Connection Failed'); }
    btn.innerText = '⚡ Test Connection';
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
  if (changes.theme || changes.uiLang) load();
});

document.addEventListener('DOMContentLoaded', () => { load(); bind(); });
