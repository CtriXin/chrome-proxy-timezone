(() => {
  const KEYS = ['timezone', 'language', 'ipTimezone', 'ipLanguage'];

  function getEffectiveConfig(storage) {
    const followTimezone = storage.timezone === 'ip';
    const followLanguage = storage.language === 'ip';

    return {
      timeZone: followTimezone ? (storage.ipTimezone || '') : (storage.timezone || ''),
      language: followLanguage ? (storage.ipLanguage || '') : (storage.language || '')
    };
  }

  function pushRuntimeConfig(storage) {
    document.dispatchEvent(new CustomEvent('__atlas_proxy_runtime__', {
      detail: getEffectiveConfig(storage)
    }));
  }

  chrome.storage.local.get(KEYS, pushRuntimeConfig);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (!KEYS.some((key) => key in changes)) return;
    chrome.storage.local.get(KEYS, pushRuntimeConfig);
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action !== 'pageProbe') return;

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let done = false;

    const cleanup = () => {
      done = true;
      document.removeEventListener('__atlas_page_probe_response__', onResponse);
      clearTimeout(timer);
    };

    const onResponse = (event) => {
      const detail = event.detail || {};
      if (detail.id !== id || done) return;
      cleanup();
      sendResponse(detail.payload || null);
    };

    const timer = setTimeout(() => {
      if (done) return;
      cleanup();
      sendResponse({ error: 'timeout' });
    }, 3000);

    document.addEventListener('__atlas_page_probe_response__', onResponse);
    document.dispatchEvent(new CustomEvent('__atlas_page_probe_request__', {
      detail: { id, type: message.probeType }
    }));

    return true;
  });
})();
