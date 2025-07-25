
document.addEventListener("DOMContentLoaded", () => {
  const priceTableBody = document.getElementById("priceTableBody");

  fetch("prices_by_region.json")
    .then((res) => res.json())
    .then((prices) => {
      priceTableBody.innerHTML = "";

      if (!Array.isArray(prices)) {
        console.error("Invalid data format: prices is not an array.");
        return;
      }

      const prefectures = [
        "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
        "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
        "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
        "岐阜県", "静岡県", "愛知県", "三重県",
        "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
        "鳥取県", "島根県", "岡山県", "広島県", "山口県",
        "徳島県", "香川県", "愛媛県", "高知県",
        "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
      ];

      prices.forEach((region) => {
        const isPrefecture = prefectures.includes(region.name);
        const row = document.createElement("tr");

        if (isPrefecture) row.classList.add("prefecture-row");

        row.innerHTML = `
          <td>${region.name}</td>
          <td>${region.basic === "対象外" ? "対象外" : region.basic + "円"}</td>
          <td>${region.multi === "対象外" ? "対象外" : region.multi + "円"}</td>
          <td>${region.posStill === "対象外" ? "対象外" : region.posStill + "円"}</td>
          <td>${region.posMovie === "対象外" ? "対象外" : region.posMovie + "円"}</td>
        `;
        priceTableBody.appendChild(row);
      });
    })
    .catch(err => {
      console.error("Fetch error:", err);
    });
});
