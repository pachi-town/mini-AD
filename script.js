
let storeData = [];

async function fetchData() {
  const res = await fetch("store.json");
  storeData = await res.json();
  populateAreaPrefectureCity();
}

function populateAreaPrefectureCity() {
  const areaSelect = document.getElementById("areaSelect");
  const prefSelect = document.getElementById("prefectureSelect");
  const citySelect = document.getElementById("citySelect");

  // エリアを抽出
  const areas = [...new Set(storeData.map(store => store.エリア))].sort();
  areas.forEach(area => {
    const opt = document.createElement("option");
    opt.value = area;
    opt.textContent = area;
    areaSelect.appendChild(opt);
  });

  // エリア変更時に都道府県更新
  areaSelect.addEventListener("change", () => {
    const selectedArea = areaSelect.value;
    const filteredPrefs = selectedArea
      ? [...new Set(storeData.filter(s => s.エリア === selectedArea).map(s => s.都道府県))].sort()
      : [...new Set(storeData.map(s => s.都道府県))].sort();

    prefSelect.innerHTML = '<option value="">選択</option>';
    filteredPrefs.forEach(pref => {
      const opt = document.createElement("option");
      opt.value = pref;
      opt.textContent = pref;
      prefSelect.appendChild(opt);
    });

    // 都道府県が変わるので市区町村もリセット
    citySelect.innerHTML = '<option value="">選択</option>';
  });

  // 都道府県変更時に市区町村更新
  prefSelect.addEventListener("change", () => {
    const selectedPref = prefSelect.value;
    const filteredCities = selectedPref
      ? [...new Set(storeData.filter(s => s.都道府県 === selectedPref).map(s => s.市区町村))].sort()
      : [];

    citySelect.innerHTML = '<option value="">選択</option>';
    filteredCities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });
  });
}

// 検索フィルター処理（エリア・都道府県・市区町村対応）
function filterStores() {
  const selectedArea = document.getElementById("areaSelect").value;
  const selectedPref = document.getElementById("prefectureSelect").value;
  const selectedCity = document.getElementById("citySelect").value;

  const filtered = storeData.filter(store =>
    (store.エリア === selectedArea || !selectedArea) &&
    (store.都道府県 === selectedPref || !selectedPref) &&
    (store.市区町村 === selectedCity || !selectedCity)
  );

  displayStores(filtered);
  updateStoreCounts(filtered);
  updatePrices(filtered);
}

// 以下は仮の関数：実装済みのHTMLに合わせてすでにあるはずの関数
function displayStores(data) {
  // 既存の描画処理を使用
}

function updateStoreCounts(data) {
  // 件数表示など
}

function updatePrices(data) {
  // 価格反映処理
}

window.onload = fetchData;
