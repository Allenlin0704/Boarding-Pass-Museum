(() => {
  const platform = String(navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || "");
  if (!/windows/i.test(platform)) return;
  for (const id of ["windowsStorePromo", "windowsAdminStorePromo"]) {
    const section = document.getElementById(id);
    if (section) section.hidden = false;
  }
})();
