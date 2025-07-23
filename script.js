
let storeData = [];
let priceData = {};

fetch('store_data.json')
  .then(res => res.json())
  .then(data => {
    storeData = data;
    populateDropdowns();
    displayAll(); // 初期表示は全国
  });

fetch('price_data.json')
  .then(res => res.json())
  .then(data => priceData = data);

function populateDropdowns() {
  const prefs = [...new Set(storeData.map(s => s.都道府県))];
  const prefSelect = document.getElementById('prefSelect');
  prefs.forEach(p => {
    const opt = document.createElement('option');
    opt.value = opt.text = p;
    prefSelect.add(opt);
  });

  prefSelect.addEventListener('change', () => {
    const cities = [...new Set(storeData.filter(s => s.都道府県 === prefSelect.value).map(s => s.市区町村))];
    const citySelect = document.getElementById('citySelect');
    citySelect.innerHTML = '<option>市区町村選択</option>';
    cities.forEach(c => {
      const opt = document.createElement('option');
      opt.value = opt.text = c;
      citySelect.add(opt);
    });
    search();
  });

  document.getElementById('citySelect').addEventListener('change', search);
  document.getElementById('nameInput').addEventListener('input', search);
}

function search() {
  const pref = document.getElementById('prefSelect').value;
  const city = document.getElementById('citySelect').value;
  const name = document.getElementById('nameInput').value.trim();

  let results = storeData;
  if (pref && pref !== '都道府県選択') results = results.filter(s => s.都道府県 === pref);
  if (city && city !== '市区町村選択') results = results.filter(s => s.市区町村 === city);
  if (name) results = results.filter(s => s.店名.includes(name));

  const table = document.getElementById('storeTable');
  table.innerHTML = '';
  results.forEach(store => {
    const tr = document.createElement('tr');
    const sign = store.サイネージ === '新' ? 'マルチディスプレイ' : '1面のみ';
    tr.innerHTML = `<td class="border px-2 py-1">${sign}</td><td class="border px-2 py-1">${store.店名}</td><td class="border px-2 py-1">${store.住所}</td>`;
    table.appendChild(tr);
  });

  document.getElementById('resultCount').textContent = `${results.length}件の店舗が見つかりました`;

  const area = document.getElementById('priceArea');
  const key = pref && pref !== '都道府県選択' ? pref : '全国';
  const p = priceData[key];
  if (p) {
    area.innerHTML = `<span class="text-blue-800">${key}</span>：ベーシック ${p['ベーシック']?.toLocaleString() || 0}円 ／ マルチのみ ${p['マルチのみ']?.toLocaleString() || 0}円 ／ POS静止画 ${p['POS静止画']?.toLocaleString() || 0}円 ／ POS動画 ${p['POS動画']?.toLocaleString() || 0}円`;
  } else {
    area.innerHTML = '';
  }
}

function displayAll() {
  document.getElementById('prefSelect').value = '都道府県選択';
  document.getElementById('citySelect').value = '市区町村選択';
  document.getElementById('nameInput').value = '';
  search();
}
