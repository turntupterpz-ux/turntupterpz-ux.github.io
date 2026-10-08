// Homepage behaviour. Deferred, so the DOM is parsed; runs before leave.js, which binds the static sheet links.
(function () {
  const { menu, vouches, links, el, vouchButton } = window.TT;

  // ------------------------------------------------------------ product cards + sheet
  const cards = document.querySelector("#cards");
  const sheet = document.querySelector("#sheet");
  const art = document.querySelector("#sheetArt");
  const prices = document.querySelector("#sheetPrices");
  const strains = document.querySelector("#sheetStrains");
  const ask = document.querySelector("#sheetAsk");

  const fromLabel = (c) => c.unit === "g" ? "$" + c.from + "/g" : "$" + c.from + " " + c.unit;

  function seg(labels, values) {
    return el("div", { class: "seg" }, labels.map((label, i) =>
      el("div", {}, [el("span", { text: label }), el("b", { text: "$" + values[i] })])));
  }

  function openSheet(c) {
    art.replaceChildren(c.render
      ? TT.motionBox(c.render, "play", c.name + ", studio render", "sheet-motion")
      : el("span", { text: "2g" }));
    document.querySelector("#sheetTitle").textContent = c.name;
    document.querySelector("#sheetNote").textContent = c.note;
    document.querySelector("#sheetBlurb").textContent = c.blurb;

    prices.replaceChildren();
    if (c.prices) prices.appendChild(seg(menu.weights, c.prices));
    if (c.tiers) prices.appendChild(seg(c.tiers.map((t) => t[0]), c.tiers.map((t) => t[1])));
    if (c.id === "rosin") {
      prices.appendChild(el("div", { class: "rosin-rows" }, c.strains.map((s) =>
        el("div", {}, [
          el("span", { html: "<b>" + s.name + "</b><small>" + s.type + " · " + s.micron + "</small>" }),
          el("em", { text: "$" + s.prices[0] + " – $" + s.prices[4] })
        ]))));
      prices.appendChild(el("p", { class: "fine", text: "1g to 28.5g. Full price ladder in the menu." }));
    }
    strains.replaceChildren(...(c.id === "rosin" ? [] : c.strains.map((s) =>
      el("li", { html: s.name + "<small>" + s.type + "</small>" }))));
    ask.href = links.ask(c.name);
    ask.textContent = "Ask about " + c.name.toLowerCase();
    ask.dataset.label = "sheet_ask_" + c.id;
    sheet.showModal();
    window.track("open_product_" + c.id);
    if (window.TTMotion) window.TTMotion.init(art);
  }

  menu.categories.forEach((c) => {
    const card = el("button", { type: "button", class: "pcard" }, [
      el("div", { class: "pcard-art" }, [c.render
        ? TT.motionBox(c.render, "x", "")
        : el("span", { text: "2g" })]),
      el("b", { text: c.name }),
      el("small", { html: "<span>" + c.note + "</span><em>" + fromLabel(c) + "</em>" })
    ]);
    card.addEventListener("click", () => openSheet(c));
    cards.appendChild(card);
  });

  document.querySelector("#sheetClose").addEventListener("click", () => sheet.close());
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  // the in-app-browser prompt needs the screen to itself
  sheet.querySelectorAll("a.leaves-site").forEach((a) => a.addEventListener("click", () => sheet.close()));

  // swipe the sheet down to dismiss
  let startY = null;
  sheet.addEventListener("touchstart", (e) => {
    startY = sheet.querySelector(".sheet-body").scrollTop <= 0 ? e.touches[0].clientY : null;
  }, { passive: true });
  sheet.addEventListener("touchend", (e) => {
    if (startY !== null && e.changedTouches[0].clientY - startY > 90) sheet.close();
    startY = null;
  }, { passive: true });

  // ------------------------------------------------------------ vouches
  document.querySelectorAll("[data-vouch-count]").forEach((n) => { n.textContent = vouches.length; });
  const stories = document.querySelector("#stories");
  vouches.slice(0, 12).forEach((_, i) => stories.appendChild(vouchButton(i)));

  const grid = document.querySelector("#vgrid");
  const more = document.querySelector("#vMore");
  // vouch taps are counted the same way the old homepage counted them
  grid.addEventListener("click", () => window.track("open_vouch"));
  stories.addEventListener("click", () => window.track("open_vouch"));
  const add = (from, to) => { for (let i = from; i < to; i++) grid.appendChild(vouchButton(i)); };
  add(12, 21);
  more.textContent = "Show all " + vouches.length;
  more.addEventListener("click", () => { add(21, vouches.length); more.hidden = true; });

  // ------------------------------------------------------------ tab bar follows the scroll
  const tabs = [...document.querySelectorAll(".tabbar a")];
  const screens = tabs.map((t) => document.querySelector(t.getAttribute("href")));
  const setActive = (id) => tabs.forEach((t) => {
    const on = t.getAttribute("href") === "#" + id;
    t.classList.toggle("on", on);
    if (on) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
  });
  let ticking = false;
  const spy = () => {
    ticking = false;
    const line = window.innerHeight * 0.4;
    let current = screens[0];
    screens.forEach((s) => { if (s.getBoundingClientRect().top <= line) current = s; });
    setActive(current.id);
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(spy); }
  }, { passive: true });
  spy();
})();
