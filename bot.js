// =============================
// MochiPop BOT 🍛
// Telegram Bot Version
// =============================
 
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
 
// === MASUKKAN TOKEN TELEGRAM ANDA DI SINI ===
const token = process.env.TELEGRAM_BOT_TOKEN || '8010057212:AAG8LvpiVFBAEmVCPno_4fMaxxMXFvlS0AU';
 
// Jalankan bot dengan polling
const bot = new TelegramBot(token, { polling: true });
 
// Error handling untuk bot
bot.on('error', (error) => {
  console.error('Bot error:', error);
});
 
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});
// =============================
// Data Menu Warteg
// =============================
const menu = {
  "Mochi Coklat": 10000,
  "Mochi Kacang Tanah": 10000,
  "Mochi kacang Merah": 12000,
  "Mochi Coklat Strawberry": 15000,
  "Mochi Green Tea": 10000,
  "Mochi Cookies & Cream": 15000
};
// =============================
// State Management
// =============================
const userStates = new Map(); // chatId -> state
 
// =============================
// Inline Keyboard Menu Utama
// =============================
const mainMenu = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🍡 Lihat Menu", callback_data: "lihat_menu" }],
      [{ text: "🛒 Pesan Makanan", callback_data: "pesan_makanan" }],
      [{ text: "📍 Info Lokasi & Jam Buka", callback_data: "info_lokasi" }],
      [{ text: "📞 Hubungi Admin", callback_data: "hubungi_admin" }]
    ]
  }
};
// =============================
// COMMAND /START
// =============================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
 
  try {
    await bot.sendMessage(chatId, `
🍡✨ Halo, selamat datang di *MochiPop*!  
Saya *MochiPopBot*, siap bantu kamu pesan makanan enak dan hemat 😋
 
Silakan pilih menu di bawah ini:
    `, { parse_mode: 'Markdown', ...mainMenu });
  } catch (error) {
    console.error('Error sending start message:', error);
  }
});
// =============================
// HANDLER CALLBACK BUTTON
// =============================
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const action = query.data;
 
  try {
    switch (action) {
// === FLOW 2: LIHAT MENU ===
      case 'lihat_menu':
        await bot.sendMessage(chatId, `
🍡 *Menu Hari Ini:*
 
🍫 Mochi Coklat – Rp10.000  
🥜 Mochi Kacang Tanah – Rp10.000  
🫘 Mochi Kacang Merah – Rp12.000  
🤎🍓 Mochi Coklat Strawberry – Rp15.000  
‧₊˚ 🍵 ⋅ Mochi Green tea – Rp10.000  
🍪 Mochi Cookies & Cream – Rp15.000
 
Ketik *pesan* untuk lanjut order makanan.
        `, { parse_mode: 'Markdown' });
        break;
 // === FLOW 3: PESAN MAKANAN ===
      case 'pesan_makanan':
        userStates.set(chatId, 'waiting_for_order');
        await bot.sendMessage(chatId, `
Baik! Ketik pesanan kamu ya, contoh:
*Pesan Mochi Coklat 1, Mochi Kacang Tanah 1,Mochi Cookies & Cream 1*
        `, { parse_mode: 'Markdown' });
        break;
 // === FLOW 4: INFO LOKASI ===
      case 'info_lokasi':
        await bot.sendMessage(chatId, `
🕒 Kami buka setiap hari pukul *08.00–21.00 WIB*  
📍 Alamat: *Jl. Mawar No. 189, Bekasi*  
📌 Google Maps: [bit.ly/MochiPop](https://bit.ly/MochiPop)
        `, { parse_mode: 'Markdown', ...mainMenu });
        break;
// === FLOW 5: HUBUNGI ADMIN ===
      case 'hubungi_admin':
        await bot.sendMessage(chatId, `
Untuk pertanyaan atau pesanan besar (catering):
📞 *0813-0265-2005*  
📧 *mochipop@gmail.com*
 
Kami siap membantu Anda! 🍛
        `, { parse_mode: 'Markdown', ...mainMenu });
        break;
 
      default:
        await fallback(chatId);
    }
await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Error handling callback query:', error);
    try {
      await bot.answerCallbackQuery(query.id, { text: 'Terjadi kesalahan, silakan coba lagi.' });
    } catch (answerError) {
      console.error('Error answering callback query:', answerError);
    }
  }
});
// =============================
// HANDLER PESAN UMUM
// =============================
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userState = userStates.get(chatId);
 
  try {
    if (userState === 'waiting_for_order') {
      await handleOrder(msg);
    } else if (userState === 'waiting_for_confirmation') {
      await handleConfirmation(msg);
    } else if (userState === 'waiting_for_contact') {
      await handleContact(msg);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    try {
      await bot.sendMessage(chatId, 'Terjadi kesalahan, silakan coba lagi atau gunakan menu utama.', mainMenu);
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
});
// =============================
// FLOW 3.1: PROSES PESAN MAKANAN
// =============================
async function handleOrder(msg) {
  const chatId = msg.chat.id;
  const orderText = msg.text;
 
  try {
    const items = parseOrder(orderText);
    const total = calculateTotal(items);
 
    if (total === 0) {
      userStates.delete(chatId);
      await bot.sendMessage(chatId, "Maaf, saya tidak menemukan item valid dari pesanan kamu 😅", mainMenu);
      return;
    }
 
    const orderSummary = items.map(i => `${i.name} x${i.quantity}`).join(" + ");
    userStates.set(chatId, 'waiting_for_confirmation');
    userStates.set(`${chatId}_order`, { items, total, orderSummary });
   
    await bot.sendMessage(chatId, `
✅ Pesanan kamu: ${orderSummary}  
💰 Total: Rp${total.toLocaleString('id-ID')}
 
Mau lanjut checkout? (ya/tidak)
    `, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in handleOrder:', error);
    userStates.delete(chatId);
    await bot.sendMessage(chatId, "Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.", mainMenu);
  }
}
 
async function handleConfirmation(msg) {
  const chatId = msg.chat.id;
  const reply = msg.text.toLowerCase();
 
  try {
    if (reply === "ya") {
      userStates.set(chatId, 'waiting_for_contact');
      await bot.sendMessage(chatId, "Silakan kirim *nama dan nomor HP* untuk konfirmasi pesanan.", { parse_mode: 'Markdown' });
    } else {
      userStates.delete(chatId);
      userStates.delete(`${chatId}_order`);
      await bot.sendMessage(chatId, "Baik, pesanan dibatalkan. Silakan lihat menu lain atau kembali ke menu utama.", mainMenu);
    }
  } catch (error) {
    console.error('Error in handleConfirmation:', error);
    userStates.delete(chatId);
    userStates.delete(`${chatId}_order`);
    await bot.sendMessage(chatId, "Terjadi kesalahan. Silakan coba lagi.", mainMenu);
  }
}
 
async function handleContact(msg) {
  const chatId = msg.chat.id;
  const contact = msg.text;
 
  try {
    userStates.delete(chatId);
    userStates.delete(`${chatId}_order`);
await bot.sendMessage(chatId, `
Terima kasih ${contact.split(" ")[0]}! 🙏  
Admin kami akan segera menghubungi kamu untuk konfirmasi pesanan.
 
🍽️ *Terima kasih sudah pesan di MochiPop!* 🍡✨
    `, { parse_mode: 'Markdown', ...mainMenu });
  } catch (error) {
    console.error('Error in handleContact:', error);
    await bot.sendMessage(chatId, "Terima kasih! Admin akan menghubungi Anda.", mainMenu);
  }
}
// =============================
// Fungsi Parsing & Hitung Total
// =============================
function parseOrder(orderText) {
  const foundItems = [];
  const orderLower = orderText.toLowerCase();
 
  for (let key in menu) {
    const itemLower = key.toLowerCase();
    if (orderLower.includes(itemLower)) {
      // Cari jumlah item dengan regex
      const quantityRegex = new RegExp(`(\\d+)\\s*${itemLower.replace(/\s+/g, '\\s+')}`, 'i');
      const match = orderText.match(quantityRegex);
      const quantity = match ? parseInt(match[1]) : 1;
     
      foundItems.push({
        name: key,
        price: menu[key],
        quantity: quantity
      });
    }
  }
  return foundItems;
}
 
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}
// =============================
// FLOW 6: FALLBACK
// =============================
async function fallback(chatId) {
  try {
    await bot.sendMessage(chatId, `
Maaf, saya belum paham maksud kamu 😅  
Silakan pilih menu berikut:
1️⃣ Lihat Menu  
2️⃣ Pesan Makanan  
3️⃣ Info Lokasi  
4️⃣ Hubungi Admin
    `, mainMenu);
  } catch (error) {
    console.error('Error in fallback:', error);
  }
}
 
console.log("🤖 MochiPop Bot is running...");
