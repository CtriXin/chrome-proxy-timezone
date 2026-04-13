(() => {
  if (window.__atlasPageOverridesInstalled) return;
  window.__atlasPageOverridesInstalled = true;

  const state = {
    timeZone: '',
    language: ''
  };

  const NativeDateTimeFormat = Intl.DateTimeFormat;
  const nativeResolvedOptions = NativeDateTimeFormat.prototype.resolvedOptions;
  const nativeToLocaleString = Date.prototype.toLocaleString;
  const nativeToLocaleDateString = Date.prototype.toLocaleDateString;
  const nativeToLocaleTimeString = Date.prototype.toLocaleTimeString;
  const nativeGetTimezoneOffset = Date.prototype.getTimezoneOffset;
  const nativeLanguageGetter = Object.getOwnPropertyDescriptor(Navigator.prototype, 'language')?.get;
  const nativeLanguagesGetter = Object.getOwnPropertyDescriptor(Navigator.prototype, 'languages')?.get;
  const fallbackLanguage = nativeLanguageGetter ? nativeLanguageGetter.call(navigator) : 'en-US';
  const fallbackLanguages = nativeLanguagesGetter ? nativeLanguagesGetter.call(navigator) : [fallbackLanguage];

  function getActiveLanguage() {
    return state.language || fallbackLanguage;
  }

  function getActiveLanguages() {
    if (!state.language) {
      return Array.isArray(fallbackLanguages) ? fallbackLanguages.slice() : [String(fallbackLanguages || getActiveLanguage())];
    }
    const short = state.language.split('-')[0];
    return short && short !== state.language ? [state.language, short] : [state.language];
  }

  function withDefaults(locales, options) {
    const nextLocales = locales == null ? getActiveLanguage() : locales;
    if (!state.timeZone) return [nextLocales, options];
    const nextOptions = options ? { ...options } : {};
    if (!nextOptions.timeZone) nextOptions.timeZone = state.timeZone;
    return [nextLocales, nextOptions];
  }

  function getOffsetMinutes(date, timeZone) {
    const dtf = new NativeDateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const parts = dtf.formatToParts(date);
    const values = {};
    for (const part of parts) {
      if (part.type !== 'literal') values[part.type] = part.value;
    }
    const zonedAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second)
    );
    return Math.round((date.getTime() - zonedAsUtc) / 60000);
  }

  function hashString(input) {
    let hash = 2166136261;
    const text = String(input || '');
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (`0000000${(hash >>> 0).toString(16)}`).slice(-8);
  }

  function computeCanvasHash() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 280;
      canvas.height = 72;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#22c55e';
      ctx.font = '18px sans-serif';
      ctx.fillText('Atlas Probe', 12, 32);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(navigator.userAgent.slice(0, 24), 12, 54);
      return hashString(canvas.toDataURL());
    } catch (error) {
      return '';
    }
  }

  function getWebglProbe() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return { status: 'unsupported', value: '' };
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return { status: 'unsupported', value: '' };
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return { status: 'ok', value: `${vendor} / ${renderer}` };
    } catch (error) {
      return { status: 'failed', value: '' };
    }
  }

  function PatchedDateTimeFormat(locales, options) {
    const [nextLocales, nextOptions] = withDefaults(locales, options);
    return new NativeDateTimeFormat(nextLocales, nextOptions);
  }

  PatchedDateTimeFormat.prototype = NativeDateTimeFormat.prototype;
  Object.setPrototypeOf(PatchedDateTimeFormat, NativeDateTimeFormat);
  PatchedDateTimeFormat.supportedLocalesOf = NativeDateTimeFormat.supportedLocalesOf.bind(NativeDateTimeFormat);
  Intl.DateTimeFormat = PatchedDateTimeFormat;

  NativeDateTimeFormat.prototype.resolvedOptions = function patchedResolvedOptions() {
    const resolved = nativeResolvedOptions.call(this);
    if (state.timeZone && !resolved.timeZone) resolved.timeZone = state.timeZone;
    if (state.language && !resolved.locale) resolved.locale = state.language;
    return resolved;
  };

  Date.prototype.toLocaleString = function patchedToLocaleString(locales, options) {
    const [nextLocales, nextOptions] = withDefaults(locales, options);
    return nativeToLocaleString.call(this, nextLocales, nextOptions);
  };

  Date.prototype.toLocaleDateString = function patchedToLocaleDateString(locales, options) {
    const [nextLocales, nextOptions] = withDefaults(locales, options);
    return nativeToLocaleDateString.call(this, nextLocales, nextOptions);
  };

  Date.prototype.toLocaleTimeString = function patchedToLocaleTimeString(locales, options) {
    const [nextLocales, nextOptions] = withDefaults(locales, options);
    return nativeToLocaleTimeString.call(this, nextLocales, nextOptions);
  };

  Date.prototype.getTimezoneOffset = function patchedGetTimezoneOffset() {
    if (!state.timeZone) return nativeGetTimezoneOffset.call(this);
    return getOffsetMinutes(this, state.timeZone);
  };

  try {
    Object.defineProperty(Navigator.prototype, 'language', {
      configurable: true,
      get() {
        return getActiveLanguage();
      }
    });
  } catch (e) {}

  try {
    Object.defineProperty(Navigator.prototype, 'languages', {
      configurable: true,
      get() {
        return getActiveLanguages();
      }
    });
  } catch (e) {}

  document.addEventListener('__atlas_proxy_runtime__', (event) => {
    const detail = event.detail || {};
    state.timeZone = detail.timeZone || '';
    state.language = detail.language || '';
  });

  document.addEventListener('__atlas_page_probe_request__', (event) => {
    const detail = event.detail || {};
    const respond = (payload) => {
      document.dispatchEvent(new CustomEvent('__atlas_page_probe_response__', {
        detail: { id: detail.id, payload }
      }));
    };

    if (detail.type === 'pageEnv') {
      respond({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        language: navigator.language || '',
        languages: Array.isArray(navigator.languages) ? navigator.languages : []
      });
      return;
    }

    if (detail.type === 'webgl') {
      respond(getWebglProbe());
      return;
    }

    if (detail.type === 'envProfile') {
      const webgl = getWebglProbe();
      respond({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        language: navigator.language || '',
        languages: Array.isArray(navigator.languages) ? navigator.languages : [],
        userAgent: navigator.userAgent || '',
        platform: navigator.platform || '',
        vendor: navigator.vendor || '',
        webdriver: !!navigator.webdriver,
        hardwareConcurrency: navigator.hardwareConcurrency || null,
        deviceMemory: navigator.deviceMemory || null,
        maxTouchPoints: navigator.maxTouchPoints || 0,
        cookieEnabled: navigator.cookieEnabled !== false,
        doNotTrack: navigator.doNotTrack || '',
        screen: {
          width: window.screen?.width || 0,
          height: window.screen?.height || 0,
          availWidth: window.screen?.availWidth || 0,
          availHeight: window.screen?.availHeight || 0,
          colorDepth: window.screen?.colorDepth || 0,
          pixelDepth: window.screen?.pixelDepth || 0,
          dpr: window.devicePixelRatio || 1
        },
        viewport: {
          innerWidth: window.innerWidth || 0,
          innerHeight: window.innerHeight || 0,
          outerWidth: window.outerWidth || 0,
          outerHeight: window.outerHeight || 0
        },
        canvasHash: computeCanvasHash(),
        webgl
      });
      return;
    }

    if (detail.type === 'webrtc') {
      const RTCPeer = window.RTCPeerConnection || window.webkitRTCPeerConnection;
      if (!RTCPeer) {
        respond({ supported: false, privateIps: [], publicIps: [] });
        return;
      }

      const pc = new RTCPeer({ iceServers: [] });
      const addresses = new Set();
      let done = false;

      function isPrivate(ip) {
        return /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.|::1|fc|fd)/i.test(ip);
      }

      function finish() {
        if (done) return;
        done = true;
        try { pc.close(); } catch (e) {}
        const all = Array.from(addresses);
        respond({
          supported: true,
          privateIps: all.filter(isPrivate),
          publicIps: all.filter((ip) => !isPrivate(ip))
        });
      }

      const timer = setTimeout(finish, 1800);
      pc.onicecandidate = (iceEvent) => {
        const candidate = iceEvent.candidate && iceEvent.candidate.candidate;
        if (!candidate) {
          clearTimeout(timer);
          finish();
          return;
        }

        const parts = candidate.trim().split(/\s+/);
        const ip = parts[4];
        if (ip && (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip) || /^[a-f0-9:]+$/i.test(ip))) {
          addresses.add(ip);
        }
      };

      pc.createDataChannel('atlas-audit');
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {
          clearTimeout(timer);
          respond({ supported: false, privateIps: [], publicIps: [] });
        });
    }
  });
})();
