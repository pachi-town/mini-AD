
document.addEventListener("DOMContentLoaded", () => {
  const areaSelect = document.getElementById("areaSelect");
  const prefectureSelect = document.getElementById("prefectureSelect");
  const citySelect = document.getElementById("citySelect");
  const priceTableBody = document.getElementById("priceTableBody");

  fetch("prices_by_region.json")
    .then((res) => res.json())
    .then((prices) => {
      priceTableBody.innerHTML = "";

      prices.forEach((region) => {
        const row = document.createElement("tr");
        const isPrefecture = region.type === "prefecture";

        if (isPrefecture) row.classList.add("highlight-pref-price");

        row.innerHTML = `
          <td>${region.name}</td>
          <td>${region.basic === "対象外" ? "対象外" : region.basic + "円"}</td>
          <td>${region.multi === "対象外" ? "対象外" : region.multi + "円"}</td>
          <td>${region.posStill === "対象外" ? "対象外" : region.posStill + "円"}</td>
          <td>${region.posMovie === "対象外" ? "対象外" : region.posMovie + "円"}</td>
        `;
        if (isPrefecture) row.querySelectorAll("td").forEach(td => td.classList.add("highlight-pref-price"));
        priceTableBody.appendChild(row);
      });
    });
});
