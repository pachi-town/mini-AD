
let storeData = [];
let pricesByRegion = {};

async function fetchData() {
  const storeRes = await fetch("store.json");
  storeData = await storeRes.json();

  const priceRes = await fetch("prices_by_region.json");
  pricesByRegion = await priceRes.json();

  populateAreaPrefectureCity();
  document.getElementById("searchBtn").addEventListener("click", filterStores);
}

function populateAreaPrefectureCity() {
  const areaSelect = document.getElementById("areaSelect");
  const prefSelect = document.getElementById("prefectureSelect");
  const citySelect = document.getElementById("citySelect");

  const areas = [...new Set(storeData.map(store => store.エリア))].sort();
  areas.forEach(area => {
    const opt = document.createElement("option");
    opt.value = area;
    opt.textContent = area;
    areaSelect.appendChild(opt);
  });

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

    citySelect.innerHTML = '<option value="">選択</option>';
  });

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

function displayStores(data) {
  const tableBody = document.querySelector("#resultTable tbody");
  tableBody.innerHTML = "";
  data.forEach(store => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${store.サイネージ}</td>
      <td>${store.店舗名}</td>
      <td>${store.住所}</td>
    `;
    tableBody.appendChild(row);
  });
}

function updateStoreCounts(data) {
  const multi = data.filter(s => s.サイネージ === "マルチ").length;
  const single = data.filter(s => s.サイネージ === "1面").length;
  const total = data.length;

  const countEl = document.getElementById("storeCount");
  countEl.innerHTML = `
    <span class="count"><span class="num">${multi}</span><span class="label">件</span></span>：マルチディスプレイ設置店舗 ／ 
    <span class="count"><span class="num">${single}</span><span class="label">件</span></span>：1面のみ設置店舗 ／ 
    <span class="count"><span class="num">${total}</span><span class="label">店舗</span></span>：設置店舗合計
  `;
}

function updatePrices(data) {
  const selectedPref = document.getElementById("prefectureSelect").value;
  const target = selectedPref || (data[0] && data[0].都道府県) || "全国";
  const price = pricesByRegion[target] || pricesByRegion["全国"];

  document.getElementById("basicPrice").textContent = price["ベーシック"] === "対象外" ? "対象外" : price["ベーシック"] + "円";
  document.getElementById("multiOnlyPrice").textContent = price["マルチのみ"] === "対象外" ? "対象外" : price["マルチのみ"] + "円";
  document.getElementById("stillPrice").textContent = price["POS静止画"] === "対象外" ? "対象外" : price["POS静止画"] + "円";
  document.getElementById("videoPrice").textContent = price["POS動画"] === "対象外" ? "対象外" : price["POS動画"] + "円";
}

window.onload = fetchData;
