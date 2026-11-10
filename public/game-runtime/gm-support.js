// Local userscript compatibility. Auth requests use the instance's isolated cookie jar.
window.unsafeWindow = window;
window.GM_addStyle = function (css) {
  const style = document.createElement('style'); style.textContent = css; document.head.append(style);
};
window.GM_xmlhttpRequest = function (options = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeout || 65000);
  const request = window.__multiNetwork ? window.__multiNetwork.fetch : window.fetch;
  request(options.url, { method: options.method || 'GET', headers: options.headers || {},
    body: options.data, signal: controller.signal, credentials: 'omit' })
    .then(async response => {
      const binary = options.responseType === 'arraybuffer';
      const data = binary ? await response.arrayBuffer() : await response.text();
      clearTimeout(timer);
      options.onload?.({ status: response.status, statusText: response.statusText,
        responseText: binary ? '' : data, response: data,
        responseHeaders: [...response.headers].map(([key, value]) => key + ': ' + value).join('\r\n'),
        finalUrl: response.url || options.url });
    })
    .catch(error => {
      clearTimeout(timer);
      const callback = timedOut ? options.ontimeout : controller.signal.aborted ? options.onabort : options.onerror;
      callback?.({ status: 0, responseText: '', error });
    });
  return { abort() { controller.abort(); } };
};
