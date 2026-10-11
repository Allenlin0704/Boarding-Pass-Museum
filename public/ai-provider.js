(() => {
  let providerName = '';
  const updateSlots = () => {
    if (!providerName) return;
    document.querySelectorAll('[data-bpm-ai-slot]').forEach((slot) => {
      if (slot.textContent !== providerName) slot.textContent = providerName;
    });
  };
  new MutationObserver(updateSlots).observe(document.documentElement, { childList: true, subtree: true });
  fetch('https://api.bpmuseum.org.cn/api/ai/provider', { credentials: 'omit' })
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      if (!data?.provider) return;
      const english = document.documentElement.lang === 'en' || window.BPM_LANGUAGE === 'en';
      providerName = english ? 'Doubao' : '豆包';
      updateSlots();
    })
    .catch(() => {});
})();
