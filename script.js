let storeData = [];

fetch('store_with_price.json')
  .then(response => response.json())
  .then(data => {
    storeData = data;
    populateSelectors(data);
    renderTable(data);
    updatePriceDisplay(data);
  });

function populateSelectors(data) {
  const prefectures = [...new Set(data.map(item => item.都道府県))];
  const prefectureSelect = document.getElementById("prefectureSelect");
  prefectures.forEach(pref => {
    const option = document.createElement("option");
    option.value = option.textContent = pref;
    prefectureSelect.appendChild(option);
  });

  prefectureSelect.addEventListener("change", () => {
    const selected = prefectureSelect.value;
    const cities = [...new Set(data.filter(d => d.都道府県 === selected).map(d => d.市区町村))];
    const citySelect = document.getElementById("citySelect");
    citySelect.innerHTML = '<option value="">市区町村</option>';
    cities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = city;
      citySelect.appendChild(opt);
    });

    const areas = [...new Set(data.filter(d => d.都道府県 === selected).map(d => d.エリア))];
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

  document.getElementById("searchButton").addEventListener("click", filterAndRender);
}

function updatePriceDisplay(data) {
  const pref = document.getElementById("prefectureSelect").value;
  const priceDiv = document.getElementById("priceArea");
  let price = null;

  if (pref) {
    price = data.find(d => d.都道府県 === pref && d.価格情報);
  } else {
    price = data.find(d => d.都道府県 === "全国" && d.価格情報);
  }

  if (price && price.価格情報) {
    priceDiv.innerHTML = `<b>${pref || "全国"}：</b>
      ベーシック ${price.価格情報.ベーシック}円 ／ 
      マルチのみ ${price.価格情報.マルチのみ}円 ／ 
      POS静止画 ${price.価格情報.POS静止画}円 ／ 
      POS動画 ${price.価格情報.POS動画}円`;
  } else {
    priceDiv.textContent = "";
  }
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
  if (keyword) filtered = filtered.filter(d => d.店名.includes(keyword));

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
