const fs = require("fs");
const fetch = require("node-fetch");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const RATE_FILE = path.join(__dirname, "aed_rate.json");

async function updateAedRate() {
  const apiKey = process.env.api_url; // your .env variable
  try {
    const url = `http://api.navasan.tech/latest/?api_key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API returned HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();

    // Use aed_sell directly
    const aedRate = Number(data.aed_sell.value); // now it's a number
    if (!aedRate) throw new Error("AED rate not found");

    fs.writeFileSync(RATE_FILE, JSON.stringify({ rate: Math.round(aedRate) }));
    console.log("✅ AED rate updated:", aedRate);
  } catch (err) {
    console.error("Error updating AED rate:", err);
  }
}

function getAedRate() {
  if (!fs.existsSync(RATE_FILE)) return null;
  const data = JSON.parse(fs.readFileSync(RATE_FILE));
  return data.rate;
}

module.exports = { getAedRate, updateAedRate };
