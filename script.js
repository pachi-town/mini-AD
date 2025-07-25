document.addEventListener("DOMContentLoaded", () => {
  // HTML要素の取得
  const areaSelect = document.getElementById("areaSelect");
  const prefectureSelect = document.getElementById("prefectureSelect");
  const citySelect = document.getElementById("citySelect");
  const searchBtn = document.getElementById("searchBtn");
  const storeSummary = document.getElementById("storeSummary");
  const resultBody = document.getElementById("resultBody");
  const priceTableBody = document.getElementById("priceTableBody");

  // 親要素の取得 (表示/非表示制御のため)
  const priceInfoSection = document.querySelector('h2:nth-of-type(1)'); 
  const priceTable = priceTableBody.closest('table');
  const searchResultSection = document.querySelector('h2:nth-of-type(2)');
  const searchResultTable = resultBody.closest('table');

  // 全ての店舗データと価格データを格納する変数
  let allStoresRaw = []; // 読み込んだそのままの店舗データ
  let allStoresStructured = {}; // 都道府県 -> 市区町村 -> 店舗リストの構造化データ
  let allPrices = {};

  // エリアと都道府県の対応関係
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

  // prices_by_region.jsonのキーと表示名を合わせるためのマップ
  const areaDisplayMap = {
    "九州・沖縄": "九州",
    "近畿": "近畿北陸"
  };

  // stores.jsonとprices_by_region.jsonに存在する都道府県のみを抽出
  let availablePrefectures = new Set();

  // --- データフェッチング ---
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
      allStoresRaw = stores;
      allPrices = prices;

      // 利用可能な都道府県をstores.jsonから抽出
      allStoresRaw.forEach(store => {
        availablePrefectures.add(store.都道府県);
      });
      // prices_by_region.jsonからも都道府県を抽出（両方に存在するものが対象）
      Object.keys(allPrices).forEach(region => {
          if (region.endsWith('県') || region === '北海道') { // 都道府県名の判定を強化
              availablePrefectures.add(region);
          }
      });
      // NaNを削除
      availablePrefectures.delete('NaN');

      structureStores(allStoresRaw); // 店舗データを構造化
      populateAreaSelect(); // エリアドロップダウンを初期化
      populatePrefectureSelect(""); // 都道府県ドロップダウンを初期化（全表示）

      // 初期状態では店舗一覧と価格情報を非表示にする (タイトルは表示)
      hideAllContent();
    })
    .catch(err => {
      console.error("データの読み込みに失敗しました:", err);
      storeSummary.innerHTML = "<p class='error-message'>データの読み込みに失敗しました。ファイルが正しいか確認してください。</p>";
      resultBody.innerHTML = '<tr><td colspan="3">データの読み込みに失敗しました。</td></tr>';
      priceTableBody.innerHTML = '<tr><td colspan="5">価格データの読み込みに失敗しました。</td></tr>';
      // エラー時もコンテンツは非表示のまま
      hideAllContent();
    });

  // 店舗データを都道府県 -> 市区町村の構造に整理する関数
  function structureStores(stores) {
    allStoresStructured = {};
    stores.forEach(store => {
      const pref = store.都道府県;
      const city = store.市区町村;

      if (!allStoresStructured[pref]) {
        allStoresStructured[pref] = {};
      }
      if (!allStoresStructured[pref][city]) {
        allStoresStructured[pref][city] = [];
      }
      allStoresStructured[pref][city].push(store);
    });
  }

  // --- ドロップダウンの項目を生成する関数 ---

  // エリア選択ドロップダウンを生成
  function populateAreaSelect() {
    areaSelect.innerHTML = '<option value="">エリア選択</option>';
    // areasオブジェクトのキーを元に、ただし実データに存在する都道府県を含むエリアのみ追加
    Object.keys(areas).forEach(area => {
        const relevantPrefecturesInArea = areas[area].filter(pref => availablePrefectures.has(pref));
        if (relevantPrefecturesInArea.length > 0) {
            const option = document.createElement("option");
            option.value = area;
            option.textContent = area;
            areaSelect.appendChild(option);
        }
    });
  }

  // 都道府県選択ドロップダウンを生成
  function populatePrefectureSelect(selectedArea) {
    prefectureSelect.innerHTML = '<option value="">都道府県</option>';
    let targetPrefectures = [];

    if (selectedArea) {
      // エリアが選択されている場合、そのエリアに属する、かつ利用可能な都道府県のみを表示
      targetPrefectures = areas[selectedArea].filter(pref => availablePrefectures.has(pref)) || [];
    } else {
      // エリアが選択されていない場合、全ての利用可能な都道府県を表示
      targetPrefectures = Array.from(availablePrefectures);
    }

    // 都道府県名をソートして追加
    targetPrefectures.sort().forEach(pref => {
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
    if (selectedPrefecture && allStoresStructured[selectedPrefecture]) {
      // 市区町村名をソートして追加
      const cities = Object.keys(allStoresStructured[selectedPrefecture]).sort();
      cities.forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
    }
  }

  // --- ドロップダウンの変更イベントリスナー (選択肢の更新のみ) ---
  areaSelect.addEventListener("change", () => {
    const selectedArea = areaSelect.value;
    populatePrefectureSelect(selectedArea); // エリアに基づいて都道府県を更新
    prefectureSelect.value = ""; // 都道府県をリセット
    citySelect.value = ""; // 市区町村をリセット
    // ここでは検索や価格表の更新は行わない
  });

  prefectureSelect.addEventListener("change", () => {
    const selectedPrefecture = prefectureSelect.value;
    populateCitySelect(selectedPrefecture); // 都道府県に基づいて市区町村を更新
    // ここでは検索や価格表の更新は行わない
  });

  citySelect.addEventListener("change", () => {
    // ここでは検索や価格表の更新は行わない
  });

  // --- 検索ボタンクリック時の処理 ---
  searchBtn.addEventListener("click", () => {
    performSearchAndPriceUpdate();
    showAllContent(); // 検索ボタンが押されたら結果を表示
  });

  // 検索と価格表の更新をまとめて行う関数
  function performSearchAndPriceUpdate() {
    const selectedArea = areaSelect.value;
    const selectedPrefecture = prefectureSelect.value;
    const selectedCity = citySelect.value;

    let filteredStores = [];

    // フィルタリングロジック
    if (selectedCity && allStoresStructured[selectedPrefecture] && allStoresStructured[selectedPrefecture][selectedCity]) {
      // 市区町村が選択されている場合
      filteredStores = allStoresStructured[selectedPrefecture][selectedCity];
    } else if (selectedPrefecture && allStoresStructured[selectedPrefecture]) {
      // 都道府県が選択されている場合（市区町村は未選択）
      Object.values(allStoresStructured[selectedPrefecture]).forEach(cityStores => {
        filteredStores = filteredStores.concat(cityStores);
      });
    } else if (selectedArea) {
      // エリアが選択されている場合（都道府県、市区町村は未選択）
      const prefecturesInArea = areas[selectedArea] || [];
      prefecturesInArea.forEach(pref => {
        if (allStoresStructured[pref]) {
          Object.values(allStoresStructured[pref]).forEach(cityStores => {
            filteredStores = filteredStores.concat(cityStores);
          });
        }
      });
    } else {
      // 何も選択されていない場合、全ての店舗を表示
      Object.values(allStoresStructured).forEach(prefStores => {
        Object.values(prefStores).forEach(cityStores => {
          filteredStores = filteredStores.concat(cityStores);
        });
      });
    }

    // ソート: マルチディスプレイを上位に、1面のみを下位に
    filteredStores.sort((a, b) => {
      // "マルチディスプレイ"が"1面のみ"より常に上位
      if (a.サイネージ === "マルチディスプレイ" && b.サイネージ === "1面のみ") {
        return -1;
      }
      if (a.サイネージ === "1面のみ" && b.サイネージ === "マルチディスプレイ") {
        return 1;
      }
      // その他の場合は順序変更なし（同じサイネージタイプの場合、または未知のタイプの場合）
      return 0;
    });

    displaySearchResults(filteredStores);
    updateStoreSummary(filteredStores); // フィルタリングされた店舗リストを渡す

    // 価格表の更新
    updatePriceTable(selectedArea, selectedPrefecture);
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
      // サイネージの表示を日本語に
      const signageDisplay = store.サイネージ;
      row.innerHTML = `
        <td>${signageDisplay}</td>
        <td>${store.店名}</td>
        <td>${store.住所}</td>
      `;
      resultBody.appendChild(row);
    });
  }

  // 表示店舗数のサマリーを更新する関数
  function updateStoreSummary(stores) {
    let multiDisplayCount = 0;
    let singleDisplayCount = 0;

    stores.forEach(store => {
      if (store.サイネージ === "マルチディスプレイ") {
        multiDisplayCount++;
      } else if (store.サイネージ === "1面のみ") {
        singleDisplayCount++;
      }
    });

    const totalStoresCount = multiDisplayCount + singleDisplayCount;

    storeSummary.innerHTML = `
      <span class="label">マルチディスプレイ設置店舗：</span><span class="count">${multiDisplayCount}</span><span class="label">件 / </span>
      <span class="label">1面設置店舗：</span><span class="count">${singleDisplayCount}</span><span class="label">件 / </span>
      <span class="label">サイネージ設置店舗合計：</span><span class="count">${totalStoresCount}</span><span class="label">店舗</span>
    `;
  }

  // --- 価格表の機能 ---
  function updatePriceTable(selectedArea = "", selectedPrefecture = "") {
    priceTableBody.innerHTML = ""; // 価格表をクリア

    // 価格行を追加するヘルパー関数
    const addPriceRow = (regionName, priceData, isHighlighted = false) => {
      if (!priceData) return; // データがない場合は追加しない

      const row = document.createElement("tr");
      // 都道府県名のリストを直接使用し、エリア名も含むように修正
      const allDisplayableRegions = Array.from(availablePrefectures);
      Object.keys(areas).forEach(areaKey => allDisplayableRegions.push(areaKey));
      allDisplayableRegions.push("全国"); // 「全国」もリストに追加
      
      if (isHighlighted) {
        row.classList.add("highlight-pref-price"); // 選択された都道府県の価格を強調
      } else if (allDisplayableRegions.includes(regionName) && !isHighlighted) { 
        // 価格表の行が「都道府県」または「エリア」である場合にクラスを追加
        // ただし、ハイライトされている行にはつけない（重複スタイル防止）
        // prices_by_region.json に直接存在するエリアキーも確認
        const rawRegionName = Object.keys(areaDisplayMap).find(key => areaDisplayMap[key] === regionName) || regionName;
        if (availablePrefectures.has(rawRegionName) || areas[rawRegionName] || rawRegionName === "全国") {
            row.classList.add("prefecture-row");
        }
      }

      // '対象外'の場合は文字列として表示、それ以外はtoLocaleString()で整形
      const formatPrice = (price) => {
        return price === "対象外" ? "対象外" : price.toLocaleString() + "円";
      };

      row.innerHTML = `
        <td>${regionName}</td>
        <td>${formatPrice(priceData["ベーシック"])}</td>
        <td>${formatPrice(priceData["マルチのみ"])}</td>
        <td>${formatPrice(priceData["POS静止画"])}</td>
        <td>${formatPrice(priceData["POS動画"])}</td>
      `;
      priceTableBody.appendChild(row);
    };

    const addedRegions = new Set(); // 重複行を避けるためのSet

    // 選択肢が何もない場合のロジックを優先
    if (!selectedArea && !selectedPrefecture && !citySelect.value) {
        // 何も選択肢ない場合、全国の価格情報のみ表示
        if (allPrices["全国"]) {
            addPriceRow("全国", allPrices["全国"]);
            addedRegions.add("全国");
        }
    } else {
        // 1. 全国価格を常に表示 (ただし、何も選択肢がない場合の条件は上記で処理済み)
        if (allPrices["全国"]) {
          addPriceRow("全国", allPrices["全国"]);
          addedRegions.add("全国");
        }

        // 2. 選択されたエリアの価格を表示（全国と重複しない場合）
        let areaPriceKey = selectedArea;
        if (selectedArea === "九州・沖縄") {
            areaPriceKey = "九州";
        } else if (selectedArea === "近畿") {
            areaPriceKey = "近畿北陸";
        }
        
        // エリアが存在し、かつprices_by_region.jsonにそのキーが存在する場合
        if (selectedArea && allPrices[areaPriceKey] && !addedRegions.has(areaPriceKey)) {
            addPriceRow(selectedArea, allPrices[areaPriceKey]); // 表示名はselectedArea、データはareaPriceKeyで取得
            addedRegions.add(areaPriceKey);
        }

        // 3. 選択された都道府県の価格を表示し、強調
        if (selectedPrefecture && allPrices[selectedPrefecture] && !addedRegions.has(selectedPrefecture)) { 
          addPriceRow(selectedPrefecture, allPrices[selectedPrefecture], true); 
          addedRegions.add(selectedPrefecture);
        }
        
        // 4. その他の関連する都道府県の価格を表示
        // 表示すべき都道府県のリストを決定 (選択エリアがあればその中の都道府県、なければ全ての利用可能な都道府県)
        const prefecturesToDisplay = selectedArea ? 
                                     (areas[selectedArea] ? areas[selectedArea].filter(p => availablePrefectures.has(p)) : []) :
                                     Array.from(availablePrefectures);
        
        prefecturesToDisplay.sort().forEach(pref => {
            if (allPrices[pref] && !addedRegions.has(pref)) { 
                addPriceRow(pref, allPrices[pref]); 
                addedRegions.add(pref);
            }
        });
    }

    // 表示順序の調整: 全国 -> 選択エリア -> 選択都道府県 -> その他の都道府県
    const order = ["全国"];
    if (selectedArea && selectedArea !== "全国") {
        order.push(selectedArea);
    }
    if (selectedPrefecture && selectedPrefecture !== "全国") {
        order.push(selectedPrefecture);
    }

    const sortedRows = Array.from(priceTableBody.children).sort((a, b) => {
      const textA = a.children[0].textContent;
      const textB = b.children[0].textContent;

      let indexA = order.indexOf(textA);
      let indexB = order.indexOf(textB);
      
      // prices_by_region.json のキー名と表示名を考慮した順序調整
      // 例: "九州" (表示名) は "九州・沖縄" (areasキー) または "九州" (pricesキー) に対応
      if (textA === "九州" && selectedArea === "九州・沖縄") indexA = order.indexOf("九州・沖縄");
      if (textB === "九州" && selectedArea === "九州・沖縄") indexB = order.indexOf("九州・沖縄");
      if (textA === "近畿" && selectedArea === "近畿") indexA = order.indexOf("近畿"); // 近畿の場合
      if (textB === "近畿" && selectedArea === "近畿") indexB = order.indexOf("近畿");


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
      // どちらも優先順位リストにない場合、都道府県名でソート（昇順）
      return textA.localeCompare(textB);
    });

    // ソートされた順序でDOMを再構築
    priceTableBody.innerHTML = '';
    sortedRows.forEach(row => priceTableBody.appendChild(row));
  }

  // 初期表示時に結果セクションのコンテンツを非表示にする関数
  function hideAllContent() {
    storeSummary.style.display = 'none';
    priceTable.style.display = 'none';
    searchResultTable.style.display = 'none';
  }

  // 検索後に結果セクションのコンテンツを表示する関数
  function showAllContent() {
    storeSummary.style.display = 'block';
    priceTable.style.display = 'table';
    searchResultTable.style.display = 'table';
  }
});
