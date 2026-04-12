/**
 * Atlas Proxy Ultimate Web Hub (v3.0 - The Masterpiece)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const params = url.searchParams;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // 路由 1: 网页版 Dashboard
    if (path === "/" || path === "/index.html") {
      const browserLang = request.headers.get("Accept-Language")?.startsWith("zh") ? "zh" : "en";
      const currentLang = params.get("lang") || browserLang;
      return new Response(generateUltimateDashboard(currentLang), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // 路由 2: API 接口
    if (path === "/api/risk") {
      const ip = params.get("ip") || request.headers.get("cf-connecting-ip");
      const [abuseRes, geoRes] = await Promise.all([
        env.ABUSEIPDB_KEY 
          ? fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
              headers: { "Key": env.ABUSEIPDB_KEY, "Accept": "application/json" }
            }).then(r => r.json()).catch(() => ({}))
          : Promise.resolve({}),
        fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,timezone,isp,as,proxy,hosting`)
          .then(r => r.json()).catch(() => ({}))
      ]);

      const d = abuseRes.data || {};
      const result = {
        ip: ip,
        trust_score: 100 - (d.abuseConfidenceScore || 0),
        country: d.countryName || geoRes.country || "Unknown",
        city: d.city || geoRes.city || "Unknown",
        asn: d.asn || (geoRes.as ? parseInt(geoRes.as.split(' ')[0].replace('AS','')) : 0),
        asOrganization: d.isp || geoRes.isp || "Unknown",
        is_proxy: geoRes.proxy || (d.abuseConfidenceScore > 0),
        is_vpn: geoRes.hosting || d.usageType?.includes("Data Center") || false,
        timezone: geoRes.timezone || "UTC"
      };
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (path === "/api/dns") {
      const res = await fetch("https://edns.ip-api.com/json");
      return new Response(JSON.stringify(await res.json()), { headers: corsHeaders });
    }

    return new Response("404 Not Found", { status: 404 });
  }
};

function generateUltimateDashboard(lang) {
  const isZh = lang === "zh";
  const t = {
    title: isZh ? "Atlas Proxy 审计中心" : "Atlas Proxy Audit Hub",
    langBtn: isZh ? "English" : "中文",
    langTarget: isZh ? "en" : "zh",
    hero: isZh ? "当前出口 IP" : "CURRENT EXIT IP",
    quality: isZh ? "IP 情报" : "IP Intelligence",
    connectivity: isZh ? "连通性" : "Connectivity",
    privacy: isZh ? "隐私审计" : "Privacy Audit",
    claude: isZh ? "Claude AI 专检" : "Claude AI Audit",
    environment: isZh ? "浏览器环境" : "Browser Env",
    refresh: isZh ? "重新扫描" : "Rescan",
    detecting: isZh ? "正在探测..." : "Detecting...",
    secure: isZh ? "受保护" : "Protected",
    leaked: isZh ? "已泄漏" : "Leaked"
  };

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
    <style>
        :root { --p: #7c3aed; --bg: #09090b; --card: #18181b; --border: #27272a; --text: #fafafa; --muted: #a1a1aa; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); display: flex; min-height: 100vh; overflow-x: hidden; }
        
        /* 布局：侧边 IP 栏 + 右侧功能面板 */
        .sidebar-hero { width: 380px; background: var(--card); border-right: 1px solid var(--border); padding: 4rem 2rem; position: fixed; height: 100vh; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .main-content { margin-left: 380px; flex: 1; padding: 4rem 3rem; }

        .logo-box { position: absolute; top: 2rem; left: 2rem; font-weight: 900; font-size: 1.2rem; letter-spacing: -1px; }
        .lang-switch { position: absolute; top: 2rem; right: 2rem; background: var(--bg); color: var(--text); border: 1px solid var(--border); padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 700; }

        .hero-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1.5rem; }
        .hero-ip { font-size: 2.5rem; font-weight: 900; color: var(--p); font-family: 'JetBrains Mono', monospace; word-break: break-all; line-height: 1.1; margin-bottom: 1.5rem; }
        .hero-geo { font-size: 1.1rem; color: var(--text); font-weight: 700; margin-bottom: 2rem; }
        .btn-refresh { background: var(--p); color: white; border: none; width: 100%; padding: 1rem; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; }
        .btn-refresh:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(124, 58, 237, 0.3); }

        .section-title { font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 10px; }
        .section-title::after { content: ""; flex: 1; height: 1px; background: var(--border); }

        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 1.5rem; }
        
        .row { display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.95rem; }
        .row:last-child { border-bottom: none; }
        .row span { color: var(--muted); }
        .row b { font-weight: 700; }
        .mono { font-family: 'JetBrains Mono', monospace; color: #22c55e; }

        @media (max-width: 900px) {
            body { flex-direction: column; }
            .sidebar-hero { width: 100%; position: relative; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
            .main-content { margin-left: 0; padding: 2rem 1rem; }
        }
    </style>
</head>
<body>
    <div class="sidebar-hero">
        <div class="logo-box">ATLAS <span style="color:var(--p)">PROXY</span></div>
        <button class="lang-switch" onclick="location.href='?lang=${t.langTarget}'">${t.langBtn}</button>
        
        <div style="margin-top: auto; margin-bottom: auto; width: 100%;">
            <div class="hero-label">${t.hero}</div>
            <div class="hero-ip" id="ip-t">${t.detecting}</div>
            <div class="hero-geo" id="geo-t">--</div>
            <button class="btn-refresh" onclick="run()">${t.refresh}</button>
        </div>
        
        <div style="font-size: 0.7rem; color: var(--muted); opacity: 0.5;">&copy; 2026 ATLAS PROXY MASTER</div>
    </div>

    <main class="main-content">
        <div class="section-title">${t.quality}</div>
        <div class="grid">
            <div class="card"><div id="q-rows"></div></div>
            <div class="card"><div id="q-badges" style="display:flex; flex-wrap:wrap; gap:8px"></div></div>
        </div>

        <div class="section-title">${t.ping}</div>
        <div class="grid">
            <div class="card" id="p-box"></div>
        </div>

        <div class="section-title">${t.claude}</div>
        <div class="grid">
            <div class="card" id="c-box"></div>
        </div>

        <div class="section-title">${t.privacy} & ${t.environment}</div>
        <div class="grid">
            <div class="card" id="s-box"></div>
            <div class="card" id="e-box"></div>
        </div>
    </main>

    <script>
        async function run() {
            // 1. IP 情报
            const risk = await fetch('/api/risk').then(r=>r.json());
            document.getElementById('ip-t').innerText = risk.ip;
            document.getElementById('geo-t').innerText = risk.country + ', ' + risk.city;
            document.getElementById('q-rows').innerHTML = \`
                <div class="row"><span>Trust Score</span><b style="color:var(--p)">\${risk.trust_score}/100</b></div>
                <div class="row"><span>ISP</span><b>\${risk.asOrganization}</b></div>
                <div class="row"><span>ASN</span><b class="mono">AS\${risk.asn}</b></div>
            \`;

            // 2. 顺序 Ping 测试
            const pBox = document.getElementById('p-box'); pBox.innerHTML = '';
            const targets = [{n:'Google',u:'https://www.google.com/favicon.ico'},{n:'GitHub',u:'https://github.com/favicon.ico'},{n:'Cloudflare',u:'https://1.1.1.1/cdn-cgi/trace'}];
            for(const t of targets) {
                const row = document.createElement('div'); row.className = 'row';
                row.innerHTML = \`<span>\${t.n}</span><b class="mono">...</b>\`;
                pBox.appendChild(row);
                const s = Date.now();
                try { await fetch(t.u,{mode:'no-cors',cache:'no-store'}); row.querySelector('b').innerText = (Date.now()-s)+'ms'; }
                catch { row.querySelector('b').innerText = 'Timeout'; }
            }

            // 3. Claude 专检 (纯客户端)
            const cBox = document.getElementById('c-box');
            const cStart = Date.now();
            fetch('https://claude.ai/favicon.ico', {mode:'no-cors', cache:'no-store', credentials:'omit'})
                .then(() => {
                    cBox.innerHTML = \`<div class="row"><span>Claude AI</span><b style="color:#22c55e">Operational</b></div><div class="row"><span>Latency</span><b>\${Date.now()-cStart}ms</b></div>\`;
                })
                .catch(() => {
                    cBox.innerHTML = \`<div class="row"><span>Claude AI</span><b style="color:#ef4444">Blocked / Offline</b></div>\`;
                });

            // 4. DNS & WebRTC (略...)
            fetch('/api/dns').then(r=>r.json()).then(d => {
                document.getElementById('s-box').innerHTML = \`
                    <div class="row"><span>DNS Leak</span><b style="color:#3b82f6">\${d.dns.geo}</b></div>
                    <div class="row"><span>WebRTC</span><b id="w-val">Scanning...</b></div>
                \`;
                // WebRTC 逻辑
                const pc = new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
                let l = false; pc.onicecandidate=(e)=>{if(e.candidate)l=true;};
                pc.createDataChannel(''); pc.createOffer().then(o=>pc.setLocalDescription(o));
                setTimeout(()=>{ document.getElementById('w-val').innerText = l ? '${t.leaked}' : '${t.secure}'; pc.close(); }, 1500);
            });

            // 5. 设备环境
            document.getElementById('e-box').innerHTML = \`
                <div class="row"><span>Timezone</span><b>\${Intl.DateTimeFormat().resolvedOptions().timeZone}</b></div>
                <div class="row"><span>Language</span><b>\${navigator.language}</b></div>
                <div class="row"><span>Platform</span><b>\${navigator.platform}</b></div>
            \`;
        }
        window.onload = run;
    </script>
</body>
</html>
  `;
}
