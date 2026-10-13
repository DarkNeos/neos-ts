(() => {
  const query = new URLSearchParams(location.search);
  if (query.get("animationDebug") === "0") sessionStorage.removeItem("neos-animation-debug");
  if (query.get("animationDebug") === "1") sessionStorage.setItem("neos-animation-debug", "1");
  if (sessionStorage.getItem("neos-animation-debug") !== "1") return;

  const session = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const records = [];
  let lastSnapshot = "";
  let scheduled = 0;
  const cardSelector = '[data-testid="duel-card"]';
  const relevantSelector = `${cardSelector}[data-card-zone="HAND"],${cardSelector}[data-card-zone="MZONE"],${cardSelector}[data-card-zone="SZONE"]`;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  function record(type, data) {
    records.push({ time: new Date().toISOString(), elapsed: Math.round(performance.now()), type, data });
    if (records.length >= 50) flush();
  }

  function flush() {
    if (!records.length) return;
    const pending = records.splice(0);
    const body = JSON.stringify({ session, records: pending });
    if (navigator.sendBeacon("/__animation-debug/log", new Blob([body], { type: "application/json" }))) return;
    fetch("/__animation-debug/log", {
      method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true,
    }).catch(() => {
      // 网络恢复后再次上报，限制断网时积累的日志数量。
      records.unshift(...pending);
      records.splice(100);
    });
  }

  function rotation(element) {
    const match = element?.style.transform.match(/rotateZ\((-?[\d.]+)deg\)/);
    return match ? Number(match[1]) : null;
  }

  function faceState(element) {
    if (!element) return null;
    const image = element.querySelector("img");
    const style = getComputedStyle(element);
    return {
      source: image?.currentSrc || image?.src,
      complete: image?.complete, naturalWidth: image?.naturalWidth,
      backfaceVisibility: style.backfaceVisibility,
      transform: style.transform, transformStyle: style.transformStyle,
      filter: style.filter, opacity: style.opacity,
    };
  }

  function cardState(card) {
    const style = getComputedStyle(card);
    const wrap = card.querySelector('[class*="img-wrap"]');
    const anchor = card.querySelector('[class*="field-info-anchor"]');
    const rotationZ = rotation(card);
    const labelRotationZ = rotation(anchor);
    return {
      uuid: card.dataset.cardUuid, code: card.dataset.cardCode,
      controller: card.dataset.cardController, zone: card.dataset.cardZone,
      sequence: card.dataset.cardSequence, position: card.dataset.cardPosition,
      overlay: card.dataset.cardIsOverlay,
      confirming: card.dataset.cardConfirming, shuffling: card.dataset.cardShuffling,
      ry: style.getPropertyValue("--ry").trim(),
      z: style.getPropertyValue("--z").trim(),
      transform: style.transform, inlineTransform: card.style.transform,
      rotationZ, labelRotationZ,
      labelRotationSum: rotationZ === null || labelRotationZ === null ? null : rotationZ + labelRotationZ,
      labelTransform: anchor ? getComputedStyle(anchor).transform : null,
      transformStyle: style.transformStyle, opacity: style.opacity,
      filter: style.filter, zIndex: style.zIndex,
      wrapTransform: wrap ? getComputedStyle(wrap).transform : null,
      front: faceState(card.querySelector('[class*="cover"]')),
      back: faceState(card.querySelector('[class*="back_"]')),
    };
  }

  function snapshot(reason, force = false) {
    const cards = [...document.querySelectorAll(relevantSelector)].map(cardState);
    const state = JSON.stringify({ hidden: document.hidden, reducedMotion: motion.matches, cards });
    if (!force && state === lastSnapshot) return;
    lastSnapshot = state;
    record("snapshot", { reason, ...JSON.parse(state) });
  }

  function scheduleSnapshot() {
    if (scheduled) return;
    scheduled = setTimeout(() => { scheduled = 0; snapshot("dom-change"); }, 250);
  }

  function environment() {
    const rootStyle = getComputedStyle(document.documentElement);
    return {
      browser: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      adaptiveScale: rootStyle.getPropertyValue("--neos-adaptive-scale").trim(),
      planeRotation: rootStyle.getPropertyValue("--plane-rotate-x").trim(),
      hidden: document.hidden, reducedMotion: motion.matches,
      scripts: [...document.scripts].map(script => new URL(script.src || location.href).pathname),
    };
  }

  function init() {
    record("ready", environment());
    new MutationObserver(scheduleSnapshot).observe(document.getElementById("root") || document.body, {
      subtree: true, childList: true, attributes: true,
      attributeFilter: ["style", "class", "src", "data-card-code", "data-card-zone", "data-card-position"],
    });
    snapshot("initial", true);
    flush();
    console.info("[animation-debug] 日志已启用；发现异常时在控制台执行 neosAnimationDebug.mark('现象说明')。", session);
  }

  for (const type of ["click", "pointerover"]) {
    document.addEventListener(type, event => {
      const card = event.target instanceof Element ? event.target.closest(cardSelector) : null;
      if (!card || (type === "pointerover" && event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) return;
      record(type, cardState(card));
      scheduleSnapshot();
    }, true);
  }
  document.addEventListener("load", event => {
    const image = event.target;
    if (image instanceof HTMLImageElement && image.closest(cardSelector)) {
      record("image-loaded", { uuid: image.closest(cardSelector).dataset.cardUuid, source: image.currentSrc, naturalWidth: image.naturalWidth });
      scheduleSnapshot();
    }
  }, true);
  window.addEventListener("error", event => {
    if (event.target instanceof HTMLImageElement) {
      const card = event.target.closest(cardSelector);
      if (card) record("image-error", { uuid: card.dataset.cardUuid, source: event.target.src });
    } else if (event.message) {
      record("error", { message: event.message, stack: event.error?.stack });
    }
  }, true);
  window.addEventListener("unhandledrejection", event => {
    record("unhandled-rejection", { message: String(event.reason), stack: event.reason?.stack });
  });
  document.addEventListener("visibilitychange", () => {
    record("visibility", { hidden: document.hidden });
    snapshot("visibility", true);
    flush();
  });
  motion.addEventListener("change", () => {
    record("motion-preference", { reducedMotion: motion.matches });
    snapshot("motion-preference", true);
  });
  window.addEventListener("resize", () => { record("resize", environment()); scheduleSnapshot(); });
  window.addEventListener("pagehide", flush);

  window.neosAnimationDebug = {
    mark(note) { record("mark", { note }); snapshot("mark", true); flush(); },
    snapshot() { snapshot("manual", true); flush(); },
  };
  setInterval(() => snapshot("interval"), 1000);
  setInterval(flush, 2000);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
