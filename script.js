let stores = [];
let prices = {};

async function loadData() {
  const [storeRes, priceRes] = await Promise.all([
    fetch("store_data.json"),
    fetch("price_data.json"),
  ]);
  stores = await storeRes.json();
  prices = await priceRes.json();
  populateDropdowns();
  showPrices(); // 全国価格表示
  render();
}

function populateDropdowns() {
  const prefSet = new Set(stores.map(s => s.都道府県).filter(Boolean));
  const prefSelect = document.getElementById("pref-select");
  for (const pref of [...prefSet].sort()) {
    const opt = document.createElement("option");
    opt.value = opt.text = pref;
    prefSelect.appendChild(opt);
  }

  prefSelect.addEventListener("change", () => {
    const citySelect = document.getElementById("city-select");
    citySelect.innerHTML = '<option value="">--選択--</option>';
    const selectedPref = prefSelect.value;
    const citySet = new Set(stores.filter(s => s.都道府県 === selectedPref).map(s => s.市区町村).filter(Boolean));
    for (const city of [...citySet].sort()) {
      const opt = document.createElement("option");
      opt.value = opt.text = city;
      citySelect.appendChild(opt);
    }
    showPrices(); // 都道府県選択時に価格切り替え
  });
}

function showPrices() {
  const area = document.getElementById("priceArea");
  const pref = document.getElementById("pref-select").value;
  if (!pref || !prices[pref]) {
    area.innerHTML = `<strong>全国：</strong> ベーシック ${prices["ベーシック"] ?? 0}円 / マルチのみ ${prices["マルチのみ"] ?? 0}円 / POS静止画 ${prices["POS静止画"] ?? 0}円 / POS動画 ${prices["POS動画"] ?? 0}円`;
  } else {
    const p = prices[pref];
    area.innerHTML = `<strong>${pref}：</strong> ベーシック ${p["ベーシック"] ?? 0}円 / マルチのみ ${p["マルチのみ"] ?? 0}円 / POS静止画 ${p["POS静止画"] ?? 0}円 / POS動画 ${p["POS動画"] ?? 0}円`;
  }
}

function render() {
  const pref = document.getElementById("pref-select").value;
  const city = document.getElementById("city-select").value;
  const query = document.getElementById("searchBox").value.trim();

  let filtered = stores.filter(s => {
    return (!pref || s.都道府県 === pref)
      && (!city || s.市区町村 === city)
      && (!query || (s.店名 && s.店名.includes(query)));
  });

  document.getElementById("resultCount").innerHTML = `${filtered.length} 件の店舗が見つかりました`;

  const tbody = document.querySelector("#storeTable tbody");
  tbody.innerHTML = "";
  filtered.forEach(s => {
    const signage = s.サイネージ === "1" ? "1面のみ" :
                    s.サイネージ === "新" ? "マルチディスプレイ" : (s.サイネージ ?? "―");

    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${signage}</td><td>${s.店名 ?? "―"}</td><td>${s.住所}</td>`;
    tbody.appendChild(tr);
  });
}

loadData();
