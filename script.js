// Konfigurasi
const token = "7635408983:AAHrM9l9mXMYMrX6K6IP_my1tR-gHCmADBM";
const infoGroupId = "-1002386917210";   // grup informasi
const proofGroupId = "-1002406787864";  // grup bukti transfer
const adminWa = "6283896425349";        // nomor admin WA (format internasional, tanpa +)

let selectedFee = null;
let orderCode = null;

// Pilih biaya
document.querySelectorAll(".fee-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".fee-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedFee = btn.dataset.fee;
    orderCode = "REG" + Math.random().toString().slice(2,8);
    document.getElementById("summary").innerHTML =
      `Biaya pendaftaran dipilih: <strong>Rp${Number(selectedFee).toLocaleString()}</strong><br>
       Pemain yang menang akan mendapatkan <strong>40%</strong> dari total biaya pendaftaran.`;
  });
});

// Modal QR
const qrModal = document.getElementById("qrModal");
document.getElementById("btnPay").onclick = () => {
  if (!selectedFee) { alert("Pilih biaya pendaftaran dulu!"); return; }
  qrModal.style.display = "flex";
};
document.getElementById("closeQr").onclick = () => qrModal.style.display = "none";

// Kirim pesan teks ke Telegram
const sendMessage = (chatId, text, buttons) => {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
      reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
    }),
  }).then(res => res.json());
};

// Upload bukti TF + cooldown 15 detik
document.getElementById("btnSendProof").onclick = async () => {
  const gameId = document.getElementById("gameId").value.trim();
  const username = document.getElementById("username").value.trim();
  const waNumber = document.getElementById("waNumber").value.trim();
  const proofFile = document.getElementById("proofFile").files[0];
  const btnSend = document.getElementById("btnSendProof");

  if (!gameId || !username || !waNumber || !selectedFee) {
    alert("Lengkapi semua data dulu!");
    return;
  }
  if (!proofFile) {
    alert("Pilih file bukti transfer!");
    return;
  }

  // Kirim foto bukti ke grup bukti transfer
  const formData = new FormData();
  formData.append("chat_id", proofGroupId);
  formData.append("photo", proofFile);
  formData.append("caption", `📄 Bukti TF Pendaftaran\n\nID: ${gameId}\nUsername: ${username}\nWA: ${waNumber}\nNominal: Rp${Number(selectedFee).toLocaleString()}\nKode: ${orderCode}`);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: formData
  }).then(r => r.json());

  if (!res.ok) { alert("Gagal kirim bukti transfer!"); return; }

  // Tombol ✅ ❌ di bawah gambar bukti transfer
  const proofMsgId = res.result.message_id;
  const buttonsProof = [
    [
      { text: "✅ Konfirmasi", url: `https://wa.me/${adminWa}?text=${encodeURIComponent(`ID: ${gameId}\nUsername: ${username}\nWA: ${waNumber}\nNominal: Rp${selectedFee}\nTerkonfirmasi ✅`)}` },
      { text: "❌ Tolak", url: `https://wa.me/${adminWa}?text=${encodeURIComponent(`ID: ${gameId}\nUsername: ${username}\nWA: ${waNumber}\nNominal: Rp${selectedFee}\nGagal ❌`)}` }
    ]
  ];

  await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: proofGroupId,
      message_id: proofMsgId,
      reply_markup: { inline_keyboard: buttonsProof }
    })
  });

  // Kirim info ke grup informasi dengan tombol "Lihat Bukti Transfer"
  const buttonsInfo = [
    [{ text: "📷 Lihat Bukti Transfer", url: `https://t.me/c/${proofGroupId.replace('-100','')}/${proofMsgId}` }]
  ];

  await sendMessage(infoGroupId,
    `🔔 *Pendaftaran Baru*\n\n👤 ID: ${gameId}\n📝 Username: ${username}\n📱 WA: ${waNumber}\n💰 Biaya: Rp${Number(selectedFee).toLocaleString()}\nKode: ${orderCode}`,
    buttonsInfo
  );

  // Reset form
  document.getElementById("registerForm").reset();
  selectedFee = null;
  document.getElementById("summary").innerHTML = "Pemain yang menang akan mendapatkan <strong>40%</strong> dari total biaya pendaftaran.";

  // Cooldown 15 detik
  let countdown = 15;
  btnSend.disabled = true;
  const interval = setInterval(() => {
    btnSend.textContent = `Tunggu ${countdown}s...`;
    countdown--;
    if (countdown < 0) {
      clearInterval(interval);
      // Redirect ke halaman selesai
      window.location.href = "pendaftaran-selesai.html";
    }
  }, 1000);
};