
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
  const prefs = [...new Set(storeData.map(s => s.都道府県))];
  const selPref = document.getElementById("prefectureSelect");
  prefs.forEach(p => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = p;
    selPref.appendChild(opt);
  });

  selPref.addEventListener("change", () => {
    const selected = selPref.value;
    const cities = [...new Set(storeData.filter(s => s.都道府県 === selected).map(s => s.市区町村))];
    const citySel = document.getElementById("citySelect");
    citySel.innerHTML = '<option value="">市区町村</option>';
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
  const keywordEl = document.getElementById("searchInput");
  const keyword = keywordEl ? keywordEl.value.trim() : "";

  let results = storeData.filter(s =>
    (!pref || s.都道府県 === pref) &&
    (!city || s.市区町村 === city) &&
    (!keyword || s.店名.includes(keyword))
  );

  const tbody = document.getElementById("resultBody");
  tbody.innerHTML = "";
  results.forEach(s => {
    const signage = s.サイネージ || "";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${signage}</td><td>${s.店名}</td><td>${s.住所}</td>`;
    tbody.appendChild(tr);
  });

  document.getElementById("resultCount").textContent = `該当件数：${results.length}`;

  // 価格ロジック（都道府県→エリア→全国）
  const area = results[0]?.エリア;
  const aliasedArea = AREA_ALIAS[area] || area;

  const prefPrice = priceData[pref];
  const areaPrice = priceData[aliasedArea];
  const nationalPrice = priceData["全国"];
  const zone = pref || aliasedArea || '全国';

  if (true) {
    
    let html = '<div><strong>全国：</strong> ベーシック ' + nationalPrice.ベーシック.toLocaleString() + '円 ／ マルチのみ ' + nationalPrice["マルチのみ"].toLocaleString() + '円 ／ POS静止画 ' + nationalPrice["POS静止画"].toLocaleString() + '円 ／ POS動画 ' + nationalPrice["POS動画"].toLocaleString() + '円</div>';

    if (areaPrice) {
      html += '<div><strong>' + aliasedArea + '：</strong> ベーシック ' + areaPrice.ベーシック.toLocaleString() + '円 ／ マルチのみ ' + areaPrice["マルチのみ"].toLocaleString() + '円 ／ POS静止画 ' + areaPrice["POS静止画"].toLocaleString() + '円 ／ POS動画 ' + areaPrice["POS動画"].toLocaleString() + '円</div>';
    }

    if (prefPrice) {
      html += '<div><strong>' + pref + '：</strong> ベーシック ' + prefPrice.ベーシック.toLocaleString() + '円 ／ マルチのみ ' + prefPrice["マルチのみ"].toLocaleString() + '円 ／ POS静止画 ' + prefPrice["POS静止画"].toLocaleString() + '円 ／ POS動画 ' + prefPrice["POS動画"].toLocaleString() + '円</div>';
    }

    document.getElementById("priceInfo").innerHTML = html;

  } else {
    document.getElementById("priceInfo").innerHTML = '';
  }
}


// Add counts to dropdowns
document.getElementById("prefectureSelect").addEventListener("change", () => {
  const sel = document.getElementById("prefectureSelect");
  const val = sel.value;
  const citySel = document.getElementById("citySelect");
  const cities = Array.from(citySel.options).length - 1;
  document.getElementById("prefCount").textContent = val ? `（${sel.options.length - 1}件）` : "";
  document.getElementById("cityCount").textContent = val && cities > 0 ? `（${cities}件）` : "";
});

function updateStoreSummary(results) {
  let multi = 0, single = 0;
  results.forEach(s => {
    const type = s.サイネージ || "";
    if (type.includes("マルチ")) multi++;
    else if (type.includes("1面")) single++;
  });
  const total = results.length;
  document.getElementById("storeSummary").textContent = `マルチ：${multi}件 ／ 1面：${single}件 ／ 総計：${total}店舗`;
}

const originalRenderResults = renderResults;
renderResults = function () {
  originalRenderResults();
  const pref = document.getElementById("prefectureSelect").value;
  const city = document.getElementById("citySelect").value;
  const keywordEl = document.getElementById("searchInput");
  const keyword = keywordEl ? keywordEl.value.trim() : "";
  let results = storeData.filter(s =>
    (!pref || s.都道府県 === pref) &&
    (!city || s.市区町村 === city) &&
    (!keyword || s.店名.includes(keyword))
  );
  updateStoreSummary(results);
};
