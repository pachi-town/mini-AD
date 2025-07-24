
let storeData = [];
let priceData = {};

const AREA_ALIAS = {
  "近畿": "近畿北陸",
  "北陸": "近畿北陸"
};

Promise.all([
  fetch('store.json').then(res => res.json()),
  fetch('prices_by_region.json').then(res => res.json())
]).then(([stores, prices]) => {
  storeData = stores;
  priceData = prices;
  populateSelectors();
  document.getElementById("searchBtn").addEventListener("click", renderResults);
document.getElementById("storeSummary").style.display = "none";
});

function populateSelectors() {
  const prefs = [...new Set(storeData.map(s => s.都道府県))].sort();
  const selPref = document.getElementById("prefectureSelect");
  prefs.forEach(p => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = p;
    selPref.appendChild(opt);
  });

  selPref.addEventListener("change", () => {
    const selected = selPref.value;
    const cities = [...new Set(storeData.filter(s => s.都道府県 === selected).map(s => s.市区町村))].sort();
    const citySel = document.getElementById("citySelect");
    citySel.innerHTML = '<option value="">選択</option>';
    cities.forEach(c => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = c;
      citySel.appendChild(opt);
    });
  });
}

function renderResults() {
  const pref = document.getElementById("prefectureSelect").value;
  const city = document.getElementById("citySelect").value;

  let results = storeData.filter(s =>
    (!pref || s.都道府県 === pref) &&
    (!city || s.市区町村 === city)
  );

  const tbody = document.getElementById("resultBody");
  tbody.innerHTML = "";
  results.forEach(s => {
    const signage = s.サイネージ || "";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${signage}</td><td>${s.店名}</td><td>${s.住所}</td>`;
    tbody.appendChild(tr);
  });

  let multi = 0, single = 0;
  results.forEach(s => {
    const type = s.サイネージ || "";
    if (type.includes("マルチ")) multi++;
    else if (type.includes("1面")) single++;
  });
  const summary = document.getElementById("storeSummary"); summary.style.display = "block"; summary.textContent = `マルチディスプレイ設置店舗：${multi}件 ／ 1面のみ設置店舗：${single}件 ／ 設置店舗合計：${results.length}件`;

  const area = results[0]?.エリア;
  const aliasedArea = AREA_ALIAS[area] || area;
  const prefPrice = priceData[pref];
  const areaPrice = priceData[aliasedArea];
  const nationalPrice = priceData["全国"];

  const priceBody = document.getElementById("priceTableBody");
  priceBody.innerHTML = "";

  function createRow(label, price, emphasize = false) {
    if (!price) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${label}</td>
      <td>${price.ベーシック === "対象外" ? "対象外" : price.ベーシック.toLocaleString() + "円"}</td>
      <td>${price["マルチのみ"] === "対象外" ? "対象外" : price["マルチのみ"].toLocaleString() + "円"}</td>
      <td>${price["POS静止画"] === "対象外" ? "対象外" : price["POS静止画"].toLocaleString() + "円"}</td>
      <td>${price["POS動画"] === "対象外" ? "対象外" : price["POS動画"].toLocaleString() + "円"}</td>
    `;
    if (emphasize) tr.classList.add("prefecture-row");
    priceBody.appendChild(tr);
  }

  if (prefPrice) createRow(pref, prefPrice, true);
  if (pref || city) { if (areaPrice) createRow(aliasedArea, areaPrice); }
  createRow("全国", nationalPrice);
}

// ヘッダー表記の修正をDOM描画後に手動で変更
window.addEventListener("DOMContentLoaded", () => {
  const ths = document.querySelectorAll(".price-panel table thead th");
  if (ths.length >= 5) {
    ths[1].textContent = "マルチ＋1面の店舗に掲載";
    ths[2].textContent = "マルチディスプレイ設置店舗にのみ掲載";
    ths[3].textContent = "POSレジ静止画15秒";
    ths[4].textContent = "POSレジ動画15秒";
  }
});
