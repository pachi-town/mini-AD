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
  showPrices();
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
  });
}

function showPrices() {
  const area = document.getElementById("priceArea");
  area.innerHTML = `<strong>全国：</strong> ベーシック ${prices["ベーシック"] ?? 0}円 / マルチのみ ${prices["マルチのみ"] ?? 0}円 / POS静止画 ${prices["POS静止画"] ?? 0}円 / POS動画 ${prices["POS動画"] ?? 0}円`;
}

function render() {
  const pref = document.getElementById("pref-select").value;
  const city = document.getElementById("city-select").value;
  const query = document.getElementById("searchBox").value.trim();

  let filtered = stores.filter(s => {
    return (!pref || s.都道府県 === pref)
      && (!city || s.市区町村 === city)
      && (!query || (s.住所 && s.住所.includes(query)));
  });

  document.getElementById("resultCount").innerHTML = `${filtered.length} 件の店舗が見つかりました`;

  const tbody = document.querySelector("#storeTable tbody");
  tbody.innerHTML = "";
  filtered.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${s.サイネージ}</td><td>${s.住所}</td><td>${s.サイネージ種別}</td>`;
    tbody.appendChild(tr);
  });
}

loadData();
