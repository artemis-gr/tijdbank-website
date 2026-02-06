(() => {
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const menu = document.querySelector("details.menu");
  const sections = [...document.querySelectorAll("main section[data-bg]")];

  if (!header || sections.length === 0) return;

  const mqDesktop = window.matchMedia("(min-width: 720px)");

  let lockToken = 0;
  const lockFor = (ms) => {
    const t = ++lockToken;
    window.setTimeout(() => {
      if (lockToken === t) lockToken = 0;
    }, ms);
  };
  const isLocked = () => lockToken !== 0;

  let headerH = 0;
  let snapOffset = 0;

  const readSnapOffset = () => {
    const v = getComputedStyle(root).getPropertyValue("--snap-offset").trim();
    const n = parseFloat(v);
    snapOffset = Number.isFinite(n) ? n : 0;
  };

  const measureHeader = () => {
    const measured = Math.ceil(header.getBoundingClientRect().height);
    headerH = Math.min(measured, 120);
    root.style.setProperty("--header-h", `${headerH}px`);
  };

  const resolveBgFromSection = (section) => {
    if (!section) return "var(--c-grey)";

    const raw = (section.getAttribute("data-bg") || "").trim();
    if (!raw) return "var(--c-grey)";

    if (raw.startsWith("var(")) return raw;

    if (raw.startsWith("--")) {
      const val = getComputedStyle(root).getPropertyValue(raw).trim();
      return val || `var(${raw})`; 
    }

    return raw;
  };

  const setActiveNavLink = (section) => {
    const id = section?.id === "welkom" ? "wat" : section?.id;
    if (!id) return;
    document.querySelectorAll(".nav a").forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`);
    });
  };

  const getActiveSectionByProbe = () => {
    const probeY = headerH + snapOffset + 2;

    let active = sections[0];
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= probeY) active = s;
    }
    return active;
  };

  const applyHeaderAndMenuBg = (section) => {
    const sectionBg = resolveBgFromSection(section);
    root.style.setProperty("--menu-bg", sectionBg);
    root.style.setProperty("--header-bg", sectionBg);
  };

  let lastActiveId = "";

  const sync = () => {
    if (isLocked()) return;

    const active = getActiveSectionByProbe();
    const activeId = active?.id || "";

    if (!mqDesktop.matches && activeId === lastActiveId) return;

    lastActiveId = activeId;
    applyHeaderAndMenuBg(active);
    setActiveNavLink(active);
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      sync();
      ticking = false;
    });
  };

  const bindScroll = () => {
    window.removeEventListener("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
  };

  const applyMode = () => {
    measureHeader();
    readSnapOffset();
    bindScroll();
    lastActiveId = "";
    sync();
  };

  applyMode();

  document.addEventListener("click", (e) => {
    if (menu?.open && !menu.contains(e.target)) menu.open = false;

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

    if (section) {
      applyHeaderAndMenuBg(section);
      setActiveNavLink(section);
      lastActiveId = section.id || "";
      lockFor(380);
    }

    if (menu) menu.open = false;

    measureHeader();
    readSnapOffset();

    const EPS = 4; 
    const y =
      window.scrollY +
      target.getBoundingClientRect().top -
      (headerH + snapOffset) +
      EPS;

    window.scrollTo({ top: y, behavior: "auto" });

    window.setTimeout(() => {
      lastActiveId = "";
      sync();
    }, 420);
  });

  // ESC closes menu
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu?.open) menu.open = false;
  });

  menu?.addEventListener("toggle", () => {
    if (menu.open) {
      const active = getActiveSectionByProbe();
      applyHeaderAndMenuBg(active);
    }
  });

  mqDesktop.addEventListener?.("change", applyMode);
  window.addEventListener("resize", applyMode);
  new ResizeObserver(applyMode).observe(header);
})();
