const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const PORT = 8089;
const API_KEY = "pub_1366592f70104e74a11fce2ead31f57fb";

async function fetchNewsPage(page = 10) {
  const url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&country=in&language=en,hi&page=${page}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results || [];
}

app.get("/api/news", async (req, res) => {
  try {
    let allResults = [];
    let page = 10;
    let results;

    do {
      results = await fetchNewsPage(page);
      if (results.length === 0) break;

      allResults = allResults.concat(results);
      page++;

      if (page > 10) break;
    } while (results.length > 0);

    res.json(allResults);

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server crashed" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () =>
  console.log(`Prototype running at http://localhost:${PORT}`)
);