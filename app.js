const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRpcuB3lP6poEiXufRP7C_pdB3ZHz4WB82Zg5JmLSUg_BvjoC7xM5BDqG5PhdZOFg/pub?gid=1251597746&single=true&output=csv";

let data = [];

fetch(sheetURL)
  .then(res => res.text())
  .then(csv => {
    const rows = csv.split("\n").slice(1);
    data = rows.map(row => {
      const cols = row.split(",");
      return {
        title: cols[0],
        keywords: cols[1],
        creator: cols[2],
        link: cols[3]
      };
    });
    render(data);
  });

function render(items) {
  const list = document.getElementById("list");
  list.innerHTML = "";

  items.forEach((item, index) => {
    const li = document.createElement("li");

    const favs = JSON.parse(localStorage.getItem("favs") || "[]");
    const isFav = favs.includes(index);

    li.innerHTML = `
      <b>${item.title}</b> (${item.creator})<br>
      <a href="${item.link}" target="_blank">Open</a>
      <button onclick="toggleFav(${index})">
        ${isFav ? "★" : "☆"}
      </button>
    `;

    list.appendChild(li);
  });
}

document.getElementById("search").addEventListener("input", e => {
  const value = e.target.value.toLowerCase();

  const filtered = data.filter(item =>
    item.keywords.toLowerCase().includes(value)
  );

  render(filtered);
});

function toggleFav(index) {
  let favs = JSON.parse(localStorage.getItem("favs") || "[]");

  if (favs.includes(index)) {
    favs = favs.filter(i => i !== index);
  } else {
    favs.push(index);
  }

  localStorage.setItem("favs", JSON.stringify(favs));
  render(data);
}