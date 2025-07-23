
let storeData = [];
let priceData = {};

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
  const keyword = document.getElementById("searchInput").value.trim();

  let results = storeData.filter(s =>
    (!pref || s.都道府県 === pref) &&
    (!city || s.市区町村 === city) &&
    (!keyword || s.店名.includes(keyword))
  );

  const tbody = document.getElementById("resultBody");
  tbody.innerHTML = "";
  results.forEach(s => {
    const tr = document.createElement("tr");
    const signage = s.サイネージ || "";
    tr.innerHTML = `<td>${signage}</td><td>${s.店名}</td><td>${s.住所}</td>`;
    tbody.appendChild(tr);
  });

  document.getElementById("resultCount").textContent = `該当件数：${results.length}`;

  // 価格ロジック（都道府県→エリア→全国）
  let price = priceData[pref] || priceData[results[0]?.エリア] || priceData['全国'];
  const zone = pref || results[0]?.エリア || '全国';
  if (price) {
    document.getElementById("priceInfo").innerHTML = `
      <strong>${zone}：</strong>
      ベーシック ${price.ベーシック}円 ／ 
      マルチのみ ${price.マルチのみ}円 ／ 
      POS静止画 ${price.POS静止画}円 ／ 
      POS動画 ${price.POS動画}円
    `;
  } else {
    document.getElementById("priceInfo").innerHTML = '';
  }
}
