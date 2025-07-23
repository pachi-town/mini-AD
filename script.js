
let storeData = [];
let priceData = {};

const PREF_TO_AREA = {
  "北海道": "北海道",
  "青森県": "東北",
  "岩手県": "東北",
  "宮城県": "東北",
  "秋田県": "東北",
  "山形県": "東北",
  "福島県": "東北",
  "茨城県": "関東",
  "栃木県": "関東",
  "群馬県": "関東",
  "埼玉県": "関東",
  "千葉県": "関東",
  "東京都": "関東",
  "神奈川県": "関東",
  "新潟県": "近畿北陸",
  "富山県": "近畿北陸",
  "石川県": "近畿北陸",
  "福井県": "近畿北陸",
  "山梨県": "関東",
  "長野県": "近畿北陸",
  "岐阜県": "東海",
  "静岡県": "東海",
  "愛知県": "東海",
  "三重県": "東海",
  "滋賀県": "近畿北陸",
  "京都府": "近畿北陸",
  "大阪府": "近畿北陸",
  "兵庫県": "近畿北陸",
  "奈良県": "近畿北陸",
  "和歌山県": "近畿北陸",
  "鳥取県": "近畿北陸",
  "島根県": "近畿北陸",
  "岡山県": "近畿北陸",
  "広島県": "近畿北陸",
  "山口県": "近畿北陸",
  "徳島県": "四国",
  "香川県": "四国",
  "愛媛県": "四国",
  "高知県": "四国",
  "福岡県": "九州",
  "佐賀県": "九州",
  "長崎県": "九州",
  "熊本県": "九州",
  "大分県": "九州",
  "宮崎県": "九州",
  "鹿児島県": "九州",
  "沖縄県": "九州"
};

const AREA_ALIAS = {
  "近畿": "近畿北陸",
  "北陸": "近畿北陸"
};

Promise.all([
  fetch('store.json').then(res => res.json()),
  fetch('prices_by_region.json').then(res => res.json())
]).then(([stores, prices]) => {
  storeData = stores;
  priceData = prices;
  populateSelectors();
  document.getElementById("searchBtn").addEventListener("click", renderResults);
});

function populateSelectors() {
  const prefs = [...new Set(storeData.map(s => s.都道府県))];
  const selPref = document.getElementById("prefectureSelect");
  prefs.forEach(p => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = p;
    selPref.appendChild(opt);
  });

  selPref.addEventListener("change", () => {
    const selected = selPref.value;
    const cities = [...new Set(storeData.filter(s => s.都道府県 === selected).map(s => s.市区町村))];
    const citySel = document.getElementById("citySelect");
    citySel.innerHTML = '<option value="">市区町村</option>';
    cities.forEach(c => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = c;
      citySel.appendChild(opt);
    });
  });
}

function renderResults() {
  const pref = document.getElementById("prefectureSelect").value;
  const city = document.getElementById("citySelect").value;
  const keyword = document.getElementById("searchInput").value.trim();

  let results = storeData.filter(s =>
    (!pref || s.都道府県 === pref) &&
    (!city || s.市区町村 === city) &&
    (!keyword || s.店名.includes(keyword))
  );

  const tbody = document.getElementById("resultBody");
  tbody.innerHTML = "";
  results.forEach(s => {
    const signage = s.サイネージ || "";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${signage}</td><td>${s.店名}</td><td>${s.住所}</td>`;
    tbody.appendChild(tr);
  });

  document.getElementById("resultCount").textContent = `該当件数：${results.length}`;

  let html = '<div><strong>全国：</strong> ベーシック ' + priceData['全国'].ベーシック.toLocaleString() + '円 ／ マルチのみ ' + priceData['全国']["マルチのみ"].toLocaleString() + '円 ／ POS静止画 ' + priceData['全国']["POS静止画"].toLocaleString() + '円 ／ POS動画 ' + priceData['全国']["POS動画"].toLocaleString() + '円</div>';

  if (pref && priceData[pref]) {
    const p = priceData[pref];
    html += '<div><strong>' + pref + '：</strong> ベーシック ' + p.ベーシック.toLocaleString() + '円 ／ マルチのみ ' + p["マルチのみ"].toLocaleString() + '円 ／ POS静止画 ' + p["POS静止画"].toLocaleString() + '円 ／ POS動画 ' + p["POS動画"].toLocaleString() + '円</div>';
  }

  const area = AREA_ALIAS[PREF_TO_AREA[pref]] || PREF_TO_AREA[pref];
  if (area && priceData[area]) {
    const a = priceData[area];
    html += '<div><strong>' + area + '：</strong> ベーシック ' + a.ベーシック.toLocaleString() + '円 ／ マルチのみ ' + a["マルチのみ"].toLocaleString() + '円 ／ POS静止画 ' + a["POS静止画"].toLocaleString() + '円 ／ POS動画 ' + a["POS動画"].toLocaleString() + '円</div>';
  }

  document.getElementById("priceInfo").innerHTML = html;
}
