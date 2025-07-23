let storeData = [];
let priceData = {};

fetch('store.json')
  .then(response => response.json())
  .then(data => {
    storeData = data;
    populateFilters();
    filterStores();
  });

fetch('prices_by_region.json')
  .then(response => response.json())
  .then(data => {
    priceData = data;
  });

function populateFilters() {
  const prefectures = [...new Set(storeData.map(s => s.prefecture))];
  const prefectureSelect = document.getElementById('prefectureSelect');
  prefectures.forEach(p => {
    const option = document.createElement('option');
    option.value = p;
    option.textContent = p;
    prefectureSelect.appendChild(option);
  });
  prefectureSelect.onchange = populateCities;
  populateCities();
}

function populateCities() {
  const prefecture = document.getElementById('prefectureSelect').value;
  const citySelect = document.getElementById('citySelect');
  citySelect.innerHTML = '';
  const cities = [...new Set(storeData.filter(s => s.prefecture === prefecture).map(s => s.city))];
  cities.forEach(c => {
    const option = document.createElement('option');
    option.value = c;
    option.textContent = c;
    citySelect.appendChild(option);
  });
}

function filterStores() {
  const prefecture = document.getElementById('prefectureSelect').value;
  const city = document.getElementById('citySelect').value;
  const keyword = document.getElementById('storeSearch').value.trim();
  const filtered = storeData.filter(s =>
    s.prefecture === prefecture &&
    s.city === city &&
    s.name.toLowerCase().includes(keyword.toLowerCase())
  );
  updateTable(filtered);
  updatePrices(prefecture, city);
}

function updateTable(data) {
  const table = document.getElementById('storeTable');
  table.innerHTML = '';
  data.forEach(s => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${s.signage}</td><td>${s.name}</td><td>${s.address}</td>`;
    table.appendChild(row);
  });
  document.getElementById('resultCount').textContent = `該当件数：${data.length}`;
}

function formatPriceLine(p) {
  return `ベーシック ${p.basic}円 ／ マルチのみ ${p.multi}円 ／ POS静止画 ${p.posStill}円 ／ POS動画 ${p.posVideo}円`;
}

function updatePrices(prefecture, city) {
  const area = getArea(prefecture);
  const priceLines = [];

  if (priceData['全国']) {
    priceLines.push(`全国：${formatPriceLine(priceData['全国'])}`);
  }
  if (area && priceData[area]) {
    priceLines.push(`${area}：${formatPriceLine(priceData[area])}`);
  }
  if (prefecture && priceData[prefecture]) {
    priceLines.push(`${prefecture}：${formatPriceLine(priceData[prefecture])}`);
  }

  document.getElementById('priceInfo').innerHTML = priceLines.join('<br>');
}

function getArea(pref) {
  const areaMap = {
    '北海道': '北海道', '青森県': '東北', '岩手県': '東北', '宮城県': '東北', '秋田県': '東北', '山形県': '東北', '福島県': '東北',
    '茨城県': '関東', '栃木県': '関東', '群馬県': '関東', '埼玉県': '関東', '千葉県': '関東', '東京都': '関東', '神奈川県': '関東',
    '新潟県': '近畿北陸', '富山県': '近畿北陸', '石川県': '近畿北陸', '福井県': '近畿北陸', '山梨県': '近畿北陸', '長野県': '近畿北陸',
    '岐阜県': '東海', '静岡県': '東海', '愛知県': '東海', '三重県': '東海',
    '滋賀県': '近畿北陸', '京都府': '近畿北陸', '大阪府': '近畿北陸', '兵庫県': '近畿北陸', '奈良県': '近畿北陸', '和歌山県': '近畿北陸',
    '鳥取県': '四国', '島根県': '四国', '岡山県': '四国', '広島県': '四国', '山口県': '四国',
    '徳島県': '四国', '香川県': '四国', '愛媛県': '四国', '高知県': '四国',
    '福岡県': '九州', '佐賀県': '九州', '長崎県': '九州', '熊本県': '九州', '大分県': '九州', '宮崎県': '九州', '鹿児島県': '九州', '沖縄県': '九州'
  };
  return areaMap[pref] || '';
}
