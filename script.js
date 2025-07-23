document.addEventListener("DOMContentLoaded", async () => {
  const storeTable = document.getElementById("storeTable");
  const resultCount = document.getElementById("resultCount");
  const priceArea = document.getElementById("priceArea");

  const prefectureSelect = document.getElementById("prefectureSelect");
  const citySelect = document.getElementById("citySelect");
  const areaSelect = document.getElementById("areaSelect");
  const storeNameInput = document.getElementById("storeNameInput");
  const searchButton = document.getElementById("searchButton");

  const storeData = await fetch("store_with_price.json").then(res => res.json());

  const allPrefectures = [...new Set(storeData.map(store => store.prefecture))];
  allPrefectures.forEach(pref => {
    const option = document.createElement("option");
    option.value = option.textContent = pref;
    prefectureSelect.appendChild(option);
  });

  prefectureSelect.addEventListener("change", () => {
    const selected = prefectureSelect.value;
    citySelect.innerHTML = '<option value="">市区町村</option>';
    const cities = [...new Set(storeData.filter(s => s.prefecture === selected).map(s => s.city))];
    cities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = city;
      citySelect.appendChild(opt);
    });
  });

  function renderTable(data) {
    storeTable.innerHTML = "";
    data.forEach(store => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${store.signage}</td><td>${store.name}</td><td>${store.address}</td>`;
      storeTable.appendChild(row);
    });
  }

  function renderPrice(data) {
    if (!data.length) return priceArea.innerHTML = "";
    const sample = data[0];
    if (sample.prefecture === "全国") {
      priceArea.innerHTML = `<strong>全国：</strong> ベーシック ${sample.basic}円 ／ マルチのみ ${sample.multi}円 ／ POS静止画 ${sample.pos_static}円 ／ POS動画 ${sample.pos_video}円`;
    } else {
      priceArea.innerHTML = `<strong>${sample.prefecture}：</strong> ベーシック ${sample.basic}円 ／ マルチのみ ${sample.multi}円 ／ POS静止画 ${sample.pos_static}円 ／ POS動画 ${sample.pos_video}円`;
    }
  }

  function getFilteredStores() {
    const pref = prefectureSelect.value;
    const city = citySelect.value;
    const area = areaSelect.value;
    const name = storeNameInput.value.trim();

    return storeData.filter(store => {
      return (!pref || store.prefecture === pref) &&
             (!city || store.city === city) &&
             (!area || store.area === area) &&
             (!name || store.name.includes(name));
    });
  }

  searchButton.addEventListener("click", () => {
    const results = getFilteredStores();
    renderTable(results);
    renderPrice(results);
    resultCount.textContent = `${results.length}件の店舗が見つかりました`;
  });
});
