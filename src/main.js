import "./style.css";
import { dimensions } from "./data/layout.js";
import f1 from "./data/floor1-layout.js";
import f2 from "./data/floor2-layout.js";
import { createScene } from "./scene.js";
import { faqs } from "./data/faq-data.js";
import { quizzes, scoreAnswers } from "./data/quiz-data.js";
import { books, printCost, rules } from "./data/library-content.js";
import { tour, borrowPath, missions } from "./data/tour-paths.js";
const areas = [...f1, ...f2],
  $ = (s) => document.querySelector(s);
const safe = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function load(k, def) {
  try {
    return JSON.parse(localStorage.getItem(k)) || def;
  } catch {
    return def;
  }
}
let progress = load("ym-progress", {
    nickname: "新生探險家",
    visited: [],
    completed: [],
    score: null,
    wrong: [],
    seconds: 0,
    last: null,
  }),
  prefs = load("ym-settings", {
    sound: false,
    device: "自動",
    layout: "標準",
    language: "繁體中文",
    font: "標準",
    performance: "標準",
    speed: 1,
  });
let floor = 1,
  selected = null,
  scene,
  borrowStep = 0,
  tourTimer = null,
  tourIndex = 0;
const started = Date.now();
const icon = (s) =>
  ({
    book: "▥",
    map: "◈",
    home: "⌂",
    settings: "⚙",
    help: "?",
    sun: "☀",
    expand: "⛶",
    rotate: "↻",
    target: "⌖",
    play: "▷",
  })[s] || s;
$("#app").innerHTML =
  `<header><a class="brand" href="./"><span class="brand-mark">▥</span><span>楊梅高中圖書館<small>YANGMEI LIBRARY · EXPLORE & DISCOVER</small></span></a><nav><button class="active" data-tab="explore">探索圖書館</button><button data-tab="missions">新生探險 <span class="dot"></span></button><button data-tab="faq">利用教育</button><button data-tab="progress">我的學習</button></nav><div class="header-right"><span class="open-status">08:00 — 16:00</span><button id="settings" class="icon-button" aria-label="開啟設定">⚙</button></div></header>
<main><aside class="sidebar"><div class="eyebrow">YOUR READING ADVENTURE</div><h1>閱讀，從探索開始。</h1><p class="muted">轉個角度，發現圖書館的新風景。</p><div class="floor-switch"><button data-floor="1" class="active">1F <span>探索與交流</span></button><button data-floor="2">2F <span>書海與閱讀</span></button></div><label class="search"><span>⌕</span><input id="space-search" placeholder="搜尋空間或設施…" aria-label="搜尋空間"></label><div class="list-heading">空間目錄 <span id="area-count"></span></div><div id="space-list"></div><div class="sidebar-bottom"><span class="tiny-leaf">✦</span><b>每一個角落，都有新發現。</b><p>點選空間，開始你的閱讀冒險。</p></div></aside>
<section class="stage"><div class="stage-heading"><div><span class="eyebrow">LIBRARY EXPLORER</span><h2>一座圖書館，無限的可能<span>3D 互動探索島</span></h2></div><span class="pill">示意比例模型</span></div><div class="view-tabs"><button data-mode="full">完整建築</button><button class="active" data-mode="exploded">樓層展開</button><button data-mode="top">樓層俯視</button><button data-mode="floor">室內探索</button><button data-mode="compare">2D / 3D 對照</button><button data-mode="validate">配置驗證</button></div><div class="canvas-layout"><div id="map-panel" hidden><div class="map-title">圖面座標示意 <b id="map-floor">1F</b></div><svg id="floor-map" viewBox="0 0 1000 562" aria-label="樓層互動配置示意圖"></svg><p>依對話配置圖重繪，非原始 PNG。北 ↑，南側大門 ↓</p><label>疊合透明度 <input id="opacity" type="range" min="0" max="1" step=".05" value=".6"></label><div id="calibrate" hidden><label>載入原始配置圖（僅本機）<input id="original-map" type="file" accept="image/png,image/jpeg"></label><p>選取區域後調整示意座標；橘框為原始資料、綠框為調整值。僅供人工校正，非自動差異判定。</p><label>X <input id="adjust-x" type="number" step=".005"></label><label>Y <input id="adjust-y" type="number" step=".005"></label><button id="apply-adjust">套用座標</button><button id="reset-adjust">還原</button><button id="export-layout">匯出座標</button></div></div><div id="scene"><div class="compass">N<span>↑</span></div><div class="scene-note"><span class="live-dot"></span> 自由探索中 <small>拖曳旋轉 · 滾輪縮放 · 點選空間</small></div><div class="floor-badge"><b>2F</b> 書庫・閱讀空間<br><b>1F</b> 交流・學習空間</div></div></div><div class="scene-controls"><button id="reset-view" title="返回全景">⌂ <span>返回全景</span></button><button id="top-view" title="鳥瞰">⌖ <span>鳥瞰</span></button><button id="auto-rotate" aria-pressed="false">↻ <span>自動旋轉</span></button><button id="night" aria-pressed="false">☀ <span>日夜</span></button><button id="labels" aria-pressed="true">Aa <span>標籤</span></button><button id="fullscreen">⛶ <span>全螢幕</span></button><label class="gap-label">樓層間距 <input id="gap" type="range" min="6" max="16" value="8"></label></div><footer class="stage-footer"><span>以真實配置為依據，讓閱讀的第一步更有趣。</span><button id="start-tour">▷ 開始自動導覽</button></footer></section>
<aside class="info-panel"><div class="info-top"><span class="eyebrow">DISCOVER THIS SPACE</span><button id="collapse-info" aria-label="收合空間資訊">−</button></div><div class="room-illustration"><span>1F</span><div class="mini-books"><i></i><i></i><i></i><i></i><i></i></div><small>YOUR NEXT CHAPTER</small></div><div id="room-info"></div><section class="mission-teaser"><div class="eyebrow">新生專屬任務</div><h3>準備好探索了嗎？</h3><p>找到空間、學會借書，收集你的閱讀徽章。</p><div class="progress-track"><i id="mini-progress"></i></div><div class="mission-status"><span id="mission-count">0 / 6 個任務</span><button id="open-missions">開始探險 →</button></div></section><div class="library-hours"><span>◷</span><div><b>開館時間 08:00–16:00</b><p>借書請攜學生證，16:00 前完成。</p></div></div></aside></main><div id="toast" role="status"></div><dialog id="modal"><div class="modal-heading"><h2 id="modal-title"></h2><button id="close-modal" aria-label="關閉視窗">×</button></div><div id="modal-body"></div></dialog>`;
function persist() {
  progress.last = new Date().toISOString();
  localStorage.setItem("ym-progress", JSON.stringify(progress));
  updateProgress();
}
function updateProgress() {
  $("#mini-progress").style.width = (progress.completed.length / 6) * 100 + "%";
  $("#mission-count").textContent = `${progress.completed.length} / 6 個任務`;
}
function complete(id) {
  if (progress.completed.includes(id)) return;
  progress.completed.push(id);
  toast("任務完成！獲得 100 積分");
  persist();
  if (prefs.sound) {
    const ctx = new AudioContext(),
      o = ctx.createOscillator(),
      g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.value = 0.08;
    o.frequency.value = 660;
    o.start();
    o.stop(ctx.currentTime + 0.2);
    o.onended = () => ctx.close();
  }
}
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("show"), 3000);
}
function modal(title, html) {
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = html;
  if (!$("#modal").open) $("#modal").showModal();
}
$("#close-modal").onclick = () => {
  $("#modal").close();
  speechSynthesis?.cancel();
};
$("#modal").addEventListener("click", (e) => {
  if (e.target === $("#modal")) $("#modal").close();
});
function list() {
  const term = $("#space-search").value.trim();
  const shown = areas.filter((a) => a.floor === floor && a.name.includes(term));
  $("#area-count").textContent = String(shown.length).padStart(2, "0");
  $("#space-list").innerHTML = shown.length
    ? shown
        .map(
          (a) =>
            `<button data-area="${a.id}" class="space-item ${selected === a.id ? "selected" : ""}"><span class="category-icon ${a.category}">${a.category === "閱讀" ? "▤" : a.category === "樓梯" ? "↗" : a.category === "書庫" ? "▥" : "◇"}</span><span>${a.name}<small>${a.category}空間</small></span><span class="list-arrow">›</span></button>`,
        )
        .join("")
    : '<p class="muted">找不到符合的空間。</p>';
  $("#space-list")
    .querySelectorAll("[data-area]")
    .forEach((b) => (b.onclick = () => select(b.dataset.area)));
}
const originalMaps = {};
function drawMap() {
  const shown = areas.filter((a) => a.floor === floor);
  $("#map-floor").textContent = floor + "F";
  $("#floor-map").innerHTML =
    `${originalMaps[floor] ? `<image href="${originalMaps[floor]}" x="0" y="0" width="1000" height="562"/>` : ""}<rect x="5" y="5" width="990" height="552" fill="${originalMaps[floor] ? "none" : "#fffdf7"}" stroke="#608c81"/>` +
    shown
      .map((a) => {
        const b = a.mapBounds;
        return `<g data-map="${a.id}" tabindex="0" role="button" aria-label="${a.name}"><rect x="${b.x * 1000}" y="${b.y * 562}" width="${b.w * 1000}" height="${b.h * 562}" fill-opacity="${originalMaps[floor] ? 0.35 : 1}" fill="${selected === a.id ? "#f5c281" : a.category === "書庫" ? "#c8b192" : "#d7e7df"}" stroke="${selected === a.id ? "#bf713a" : "#89ab9f"}"/><text x="${(b.x + b.w / 2) * 1000}" y="${(b.y + b.h / 2) * 562}" text-anchor="middle" font-size="${b.w < 0.08 ? 12 : 16}" fill="#294a42">${a.name}</text></g>`;
      })
      .join("");
  if (scene?.mode === "validate") {
    const blob = new Blob(
      [new XMLSerializer().serializeToString($("#floor-map"))],
      { type: "image/svg+xml" },
    );
    const url = URL.createObjectURL(blob);
    scene.overlay(originalMaps[floor] || url, $("#opacity").value);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  $("#floor-map")
    .querySelectorAll("[data-map]")
    .forEach((g) => {
      g.onclick = () => select(g.dataset.map);
      g.onkeydown = (e) => {
        if (e.key === "Enter") select(g.dataset.map);
      };
    });
}
function setFloor(f) {
  floor = +f;
  document
    .querySelectorAll("[data-floor]")
    .forEach((b) => b.classList.toggle("active", +b.dataset.floor === floor));
  list();
  drawMap();
}
function select(id, focus = true) {
  const a = areas.find((a) => a.id === id);
  if (!a) return;
  selected = id;
  setFloor(a.floor);
  scene?.select(id, focus);
  if (!progress.visited.includes(id)) {
    progress.visited.push(id);
    persist();
  }
  if (id === "entrance") complete(0);
  if (id === "catalog") complete(1);
  if (id.startsWith("shelf") && progress.visited.includes("stairs1"))
    complete(2);
  if (id === "special") complete(4);
  $(".info-panel").classList.remove("collapsed");
  $("#collapse-info").textContent = "−";
  $(".room-illustration>span").textContent = a.floor + "F";
  $("#room-info").innerHTML =
    `<div class="room-kicker">${a.floor}F · ${a.category}</div><h2>${a.name}</h2><p>${a.description || "安靜閱讀、自在探索。請愛護設備並保持環境整潔；空間為依圖面建立的示意比例。"}</p><div class="room-tags"><span>可互動探索</span><span>${a.floor === 1 ? "一樓" : "二樓"}空間</span></div><button class="primary wide" id="room-action">${a.interactionType === "stairs" ? "前往 " + (a.floor === 1 ? "2F" : "1F") + " →" : a.interactionType === "catalog" ? "開啟模擬圖書查詢 →" : a.interactionType === "print" ? "計算影印與列印費用 →" : a.interactionType === "borrow" ? "開始模擬借書 →" : a.interactionType === "book" ? "選取示範書籍 →" : "⌖ 聚焦這個空間"}</button><button class="text-button" id="speak">♫ 聽聽空間介紹</button>`;
  $("#room-action").onclick = () => {
    switch (a.interactionType) {
      case "stairs":
        setFloor(a.floor === 1 ? 2 : 1);
        setMode("floor");
        select(a.floor === 1 ? "shelf4" : "counter");
        break;
      case "catalog":
        catalog();
        break;
      case "print":
        printer();
        break;
      case "borrow":
        borrowStep = 0;
        borrow();
        break;
      case "book":
        catalog();
        break;
      default:
        scene.select(id);
    }
  };
  $("#speak").onclick = () =>
    speak(a.name + "。" + (a.description || "請安靜閱讀、愛護設備。"));
  $("#adjust-x").value = a.mapBounds.x;
  $("#adjust-y").value = a.mapBounds.y;
}
function speak(text) {
  if (!("speechSynthesis" in window)) {
    toast("此瀏覽器不支援語音解說");
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-TW";
  u.rate = +prefs.speed;
  speechSynthesis.speak(u);
}
function setMode(mode) {
  document
    .querySelectorAll("[data-mode]")
    .forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  $("#map-panel").hidden = !["compare", "validate"].includes(mode);
  $("#calibrate").hidden = mode !== "validate";
  $("#map-panel").classList.toggle("validation", mode === "validate");
  scene.setMode(mode, floor);
  drawMap();
}
function catalog() {
  modal(
    "模擬館藏查詢",
    `<p class="notice">教學示範資料，並非學校真實館藏。實際查詢請由學校首頁進入「圖書館圖書查詢」。</p><form id="catalog-form" class="inline-form"><select id="search-type" aria-label="查詢類型"><option value="keyword">關鍵字</option><option value="isbn">ISBN</option><option value="title">書名</option></select><input id="book-query" placeholder="輸入書名、ISBN 或關鍵字" aria-label="查詢內容"><button class="primary">查詢</button></form><div id="book-results"></div>`,
  );
  const results = () => {
    const term = $("#book-query").value.trim(),
      type = $("#search-type").value;
    const found = books.filter((b) =>
      (type === "keyword" ? Object.values(b).join(" ") : b[type]).includes(
        term,
      ),
    );
    $("#book-results").innerHTML = found.length
      ? found
          .map(
            (b) =>
              `<article class="book-result"><div class="book-cover">${b.title.slice(0, 2)}</div><div><small>示範書目</small><h3>${b.title}</h3><p>${b.author} · ISBN ${b.isbn}<br>${b.location}</p><button data-choose="${b.isbn}">選取此書，練習借閱 →</button></div></article>`,
          )
          .join("")
      : "<p>沒有符合的示範書目。</p>";
    document.querySelectorAll("[data-choose]").forEach(
      (b) =>
        (b.onclick = () => {
          borrowStep = 0;
          borrow();
        }),
    );
  };
  $("#catalog-form").onsubmit = (e) => {
    e.preventDefault();
    results();
  };
  results();
}
function printer() {
  modal(
    "數位服務・費用試算",
    `<p>影印與列印：黑白每頁 2 元、彩色每頁 6 元。掃描只需過卡，不收費。自備悠遊卡，餘額須 10 元以上。</p><label>服務<select id="print-service"><option>影印</option><option>列印</option><option>掃描</option></select></label><label>色彩<select id="print-type"><option value="bw">黑白</option><option value="color">彩色</option></select></label><label>頁數<input id="pages" type="number" value="1" min="1" max="9999"></label><output id="cost" class="cost"></output>`,
  );
  const calc = () => {
    const scan = $("#print-service").value === "掃描";
    $("#print-type").disabled = scan;
    $("#cost").textContent =
      `試算費用 NT$ ${printCost($("#pages").value, scan ? "scan" : $("#print-type").value)}`;
  };
  ["#print-service", "#print-type", "#pages"].forEach(
    (s) => ($(s).oninput = calc),
  );
  calc();
}
const borrowLabels = [
  "從一樓大門進館",
  "前往東南側樓梯",
  "在二樓書庫選書",
  "沿樓梯返回一樓",
  "到借還書櫃台出示學生證",
  "完成借書",
];
function borrow() {
  const id = borrowPath[Math.min(borrowStep, 4)];
  select(id);
  scene.drawRoute(borrowPath.slice(0, Math.min(borrowStep + 2, 5)));
  modal(
    "模擬借書・跟著路線走",
    `<div class="steps">${borrowLabels.map((l, i) => `<span class="${i <= borrowStep ? "done" : ""}">${i + 1}. ${l}</span>`).join("")}</div><h3>${borrowLabels[borrowStep]}</h3><p>每人最多 4 本、借期 2 週。續借請在到期前 1～2 日辦理，可續借 2 週。請於開放日 16:00 前完成借書。</p>${borrowStep === 4 ? '<label><input id="student-card" type="checkbox"> 我已出示學生證（教學模擬）</label>' : ""}${borrowStep < 5 ? '<button class="primary" id="borrow-next">' + (borrowStep === 4 ? "完成借書" : "沿路線前往下一站 →") + "</button>" : '<p class="success">借閱完成！記得在到期前歸還。</p><button id="borrow-finish">返回探索</button>'}`,
  );
  if (borrowStep < 5)
    $("#borrow-next").onclick = () => {
      if (borrowStep === 4 && !$("#student-card").checked) {
        toast("請先出示學生證");
        return;
      }
      borrowStep++;
      if (borrowStep === 5) complete(3);
      borrow();
    };
  else $("#borrow-finish").onclick = () => $("#modal").close();
}
function missionPanel() {
  modal(
    "圖書館新生探險",
    `<p>探索六個關卡，每完成一關獲得 100 積分。進度儲存在此瀏覽器。</p><div class="mission-grid">${missions.map((m, i) => `<button data-mission="${i}" class="mission-card ${progress.completed.includes(i) ? "done" : ""}"><span>${progress.completed.includes(i) ? "✓" : String(i + 1).padStart(2, "0")}</span><h3>${m[0]}</h3><p>${m[1]}</p><small>100 積分 ${progress.completed.includes(i) ? "・已完成" : "→"}</small></button>`).join("")}</div>${progress.completed.length === 6 ? '<div class="badge">✦ 楊梅高中圖書館探索達人 ✦<p>600 積分・六個關卡全數完成</p></div>' : ""}`,
  );
  document.querySelectorAll("[data-mission]").forEach(
    (b) =>
      (b.onclick = () => {
        const i = +b.dataset.mission;
        $("#modal").close();
        if (i === 3) {
          borrowStep = 0;
          borrow();
        } else if (i === 5) quiz();
        else select(["entrance", "catalog", "stairs1", null, "special"][i]);
      }),
  );
}
function faqPanel() {
  modal(
    "圖書館利用教育",
    `<div class="education-tabs"><button id="faq-tab">11 題常見問題</button><button id="rules-tab">完整館規</button><button id="quiz-tab">學習測驗</button><a href="${import.meta.env.BASE_URL}materials/library-guide.pdf" target="_blank" rel="noopener">原始教材 PDF ↗</a></div><div id="education-content"></div>`,
  );
  const showFaq = () => {
    $("#education-content").innerHTML =
      '<div class="inline-form"><input id="faq-search" placeholder="搜尋常見問題" aria-label="搜尋常見問題"><select id="faq-category"><option>全部</option>' +
      [...new Set(faqs.map((f) => f.category))]
        .map((c) => `<option>${c}</option>`)
        .join("") +
      '</select></div><div id="faq-list"></div>';
    const filter = () => {
      $("#faq-list").innerHTML = faqs
        .filter(
          (f) =>
            (f.question + f.answer).includes($("#faq-search").value) &&
            ($("#faq-category").value === "全部" ||
              f.category === $("#faq-category").value),
        )
        .map(
          (f) =>
            `<details><summary><b>${f.id}</b> ${f.question}</summary><p>${f.answer}</p><button data-say="${f.id}">朗讀解答</button></details>`,
        )
        .join("");
      document.querySelectorAll("[data-say]").forEach(
        (b) =>
          (b.onclick = () => {
            const f = faqs.find((x) => x.id === b.dataset.say);
            speak(f.question + f.answer);
          }),
      );
    };
    $("#faq-search").oninput = filter;
    $("#faq-category").onchange = filter;
    filter();
  };
  $("#faq-tab").onclick = showFaq;
  $("#rules-tab").onclick = () =>
    ($("#education-content").innerHTML = rules
      .map(
        ([t, c]) => `<article class="rule"><h3>${t}</h3><p>${c}</p></article>`,
      )
      .join(""));
  $("#quiz-tab").onclick = quiz;
  showFaq();
}
function quiz() {
  modal(
    "閱讀通行證・利用教育測驗",
    `<form id="quiz-form">${quizzes.map((q, i) => `<fieldset><legend>${i + 1}. ${q.q}</legend>${q.options.map((o, j) => `<label class="quiz-option"><input required type="radio" name="q${i}" value="${j}">${o}</label>`).join("")}</fieldset>`).join("")}<button class="primary">送出答案</button></form>`,
  );
  $("#quiz-form").onsubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target),
      answers = quizzes.map((_, i) => +data.get("q" + i));
    progress.score = scoreAnswers(answers);
    progress.wrong = quizzes.flatMap((q, i) =>
      q.answer === answers[i] ? [] : [i],
    );
    if (progress.score === 100) complete(5);
    persist();
    modal(
      "測驗結果",
      `<div class="score">${progress.score}<small>分</small></div><p>${progress.score === 100 ? "全部答對，閱讀通行證到手！" : "看看解答，再來挑戰一次！"}</p>${quizzes.map((q, i) => `<article class="rule"><h3>${answers[i] === q.answer ? "✓" : "×"} ${q.q}</h3><p>${q.explanation}</p></article>`).join("")}<button id="retry-quiz">重新挑戰</button>`,
    );
    $("#retry-quiz").onclick = quiz;
  };
}
function exportFile(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function progressPanel() {
  persist();
  modal(
    "我的學習歷程",
    `<label>探險暱稱<input id="nickname" maxlength="30" value="${safe(progress.nickname)}"></label><div class="stats"><div><b>${progress.visited.length}</b>已探索空間</div><div><b>${progress.completed.length * 100}</b>任務積分</div><div><b>${progress.score ?? "—"}</b>測驗分數</div></div><p>探索時間：${Math.floor(progress.seconds / 60)} 分 ${progress.seconds % 60} 秒<br>最近學習：${new Date(progress.last).toLocaleString("zh-TW")}</p><p>錯誤題目：${progress.wrong.length ? progress.wrong.map((i) => quizzes[i].q).join("、") : "尚無錯題紀錄"}</p>${progress.completed.length === 6 ? '<div class="badge">楊梅高中圖書館探索達人</div>' : ""}<div class="export-actions"><button id="export-json">匯出 JSON</button><button id="export-csv">匯出 CSV</button><button id="print-progress">列印成果</button><button id="clear-progress">清除紀錄並重新開始</button></div>`,
  );
  $("#nickname").onchange = (e) => {
    progress.nickname = e.target.value || "新生探險家";
    persist();
  };
  $("#export-json").onclick = () =>
    exportFile(
      "library-learning.json",
      JSON.stringify(progress, null, 2),
      "application/json",
    );
  $("#export-csv").onclick = () => {
    const cell = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    exportFile(
      "library-learning.csv",
      "\ufeff" +
        [
          [
            "暱稱",
            "已探索區域",
            "完成關卡",
            "測驗分數",
            "錯誤題號",
            "探索秒數",
            "最近學習",
          ],
          [
            progress.nickname,
            progress.visited.join(";"),
            progress.completed.map((i) => missions[i][0]).join(";"),
            progress.score,
            progress.wrong.map((i) => i + 1).join(";"),
            progress.seconds,
            progress.last,
          ],
        ]
          .map((row) => row.map(cell).join(","))
          .join("\r\n"),
      "text/csv;charset=utf-8",
    );
  };
  $("#print-progress").onclick = () => window.print();
  $("#clear-progress").onclick = () => {
    modal(
      "清除本機學習紀錄",
      `<p>這會移除此瀏覽器中的暱稱、任務與測驗紀錄。可先匯出備份。</p><button id="confirm-clear">確認清除並重新開始</button>`,
    );
    $("#confirm-clear").onclick = () => {
      progress = {
        nickname: "新生探險家",
        visited: [],
        completed: [],
        score: null,
        wrong: [],
        seconds: 0,
        last: null,
      };
      persist();
      progressPanel();
    };
  };
}
function applyPrefs() {
  document.documentElement.style.fontSize =
    { 標準: 16, 大: 18, 特大: 20 }[prefs.font] + "px";
  document.body.dataset.layout = prefs.layout;
  document.body.dataset.device = prefs.device;
  scene?.performance(prefs.performance);
  scene?.speed(prefs.speed);
  localStorage.setItem("ym-settings", JSON.stringify(prefs));
}
function settings() {
  const choices = {
    device: ["自動", "電腦", "觸控"],
    layout: ["標準", "專注", "簡潔"],
    language: ["繁體中文", "English（預留）"],
    font: ["標準", "大", "特大"],
    performance: ["高", "標準", "省電"],
  };
  modal(
    "顯示與操作設定",
    `<div class="settings-grid"><label>全螢幕<button id="settings-fullscreen">${document.fullscreenElement ? "離開全螢幕" : "進入全螢幕"}</button></label><label>音效<input id="sound" type="checkbox" ${prefs.sound ? "checked" : ""}></label>${Object.entries(
      choices,
    )
      .map(
        ([key, values]) =>
          `<label>${{ device: "裝置模式", layout: "版面", language: "語言", font: "字體", performance: "動畫效能" }[key]}<select data-pref="${key}">${values.map((v) => `<option ${prefs[key] === v ? "selected" : ""}>${v}</option>`).join("")}</select></label>`,
      )
      .join(
        "",
      )}<label>動畫／語音速度<input id="speed" type="range" min=".5" max="2" step=".25" value="${prefs.speed}"></label></div><p id="language-note">英文介面預留，教材維持原始繁體中文。</p>`,
  );
  $("#settings-fullscreen").onclick = fullscreen;
  $("#sound").onchange = (e) => {
    prefs.sound = e.target.checked;
    applyPrefs();
  };
  document.querySelectorAll("[data-pref]").forEach(
    (el) =>
      (el.onchange = () => {
        prefs[el.dataset.pref] = el.value;
        applyPrefs();
        if (el.dataset.pref === "language")
          $("#language-note").textContent =
            "English interface is reserved for a future translation. 教材目前維持繁體中文。";
      }),
  );
  $("#speed").oninput = (e) => {
    prefs.speed = +e.target.value;
    applyPrefs();
  };
}
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    toast("目前瀏覽器不允許全螢幕");
  }
}
$("#settings").onclick = settings;
$("#fullscreen").onclick = fullscreen;
$("#space-search").oninput = list;
document.querySelectorAll("[data-floor]").forEach(
  (b) =>
    (b.onclick = () => {
      setFloor(b.dataset.floor);
      setMode("floor");
    }),
);
document
  .querySelectorAll("[data-mode]")
  .forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
$("#reset-view").onclick = () => setMode("exploded");
$("#top-view").onclick = () => setMode("top");
$("#gap").oninput = (e) => scene.setGap(e.target.value);
for (const [id, method] of [
  ["auto-rotate", "rotate"],
  ["night", "night"],
  ["labels", "labels"],
])
  $("#" + id).onclick = (e) => {
    const b = e.currentTarget,
      v = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", v);
    scene[method](v);
  };
$("#collapse-info").onclick = () => {
  const collapsed = $(".info-panel").classList.toggle("collapsed");
  $("#collapse-info").textContent = collapsed ? "+" : "−";
};
$("#open-missions").onclick = missionPanel;
document.querySelectorAll("[data-tab]").forEach(
  (b) =>
    (b.onclick = () => {
      ({
        missions: missionPanel,
        faq: faqPanel,
        progress: progressPanel,
        explore: () => {
          $("#modal").close();
          setMode("exploded");
        },
      })[b.dataset.tab]();
    }),
);
$("#start-tour").onclick = () => {
  if (tourTimer) {
    clearInterval(tourTimer);
    tourTimer = null;
    $("#start-tour").textContent = "▷ 開始自動導覽";
    return;
  }
  const next = () => {
    const id = tour[tourIndex++ % tour.length];
    select(id);
    scene.drawRoute(tour.slice(0, tourIndex % tour.length || tour.length));
    if (prefs.sound) speak(areas.find((a) => a.id === id).name);
  };
  next();
  tourTimer = setInterval(next, 5000 / Number(prefs.speed));
  $("#start-tour").textContent = "Ⅱ 暫停自動導覽";
};
$("#original-map").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    originalMaps[floor] = reader.result;
    drawMap();
    toast("已載入此樓層原始圖，僅留在目前工作階段");
  };
  reader.readAsDataURL(file);
};
$("#opacity").oninput = (e) => {
  scene?.overlayOpacity(e.target.value);
  $("#floor-map").style.opacity = e.target.value;
};
const originals = new Map(areas.map((a) => [a.id, { ...a.mapBounds }]));
$("#apply-adjust").onclick = () => {
  if (!selected) return toast("請先選取區域");
  const a = areas.find((a) => a.id === selected),
    x = +$("#adjust-x").value,
    y = +$("#adjust-y").value;
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 0 ||
    y < 0 ||
    x + a.mapBounds.w > 1 ||
    y + a.mapBounds.h > 1
  )
    return toast("座標範圍需在 0～1 之內");
  const old = { ...a.mapBounds };
  a.mapBounds.x = x;
  a.mapBounds.y = y;
  a.position.x += (x - old.x) * dimensions.width;
  a.position.z += (y - old.y) * dimensions.depth;
  const g = scene.groups.get(a.id);
  g.position.x = a.position.x;
  g.position.z = a.position.z;
  scene.select(a.id, false);
  drawMap();
  const b = originals.get(a.id);
  $("#floor-map").insertAdjacentHTML(
    "beforeend",
    `<rect x="${b.x * 1000}" y="${b.y * 562}" width="${b.w * 1000}" height="${b.h * 562}" fill="none" stroke="#d77739" stroke-width="4"/>`,
  );
  toast("已套用本次工作階段的示意座標");
};
$("#reset-adjust").onclick = () => {
  if (!selected) return;
  const b = originals.get(selected);
  $("#adjust-x").value = b.x;
  $("#adjust-y").value = b.y;
  $("#apply-adjust").click();
};
$("#export-layout").onclick = () =>
  exportFile(
    "library-layout.json",
    JSON.stringify(areas, null, 2),
    "application/json",
  );
try {
  scene = createScene($("#scene"), areas, (id) => select(id));
  applyPrefs();
  select("newbooks", false);
  if (matchMedia("(max-width:650px)").matches) {
    $(".info-panel").classList.add("collapsed");
    $("#collapse-info").textContent = "+";
  }
} catch (e) {
  console.error(e);
  $("#scene").insertAdjacentHTML(
    "beforeend",
    '<div class="webgl-error">無法啟動 WebGL。請啟用瀏覽器硬體加速；仍可使用空間目錄、FAQ 與學習功能。</div>',
  );
  list();
}
updateProgress();
drawMap();
setInterval(() => {
  progress.seconds += 10;
  persist();
}, 10000);
window.addEventListener("beforeunload", persist);
