document.addEventListener("DOMContentLoaded", () => {
  // HTML要素の取得
  const areaSelect = document.getElementById("areaSelect");
  const prefectureSelect = document.getElementById("prefectureSelect");
  const citySelect = document.getElementById("citySelect");
  const searchBtn = document.getElementById("searchBtn");
  const storeSummary = document.getElementById("storeSummary");
  const resultBody = document.getElementById("resultBody");
  const priceTableBody = document.getElementById("priceTableBody");

  // 全ての店舗データと価格データを格納する変数
  let allStores = {};
  let allPrices = {};

  // エリアと都道府県の対応関係を定義（必要に応じて調整してください）
  const areas = {
    "北海道": ["北海道"],
    "東北": ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
    "関東": ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
    "中部": ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県"],
    "近畿": ["滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
    "中国": ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
    "四国": ["徳島県", "香川県", "愛媛県", "高知県"],
    "九州・沖縄": ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"]
  };

  // 全ての都道府県のリストをフラットに作成
  const prefecturesList = Object.values(areas).flat();

  // --- データフェッチング ---
  // stores.json と prices_by_region.json を同時に読み込む
  Promise.all([
      fetch("stores.json").then(res => {
        if (!res.ok) throw new Error(`stores.json HTTP error! status: ${res.status}`);
        return res.json();
      }),
      fetch("prices_by_region.json").then(res => {
        if (!res.ok) throw new Error(`prices_by_region.json HTTP error! status: ${res.status}`);
        return res.json();
      })
    ])
    .then(([stores, prices]) => {
      allStores = stores;
      allPrices = prices;
      populateAreaSelect(); // エリアドロップダウンを初期化
      populatePrefectureSelect(""); // 都道府県ドロップダウンを初期化（全表示）
      performSearch(); // 初期表示として全ての店舗を検索
      updatePriceTable(); // 初期価格表を表示
    })
    .catch(err => {
      console.error("データの読み込みに失敗しました:", err);
      storeSummary.innerHTML = "<p class='error-message'>データの読み込みに失敗しました。ファイルが正しいか確認してください。</p>";
      resultBody.innerHTML = '<tr><td colspan="3">データの読み込みに失敗しました。</td></tr>';
      priceTableBody.innerHTML = '<tr><td colspan="5">価格データの読み込みに失敗しました。</td></tr>';
    });

  // --- ドロップダウンの項目を生成する関数 ---

  // エリア選択ドロップダウンを生成
  function populateAreaSelect() {
    areaSelect.innerHTML = '<option value="">エリア選択</option>';
    Object.keys(areas).forEach(area => {
      const option = document.createElement("option");
      option.value = area;
      option.textContent = area;
      areaSelect.appendChild(option);
    });
  }

  // 都道府県選択ドロップダウンを生成
  function populatePrefectureSelect(selectedArea) {
    prefectureSelect.innerHTML = '<option value="">都道府県</option>';
    let targetPrefectures = [];

    if (selectedArea) {
      // エリアが選択されている場合、そのエリアに属する都道府県のみを表示
      targetPrefectures = areas[selectedArea] || [];
    } else {
      // エリアが選択されていない場合、全ての都道府県を表示
      targetPrefectures = prefecturesList;
    }

    targetPrefectures.forEach(pref => {
      const option = document.createElement("option");
      option.value = pref;
      option.textContent = pref;
      prefectureSelect.appendChild(option);
    });
    citySelect.innerHTML = '<option value="">市区町村</option>'; // 都道府県が変わったら市区町村をリセット
  }

  // 市区町村選択ドロップダウンを生成
  function populateCitySelect(selectedPrefecture) {
    citySelect.innerHTML = '<option value="">市区町村</option>';
    if (selectedPrefecture && allStores[selectedPrefecture]) {
      Object.keys(allStores[selectedPrefecture]).forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
    }
  }

  // --- ドロップダウンの変更イベントリスナー ---
  areaSelect.addEventListener("change", () => {
    const selectedArea = areaSelect.value;
    populatePrefectureSelect(selectedArea); // エリアに基づいて都道府県を更新
    prefectureSelect.value = ""; // 都道府県をリセット
    citySelect.value = ""; // 市区町村をリセット
    updatePriceTable(selectedArea, ""); // 価格表をエリアに基づいて更新
    performSearch(); // 検索を実行
  });

  prefectureSelect.addEventListener("change", () => {
    const selectedPrefecture = prefectureSelect.value;
    populateCitySelect(selectedPrefecture); // 都道府県に基づいて市区町村を更新
    updatePriceTable(areaSelect.value, selectedPrefecture); // 価格表を都道府県に基づいて更新
    performSearch(); // 検索を実行
  });

  citySelect.addEventListener("change", () => {
    // 市区町村が変更されたら検索を実行（価格表には影響なし）
    performSearch();
  });

  // --- 検索機能 ---
  searchBtn.addEventListener("click", () => {
    performSearch();
    // 検索ボタンクリック時にも価格表を更新する
    updatePriceTable(areaSelect.value, prefectureSelect.value);
  });

  function performSearch() {
    const selectedArea = areaSelect.value;
    const selectedPrefecture = prefectureSelect.value;
    const selectedCity = citySelect.value;

    let filteredStores = [];
    let totalStoresCount = 0;

    // フィルタリングロジック
    if (selectedCity) {
      // 市区町村が選択されている場合
      if (allStores[selectedPrefecture] && allStores[selectedPrefecture][selectedCity]) {
        filteredStores = allStores[selectedPrefecture][selectedCity];
      }
    } else if (selectedPrefecture) {
      // 都道府県が選択されている場合（市区町村は未選択）
      if (allStores[selectedPrefecture]) {
        Object.values(allStores[selectedPrefecture]).forEach(cityStores => {
          filteredStores = filteredStores.concat(cityStores);
        });
      }
    } else if (selectedArea) {
      // エリアが選択されている場合（都道府県、市区町村は未選択）
      const prefecturesInArea = areas[selectedArea] || [];
      prefecturesInArea.forEach(pref => {
        if (allStores[pref]) {
          Object.values(allStores[pref]).forEach(cityStores => {
            filteredStores = filteredStores.concat(cityStores);
          });
        }
      });
    } else {
      // 何も選択されていない場合、全ての店舗を表示
      Object.values(allStores).forEach(prefStores => {
        Object.values(prefStores).forEach(cityStores => {
          filteredStores = filteredStores.concat(cityStores);
        });
      });
    }

    totalStoresCount = filteredStores.length;
    displaySearchResults(filteredStores);
    updateStoreSummary(totalStoresCount);
  }

  // 検索結果を表示する関数
  function displaySearchResults(stores) {
    resultBody.innerHTML = "";
    if (stores.length === 0) {
      resultBody.innerHTML = '<tr><td colspan="3">検索結果がありません。</td></tr>';
      return;
    }

    stores.forEach(store => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${store.signage === "あり" ? "〇" : "-"}</td>
        <td>${store.name}</td>
        <td>${store.address}</td>
      `;
      resultBody.appendChild(row);
    });
  }

  // 表示店舗数のサマリーを更新する関数
  function updateStoreSummary(count) {
    storeSummary.innerHTML = `<span class="label">表示店舗数：</span><span class="count">${count}</span><span class="label">店舗</span>`;
  }

  // --- 価格表の機能 ---
  function updatePriceTable(selectedArea = "", selectedPrefecture = "") {
    priceTableBody.innerHTML = ""; // 価格表をクリア

    // 価格行を追加するヘルパー関数
    const addPriceRow = (regionName, priceData, isHighlighted = false) => {
      if (!priceData) return; // データがない場合は追加しない

      const row = document.createElement("tr");
      if (isHighlighted) {
        row.classList.add("highlight-pref-price"); // 選択された都道府県の価格を強調
      } else if (prefecturesList.includes(regionName)) {
        row.classList.add("prefecture-row"); // その他の都道府県の価格
      }

      row.innerHTML = `
        <td>${regionName}</td>
        <td>${priceData["ベーシック"] === "対象外" ? "対象外" : priceData["ベーシック"].toLocaleString() + "円"}</td>
        <td>${priceData["マルチのみ"] === "対象外" ? "対象外" : priceData["マルチのみ"].toLocaleString() + "円"}</td>
        <td>${priceData["POS静止画"] === "対象外" ? "対象外" : priceData["POS静止画"].toLocaleString() + "円"}</td>
        <td>${priceData["POS動画"] === "対象外" ? "対象外" : priceData["POS動画"].toLocaleString() + "円"}</td>
      `;
      priceTableBody.appendChild(row);
    };

    const addedRegions = new Set(); // 重複行を避けるためのSet

    // 1. 全国価格を常に表示
    if (allPrices["全国"] && !addedRegions.has("全国")) {
      addPriceRow("全国", allPrices["全国"]);
      addedRegions.add("全国");
    }

    // 2. 選択されたエリアの価格を表示（全国と重複しない場合）
    if (selectedArea && allPrices[selectedArea] && selectedArea !== "全国" && !addedRegions.has(selectedArea)) {
      addPriceRow(selectedArea, allPrices[selectedArea]);
      addedRegions.add(selectedArea);
    }

    // 3. 選択された都道府県の価格を表示し、強調
    if (selectedPrefecture && allPrices[selectedPrefecture] && !addedRegions.has(selectedPrefecture)) {
      addPriceRow(selectedPrefecture, allPrices[selectedPrefecture], true);
      addedRegions.add(selectedPrefecture);
    }

    // 4. その他の関連する都道府県の価格を表示
    // ここでは、選択されたエリアに属する、または何も選択されていない場合に全ての都道府県を表示します。
    prefecturesList.forEach(pref => {
      // 既に全国、選択エリア、選択都道府県として追加されていない場合
      if (allPrices[pref] && !addedRegions.has(pref)) {
        // 選択されたエリアがある場合、そのエリア内の都道府県のみを表示
        // 選択されたエリアがない場合、全ての都道府県を表示
        const isPrefInSelectedArea = selectedArea ? areas[selectedArea].includes(pref) : true;
        if (isPrefInSelectedArea) {
          addPriceRow(pref, allPrices[pref]);
          addedRegions.add(pref);
        }
      }
    });

    // 表示順序の調整: 全国 -> 選択エリア -> 選択都道府県 -> その他の都道府県
    const sortedRows = Array.from(priceTableBody.children).sort((a, b) => {
      const order = ["全国", selectedArea, selectedPrefecture].filter(Boolean); // 優先順位リスト
      const textA = a.children[0].textContent;
      const textB = b.children[0].textContent;

      const indexA = order.indexOf(textA);
      const indexB = order.indexOf(textB);

      // 優先順位リストにある項目は、その順序に従う
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // Aのみが優先順位リストにある場合、Aを前に
      if (indexA !== -1) {
        return -1;
      }
      // Bのみが優先順位リストにある場合、Bを前に
      if (indexB !== -1) {
        return 1;
      }
      // どちらも優先順位リストにない場合、元のDOM順序を維持（または名前でソートなど）
      return 0;
    });

    // ソートされた順序でDOMを再構築
    priceTableBody.innerHTML = '';
    sortedRows.forEach(row => priceTableBody.appendChild(row));
  }
});
