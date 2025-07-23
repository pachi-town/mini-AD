let storeData = [];

fetch('store_with_price.json')
  .then(response => response.json())
  .then(data => {
    storeData = data;
    populateSelectors(data);
    renderTable(data);
    updatePriceDisplay(data);
  })
  .catch(error => {
    console.error('Error fetching store data:', error);
    document.getElementById("resultBody").innerHTML = '<tr><td colspan="3">店舗データを読み込めませんでした。</td></tr>';
    document.getElementById("priceArea").textContent = '価格情報を読み込めませんでした。';
  });

function populateSelectors(data) {
  const prefectures = [...new Set(data.map(item => item.都道府県))].sort(); // ソートを追加
  const prefectureSelect = document.getElementById("prefectureSelect");
  prefectures.forEach(pref => {
    const option = document.createElement("option");
    option.value = option.textContent = pref;
    prefectureSelect.appendChild(option);
  });

  prefectureSelect.addEventListener("change", () => {
    const selectedPref = prefectureSelect.value;
    const cities = [...new Set(data.filter(d => d.都道府県 === selectedPref).map(d => d.市区町村))].sort(); // ソートを追加
    const citySelect = document.getElementById("citySelect");
    citySelect.innerHTML = '<option value="">市区町村</option>';
    cities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = city;
      citySelect.appendChild(opt);
    });

    const areas = [...new Set(data.filter(d => d.都道府県 === selectedPref).map(d => d.エリア))].sort(); // ソートを追加
    const areaSelect = document.getElementById("areaSelect");
    areaSelect.innerHTML = '<option value="">エリア</option>';
    areas.forEach(area => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = area;
      areaSelect.appendChild(opt);
    });

    updatePriceDisplay(data);
    filterAndRender();
  });

  document.getElementById("citySelect").addEventListener("change", filterAndRender); // 市区町村変更時もフィルター
  document.getElementById("areaSelect").addEventListener("change", filterAndRender); // エリア変更時もフィルター
  document.getElementById("searchInput").addEventListener("input", filterAndRender); // 検索入力時もフィルター

  document.getElementById("searchButton").addEventListener("click", filterAndRender);
}

function updatePriceDisplay(data) {
  const pref = document.getElementById("prefectureSelect").value;
  const priceDiv = document.getElementById("priceArea");
  let relevantPriceData = null;

  // まず選択された都道府県に価格情報があるかを探す
  if (pref) {
    // 選択された都道府県の価格情報を持つ最初の店舗を探す
    // JSONデータで価格情報がネストされていないため、直接アクセス
    relevantPriceData = data.find(d => d.都道府県 === pref && d.ベーシック !== undefined && !isNaN(d.ベーシック));
  } 
  
  // 選択された都道府県に価格情報がない、または都道府県が選択されていない場合、
  // "全国"の価格情報を持つエントリを探す（もしあれば）
  if (!relevantPriceData) {
      relevantPriceData = data.find(d => d.都道府県 === "全国" && d.ベーシック !== undefined && !isNaN(d.ベーシック));
  }


  if (relevantPriceData && relevantPriceData.ベーシック !== undefined && !isNaN(relevantPriceData.ベーシック)) {
    // マルチのみと3面のみがJSONデータで混在しているため、両方を考慮した表示名にしています。
    // データ構造を統一できるのであれば、統一することを推奨します。
    const multiOnlyPrice = relevantPriceData["マルチのみ"] !== undefined && !isNaN(relevantPriceData["マルチのみ"]) ? relevantPriceData["マルチのみ"] : (relevantPriceData["3面のみ"] !== undefined && !isNaN(relevantPriceData["3面のみ"]) ? relevantPriceData["3面のみ"] : null);

    priceDiv.innerHTML = `<b>${pref || "全国"}の価格情報：</b><br>
      ベーシック ${formatPrice(relevantPriceData.ベーシック)}円 ／ 
      マルチのみ/3面のみ ${formatPrice(multiOnlyPrice)}円 ／ 
      POS静止画 ${formatPrice(relevantPriceData.POS静止画)}円 ／ 
      POS動画 ${formatPrice(relevantPriceData.POS動画)}円`;
  } else {
    // 都道府県が選択されているが価格情報がない場合、または全国の価格情報もない場合
    priceDiv.textContent = pref ? `「${pref}」の価格情報はありません。` : "全国の価格情報はありません。";
  }
}

// 価格をフォーマットするヘルパー関数
function formatPrice(price) {
    return price !== null && !isNaN(price) ? price.toLocaleString() : 'N/A';
}

function filterAndRender() {
  const pref = document.getElementById("prefectureSelect").value;
  const city = document.getElementById("citySelect").value;
  const area = document.getElementById("areaSelect").value;
  const keyword = document.getElementById("searchInput").value.trim().toLowerCase(); // キーワードを小文字に変換

  let filtered = storeData;

  if (pref) filtered = filtered.filter(d => d.都道府県 === pref);
  if (city) filtered = filtered.filter(d => d.市区町村 === city);
  if (area) filtered = filtered.filter(d => d.エリア === area);
  // キーワード検索を大文字小文字を区別しないように修正
  if (keyword) filtered = filtered.filter(d => d.店名.toLowerCase().includes(keyword));

  renderTable(filtered);
}

function renderTable(data) {
  const tbody = document.getElementById("resultBody");
  const countDiv = document.getElementById("resultCount");
  tbody.innerHTML = "";
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3">該当する店舗が見つかりませんでした。</td></tr>';
  } else {
    data.forEach(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${d.サイネージ}</td><td>${d.店名}</td><td>${d.住所}</td>`;
      tbody.appendChild(tr);
    });
  }
  countDiv.textContent = `該当件数：${data.length}件`;
}
