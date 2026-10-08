// Shared data and behaviour for the site (and the /redesign drafts).
// Pages only decide how things look; the facts live here once.
(function () {
  // Resolve asset paths from this script's own location, so any page depth works.
  const ASSETS = new URL("../", document.currentScript.src).href;

  const vouchFiles = [
    ["1738.JPEG", "1738.webp"], ["1412.JPEG", "1412.webp"], ["151.JPEG", "151.webp"],
    ["67.jpg", "67.webp"], ["64.png", "64.webp"], ["65.png", "65.webp"], ["66.png", "66.webp"],
    ["61.png", "61.webp"], ["62.png", "62.webp"], ["63.png", "63.webp"], ["59.png", "59.webp"],
    ["56.png", "56.webp"], ["57.png", "57.webp"], ["58.png", "58.webp"], ["54.png", "54.webp"],
    ["55.png", "55.webp"], ["53.png", "53.webp"], ["52.png", "52.webp"], ["51.png", "51.webp"],
    ["50.png", "50.webp"], ["49.png", "49.webp"], ["48.png", "48.webp"], ["47.png", "47.webp"],
    ["46.png", "46.webp"], ["45.png", "45.webp"], ["44.png", "44.webp"], ["43.png", "43.webp"],
    ["42.png", "42.webp"], ["41.png", "41.webp"], ["40.png", "40.webp"], ["39.png", "39.webp"],
    ["38.png", "38.webp"], ["37.png", "37.webp"], ["36.png", "36.webp"], ["35.png", "35.webp"],
    ["34.png", "34.webp"], ["32.jpg", "32.webp"], ["31.jpg", "31.webp"], ["30.jpg", "30.webp"],
    ["29.jpg", "29.webp"], ["28.jpg", "28.webp"], ["27.jpg", "27.webp"], ["26.jpg", "26.webp"],
    ["24.png", "24.webp"], ["23.jpg", "23.webp"], ["22.jpg", "22.webp"], ["20.jpg", "20.webp"],
    ["19.jpg", "19.webp"], ["18.jpg", "18.webp"], ["16.JPEG", "16.webp"], ["14.jpg", "14.webp"],
    ["13.jpeg", "13.webp"], ["12.jpeg", "12.webp"], ["11.jpeg", "11.webp"], ["10.jpg", "10.webp"],
    ["9.jpg", "9.webp"], ["8.jpg", "8.webp"], ["7.jpg", "7.webp"], ["6.jpg", "6.webp"],
    ["5.jpg", "5.webp"], ["4.jpg", "4.webp"], ["3.jpg", "3.webp"], ["2.jpg", "2.webp"],
    ["1.jpg", "1.webp"]
  ];

  const vouches = vouchFiles.map(([full, thumb]) => ({
    full: ASSETS + "images/vouches/full/" + full,
    thumb: ASSETS + "images/vouches/thumbs/" + thumb
  }));

  const links = {
    menu: "https://t.me/addlist/u3J2k7PsK3w5MzQx",
    telegram: "https://t.me/TurntUpTerp",
    facetime: "https://t.me/TurntUpTerp?text=" + encodeURIComponent("Hey, I'd like to schedule a quick FaceTime to see my order before I buy"),
    menuImage: ASSETS + "images/menu/menu-r2.webp",
    ask: (product) => "https://t.me/TurntUpTerp?text=" + encodeURIComponent("Hey, I'm interested in the " + product + ". What's available right now?")
  };

  // Copied from the 10/3/26 menu image. Update here and every draft follows.
  const menu = {
    updated: "Oct 3",
    weights: ["1g", "3.5g", "7g", "14g", "28.5g"],
    categories: [
      {
        id: "rosin", name: "Live Rosin", note: "100% solventless", render: "rosin",
        blurb: "Pressed from fresh-frozen ice water hash. No solvents, ever.",
        from: 30, unit: "g",
        strains: [
          { name: "Banana Cake", type: "I-H", micron: "90–120µ", prices: [45, 130, 230, 380, 650] },
          { name: "Sour Diesel", type: "S", micron: "90–120µ", prices: [35, 95, 165, 270, 460] },
          { name: "Trop Cherry", type: "S-H", micron: "90–120µ", prices: [30, 85, 160, 260, 445] },
          { name: "Papaya", type: "I", micron: "90–120µ", prices: [30, 85, 150, 245, 420] },
          { name: "White Truffle", type: "I-H", micron: "73–90µ", prices: [30, 80, 145, 235, 400] }
        ]
      },
      {
        id: "diamonds", name: "Diamonds", note: "THCa crystalline", render: "diamonds",
        blurb: "Clear THCa crystal. The strongest value per gram on the menu.",
        from: 15, unit: "g",
        strains: [
          { name: "Purple Punch", type: "I" },
          { name: "Trop Cherry", type: "S-H" },
          { name: "Slurricane", type: "I" }
        ],
        prices: [15, 35, 50, 85, 140]
      },
      {
        id: "sift", name: "Static Sift", note: "Dry sift hash", render: "sift",
        blurb: "Trichome heads separated dry, then cleaned up with static.",
        from: 30, unit: "g",
        strains: [
          { name: "Oreoz", type: "I-H" },
          { name: "Kush Mints", type: "H" },
          { name: "Sour Apple", type: "S-H" },
          { name: "White Truffle", type: "I-H" }
        ],
        prices: [30, 115, 185, 250, 450]
      },
      {
        id: "resin", name: "Live Resin", note: "Sauce & diamonds", render: "sauce",
        blurb: "Fresh-frozen extract with the terps left in. Budget pick.",
        from: 20, unit: "g",
        strains: [
          { name: "Mimosa", type: "S-H" },
          { name: "Chemdawg", type: "H" },
          { name: "Zoap", type: "H" }
        ],
        prices: [20, 40, 55, 80, 145]
      },
      {
        id: "crumble", name: "BHO Crumble", note: "Budget friendly", render: "crumble",
        blurb: "Dry, easy-to-handle crumble priced by the half and full zip.",
        from: 65, unit: "½ zip",
        strains: [
          { name: "Northern Lights", type: "I" },
          { name: "Oreoz", type: "I-H" }
        ],
        tiers: [["1/2 zip", 65], ["1 zip", 85], ["2 zip", 145]]
      },
      {
        id: "disposable", name: "Disposables", note: "2g melted diamond", render: null,
        blurb: "Melted-diamond 2g disposables. Cheaper the more you grab.",
        from: 20, unit: "ea",
        strains: [
          { name: "Blue Zushi", type: "I-H" },
          { name: "Trop Cherry", type: "S-H" },
          { name: "Zkittlez", type: "I-H" }
        ],
        tiers: [["1+ each", 30], ["5+ each", 25], ["10+ each", 20]]
      }
    ],
    types: { "I": "Indica", "I-H": "Indica hybrid", "H": "Hybrid", "S-H": "Sativa hybrid", "S": "Sativa" }
  };

  const shipping = {
    cutoff: "2 PM PT",
    rows: [
      ["Standard (US)", "2–5 business days", "$15"],
      ["Overnight (US)", "Next day", "$50"],
      ["Worldwide", "7–21 days", "$25–35"]
    ]
  };

  // Same-day cutoff: Monday–Saturday before 2 PM Pacific.
  function shipStatus(now) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
    }).formatToParts(now || new Date());
    const get = (type) => (parts.find((p) => p.type === type) || {}).value;
    const day = get("weekday");
    const minutes = (Number(get("hour")) % 24) * 60 + Number(get("minute"));
    const cutoff = 14 * 60;

    if (day !== "Sun" && minutes < cutoff) {
      const left = cutoff - minutes;
      const h = Math.floor(left / 60);
      const m = left % 60;
      const clock = (h ? h + "h " : "") + m + "m";
      return { today: true, clock, next: "today", text: "Order in the next " + clock + " and it ships today" };
    }
    const next = day === "Sat" || day === "Sun" ? "Monday" : "tomorrow";
    return { today: false, clock: "", next, text: "Order now and it ships " + next };
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else node.setAttribute(key, value);
    });
    (children || []).forEach((child) => child && node.appendChild(child));
    return node;
  }

  function vouchButton(index, className) {
    const v = vouches[index];
    const img = el("img", {
      src: v.thumb, alt: "Customer vouch " + (index + 1), loading: index < 8 ? "eager" : "lazy", decoding: "async"
    });
    const button = el("button", {
      type: "button", class: className || "", "aria-label": "Open customer vouch " + (index + 1) + " of " + vouches.length
    }, [img]);
    button.addEventListener("click", () => openViewer(index));
    return button;
  }

  // A scroll-driven product animation (motion.js) with the settled frame as its poster.
  function motionBox(name, mode, alt, className) {
    const img = el("img", {
      src: ASSETS + "motion/" + name + "/poster.webp", alt: alt || "", width: "640", height: "640", loading: "lazy", decoding: "async"
    });
    return el("div", { class: "motion" + (className ? " " + className : ""), "data-seq": name, "data-mode": mode || "view" }, [img]);
  }

  // ------------------------------------------------------------ vouch viewer
  let current = 0;
  const dialog = () => document.querySelector("#vouchViewer");

  function renderViewer() {
    const img = document.querySelector("#vvImg");
    const count = document.querySelector("#vvCount");
    img.src = vouches[current].full;
    img.alt = "Customer vouch " + (current + 1) + " of " + vouches.length;
    if (count) count.textContent = (current + 1) + " / " + vouches.length;
    [1, -1].forEach((step) => {
      const pre = new Image();
      pre.src = vouches[(current + step + vouches.length) % vouches.length].full;
    });
  }

  function step(delta) {
    current = (current + delta + vouches.length) % vouches.length;
    renderViewer();
  }

  function openViewer(index) {
    const d = dialog();
    if (!d) return;
    current = index;
    renderViewer();
    d.showModal();
  }

  function wireViewer() {
    const d = dialog();
    if (!d) return;
    document.querySelector("#vvClose").addEventListener("click", () => d.close());
    document.querySelector("#vvPrev").addEventListener("click", () => step(-1));
    document.querySelector("#vvNext").addEventListener("click", () => step(1));
    d.addEventListener("click", (event) => { if (event.target === d) d.close(); });
    d.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });
    d.addEventListener("close", () => document.querySelector("#vvImg").removeAttribute("src"));
    let startX = null;
    d.addEventListener("touchstart", (event) => { startX = event.changedTouches[0].clientX; }, { passive: true });
    d.addEventListener("touchend", (event) => {
      if (startX === null) return;
      const distance = event.changedTouches[0].clientX - startX;
      if (Math.abs(distance) > 55) step(distance > 0 ? -1 : 1);
      startX = null;
    }, { passive: true });
  }

  // ------------------------------------------------------------ dismissible notice
  function wireNotices() {
    document.querySelectorAll("[data-notice]").forEach((notice) => {
      const key = "tt-notice-" + notice.dataset.notice;
      try {
        if (localStorage.getItem(key)) notice.hidden = true;
      } catch (error) { /* storage blocked: just show it */ }
      const close = notice.querySelector("[data-notice-close]");
      if (close) {
        close.addEventListener("click", () => {
          notice.hidden = true;
          try { localStorage.setItem(key, "1"); } catch (error) { /* ignore */ }
        });
      }
    });
  }

  // ------------------------------------------------------------ live shipping status
  function wireShipStatus() {
    const targets = document.querySelectorAll("[data-ship-status]");
    if (!targets.length) return;
    const update = () => {
      const status = shipStatus();
      targets.forEach((node) => {
        const mode = node.dataset.shipStatus;
        node.textContent = mode === "clock" ? (status.today ? status.clock : "Ships " + status.next) : status.text;
        node.dataset.today = status.today ? "1" : "0";
      });
    };
    update();
    setInterval(update, 30000);
  }

  // Drafts never report analytics; leave.js still calls track() if it exists.
  // Analytics: only pages that load Google Analytics report anything (the drafts don't).
  window.track = function (label) {
    if (typeof window.gtag === "function") {
      window.gtag("event", "button_click", { event_category: "engagement", event_label: label });
    }
  };
  document.addEventListener("click", (event) => {
    const link = event.target.closest && event.target.closest(".track-link");
    if (link) window.track(link.dataset.label || "link");
  });

  window.TT = { vouches, links, menu, shipping, shipStatus, el, vouchButton, openViewer, motionBox };

  document.addEventListener("DOMContentLoaded", () => {
    wireViewer();
    wireNotices();
    wireShipStatus();
  });
})();
