import express from "express"; // jika package.json pakai "type": "module"
// atau kalau kamu pakai require():
// const express = require("express");

const app = express();

// Tambahkan route utama agar Railway bisa menampilkan sesuatu
app.get("/", (req, res) => {
  res.send("✅ Mochi Telegram Bot is running on Railway!");
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port ${PORT}");
});