(() => {
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const sections = [...document.querySelectorAll("main section[data-bg]")];

  if (!header || sections.length === 0) return;

  const getHeaderH = () => Math.ceil(header.getBoundingClientRect().height);

  // Stable active-section rule:
  // the active one is the section whose top is closest to (but not above) the header line.
  const setActiveFromScroll = () => {
    const headerH = getHeaderH();
    const probeY = headerH + 8; // 8px below header
    let active = sections[0];

    for (const s of sections) {
      const rect = s.getBoundingClientRect();
      if (rect.top <= probeY) active = s;
      else break;
    }

    const cssVarName = active.getAttribute("data-bg"); // e.g. "--c-grey"
    const color = getComputedStyle(root).getPropertyValue(cssVarName).trim();
    if (color) root.style.setProperty("--header-bg", color);
  };

  // Run once on load
  setActiveFromScroll();

  // Update on scroll (throttled via rAF for smoothness)
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      setActiveFromScroll();
      ticking = false;
    });
  }, { passive: true });

  // Also update after clicking nav links (anchors)
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    // after the browser scrolls, update
    requestAnimationFrame(() => {
      setTimeout(setActiveFromScroll, 0);
    });
  });

  // And on resize (header height can change)
  window.addEventListener("resize", () => {
    setActiveFromScroll();
  });
})();
