(() => {
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const sections = [...document.querySelectorAll("main section[data-bg]")];

  if (!header || sections.length === 0) return;

  const items = sections.map((section) => ({
    section,
    heading: section.querySelector("h1, h2, h3") || section, // fallback
  }));

  const getSnapOffset = () => {
    const v = getComputedStyle(root).getPropertyValue("--snap-offset").trim();
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  // Returns BOTH: the real header height and the clamped one
  const setHeaderHeightVar = () => {
    const measured = Math.ceil(header.getBoundingClientRect().height);
    const clamped = Math.min(measured, 120); // snap/anchor offset you like
    root.style.setProperty("--header-h", `${clamped}px`);
    return { measured, clamped };
  };

  const setHeaderColorFromSection = (section) => {
    const cssVarName = section.getAttribute("data-bg");
    const color = getComputedStyle(root).getPropertyValue(cssVarName).trim();
    if (color) root.style.setProperty("--header-bg", color);
  };

  const setActiveFromScroll = () => {
    const { measured, clamped } = setHeaderHeightVar();
    const snapOffset = getSnapOffset();

    // Use the SAME line your snapping/click-scroll uses:
    // (clamped is your "effective header height", e.g. 120px)
    const probeY = clamped + snapOffset + 2;

    let active = sections[0];
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= probeY) active = s;
    }

    setHeaderColorFromSection(active);
  };
  // init
  setActiveFromScroll();

  // scroll (rAF throttle)
  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setActiveFromScroll();
        ticking = false;
      });
    },
    { passive: true },
  );

  // click: set header color immediately to the target section
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();

    const section = target.matches("section[data-bg]")
      ? target
      : target.closest("section[data-bg]");

    if (section) setHeaderColorFromSection(section);

    const menu = document.querySelector("details.menu");
    if (menu) menu.open = false;

    // --- deterministic scroll (respects your offset) ---
    const { clamped } = setHeaderHeightVar(); // the 120px cap you like
    const snapOffset = getSnapOffset(); // your CSS --snap-offset
    const y =
      window.scrollY +
      target.getBoundingClientRect().top -
      (clamped + snapOffset);

    window.scrollTo({ top: y, behavior: "auto" }); // use "smooth" if you want
    requestAnimationFrame(() => requestAnimationFrame(setActiveFromScroll));
  });

  window.addEventListener("resize", setActiveFromScroll);
  new ResizeObserver(setActiveFromScroll).observe(header);
})();
