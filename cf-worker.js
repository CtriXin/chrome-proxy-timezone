const DEFAULT_API_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const ROUTE_FOCUS = {
  '/': 'overview',
  '/index.html': 'overview',
  '/claude/': 'claude',
  '/claude/status.html': 'claude',
  '/claude/claudecode.html': 'claude',
  '/dns/': 'privacy',
  '/webrtc/': 'privacy',
  '/status/': 'network'
};

const EDGE_STATUS_TARGETS = [
  { id: 'claude_web', label: 'Claude Web', url: 'https://claude.ai/login' },
  { id: 'claude_asset', label: 'Claude Asset', url: 'https://claude.ai/favicon.ico' },
  { id: 'anthropic_api', label: 'Anthropic API', url: 'https://api.anthropic.com/' },
  { id: 'cloudflare_trace', label: 'Cloudflare Trace', url: 'https://www.cloudflare.com/cdn-cgi/trace' },
  { id: 'github', label: 'GitHub', url: 'https://github.com/' }
];

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

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: DEFAULT_API_HEADERS });
    }

    const url = new URL(request.url);
    const path = normalizePath(url.pathname);
    const lang = normalizeLang(url.searchParams.get('lang') || detectBrowserLang(request));
    const theme = normalizeTheme(url.searchParams.get('theme'));

    if (path === '/api/risk') {
      return jsonResponse(await buildRiskResponse(request, env));
    }

    if (path === '/api/dns') {
      return jsonResponse(await fetchDnsLeak());
    }

    if (path === '/api/status') {
      return jsonResponse(await buildEdgeStatus());
    }

    if (path === '/api/context') {
      return jsonResponse(buildContextResponse(request));
    }

    if (path === '/api/trace') {
      const target = url.searchParams.get('target') || 'cloudflare';
      return jsonResponse(await buildEdgeTrace(target));
    }

    if (Object.prototype.hasOwnProperty.call(ROUTE_FOCUS, path)) {
      const focus = ROUTE_FOCUS[path];
      const html = generateUltimateDashboard({
        lang,
        theme,
        focus,
        path
      });
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      });
    }

    return new Response('404 Not Found', { status: 404 });
  }
};

function normalizePath(pathname) {
  if (!pathname) return '/';
  if (pathname === '/index.html') return '/index.html';
  if (pathname.startsWith('/api/')) return pathname;
  if (pathname.endsWith('/') || pathname.includes('.')) return pathname;
  return pathname + '/';
}

function normalizeLang(lang) {
  return String(lang || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function normalizeTheme(theme) {
  return theme === 'light' ? 'light' : 'dark';
}

function detectBrowserLang(request) {
  const header = request.headers.get('Accept-Language') || '';
  return header.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...DEFAULT_API_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function buildContextResponse(request) {
  const cf = request.cf || {};
  return {
    clientIp: extractClientIp(request),
    worker: {
      colo: cf.colo || '',
      country: cf.country || '',
      city: cf.city || '',
      region: cf.region || '',
      regionCode: cf.regionCode || '',
      timezone: cf.timezone || '',
      asOrganization: cf.asOrganization || '',
      asn: cf.asn || null,
      tlsVersion: request.cf?.tlsVersion || ''
    }
  };
}

async function buildRiskResponse(request, env) {
  const ip = new URL(request.url).searchParams.get('ip') || extractClientIp(request);
  const geoFields = [
    'status',
    'message',
    'country',
    'countryCode',
    'region',
    'regionName',
    'city',
    'district',
    'zip',
    'lat',
    'lon',
    'timezone',
    'isp',
    'org',
    'as',
    'asname',
    'reverse',
    'proxy',
    'hosting',
    'mobile',
    'query'
  ].join(',');

  const [abuseRes, geoRes] = await Promise.all([
    env.ABUSEIPDB_KEY
      ? fetch('https://api.abuseipdb.com/api/v2/check?maxAgeInDays=90&ipAddress=' + encodeURIComponent(ip), {
          headers: {
            Key: env.ABUSEIPDB_KEY,
            Accept: 'application/json'
          }
        }).then((res) => res.json()).catch(() => ({}))
      : Promise.resolve({}),
    fetch('http://ip-api.com/json/' + encodeURIComponent(ip) + '?fields=' + geoFields)
      .then((res) => res.json())
      .catch(() => ({}))
  ]);

  const abuse = abuseRes.data || {};
  const geo = geoRes || {};
  const abuseScore = Number(abuse.abuseConfidenceScore || 0);
  const usageType = String(abuse.usageType || '').toLowerCase();
  const reverse = geo.reverse || abuse.domain || null;
  const isPrivate = isPrivateIp(ip);
  const isDataCenter = usageType.includes('data center') || usageType.includes('hosting') || !!geo.hosting;
  const heuristicPenalty = (geo.proxy ? 18 : 0) + (geo.hosting ? 16 : 0) + (geo.mobile ? 3 : 0);
  const trustScore = clampScore(100 - Math.max(abuseScore, heuristicPenalty));
  const timezone = geo.timezone || 'UTC';
  const countryCode = geo.countryCode || abuse.countryCode || '';

  return {
    ip,
    trust_score: trustScore,
    country: abuse.countryName || geo.country || 'Unknown',
    countryCode,
    region: geo.regionName || geo.region || '',
    city: abuse.city || geo.city || 'Unknown',
    district: geo.district || '',
    timezone,
    zip: geo.zip || '',
    lat: geo.lat || null,
    lon: geo.lon || null,
    asn: parseAsn(abuse.asn || geo.as),
    asOrganization: abuse.isp || geo.org || geo.isp || 'Unknown',
    isp: geo.isp || abuse.isp || 'Unknown',
    reverseDns: reverse,
    hostPtr: reverse,
    fakeIp: isPrivate,
    chinaDns: null,
    ipLanguage: inferLanguageFromIp(countryCode, timezone),
    is_vpn: isDataCenter || (!!geo.proxy && abuseScore > 0),
    is_proxy: !!geo.proxy || abuseScore > 25,
    is_tor: usageType.includes('tor'),
    is_datacenter: isDataCenter,
    is_relay: usageType.includes('relay'),
    is_anonymous: isDataCenter || !!geo.proxy,
    is_attacker: abuseScore > 25,
    is_abuser: abuseScore > 0,
    is_threats: abuseScore > 50,
    is_bogon: isPrivate || !countryCode,
    is_spam: abuseScore > 10,
    is_batch: usageType.includes('automation') || usageType.includes('crawler'),
    is_scanner: usageType.includes('scanner') || abuseScore > 40,
    is_botnet: usageType.includes('botnet') || abuseScore > 60,
    raw: {
      abuseScore,
      usageType: abuse.usageType || '',
      reports: abuse.totalReports || 0,
      lastReportedAt: abuse.lastReportedAt || null,
      mobile: !!geo.mobile,
      proxy: !!geo.proxy,
      hosting: !!geo.hosting
    }
  };
}

async function fetchDnsLeak() {
  try {
    const res = await fetch('https://edns.ip-api.com/json');
    return await res.json();
  } catch (error) {
    return { error: error.message };
  }
}

async function buildEdgeStatus() {
  const results = await Promise.all(EDGE_STATUS_TARGETS.map(async (target) => {
    const startedAt = Date.now();
    try {
      const res = await fetch(target.url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'AtlasProxyWorker/4.0'
        }
      });
      return {
        id: target.id,
        label: target.label,
        ok: true,
        reachable: true,
        status: res.status,
        finalUrl: res.url,
        latency: Date.now() - startedAt
      };
    } catch (error) {
      return {
        id: target.id,
        label: target.label,
        ok: false,
        reachable: false,
        error: error.message,
        latency: Date.now() - startedAt
      };
    }
  }));

  return { results };
}

async function buildEdgeTrace(targetKey) {
  const targetMap = {
    cloudflare: 'https://www.cloudflare.com/cdn-cgi/trace',
    claude: 'https://claude.ai/cdn-cgi/trace'
  };
  const url = targetMap[targetKey] || targetMap.cloudflare;
  try {
    const startedAt = Date.now();
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AtlasProxyWorker/4.0'
      }
    });
    const text = await res.text();
    return {
      ok: true,
      latency: Date.now() - startedAt,
      trace: parseTrace(text),
      raw: text
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      trace: {}
    };
  }
}

function inferLanguageFromIp(countryCode, timezone) {
  if (countryCode && COUNTRY_LANGUAGE_MAP[countryCode]) return COUNTRY_LANGUAGE_MAP[countryCode];
  if (timezone && TIMEZONE_LANGUAGE_MAP[timezone]) return TIMEZONE_LANGUAGE_MAP[timezone];
  return 'en-US';
}

function extractClientIp(request) {
  const direct = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '';
  if (direct) return direct;
  const forwarded = request.headers.get('x-forwarded-for') || '';
  return forwarded.split(',')[0].trim();
}

function parseAsn(asValue) {
  if (!asValue) return 0;
  const match = String(asValue).match(/AS(\d+)/i);
  return match ? Number(match[1]) : Number(asValue) || 0;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isPrivateIp(ip) {
  return /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.|::1|fc|fd)/i.test(String(ip || ''));
}

function parseTrace(text) {
  const trace = {};
  String(text || '').split('\n').forEach((line) => {
    const index = line.indexOf('=');
    if (index > 0) {
      trace[line.slice(0, index)] = line.slice(index + 1).trim();
    }
  });
  return trace;
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function generateUltimateDashboard(boot) {
  const translations = {
    zh: {
      brand: 'ATLAS PROXY',
      title: 'Atlas 网络诊断中心',
      subtitle: '一个页面看完出口 IP、Claude 可达性、DNS、WebRTC、设备指纹与修复建议。',
      safeProbeNote: '所有 Claude 探测都只访问公开页面或静态资源，不发送 prompt、cookie 或会话数据。',
      themeLight: '浅色',
      themeDark: '深色',
      switchLang: 'English',
      refresh: '重新扫描',
      export: '导出 JSON',
      navOverview: '总览',
      navClaude: 'Claude',
      navPrivacy: 'DNS / WebRTC',
      navNetwork: '状态',
      heroLabel: '当前出口 IP',
      heroScanning: '正在检测...',
      heroStable: '与上次快照一致',
      heroChanged: '与上次快照不同',
      heroFirst: '首次检测，已建立快照',
      overviewTitle: '出口画像',
      riskTitle: '风险与身份',
      claudeTitle: 'Claude 安全可达性',
      networkTitle: '网络状态',
      privacyTitle: 'DNS / WebRTC',
      deviceTitle: '设备与指纹',
      recommendTitle: '修复建议',
      statusReachable: '可达',
      statusFailed: '失败',
      statusProtected: '未发现明显泄露',
      statusLeak: '发现风险',
      statusWarn: '需关注',
      statusUnsupported: '不支持',
      statusSame: '一致',
      statusMismatch: '不一致',
      statusUnknown: '未知',
      probeFailed: '检测失败',
      browserRoute: '浏览器路由',
      edgeRoute: 'Worker 边缘',
      exitIp: '出口 IP',
      country: '国家/地区',
      city: '城市',
      timezone: '时区',
      language: '建议语言',
      snapshot: '快照状态',
      lastSeen: '上次记录',
      trustScore: 'Trust Score',
      isp: 'ISP / Org',
      asn: 'ASN',
      reverseDns: 'Reverse DNS',
      riskTags: '安全标签',
      abuseHint: 'HTTP 403/404 代表服务在线但拒绝未授权访问，不等于被封锁。',
      claudeWeb: 'Claude Web',
      claudeAsset: 'Claude 静态资源',
      anthropicApi: 'Anthropic API',
      cloudflareTrace: 'Cloudflare',
      github: 'GitHub',
      edgeStatus: '边缘返回',
      browserStatus: '浏览器探活',
      dnsResolver: 'DNS Resolver',
      dnsGeo: 'DNS 地理',
      dnsStatus: 'DNS 状态',
      webrtcPrivate: 'WebRTC 私网 IP',
      webrtcPublic: 'WebRTC 公网 IP',
      webrtcStatus: 'WebRTC 状态',
      browserTimezone: '页面时区',
      browserLanguage: '页面语言',
      languages: '语言列表',
      platform: 'Platform',
      ua: 'User-Agent',
      hardware: 'CPU / Memory',
      screen: '屏幕',
      touch: '触控',
      connection: 'Network Info',
      webgl: 'WebGL',
      canvas: 'Canvas Hash',
      workerColo: 'Worker 节点',
      workerRegion: 'Worker 区域',
      tls: 'TLS',
      browserSummary: '浏览器总结',
      updatedAt: '更新时间',
      detected: '已检测到',
      notDetected: '未检测到',
      dnsClean: 'Resolver 与出口地区相近，未发现明显 DNS 漂移。',
      dnsWarn: 'Resolver 地理或运营商异常，建议切换节点后复测。',
      webrtcClean: '未暴露异常 WebRTC 地址。',
      webrtcWarn: 'WebRTC 暴露了本地或额外地址，建议继续收紧策略。',
      claudeClean: 'Claude 公共入口可达，未发现明显路由阻断。',
      claudeWarn: 'Claude 公共入口有失败项，建议换节点或检查代理鉴权。',
      snapDrift: '出口 IP 已变化，建议重新校准 timezone / language。',
      snapStable: '出口 IP 与上次一致，可继续沿用当前配置。',
      safeProbe: '安全探测说明',
      emptyRecommendation: '当前没有明显异常，可以继续使用当前节点。',
      fromPrevious: '来自本机上次打开此页面的快照',
      secondsAgo: '秒前',
      minutesAgo: '分钟前',
      hoursAgo: '小时前',
      justNow: '刚刚',
      yes: '是',
      no: '否'
    },
    en: {
      brand: 'ATLAS PROXY',
      title: 'Atlas Network Diagnostics',
      subtitle: 'See exit IP, Claude reachability, DNS, WebRTC, browser fingerprint, and remediation in one page.',
      safeProbeNote: 'All Claude probes only hit public pages or static assets. No prompt, cookie, or session payload is sent.',
      themeLight: 'Light',
      themeDark: 'Dark',
      switchLang: '中文',
      refresh: 'Rescan',
      export: 'Export JSON',
      navOverview: 'Overview',
      navClaude: 'Claude',
      navPrivacy: 'DNS / WebRTC',
      navNetwork: 'Status',
      heroLabel: 'Current Exit IP',
      heroScanning: 'Scanning...',
      heroStable: 'Same as last snapshot',
      heroChanged: 'Different from last snapshot',
      heroFirst: 'First scan captured a snapshot',
      overviewTitle: 'Exit Identity',
      riskTitle: 'Risk & Identity',
      claudeTitle: 'Claude Safe Reachability',
      networkTitle: 'Network Status',
      privacyTitle: 'DNS / WebRTC',
      deviceTitle: 'Device & Fingerprint',
      recommendTitle: 'Recommendations',
      statusReachable: 'Reachable',
      statusFailed: 'Failed',
      statusProtected: 'No obvious leak',
      statusLeak: 'Risk detected',
      statusWarn: 'Needs review',
      statusUnsupported: 'Unsupported',
      statusSame: 'Same',
      statusMismatch: 'Mismatch',
      statusUnknown: 'Unknown',
      probeFailed: 'Probe failed',
      browserRoute: 'Browser Route',
      edgeRoute: 'Worker Edge',
      exitIp: 'Exit IP',
      country: 'Country',
      city: 'City',
      timezone: 'Timezone',
      language: 'Suggested Lang',
      snapshot: 'Snapshot',
      lastSeen: 'Last Seen',
      trustScore: 'Trust Score',
      isp: 'ISP / Org',
      asn: 'ASN',
      reverseDns: 'Reverse DNS',
      riskTags: 'Security Tags',
      abuseHint: 'HTTP 403/404 means the service is online but denies unauthenticated access. It does not mean blocked.',
      claudeWeb: 'Claude Web',
      claudeAsset: 'Claude Asset',
      anthropicApi: 'Anthropic API',
      cloudflareTrace: 'Cloudflare',
      github: 'GitHub',
      edgeStatus: 'Edge HTTP',
      browserStatus: 'Browser Reachability',
      dnsResolver: 'DNS Resolver',
      dnsGeo: 'DNS Geo',
      dnsStatus: 'DNS Status',
      webrtcPrivate: 'WebRTC Private IPs',
      webrtcPublic: 'WebRTC Public IPs',
      webrtcStatus: 'WebRTC Status',
      browserTimezone: 'Page Timezone',
      browserLanguage: 'Page Language',
      languages: 'Languages',
      platform: 'Platform',
      ua: 'User-Agent',
      hardware: 'CPU / Memory',
      screen: 'Screen',
      touch: 'Touch',
      connection: 'Network Info',
      webgl: 'WebGL',
      canvas: 'Canvas Hash',
      workerColo: 'Worker Colo',
      workerRegion: 'Worker Region',
      tls: 'TLS',
      browserSummary: 'Browser Summary',
      updatedAt: 'Updated At',
      detected: 'Detected',
      notDetected: 'Not Detected',
      dnsClean: 'Resolver geo looks close to exit geo. No obvious DNS drift.',
      dnsWarn: 'Resolver geo or provider looks suspicious. Re-test after switching node.',
      webrtcClean: 'No unusual WebRTC addresses were exposed.',
      webrtcWarn: 'WebRTC exposed local or extra addresses. Tighten the policy.',
      claudeClean: 'Claude public entry points are reachable with no obvious route block.',
      claudeWarn: 'Some Claude probes failed. Try another node or verify proxy auth.',
      snapDrift: 'Exit IP changed. Re-align timezone and language if needed.',
      snapStable: 'Exit IP is unchanged. Current spoofing profile can stay.',
      safeProbe: 'Safe Probe Policy',
      emptyRecommendation: 'No major issue detected. Current node looks usable.',
      fromPrevious: 'Snapshot from the last time this browser opened this page',
      secondsAgo: 's ago',
      minutesAgo: 'm ago',
      hoursAgo: 'h ago',
      justNow: 'just now',
      yes: 'Yes',
      no: 'No'
    }
  };

  const bootJson = JSON.stringify(boot);
  const translationsJson = JSON.stringify(translations);

  return '<!DOCTYPE html>' +
    '<html lang="' + escapeHtml(boot.lang) + '">' +
    '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Atlas Network Diagnostics</title>' +
      '<style>' + generateStyles() + '</style>' +
    '</head>' +
    '<body data-theme="' + escapeHtml(boot.theme) + '">' +
      '<div class="noise"></div>' +
      '<div class="shell">' +
        '<header class="topbar panel">' +
          '<div class="topbar-copy">' +
            '<div id="brand" class="eyebrow"></div>' +
            '<h1 id="pageTitle"></h1>' +
            '<p id="pageSubtitle" class="subtitle"></p>' +
          '</div>' +
          '<div class="toolbar">' +
            '<button id="langBtn" class="tool-btn"></button>' +
            '<button id="themeBtn" class="tool-btn"></button>' +
            '<button id="refreshBtn" class="tool-btn strong"></button>' +
            '<button id="exportBtn" class="tool-btn wide"></button>' +
          '</div>' +
        '</header>' +
        '<nav class="route-nav panel">' +
          '<a id="nav-overview" class="route-link" href="/">Overview</a>' +
          '<a id="nav-claude" class="route-link" href="/claude/">Claude</a>' +
          '<a id="nav-privacy" class="route-link" href="/dns/">DNS / WebRTC</a>' +
          '<a id="nav-network" class="route-link" href="/status/">Status</a>' +
        '</nav>' +
        '<main class="content">' +
          '<section id="section-overview" class="hero panel">' +
            '<div>' +
              '<div id="heroLabel" class="hero-label"></div>' +
              '<div id="heroIp" class="hero-ip">--</div>' +
              '<div id="heroGeo" class="hero-geo">--</div>' +
            '</div>' +
            '<div class="hero-side">' +
              '<div id="heroBadge" class="badge badge-soft">--</div>' +
              '<div id="heroMeta" class="hero-meta">--</div>' +
              '<p id="heroNote" class="hero-note"></p>' +
            '</div>' +
          '</section>' +
          '<section class="grid two">' +
            '<article class="panel card" id="card-overview">' +
              '<div class="card-head"><h2 id="overviewTitle"></h2></div>' +
              '<div id="overviewRows" class="rows"></div>' +
            '</article>' +
            '<article class="panel card" id="card-risk">' +
              '<div class="card-head"><h2 id="riskTitle"></h2></div>' +
              '<div class="score-wrap">' +
                '<div class="score-ring"><svg viewBox="0 0 120 120"><circle class="score-bg" cx="60" cy="60" r="52"></circle><circle id="scoreCircle" class="score-fg" cx="60" cy="60" r="52"></circle></svg><div class="score-center"><span id="scoreValue">--</span><small>/100</small></div></div>' +
                '<div id="riskRows" class="rows compact"></div>' +
              '</div>' +
              '<div class="subhead" id="riskTagsTitle"></div>' +
              '<div id="riskBadges" class="badge-cloud"></div>' +
            '</article>' +
          '</section>' +
          '<section class="grid two">' +
            '<article class="panel card" id="section-claude">' +
              '<div class="card-head"><h2 id="claudeTitle"></h2></div>' +
              '<div id="claudeRows" class="rows"></div>' +
              '<div class="subhead" id="safeProbeTitle"></div>' +
              '<p id="safeProbeNote" class="note"></p>' +
              '<p id="abuseHint" class="note emphasize"></p>' +
            '</article>' +
            '<article class="panel card" id="section-network">' +
              '<div class="card-head"><h2 id="networkTitle"></h2></div>' +
              '<div id="networkRows" class="rows"></div>' +
            '</article>' +
          '</section>' +
          '<section class="grid two">' +
            '<article class="panel card" id="section-privacy">' +
              '<div class="card-head"><h2 id="privacyTitle"></h2></div>' +
              '<div id="privacyRows" class="rows"></div>' +
            '</article>' +
            '<article class="panel card" id="section-device">' +
              '<div class="card-head"><h2 id="deviceTitle"></h2></div>' +
              '<div id="deviceRows" class="rows"></div>' +
            '</article>' +
          '</section>' +
          '<section class="grid one">' +
            '<article class="panel card" id="section-recommend">' +
              '<div class="card-head"><h2 id="recommendTitle"></h2></div>' +
              '<div id="recommendRows" class="checklist"></div>' +
            '</article>' +
          '</section>' +
        '</main>' +
      '</div>' +
      '<script>window.__ATLAS_BOOT__=' + bootJson + ';window.__ATLAS_I18N__=' + translationsJson + ';<\/script>' +
      '<script>' + generateAppScript() + '<\/script>' +
    '</body>' +
    '</html>';
}

function generateStyles() {
  return `
:root {
  --bg: #07131a;
  --bg-elevated: rgba(15, 32, 39, 0.9);
  --panel: rgba(10, 24, 29, 0.82);
  --panel-strong: rgba(10, 29, 35, 0.92);
  --text: #e7f9f6;
  --muted: #9eb9b5;
  --line: rgba(120, 190, 176, 0.16);
  --primary: #2dd4bf;
  --primary-2: #f59e0b;
  --success: #10b981;
  --warn: #f59e0b;
  --danger: #ef4444;
  --shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
}
body[data-theme="light"] {
  --bg: #f3f7f5;
  --bg-elevated: rgba(255, 255, 255, 0.9);
  --panel: rgba(255, 255, 255, 0.9);
  --panel-strong: rgba(255, 255, 255, 0.98);
  --text: #102126;
  --muted: #587176;
  --line: rgba(16, 33, 38, 0.1);
  --primary: #0f766e;
  --primary-2: #ea580c;
  --shadow: 0 24px 64px rgba(15, 23, 42, 0.08);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  min-height: 100vh;
  color: var(--text);
  font-family: "Space Grotesk", "IBM Plex Sans", "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(45, 212, 191, 0.16), transparent 34%),
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.14), transparent 28%),
    linear-gradient(160deg, rgba(255,255,255,0.02), rgba(255,255,255,0)),
    var(--bg);
}
.noise {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.06;
  background-image:
    linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(circle at center, black 40%, transparent 92%);
}
.shell { max-width: 1320px; margin: 0 auto; padding: 28px 20px 56px; position: relative; z-index: 1; }
.panel {
  background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)) , var(--panel);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}
.topbar {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  border-radius: 28px;
  padding: 24px;
}
.eyebrow {
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--primary);
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 10px;
}
h1 {
  margin: 0;
  font-size: clamp(34px, 6vw, 56px);
  line-height: 0.95;
  letter-spacing: -0.05em;
}
.subtitle {
  margin: 12px 0 0;
  max-width: 760px;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.7;
}
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; }
.tool-btn {
  appearance: none;
  border: 1px solid var(--line);
  background: var(--bg-elevated);
  color: var(--text);
  height: 48px;
  min-width: 54px;
  padding: 0 16px;
  border-radius: 16px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}
.tool-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(45, 212, 191, 0.42);
}
.tool-btn.strong {
  background: linear-gradient(135deg, var(--primary), #14b8a6);
  color: #032522;
}
.tool-btn.wide { min-width: 128px; }
.route-nav {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  padding: 10px;
  border-radius: 20px;
  overflow-x: auto;
}
.route-link {
  color: var(--muted);
  text-decoration: none;
  padding: 12px 16px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}
.route-link:hover { color: var(--text); transform: translateY(-1px); }
.route-link.active {
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.18), rgba(245, 158, 11, 0.14));
  color: var(--text);
}
.content { display: grid; gap: 18px; margin-top: 18px; }
.hero {
  display: flex;
  justify-content: space-between;
  gap: 28px;
  align-items: center;
  padding: 26px;
  border-radius: 28px;
}
.hero-label {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 800;
}
.hero-ip {
  margin-top: 12px;
  font-size: clamp(38px, 7vw, 72px);
  font-weight: 900;
  letter-spacing: -0.07em;
  line-height: 0.95;
  word-break: break-word;
  color: var(--primary);
  font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
}
.hero-geo {
  margin-top: 10px;
  color: var(--muted);
  font-size: 18px;
}
.hero-side { min-width: 280px; display: grid; gap: 10px; justify-items: start; }
.hero-meta, .hero-note { color: var(--muted); line-height: 1.6; }
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 9px 14px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.badge-soft { background: rgba(255,255,255,0.06); color: var(--text); }
.badge-success { background: rgba(16,185,129,0.14); color: var(--success); }
.badge-warn { background: rgba(245,158,11,0.16); color: var(--warn); }
.badge-danger { background: rgba(239,68,68,0.16); color: var(--danger); }
.grid { display: grid; gap: 18px; }
.grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid.one { grid-template-columns: 1fr; }
.card { border-radius: 26px; padding: 22px; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.card-head h2 { margin: 0; font-size: 22px; letter-spacing: -0.04em; }
.rows { display: grid; gap: 10px; }
.rows.compact { margin-top: 8px; }
.row {
  display: grid;
  grid-template-columns: minmax(0, 180px) minmax(0, 1fr);
  gap: 18px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
}
.row:last-child { border-bottom: 0; padding-bottom: 0; }
.label { color: var(--muted); font-size: 13px; }
.value {
  text-align: right;
  font-weight: 700;
  word-break: break-word;
  font-size: 14px;
}
.value.success { color: var(--success); }
.value.warn { color: var(--warn); }
.value.danger { color: var(--danger); }
.value.mono { font-family: "IBM Plex Mono", "SFMono-Regular", monospace; }
.score-wrap {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 18px;
  align-items: center;
}
.score-ring {
  position: relative;
  width: 144px;
  height: 144px;
  margin: 0 auto;
}
.score-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.score-bg,
.score-fg {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
}
.score-bg { stroke: rgba(255,255,255,0.08); }
.score-fg {
  stroke: var(--primary);
  stroke-dasharray: 0 327;
  stroke-dashoffset: 0;
}
.score-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.score-center span { font-size: 42px; font-weight: 900; letter-spacing: -0.06em; }
.score-center small { color: var(--muted); }
.subhead {
  margin-top: 18px;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}
.badge-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
.badge-cloud .badge { font-size: 11px; }
.note {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--muted);
}
.note.emphasize {
  color: var(--primary-2);
}
.checklist {
  display: grid;
  gap: 10px;
}
.check-item {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.03);
  line-height: 1.7;
  font-size: 14px;
}
.check-item::before {
  content: "•";
  color: var(--primary-2);
  font-weight: 900;
  margin-right: 10px;
}
.focus-ring {
  box-shadow: 0 0 0 1px rgba(45, 212, 191, 0.44), var(--shadow);
}
@media (max-width: 980px) {
  .topbar, .hero { flex-direction: column; align-items: stretch; }
  .toolbar { justify-content: flex-start; }
  .grid.two, .score-wrap { grid-template-columns: 1fr; }
  .hero-side { min-width: 0; }
}
@media (max-width: 640px) {
  .shell { padding: 18px 14px 40px; }
  .topbar, .hero, .card { border-radius: 22px; }
  .row { grid-template-columns: 1fr; gap: 8px; }
  .value { text-align: left; }
  .tool-btn.wide { min-width: 0; }
}
`;
}

function generateAppScript() {
  return `
(function () {
  var boot = window.__ATLAS_BOOT__ || {};
  var translations = window.__ATLAS_I18N__ || {};
  var STORAGE_KEYS = {
    lang: 'atlas.worker.lang',
    theme: 'atlas.worker.theme',
    snapshot: 'atlas.worker.snapshot',
    payload: 'atlas.worker.payload'
  };
  var state = {
    lang: boot.lang || 'en',
    theme: boot.theme || 'dark',
    focus: boot.focus || 'overview',
    payload: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function t(key) {
    var pack = translations[state.lang] || translations.en || {};
    return pack[key] || key;
  }

  function safe(value) {
    return String(value == null ? '--' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function row(label, value, cls) {
    return '<div class="row"><div class="label">' + safe(label) + '</div><div class="value ' + (cls || '') + '">' + safe(value) + '</div></div>';
  }

  function badge(text, tone) {
    return '<span class="badge badge-' + tone + '">' + safe(text) + '</span>';
  }

  function getStored(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function setStored(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {}
  }

  function withQuery(path) {
    var url = new URL(path, window.location.origin);
    url.searchParams.set('lang', state.lang);
    url.searchParams.set('theme', state.theme);
    return url.pathname + url.search;
  }

  function applyTheme() {
    document.body.setAttribute('data-theme', state.theme);
    $('themeBtn').textContent = state.theme === 'light' ? t('themeDark') : t('themeLight');
  }

  function applyCopy() {
    $('brand').textContent = t('brand');
    $('pageTitle').textContent = t('title');
    $('pageSubtitle').textContent = t('subtitle');
    $('langBtn').textContent = t('switchLang');
    $('refreshBtn').textContent = t('refresh');
    $('exportBtn').textContent = t('export');
    $('heroLabel').textContent = t('heroLabel');
    $('overviewTitle').textContent = t('overviewTitle');
    $('riskTitle').textContent = t('riskTitle');
    $('riskTagsTitle').textContent = t('riskTags');
    $('claudeTitle').textContent = t('claudeTitle');
    $('networkTitle').textContent = t('networkTitle');
    $('privacyTitle').textContent = t('privacyTitle');
    $('deviceTitle').textContent = t('deviceTitle');
    $('recommendTitle').textContent = t('recommendTitle');
    $('safeProbeTitle').textContent = t('safeProbe');
    $('safeProbeNote').textContent = t('safeProbeNote');
    $('abuseHint').textContent = t('abuseHint');

    $('nav-overview').textContent = t('navOverview');
    $('nav-claude').textContent = t('navClaude');
    $('nav-privacy').textContent = t('navPrivacy');
    $('nav-network').textContent = t('navNetwork');

    $('nav-overview').href = withQuery('/');
    $('nav-claude').href = withQuery('/claude/');
    $('nav-privacy').href = withQuery('/dns/');
    $('nav-network').href = withQuery('/status/');

    Array.prototype.forEach.call(document.querySelectorAll('.route-link'), function (link) {
      link.classList.remove('active');
    });
    var active = $('nav-' + state.focus);
    if (active) active.classList.add('active');
  }

  function parseJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function formatAgo(timestamp) {
    if (!timestamp) return '--';
    var diff = Math.max(0, Date.now() - timestamp);
    if (diff < 5000) return t('justNow');
    if (diff < 60000) return Math.max(1, Math.round(diff / 1000)) + ' ' + t('secondsAgo');
    if (diff < 3600000) return Math.max(1, Math.round(diff / 60000)) + ' ' + t('minutesAgo');
    return Math.round(diff / 3600000) + ' ' + t('hoursAgo');
  }

  function scoreTone(score) {
    if (score >= 85) return 'success';
    if (score >= 60) return 'warn';
    return 'danger';
  }

  function computeScoreCircle(score) {
    var circumference = 2 * Math.PI * 52;
    return (circumference * Math.max(0, Math.min(100, score)) / 100).toFixed(2) + ' ' + circumference.toFixed(2);
  }

  function parseDnsGeo(geo) {
    if (!geo) return { country: '', provider: '' };
    var parts = String(geo).split(' - ');
    return {
      country: (parts.shift() || '').trim(),
      provider: parts.join(' - ').trim()
    };
  }

  function evaluateDns(dnsData, riskData) {
    if (!dnsData || dnsData.error) {
      return { text: t('probeFailed'), cls: 'danger', safe: false };
    }
    var dnsGeo = dnsData.dns && dnsData.dns.geo ? dnsData.dns.geo : dnsData.geo || '';
    var dnsIp = dnsData.dns && dnsData.dns.ip ? dnsData.dns.ip : dnsData.ip || '--';
    var exitCountry = riskData.country || '';
    var parsed = parseDnsGeo(dnsGeo);
    var provider = (parsed.provider || '').toLowerCase();
    var privateDns = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/.test(String(dnsIp));
    var sameCountry = !!exitCountry && parsed.country === exitCountry;
    var trustedProvider = /cloudflare|google|quad9|nextdns|adguard/.test(provider);
    if (privateDns || (!sameCountry && !trustedProvider && dnsGeo)) {
      return { text: t('statusWarn') + ' (' + (dnsGeo || dnsIp) + ')', cls: 'warn', safe: false };
    }
    if (!dnsGeo) {
      return { text: t('probeFailed'), cls: 'danger', safe: false };
    }
    return { text: t('statusProtected') + ' (' + dnsGeo + ')', cls: 'success', safe: true };
  }

  function hashString(input) {
    var hash = 2166136261;
    for (var i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return ('0000000' + (hash >>> 0).toString(16)).slice(-8);
  }

  function computeCanvasHash() {
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 96;
      var ctx = canvas.getContext('2d');
      if (!ctx) return t('statusUnsupported');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#2dd4bf';
      ctx.font = '20px Space Grotesk, sans-serif';
      ctx.fillText('Atlas Network Diagnostics', 12, 34);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(navigator.userAgent.slice(0, 32), 12, 64);
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(280, 40, 20, 0, Math.PI * 2);
      ctx.stroke();
      return hashString(canvas.toDataURL());
    } catch (error) {
      return t('probeFailed');
    }
  }

  function collectWebGl() {
    try {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return t('statusUnsupported');
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (!ext) return t('statusUnsupported');
      var vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
      var renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      return vendor + ' / ' + renderer;
    } catch (error) {
      return t('probeFailed');
    }
  }

  function collectDeviceSummary() {
    var nav = navigator || {};
    var uaData = nav.userAgentData;
    var brands = uaData && Array.isArray(uaData.brands) ? uaData.brands.map(function (item) {
      return item.brand + ' ' + item.version;
    }).join(', ') : '';
    var conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    var connection = conn ? [conn.effectiveType, conn.rtt ? conn.rtt + 'ms' : '', conn.downlink ? conn.downlink + 'Mb/s' : ''].filter(Boolean).join(' / ') : t('statusUnsupported');
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '--',
      language: nav.language || '--',
      languages: Array.isArray(nav.languages) ? nav.languages.join(', ') : '--',
      platform: nav.platform || '--',
      userAgent: brands ? brands + ' | ' + (nav.userAgent || '--') : (nav.userAgent || '--'),
      hardware: [nav.hardwareConcurrency ? nav.hardwareConcurrency + ' cores' : '', nav.deviceMemory ? nav.deviceMemory + ' GB' : ''].filter(Boolean).join(' / ') || '--',
      screen: window.screen ? [window.screen.width + 'x' + window.screen.height, window.devicePixelRatio ? 'DPR ' + window.devicePixelRatio : ''].filter(Boolean).join(' / ') : '--',
      touch: nav.maxTouchPoints > 0 ? t('yes') + ' (' + nav.maxTouchPoints + ')' : t('no'),
      connection: connection,
      canvas: computeCanvasHash(),
      webgl: collectWebGl()
    };
  }

  function browserProbe(url) {
    var startedAt = Date.now();
    return fetch(url, {
      mode: 'no-cors',
      credentials: 'omit',
      cache: 'no-store'
    }).then(function () {
      return { ok: true, latency: Date.now() - startedAt };
    }).catch(function (error) {
      return { ok: false, error: error && error.message ? error.message : 'failed', latency: Date.now() - startedAt };
    });
  }

  function collectBrowserStatus() {
    return Promise.all([
      browserProbe('https://claude.ai/login'),
      browserProbe('https://claude.ai/favicon.ico'),
      browserProbe('https://api.anthropic.com/'),
      browserProbe('https://www.cloudflare.com/cdn-cgi/trace'),
      browserProbe('https://github.com/')
    ]).then(function (results) {
      return {
        claude_web: results[0],
        claude_asset: results[1],
        anthropic_api: results[2],
        cloudflare_trace: results[3],
        github: results[4]
      };
    });
  }

  function collectWebRtc() {
    return new Promise(function (resolve) {
      var RTCPeer = window.RTCPeerConnection || window.webkitRTCPeerConnection;
      if (!RTCPeer) {
        resolve({ supported: false, privateIps: [], publicIps: [] });
        return;
      }
      var pc = new RTCPeer({
        iceServers: [
          { urls: 'stun:stun.cloudflare.com:3478' },
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      var addresses = new Set();
      var done = false;
      function isPrivate(ip) {
        return /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.|::1|fc|fd)/i.test(ip);
      }
      function finish() {
        if (done) return;
        done = true;
        try { pc.close(); } catch (error) {}
        var all = Array.from(addresses);
        resolve({
          supported: true,
          privateIps: all.filter(isPrivate),
          publicIps: all.filter(function (ip) { return !isPrivate(ip); })
        });
      }
      var timer = setTimeout(finish, 2200);
      pc.onicecandidate = function (event) {
        var candidate = event.candidate && event.candidate.candidate;
        if (!candidate) {
          clearTimeout(timer);
          finish();
          return;
        }
        var parts = candidate.trim().split(/\s+/);
        var ip = parts[4];
        if (ip && (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip) || /^[a-f0-9:]+$/i.test(ip))) {
          addresses.add(ip);
        }
      };
      pc.createDataChannel('atlas');
      pc.createOffer().then(function (offer) {
        return pc.setLocalDescription(offer);
      }).catch(function () {
        clearTimeout(timer);
        resolve({ supported: false, privateIps: [], publicIps: [] });
      });
    });
  }

  function renderHero(risk, snapshot) {
    $('heroIp').textContent = risk.ip || '--';
    $('heroGeo').textContent = [risk.country, risk.city, risk.timezone].filter(Boolean).join(' / ') || '--';
    var stable = snapshot.previousIp && snapshot.previousIp === risk.ip;
    var changed = snapshot.previousIp && snapshot.previousIp !== risk.ip;
    $('heroBadge').className = 'badge ' + (changed ? 'badge-warn' : 'badge-success');
    $('heroBadge').textContent = changed ? t('heroChanged') : (snapshot.previousIp ? t('heroStable') : t('heroFirst'));
    $('heroMeta').textContent = snapshot.previousIp ? t('fromPrevious') + ' · ' + formatAgo(snapshot.previousAt) : t('updatedAt') + ' · ' + formatAgo(Date.now());
    $('heroNote').textContent = changed ? t('snapDrift') : t('snapStable');
  }

  function renderOverview(context, risk, snapshot) {
    $('overviewRows').innerHTML = [
      row(t('exitIp'), risk.ip || '--', 'mono'),
      row(t('country'), risk.country || '--'),
      row(t('city'), risk.city || '--'),
      row(t('timezone'), risk.timezone || '--'),
      row(t('language'), risk.ipLanguage || '--'),
      row(t('snapshot'), snapshot.previousIp ? (snapshot.previousIp === risk.ip ? t('statusSame') : t('statusMismatch')) : t('statusUnknown'), snapshot.previousIp ? (snapshot.previousIp === risk.ip ? 'success' : 'warn') : ''),
      row(t('lastSeen'), snapshot.previousAt ? formatAgo(snapshot.previousAt) : '--'),
      row(t('workerColo'), context.worker && context.worker.colo ? context.worker.colo : '--'),
      row(t('workerRegion'), [context.worker && context.worker.country, context.worker && context.worker.city].filter(Boolean).join(' / ') || '--'),
      row(t('tls'), context.worker && context.worker.tlsVersion ? context.worker.tlsVersion : '--')
    ].join('');
  }

  function renderRisk(risk) {
    var score = Number(risk.trust_score || 0);
    $('scoreValue').textContent = score;
    $('scoreCircle').style.strokeDasharray = computeScoreCircle(score);
    $('riskRows').innerHTML = [
      row(t('trustScore'), score + '/100', scoreTone(score) + ' mono'),
      row(t('isp'), risk.asOrganization || '--'),
      row(t('asn'), risk.asn ? 'AS' + risk.asn : '--', 'mono'),
      row(t('reverseDns'), risk.reverseDns || '--'),
      row('Hosting', risk.raw && risk.raw.hosting ? t('yes') : t('no')),
      row('Proxy', risk.raw && risk.raw.proxy ? t('yes') : t('no'))
    ].join('');

    var tags = [
      ['VPN', risk.is_vpn],
      ['Proxy', risk.is_proxy],
      ['TOR', risk.is_tor],
      ['Datacenter', risk.is_datacenter],
      ['Anonymous', risk.is_anonymous],
      ['Threats', risk.is_threats],
      ['Scanner', risk.is_scanner],
      ['Botnet', risk.is_botnet],
      ['Bogon', risk.is_bogon]
    ];
    $('riskBadges').innerHTML = tags.map(function (item) {
      return badge(item[0] + ': ' + (item[1] ? t('yes') : t('no')), item[1] ? 'warn' : 'success');
    }).join('');
  }

  function renderClaude(browserStatus, edgeStatus) {
    var edgeMap = {};
    (edgeStatus.results || []).forEach(function (item) {
      edgeMap[item.id] = item;
    });
    var browserRows = [
      [t('claudeWeb'), browserStatus.claude_web],
      [t('claudeAsset'), browserStatus.claude_asset],
      [t('anthropicApi'), browserStatus.anthropic_api]
    ].map(function (entry) {
      var result = entry[1];
      return row(t('browserRoute') + ' · ' + entry[0], result.ok ? (t('statusReachable') + ' · ' + result.latency + 'ms') : t('statusFailed'), result.ok ? 'success mono' : 'danger');
    });

    var edgeRows = [
      [t('claudeWeb'), edgeMap.claude_web],
      [t('claudeAsset'), edgeMap.claude_asset],
      [t('anthropicApi'), edgeMap.anthropic_api]
    ].map(function (entry) {
      var result = entry[1];
      if (!result) return row(t('edgeRoute') + ' · ' + entry[0], '--');
      var ok = result.ok;
      var statusText = ok ? ('HTTP ' + result.status + ' · ' + result.latency + 'ms') : t('statusFailed');
      return row(t('edgeRoute') + ' · ' + entry[0], statusText, ok ? 'success mono' : 'danger');
    });

    $('claudeRows').innerHTML = browserRows.concat(edgeRows).join('');
  }

  function renderNetwork(browserStatus, edgeStatus, context) {
    var edgeMap = {};
    (edgeStatus.results || []).forEach(function (item) {
      edgeMap[item.id] = item;
    });
    $('networkRows').innerHTML = [
      row(t('browserStatus') + ' · ' + t('cloudflareTrace'), browserStatus.cloudflare_trace.ok ? (browserStatus.cloudflare_trace.latency + 'ms') : t('statusFailed'), browserStatus.cloudflare_trace.ok ? 'success mono' : 'danger'),
      row(t('browserStatus') + ' · ' + t('github'), browserStatus.github.ok ? (browserStatus.github.latency + 'ms') : t('statusFailed'), browserStatus.github.ok ? 'success mono' : 'danger'),
      row(t('edgeStatus') + ' · ' + t('cloudflareTrace'), edgeMap.cloudflare_trace && edgeMap.cloudflare_trace.ok ? ('HTTP ' + edgeMap.cloudflare_trace.status + ' · ' + edgeMap.cloudflare_trace.latency + 'ms') : t('statusFailed'), edgeMap.cloudflare_trace && edgeMap.cloudflare_trace.ok ? 'success mono' : 'danger'),
      row(t('edgeStatus') + ' · ' + t('github'), edgeMap.github && edgeMap.github.ok ? ('HTTP ' + edgeMap.github.status + ' · ' + edgeMap.github.latency + 'ms') : t('statusFailed'), edgeMap.github && edgeMap.github.ok ? 'success mono' : 'danger'),
      row(t('workerColo'), context.worker && context.worker.colo ? context.worker.colo : '--'),
      row(t('workerRegion'), [context.worker && context.worker.country, context.worker && context.worker.city].filter(Boolean).join(' / ') || '--')
    ].join('');
  }

  function renderPrivacy(dnsData, risk, webrtc) {
    var dnsEval = evaluateDns(dnsData, risk);
    var dnsGeo = dnsData && dnsData.dns && dnsData.dns.geo ? dnsData.dns.geo : dnsData && dnsData.geo ? dnsData.geo : '--';
    var dnsIp = dnsData && dnsData.dns && dnsData.dns.ip ? dnsData.dns.ip : dnsData && dnsData.ip ? dnsData.ip : '--';
    var publicMismatch = webrtc.publicIps.length && risk.ip && webrtc.publicIps.indexOf(risk.ip) === -1;
    var webrtcStatus = !webrtc.supported
      ? { text: t('statusUnsupported'), cls: 'warn', safe: true }
      : webrtc.privateIps.length
        ? { text: t('statusWarn') + ' (' + webrtc.privateIps.join(', ') + ')', cls: 'warn', safe: false }
        : publicMismatch
          ? { text: t('statusWarn') + ' (' + webrtc.publicIps.join(', ') + ')', cls: 'warn', safe: false }
          : { text: webrtc.publicIps.length ? t('statusProtected') + ' (' + webrtc.publicIps.join(', ') + ')' : t('notDetected'), cls: 'success', safe: true };

    $('privacyRows').innerHTML = [
      row(t('dnsResolver'), dnsIp, 'mono'),
      row(t('dnsGeo'), dnsGeo),
      row(t('dnsStatus'), dnsEval.text, dnsEval.cls),
      row(t('webrtcPrivate'), webrtc.privateIps.length ? webrtc.privateIps.join(', ') : t('notDetected'), webrtc.privateIps.length ? 'warn mono' : 'success mono'),
      row(t('webrtcPublic'), webrtc.publicIps.length ? webrtc.publicIps.join(', ') : t('notDetected'), webrtc.publicIps.length ? (publicMismatch ? 'warn mono' : 'success mono') : 'mono'),
      row(t('webrtcStatus'), webrtcStatus.text, webrtcStatus.cls)
    ].join('');
  }

  function renderDevice(device) {
    $('deviceRows').innerHTML = [
      row(t('browserTimezone'), device.timezone),
      row(t('browserLanguage'), device.language),
      row(t('languages'), device.languages),
      row(t('platform'), device.platform),
      row(t('hardware'), device.hardware),
      row(t('screen'), device.screen),
      row(t('touch'), device.touch),
      row(t('connection'), device.connection),
      row(t('canvas'), device.canvas, 'mono'),
      row(t('webgl'), device.webgl),
      row(t('ua'), device.userAgent)
    ].join('');
  }

  function renderRecommendations(risk, browserStatus, dnsData, webrtc, snapshot) {
    var items = [];
    var dnsEval = evaluateDns(dnsData, risk);
    if (!(browserStatus.claude_web && browserStatus.claude_web.ok && browserStatus.claude_asset && browserStatus.claude_asset.ok)) {
      items.push(t('claudeWarn'));
    } else {
      items.push(t('claudeClean'));
    }
    items.push(dnsEval.safe ? t('dnsClean') : t('dnsWarn'));
    items.push(webrtc.privateIps.length ? t('webrtcWarn') : t('webrtcClean'));
    if (snapshot.previousIp && snapshot.previousIp !== risk.ip) {
      items.push(t('snapDrift'));
    }
    if ((risk.is_proxy || risk.is_datacenter || risk.is_anonymous) && Number(risk.trust_score || 0) < 75) {
      items.push(state.lang === 'zh' ? '当前出口更像数据中心或代理 IP，如需更自然的浏览画像，建议切 Residential 或低风险节点。' : 'This exit looks like a datacenter or proxy IP. Switch to a lower-risk or residential node for a more natural browser profile.');
    }
    if (!items.length) items.push(t('emptyRecommendation'));
    $('recommendRows').innerHTML = items.map(function (item) {
      return '<div class="check-item">' + safe(item) + '</div>';
    }).join('');
  }

  function buildSnapshot(risk) {
    var previous = null;
    try {
      previous = JSON.parse(getStored(STORAGE_KEYS.snapshot) || 'null');
    } catch (error) {
      previous = null;
    }
    var snapshot = {
      previousIp: previous && previous.ip ? previous.ip : '',
      previousAt: previous && previous.at ? previous.at : 0
    };
    setStored(STORAGE_KEYS.snapshot, JSON.stringify({ ip: risk.ip || '', at: Date.now() }));
    return snapshot;
  }

  function exportPayload() {
    if (!state.payload) return;
    var blob = new Blob([JSON.stringify(state.payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'atlas-network-report.json';
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  function focusSection() {
    Array.prototype.forEach.call(document.querySelectorAll('.focus-ring'), function (node) {
      node.classList.remove('focus-ring');
    });
    var map = {
      overview: 'section-overview',
      claude: 'section-claude',
      privacy: 'section-privacy',
      network: 'section-network'
    };
    var id = map[state.focus];
    if (!id) return;
    var el = $(id);
    if (!el) return;
    el.classList.add('focus-ring');
    if (window.location.hash) return;
    setTimeout(function () {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function bind() {
    $('langBtn').addEventListener('click', function () {
      state.lang = state.lang === 'zh' ? 'en' : 'zh';
      setStored(STORAGE_KEYS.lang, state.lang);
      window.location.href = withQuery(window.location.pathname);
    });
    $('themeBtn').addEventListener('click', function () {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      setStored(STORAGE_KEYS.theme, state.theme);
      applyTheme();
      history.replaceState({}, '', withQuery(window.location.pathname));
      applyCopy();
    });
    $('refreshBtn').addEventListener('click', function () {
      run();
    });
    $('exportBtn').addEventListener('click', exportPayload);
  }

  function hydratePreference() {
    var url = new URL(window.location.href);
    var savedLang = getStored(STORAGE_KEYS.lang);
    var savedTheme = getStored(STORAGE_KEYS.theme);
    if (!url.searchParams.get('lang') && savedLang) state.lang = savedLang;
    if (!url.searchParams.get('theme') && savedTheme) state.theme = savedTheme;
    history.replaceState({}, '', withQuery(window.location.pathname));
  }

  function run() {
    $('heroIp').textContent = '--';
    $('heroGeo').textContent = t('heroScanning');
    return Promise.all([
      parseJson('/api/context'),
      parseJson('/api/risk'),
      parseJson('/api/dns').catch(function (error) { return { error: error.message }; }),
      parseJson('/api/status').catch(function (error) { return { results: [], error: error.message }; }),
      collectBrowserStatus(),
      collectWebRtc(),
      Promise.resolve(collectDeviceSummary())
    ]).then(function (results) {
      var context = results[0];
      var risk = results[1];
      var dnsData = results[2];
      var edgeStatus = results[3];
      var browserStatus = results[4];
      var webrtc = results[5];
      var device = results[6];
      var snapshot = buildSnapshot(risk);

      state.payload = {
        generatedAt: new Date().toISOString(),
        context: context,
        risk: risk,
        dns: dnsData,
        edgeStatus: edgeStatus,
        browserStatus: browserStatus,
        webrtc: webrtc,
        device: device,
        snapshot: snapshot
      };
      setStored(STORAGE_KEYS.payload, JSON.stringify(state.payload));

      renderHero(risk, snapshot);
      renderOverview(context, risk, snapshot);
      renderRisk(risk);
      renderClaude(browserStatus, edgeStatus);
      renderNetwork(browserStatus, edgeStatus, context);
      renderPrivacy(dnsData, risk, webrtc);
      renderDevice(device);
      renderRecommendations(risk, browserStatus, dnsData, webrtc, snapshot);
      focusSection();
    }).catch(function (error) {
      $('heroGeo').textContent = t('probeFailed') + ': ' + error.message;
      $('heroBadge').className = 'badge badge-danger';
      $('heroBadge').textContent = t('probeFailed');
    });
  }

  hydratePreference();
  applyTheme();
  applyCopy();
  bind();
  run();
})();
`;
}
