
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
  const areaSelect = document.getElementById("areaSelect");
  const areaSet = [...new Set(storeData.map(s => s.エリア))].sort();
  areaSet.forEach(area => {
    const opt = document.createElement("option");
    opt.value = area;
    opt.textContent = area;
    areaSelect.appendChild(opt);
  });

  const selPref = document.getElementById("prefectureSelect");
  const selCity = document.getElementById("citySelect");

  areaSelect.addEventListener("change", () => {
    const selectedArea = areaSelect.value;
    const prefs = [...new Set(storeData.filter(s => !selectedArea || s.エリア === selectedArea).map(s => s.都道府県))].sort();
    selPref.innerHTML = '<option value="">選択</option>';
    prefs.forEach(p => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = p;
      selPref.appendChild(opt);
    });
    selCity.innerHTML = '<option value="">選択</option>';
  });

  selPref.addEventListener("change", () => {
    const selectedPref = selPref.value;
    const cities = [...new Set(storeData.filter(s => !selectedPref || s.都道府県 === selectedPref).map(s => s.市区町村))].sort();
    selCity.innerHTML = '<option value="">選択</option>';
    cities.forEach(c => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = c;
      selCity.appendChild(opt);
    });
  });
}

function renderResults() {
  const area = document.getElementById("areaSelect").value;
  const pref = document.getElementById("prefectureSelect").value;
  const city = document.getElementById("citySelect").value;

  let results = storeData.filter(s =>
    (!area || s.エリア === area) &&
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

  const summary = document.getElementById("storeSummary");
  summary.style.display = "block";
  summary.innerHTML = `
    <span class="label">マルチディスプレイ設置店舗：</span><span class="count">${multi}</span><span class="label">件 ／ </span>
    <span class="label">1面のみ設置店舗：</span><span class="count">${single}</span><span class="label">件 ／ </span>
    <span class="label">設置店舗合計：</span><span class="count">${results.length}</span><span class="label">件</span>
  `;

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
  if (area && areaPrice) createRow(area, areaPrice);
  createRow("全国", nationalPrice);
}
