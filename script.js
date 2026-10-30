document.addEventListener("DOMContentLoaded", () => {
  // ★新しいGASのURL
  const gasUrl = "https://script.google.com/macros/s/AKfycbxo2yo7ewBSCBtTEMm5QMHKGcK6itFkA3bTAdJ_1UmocMdcgKaxGgfZz0iJPQ5vNNkN/exec";

  const areaSelect = document.getElementById("areaSelect");
  const prefectureSelect = document.getElementById("prefectureSelect");
  const btnSearch = document.getElementById("btnSearch");
  const btnEstimate = document.getElementById("btnEstimate");
  const loadingOverlay = document.getElementById("loadingOverlay");
  
  const tabContainer = document.getElementById("tabContainer");
  const tabCity = document.getElementById("tabCity");
  const tabPref = document.getElementById("tabPref");
  
  const resultBodyMulti = document.getElementById("resultBodyMulti");
  const resultBodySingle = document.getElementById("resultBodySingle");

  const btnListView = document.getElementById("btnListView");
  const btnMapView = document.getElementById("btnMapView");
  const listContainer = document.getElementById("listContainer");
  const mapContainer = document.getElementById("mapContainer");

  let allStoresStructured = {}; 
  let allPrices = {};
  let volumePrices = [];
  let availablePrefectures = new Set();
  
  let currentMode = "search"; 
  let currentTab = "city";
  let currentPlan = "basic"; 

  let map;
  let markersLayer;
  let isMapInitialized = false;
  let currentMultiStores = [];
  let currentSingleStores = [];

  const areas = {
    "北海道": ["北海道"], 
    "東北": ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
    "関東": ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "山梨県"],
    "東海": ["新潟県", "富山県", "石川県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県"],
    "近畿": ["滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "福井県"],
    "中国": ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
    "四国": ["徳島県", "香川県", "愛媛県", "高知県"],
    "九州・沖縄": ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"]
  };

  function renderSchedule() {
    const today = new Date();
    const releaseDate = new Date(today);
    releaseDate.setDate(today.getDate() + 35); 
    const applyDate = new Date(releaseDate);
    applyDate.setDate(releaseDate.getDate() - 28); 
    const materialDate = new Date(releaseDate);
    materialDate.setDate(releaseDate.getDate() - 21); 

    const formatDate = (d) => `${d.getMonth() + 1}月${d.getDate()}日`;

    document.getElementById('todayDate').textContent = formatDate(today);
    document.getElementById('scheduleInquiry').textContent = formatDate(today); 
    document.getElementById('scheduleApply').textContent = formatDate(applyDate);
    document.getElementById('scheduleMaterial').textContent = formatDate(materialDate);
    document.getElementById('scheduleRelease').textContent = formatDate(releaseDate);
  }
  
  renderSchedule();

  function updateCityCheckboxesState() {
    const container = document.getElementById("cityCheckboxes");
    if (!container) return;
    
    const overlayMsgId = "cityDisabledMsg";
    let msgEl = document.getElementById(overlayMsgId);

    if (currentPlan !== "multi") {
      container.style.opacity = "0.4";
      container.style.pointerEvents = "none";
      container.style.transition = "opacity 0.3s ease";
      
      const checkboxes = document.querySelectorAll('.city-checkbox:checked');
      checkboxes.forEach(cb => cb.checked = false);

      if (!msgEl) {
        msgEl = document.createElement("div");
        msgEl.id = overlayMsgId;
        msgEl.style.color = "#dc2626";
        msgEl.style.fontSize = "0.85em";
        msgEl.style.marginTop = "6px";
        msgEl.style.fontWeight = "bold";
        msgEl.textContent = "※市区町村での絞り込みは「マルチ限定プラン」選択時のみ可能です";
        container.parentNode.insertBefore(msgEl, container.nextSibling);
      } else {
        msgEl.style.display = "block";
      }
    } else {
      container.style.opacity = "1";
      container.style.pointerEvents = "auto";
      if (msgEl) msgEl.style.display = "none";
    }
  }

  document.querySelectorAll('.plan-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.plan-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentPlan = target.getAttribute('data-plan');
      
      document.body.setAttribute('data-plan', currentPlan);
      updateCityCheckboxesState();
      updateView();
    });
  });

  fetch(gasUrl)
    .then(res => res.json())
    .then(data => {
      const allStoresRaw = data.stores;
      allPrices = data.prices;
      volumePrices = data.volumePrices;

      if (data.descriptions) {
        if (data.descriptions["マルチ"]) document.getElementById("descMultiText").innerHTML = data.descriptions["マルチ"];
        if (data.descriptions["1面"]) document.getElementById("descSingleText").innerHTML = data.descriptions["1面"];
        if (data.descriptions["POS"]) document.getElementById("descPosText").innerHTML = data.descriptions["POS"];
      }

      if (data.headerBanner && data.headerBanner.imageUrl) {
        document.getElementById("headerBannerImage").src = data.headerBanner.imageUrl;
        const hbLink = document.getElementById("headerBannerLink");
        if (data.headerBanner.linkUrl) hbLink.href = data.headerBanner.linkUrl;
        document.getElementById("headerBannerContainer").style.display = "block";
      }

      if (data.ads && data.ads.length > 0) {
        const adContainer = document.getElementById("adBannerContainer");
        const adImage = document.getElementById("adBannerImage");
        const adLink = document.getElementById("adBannerLink");
        let currentAdIndex = 0;
        const updateAd = (index) => {
          adImage.style.opacity = 0; 
          setTimeout(() => {
            adImage.src = data.ads[index].imageUrl;
            if (data.ads[index].linkUrl) adLink.href = data.ads[index].linkUrl;
            adImage.style.opacity = 1; 
          }, 400); 
        };
        updateAd(0);
        adContainer.style.display = "block";
        if (data.ads.length > 1) {
          setInterval(() => {
            currentAdIndex = (currentAdIndex + 1) % data.ads.length;
            updateAd(currentAdIndex);
          }, 15000); 
        }
      }

      allStoresRaw.forEach(store => availablePrefectures.add(store.都道府県));
      Object.keys(allPrices).forEach(region => {
          if (region.endsWith('県') || region === '北海道') availablePrefectures.add(region);
      });
      availablePrefectures.delete('NaN');

      structureStores(allStoresRaw); 
      populateAreaSelect(); 
      populatePrefectureSelect(""); 
      updateCityCheckboxesState(); 
      
      loadingOverlay.style.display = "none";
    })
    .catch(err => {
      console.error("データ読み込み失敗:", err);
      loadingOverlay.innerHTML = "<p style='color: red; font-weight: bold;'>データの読み込みに失敗しました。</p>";
    });

  function initMap() {
    if (isMapInitialized) return;
    map = L.map('map').setView([35.681236, 139.767125], 5);
    // ★ 修正：国土地理院地図からOpenStreetMapに戻しました
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
    isMapInitialized = true;
  }

  btnListView.addEventListener("click", () => {
    btnListView.classList.add("active");
    btnMapView.classList.remove("active");
    listContainer.style.display = "block";
    mapContainer.style.display = "none";
  });

  btnMapView.addEventListener("click", () => {
    btnMapView.classList.add("active");
    btnListView.classList.remove("active");
    listContainer.style.display = "none";
    mapContainer.style.display = "block";
    if (!isMapInitialized) initMap();
    setTimeout(() => { map.invalidateSize(); updateMapMarkers(); }, 100);
  });

  function structureStores(stores) {
    allStoresStructured = {};
    stores.forEach(store => {
      const pref = store.都道府県;
      const city = store.市区町村;
      if (!allStoresStructured[pref]) allStoresStructured[pref] = {};
      if (!allStoresStructured[pref][city]) allStoresStructured[pref][city] = [];
      allStoresStructured[pref][city].push(store);
    });
  }

  function populateAreaSelect() {
    areaSelect.innerHTML = '<option value="">エリア選択</option>';
    Object.keys(areas).forEach(area => {
        if (areas[area].filter(pref => availablePrefectures.has(pref)).length > 0) {
            const option = document.createElement("option");
            option.value = area;
            option.textContent = area;
            areaSelect.appendChild(option);
        }
    });
  }

  function populatePrefectureSelect(selectedArea) {
    prefectureSelect.innerHTML = '<option value="">都道府県</option>';
    let targetPrefectures = selectedArea ? areas[selectedArea].filter(pref => availablePrefectures.has(pref)) : Array.from(availablePrefectures);
    targetPrefectures.sort().forEach(pref => {
      const option = document.createElement("option");
      option.value = pref;
      option.textContent = pref;
      prefectureSelect.appendChild(option);
    });
    populateCitySelect(""); 
  }

  function populateCitySelect(selectedPrefecture) {
    const container = document.getElementById("cityCheckboxes");
    container.innerHTML = '';
    if (selectedPrefecture && allStoresStructured[selectedPrefecture]) {
      Object.keys(allStoresStructured[selectedPrefecture]).sort().forEach(city => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = city;
        checkbox.className = "city-checkbox";
        checkbox.addEventListener("change", updateView);
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(city));
        container.appendChild(label);
      });
    } else {
      container.innerHTML = '<div class="placeholder">都道府県を選択してください</div>';
    }
    updateCityCheckboxesState(); 
  }

  areaSelect.addEventListener("change", () => { populatePrefectureSelect(areaSelect.value); updateView(); });
  prefectureSelect.addEventListener("change", () => { populateCitySelect(prefectureSelect.value); updateView(); });
  btnSearch.addEventListener("click", () => { currentMode = "search"; updateView(); });
  btnEstimate.addEventListener("click", () => { currentMode = "estimate"; updateView(); });
  tabCity.addEventListener("click", () => { currentTab = "city"; tabCity.classList.add("active"); tabPref.classList.remove("active"); updateView(); });
  tabPref.addEventListener("click", () => { currentTab = "pref"; tabPref.classList.add("active"); tabCity.classList.remove("active"); updateView(); });

  function updateView() {
    const selectedArea = areaSelect.value;
    const selectedPrefecture = prefectureSelect.value;
    const checkedBoxes = document.querySelectorAll('.city-checkbox:checked');
    const selectedCities = Array.from(checkedBoxes).map(cb => cb.value);

    if (currentMode === "estimate" && selectedPrefecture) {
      tabContainer.style.display = "flex";
      tabPref.textContent = `${selectedPrefecture}全体`;
    } else {
      tabContainer.style.display = "none";
      currentTab = "city"; 
      tabCity.classList.add("active");
      tabPref.classList.remove("active");
    }

    let filteredStores = [];

    if (selectedPrefecture && allStoresStructured[selectedPrefecture]) {
      if (currentTab === "city" && selectedCities.length > 0) {
        selectedCities.forEach(city => {
          if (allStoresStructured[selectedPrefecture][city]) {
            filteredStores = filteredStores.concat(allStoresStructured[selectedPrefecture][city]);
          }
        });
      } else {
        Object.values(allStoresStructured[selectedPrefecture]).forEach(cityStores => {
          filteredStores = filteredStores.concat(cityStores);
        });
      }
    } else if (selectedArea) {
      (areas[selectedArea] || []).forEach(pref => {
        if (allStoresStructured[pref]) {
          Object.values(allStoresStructured[pref]).forEach(cityStores => {
            filteredStores = filteredStores.concat(cityStores);
          });
        }
      });
    } else {
      Object.values(allStoresStructured).forEach(prefStores => {
        Object.values(prefStores).forEach(cityStores => {
          filteredStores = filteredStores.concat(cityStores);
        });
      });
    }

    currentMultiStores = filteredStores.filter(store => String(store.サイネージ) === "新");
    
    if (currentPlan === "multi") {
      currentSingleStores = [];
    } else {
      currentSingleStores = filteredStores.filter(store => String(store.サイネージ) === "1");
    }

    updateStoreSummary(currentMultiStores.length, currentSingleStores.length);
    renderTables(currentMultiStores, currentSingleStores);
    
    if (mapContainer.style.display === "block") updateMapMarkers();

    if (currentMode === "estimate") {
      document.getElementById('priceSection').style.display = 'block';
      updatePriceTable(selectedArea, selectedPrefecture);
      if (selectedCities.length > 0 && currentTab === "city") {
        document.getElementById('calcResultBox').style.display = 'flex';
        calculateAndShowPrice(currentMultiStores.length);
      } else {
        document.getElementById('calcResultBox').style.display = 'none';
      }
    } else {
      document.getElementById('priceSection').style.display = 'none';
    }
    document.getElementById('resultSection').style.display = 'block';
  }

  function renderTables(multiStores, singleStores) {
    const createRow = (store, typeLabel) => `<tr><td>${typeLabel}</td><td>${store.店名}</td><td>${store.都道府県}${store.市区町村}${store.住所}</td></tr>`;
    resultBodyMulti.innerHTML = multiStores.length > 0 ? multiStores.map(s => createRow(s, "マルチディスプレイ")).join('') : '<tr><td colspan="3">該当する店舗がありません。</td></tr>';
    resultBodySingle.innerHTML = singleStores.length > 0 ? singleStores.map(s => createRow(s, "1面のみ")).join('') : '<tr><td colspan="3">該当する店舗がありません。</td></tr>';
  }

  function updateMapMarkers() {
    if (!map || !markersLayer) return;
    markersLayer.clearLayers(); 
    let bounds = L.latLngBounds();
    let hasValidMarkers = false;

    const addMarker = (store, typeLabel, colorHex) => {
      const lat = parseFloat(store['緯度']), lng = parseFloat(store['経度']);
      if (isNaN(lat) || isNaN(lng)) return;
      const marker = L.circleMarker([lat, lng], { radius: 7, fillColor: colorHex, color: "#fff", weight: 1.5, opacity: 1, fillOpacity: 0.9 });
      marker.bindPopup(`<b>${store.店名}</b><br><span style="color:${colorHex};font-size:0.85em;">${typeLabel}</span><br><span style="font-size:0.85em;">${store.都道府県}${store.市区町村}${store.住所}</span>`);
      markersLayer.addLayer(marker);
      bounds.extend([lat, lng]);
      hasValidMarkers = true;
    };

    currentMultiStores.forEach(s => addMarker(s, "マルチディスプレイ", "#0ea5e9"));
    currentSingleStores.forEach(s => addMarker(s, "1面のみ", "#64748b"));

    if (hasValidMarkers) map.fitBounds(bounds, { padding: [30, 30] });
    else map.setView([35.681236, 139.767125], 5);
  }

  function calculateAndShowPrice(multiCount) {
    let calculatedPrice = 0;
    if (typeof volumePrices !== 'undefined' && volumePrices.length > 0) {
      for (let i = 0; i < volumePrices.length; i++) {
        if (multiCount >= volumePrices[i]["下限店舗数"] && multiCount <= volumePrices[i]["上限店舗数"]) {
          calculatedPrice = volumePrices[i]["価格"]; break;
        }
      }
    }
    document.getElementById("calcMultiCount").textContent = multiCount;
    const el = document.getElementById("priceValueDisplay");
    el.innerHTML = calculatedPrice === 0 ? '<span style="font-size: 0.65em;">対象外 地点数を増やしてください</span>' : `概算 <span>${calculatedPrice.toLocaleString()}</span> 円`;
  }

  function updateStoreSummary(multiCount, singleCount) {
    const totalCount = multiCount + singleCount;
    document.getElementById("storeSummary").innerHTML = `
      <div class="summary-widget target">
        <div class="widget-title">マルチディスプレイ</div>
        <div class="widget-value"><span class="count">${multiCount}</span><span class="unit">店舗</span></div>
      </div>
      <div class="summary-widget excluded">
        <div class="widget-title">1面ディスプレイ</div>
        <div class="widget-value"><span class="count">${singleCount}</span><span class="unit">店舗</span></div>
      </div>
      <div class="summary-widget total">
        <div class="widget-title">合計</div>
        <div class="widget-value"><span class="count">${totalCount}</span><span class="unit">店舗</span></div>
      </div>
    `;
    document.getElementById("storeSummary").style.display = "grid";
  }

  function updatePriceTable(selectedArea, selectedPrefecture) {
    const tbody = document.getElementById("priceTableBody");
    tbody.innerHTML = ""; 
    const addPriceRow = (regionName, data, isHighlighted = false) => {
      if (!data) return; 
      const row = document.createElement("tr");
      if (isHighlighted) row.classList.add("highlight-pref-price"); 
      row.innerHTML = `
        <td>${regionName}</td>
        <td class="col-basic">${data["ベーシック"] === "対象外" ? "対象外" : data["ベーシック"].toLocaleString() + "円"}</td>
        <td class="col-multi">${data["マルチのみ"] === "対象外" ? "対象外" : data["マルチのみ"].toLocaleString() + "円"}</td>
        <td class="col-pos">${data["POS静止画"] === "対象外" ? "対象外" : data["POS静止画"].toLocaleString() + "円"}</td>
        <td class="col-pos">${data["POS動画"] === "対象外" ? "対象外" : data["POS動画"].toLocaleString() + "円"}</td>
      `;
      tbody.appendChild(row);
    };

    const checkedBoxes = document.querySelectorAll('.city-checkbox:checked');
    if (!selectedArea && selectedPrefecture && checkedBoxes.length === 0) {
        if (allPrices["全国"]) addPriceRow("全国", allPrices["全国"]);
        if (allPrices[selectedPrefecture]) addPriceRow(selectedPrefecture, allPrices[selectedPrefecture], true);
    } else {
        if (allPrices["全国"]) addPriceRow("全国", allPrices["全国"]);
        let areaKey = selectedArea === "九州・沖縄" ? "九州" : (selectedArea === "近畿" ? "近畿北陸" : selectedArea);
        if (selectedArea && allPrices[areaKey]) addPriceRow(selectedArea, allPrices[areaKey]);
        if (selectedPrefecture && allPrices[selectedPrefecture]) addPriceRow(selectedPrefecture, allPrices[selectedPrefecture], true);
    }
  }
});
