
let storeData = [];

fetch('store_with_price.json')
  .then(response => response.json())
  .then(data => {
    storeData = data;
    populatePrefectures();
    renderTable(data);
    updatePrice('全国');
  });

function populatePrefectures() {
  const prefSelect = document.getElementById('prefSelect');
  const citySelect = document.getElementById('citySelect');
  const areaSelect = document.getElementById('areaSelect');

  const prefectures = [...new Set(storeData.map(d => d.都道府県))].sort();
  const areas = [...new Set(storeData.map(d => d.エリア))].sort();

  prefSelect.innerHTML = '<option value="">都道府県選択</option>';
  citySelect.innerHTML = '<option value="">市区町村選択</option>';
  areaSelect.innerHTML = '<option value="">エリア選択</option>';

  for (const pref of prefectures) {
    prefSelect.innerHTML += `<option value="${pref}">${pref}</option>`;
  }
  for (const area of areas) {
    areaSelect.innerHTML += `<option value="${area}">${area}</option>`;
  }

  prefSelect.onchange = () => {
    const selected = prefSelect.value;
    const filtered = storeData.filter(d => d.都道府県 === selected);
    const cities = [...new Set(filtered.map(d => d.市区町村))].sort();
    citySelect.innerHTML = '<option value="">市区町村選択</option>';
    for (const city of cities) {
      citySelect.innerHTML += `<option value="${city}">${city}</option>`;
    }
    updatePrice(selected || '全国');
    renderTable(filtered);
  };

  citySelect.onchange = () => {
    const selectedPref = prefSelect.value;
    const selectedCity = citySelect.value;
    const filtered = storeData.filter(d => d.都道府県 === selectedPref && d.市区町村 === selectedCity);
    renderTable(filtered);
  };

  areaSelect.onchange = () => {
    const selected = areaSelect.value;
    const filtered = storeData.filter(d => d.エリア === selected);
    renderTable(filtered);
    updatePrice(selected);
  };

  document.getElementById('nameInput').oninput = (e) => {
    const keyword = e.target.value;
    const filtered = storeData.filter(d => d.店名.includes(keyword));
    renderTable(filtered);
  };
}

function updatePrice(region) {
  const priceBox = document.getElementById('priceArea');
  const target = storeData.find(d => d.都道府県 === region || d.エリア === region || region === '全国');
  if (!target) {
    priceBox.innerHTML = '価格情報なし';
    return;
  }
  priceBox.innerHTML = `
    <div class="mb-2">
      <strong>対象地域：</strong>${region}<br/>
      <strong>ベーシック：</strong>${formatYen(target['ベーシック'])}／週　
      <strong>3面のみ：</strong>${formatYen(target['3面のみ'])}／週　
      <strong>POS静止画：</strong>${formatYen(target['POS静止画'])}／週　
      <strong>POS動画：</strong>${formatYen(target['POS動画'])}／週
    </div>`;
}

function formatYen(val) {
  return val ? `¥${Number(val).toLocaleString()}` : '-';
}

function renderTable(data) {
  const tbody = document.getElementById('storeTable');
  const counter = document.getElementById('resultCount');
  tbody.innerHTML = '';
  counter.textContent = `該当件数：${data.length} 件`;

  for (const row of data) {
    const sign = row.サイネージ === '新' ? 'マルチディスプレイ' : '1面のみ';
    tbody.innerHTML += `<tr>
      <td class="border px-2 py-1">${sign}</td>
      <td class="border px-2 py-1">${row.店名}</td>
      <td class="border px-2 py-1">${row.住所}</td>
    </tr>`;
  }
}
