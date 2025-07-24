
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

  // 検索結果描画
  const tbody = document.getElementById("resultBody");
  tbody.innerHTML = "";
  results.forEach(s => {
    const signage = s.サイネージ || "";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${signage}</td><td>${s.店名}</td><td>${s.住所}</td>`;
    tbody.appendChild(tr);
  });

  // 店舗件数集計
  let multi = 0, single = 0;
  results.forEach(s => {
    const type = s.サイネージ || "";
    if (type.includes("マルチ")) multi++;
    else if (type.includes("1面")) single++;
  });
  document.getElementById("storeSummary").textContent = `マルチ：${multi}件 ／ 1面：${single}件 ／ 総計：${results.length}店舗`;

  // 金額情報表示
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
      <td>${price.ベーシック.toLocaleString()}円</td>
      <td>${price["マルチのみ"].toLocaleString()}円</td>
      <td>${price["POS静止画"].toLocaleString()}円</td>
      <td>${price["POS動画"].toLocaleString()}円</td>
    `;
    if (emphasize) tr.style.fontSize = "1.3rem";
    priceBody.appendChild(tr);
  }

  // 表示順序: 都道府県 > エリア > 全国
  if (prefPrice) createRow(pref, prefPrice, true);
  if (areaPrice) createRow(aliasedArea, areaPrice);
  createRow("全国", nationalPrice);
}
