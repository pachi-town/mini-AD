let storeData = [];
let priceDataByRegion = [];

// 両方のJSONファイルを同時にフェッチ
Promise.all([
    fetch('stores.json').then(response => response.json()), // 店舗データ
    fetch('prices_by_region.json').then(response => response.json()) // 地域別価格データ
])
.then(([stores, prices]) => {
    storeData = stores;
    priceDataByRegion = prices;

    populateSelectors(storeData);
    renderTable(storeData);
    updatePriceDisplay(storeData); // 初期表示で全国の価格を表示
})
.catch(error => console.error('データの読み込み中にエラーが発生しました:', error));


function populateSelectors(data) {
  const prefectures = [...new Set(data.map(item => item.都道府県))];
  const prefectureSelect = document.getElementById("prefectureSelect");
  prefectures.forEach(pref => {
    const option = document.createElement("option");
    option.value = option.textContent = pref;
    prefectureSelect.appendChild(option);
  });

  prefectureSelect.addEventListener("change", () => {
    const selectedPref = prefectureSelect.value;
    const cities = [...new Set(data.filter(d => d.都道府県 === selectedPref).map(d => d.市区町村))];
    const citySelect = document.getElementById("citySelect");
    citySelect.innerHTML = '<option value="">市区町村</option>';
    cities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = city;
      citySelect.appendChild(opt);
    });

    // エリアの選択肢も都道府県に連動させる
    // 選択された都道府県に紐づくエリアを抽出
    const areasInSelectedPref = [...new Set(data.filter(d => d.都道府県 === selectedPref).map(d => d.エリア))];
    const areaSelect = document.getElementById("areaSelect");
    areaSelect.innerHTML = '<option value="">エリア</option>';
    areasInSelectedPref.forEach(area => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = area;
      areaSelect.appendChild(opt);
    });

    updatePriceDisplay(storeData); // 価格表示を更新
    filterAndRender();
  });

  document.getElementById("citySelect").addEventListener("change", filterAndRender);
  document.getElementById("areaSelect").addEventListener("change", () => {
    updatePriceDisplay(storeData); // エリア選択時も価格表示を更新
    filterAndRender();
  });
  document.getElementById("searchButton").addEventListener("click", filterAndRender);
}

function updatePriceDisplay(data) {
  const pref = document.getElementById("prefectureSelect").value;
  const area = document.getElementById("areaSelect").value;
  const priceDiv = document.getElementById("priceArea");
  let displayPrice = null;
  let regionName = "全国";

  if (pref) {
    // 都道府県が選択されている場合、まず都道府県固有の価格を探す
    displayPrice = priceDataByRegion.find(p => p.種別 === "都道府県" && p.名称 === pref);
    regionName = pref;
    if (!displayPrice) {
      // 都道府県固有の価格がなければ、その都道府県に紐づくエリアの価格を探す
      const selectedStoreInPref = data.find(d => d.都道府県 === pref);
      if (selectedStoreInPref && selectedStoreInPref.エリア) {
        displayPrice = priceDataByRegion.find(p => p.種別 === "エリア" && p.名称 === selectedStoreInPref.エリア);
        regionName = selectedStoreInPref.エリア;
      }
    }
  } else if (area) {
      // 都道府県が選択されておらず、エリアが選択されている場合、エリア価格を探す
      displayPrice = priceDataByRegion.find(p => p.種別 === "エリア" && p.名称 === area);
      regionName = area;
  }

  // 都道府県やエリアの価格が見つからなければ、全国価格を探す
  if (!displayPrice) {
    displayPrice = priceDataByRegion.find(p => p.種別 === "全国" && p.名称 === "全国");
    // regionNameはすでに"全国"に初期化されている
  }

  if (displayPrice && displayPrice.価格情報) {
    const priceInfo = displayPrice.価格情報;
    // 'マルチのみ'と'3面のみ'のキーが混在しているため、両方を考慮して表示する
    const multiOnlyPrice = priceInfo['マルチのみ'] !== undefined ? priceInfo['マルチのみ'] : (priceInfo['3面のみ'] !== undefined ? priceInfo['3面のみ'] : 'N/A');

    priceDiv.innerHTML = `<b>${regionName}の価格：</b><br>
      ベーシック ${formatPrice(priceInfo.ベーシック)}円 ／ 
      マルチのみ/3面のみ ${formatPrice(multiOnlyPrice)}円 ／ 
      POS静止画 ${formatPrice(priceInfo.POS静止画)}円 ／ 
      POS動画 ${formatPrice(priceInfo.POS動画)}円`;
  } else {
    priceDiv.textContent = "価格情報はありません。";
  }
}

function formatPrice(price) {
    return isNaN(price) || price === null ? 'N/A' : price.toLocaleString();
}

function filterAndRender() {
  const pref = document.getElementById("prefectureSelect").value;
  const city = document.getElementById("citySelect").value;
  const area = document.getElementById("areaSelect").value;
  const keyword = document.getElementById("searchInput").value.trim();

  let filtered = storeData;

  if (pref) filtered = filtered.filter(d => d.都道府県 === pref);
  if (city) filtered = filtered.filter(d => d.市区町村 === city);
  if (area) filtered = filtered.filter(d => d.エリア === area);
  if (keyword) filtered = filtered.filter(d => d.店名.includes(keyword) || d.住所.includes(keyword)); // 店舗名だけでなく住所も検索対象に含める

  renderTable(filtered);
}

function renderTable(data) {
  const tbody = document.getElementById("resultBody");
  const countDiv = document.getElementById("resultCount");
  tbody.innerHTML = "";
  data.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${d.サイネージ}</td><td>${d.店名}</td><td>${d.住所}</td>`;
    tbody.appendChild(tr);
  });
  countDiv.textContent = `該当件数：${data.length}`;
}
