(function() {
  // Styles for floating chat widget & feedback rating
  const style = document.createElement('style');
  style.textContent = `
    .dishub-chat-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 58px;
      height: 58px;
      background: #0284c7;
      border-radius: 50%;
      box-shadow: 0 8px 24px rgba(2, 132, 199, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 26px;
      cursor: pointer;
      z-index: 99999;
      transition: transform 0.2s ease, background 0.2s ease;
      border: 2px solid #ffffff;
    }
    .dishub-chat-btn:hover {
      transform: scale(1.08);
      background: #0369a1;
    }
    .dishub-chat-box {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 370px;
      max-width: calc(100vw - 48px);
      height: 520px;
      max-height: calc(100vh - 120px);
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      display: none;
      flex-direction: column;
      z-index: 99999;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .dishub-chat-box.open { display: flex; }
    .dishub-chat-header {
      background: #0284c7;
      color: #fff;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .dishub-header-title {
      font-size: 14px;
      font-weight: 700;
    }
    .dishub-header-sub {
      font-size: 11px;
      opacity: 0.85;
    }
    .dishub-chat-close {
      background: none;
      border: none;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
    }
    .dishub-chat-msgs {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #0b0f19;
      font-size: 13px;
    }
    .dishub-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      line-height: 1.45;
      white-space: pre-wrap;
    }
    .dishub-msg.bot {
      background: #1e293b;
      color: #f1f5f9;
      align-self: flex-start;
      border-bottom-left-radius: 2px;
    }
    .dishub-msg.user {
      background: #0284c7;
      color: #ffffff;
      align-self: flex-end;
      border-bottom-right-radius: 2px;
    }
    .dishub-chat-input-row {
      padding: 12px;
      background: #0f172a;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      gap: 8px;
    }
    .dishub-chat-input {
      flex: 1;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 10px 14px;
      color: #fff;
      font-size: 13px;
      outline: none;
    }
    .dishub-chat-input:focus { border-color: #0284c7; }
    .dishub-chat-send {
      background: #0284c7;
      border: none;
      border-radius: 8px;
      color: #fff;
      padding: 0 16px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    }

    /* Rating & Feedback Card Style */
    .dishub-feedback-card {
      background: #1e293b;
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 12px;
      padding: 14px;
      margin-top: 4px;
      color: #f8fafc;
      font-size: 12.5px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .dishub-feedback-prompt {
      margin-bottom: 12px;
      line-height: 1.45;
      color: #e2e8f0;
    }
    .dishub-rating-emojis {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 12px;
      padding: 6px 4px;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 10px;
    }
    .dishub-rating-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      transition: transform 0.2s ease, filter 0.2s ease;
      filter: grayscale(85%);
      opacity: 0.7;
      border-radius: 8px;
      padding: 4px;
    }
    .dishub-rating-btn:hover {
      transform: scale(1.25);
      filter: grayscale(0%);
      opacity: 1;
    }
    .dishub-rating-btn.active {
      transform: scale(1.3);
      filter: grayscale(0%);
      opacity: 1;
      background: rgba(2, 132, 199, 0.2);
    }
    .dishub-feedback-input-row {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    .dishub-feedback-input {
      flex: 1;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 8px 12px;
      color: #f8fafc;
      font-size: 12px;
      outline: none;
    }
    .dishub-feedback-input:focus {
      border-color: #0284c7;
    }
    .dishub-feedback-submit {
      background: #0284c7;
      border: none;
      color: #fff;
      border-radius: 8px;
      padding: 0 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .dishub-feedback-submit:hover {
      background: #0369a1;
    }
    .dishub-feedback-thanks {
      color: #38bdf8;
      font-weight: 600;
      text-align: center;
      padding: 6px 0;
    }
  `;
  document.head.appendChild(style);

  // Widget Elements
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="dishub-chat-btn" id="dishubChatBtn" title="Tanya CS Dishub Aceh">💬</div>
    <div class="dishub-chat-box" id="dishubChatBox">
      <div class="dishub-chat-header">
        <div>
          <div class="dishub-header-title">CS Virtual Dishub Aceh</div>
          <div class="dishub-header-sub">Pelayanan Informasi Trans Koetaradja</div>
        </div>
        <button class="dishub-chat-close" id="dishubChatClose">×</button>
      </div>
      <div class="dishub-chat-msgs" id="dishubChatMsgs">
        <div class="dishub-msg bot">Halo! Saya CS Virtual Dinas Perhubungan Aceh. Ada yang bisa dibantu seputar rute bus Trans Koetaradja atau layanan Dishub?</div>
      </div>
      <div class="dishub-chat-input-row">
        <input type="text" class="dishub-chat-input" id="dishubInput" placeholder="Ketik pertanyaan...">
        <button class="dishub-chat-send" id="dishubSend">Kirim</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  const btn = document.getElementById('dishubChatBtn');
  const box = document.getElementById('dishubChatBox');
  const closeBtn = document.getElementById('dishubChatClose');
  const sendBtn = document.getElementById('dishubSend');
  const inputEl = document.getElementById('dishubInput');
  const msgsEl = document.getElementById('dishubChatMsgs');

  // Inactivity Timer State (2 menit = 120.000 ms)
  const INACTIVITY_DELAY = 2 * 60 * 1000;
  let inactivityTimer = null;
  let hasShownFeedback = false;
  let hasUserInteracted = false;

  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (hasShownFeedback) return;

    inactivityTimer = setTimeout(() => {
      // Munculkan feedback rating hanya jika chat box terbuka dan user pernah interaksi
      if (box.classList.contains('open') && hasUserInteracted && !hasShownFeedback) {
        showFeedbackPrompt();
      }
    }, INACTIVITY_DELAY);
  }

  function showFeedbackPrompt() {
    if (hasShownFeedback) return;
    hasShownFeedback = true;

    const card = document.createElement('div');
    card.className = 'dishub-feedback-card';
    card.innerHTML = `
      <div class="dishub-feedback-prompt">
        Kalau berkenan, boleh kasih rating untuk sesi chat ini? Feedback kamu sangat berarti buat kami... 🙏
      </div>
      <div class="dishub-rating-emojis">
        <button class="dishub-rating-btn" data-rating="1" title="Sangat Buruk">😞</button>
        <button class="dishub-rating-btn" data-rating="2" title="Buruk">🙁</button>
        <button class="dishub-rating-btn" data-rating="3" title="Cukup">😐</button>
        <button class="dishub-rating-btn" data-rating="4" title="Puas">😊</button>
        <button class="dishub-rating-btn" data-rating="5" title="Sangat Puas">😍</button>
      </div>
      <div class="dishub-feedback-input-row">
        <input type="text" class="dishub-feedback-input" id="dishubFbComment" placeholder="Tell us more...">
        <button class="dishub-feedback-submit" id="dishubFbSubmit" title="Kirim Ulasan">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    `;

    msgsEl.appendChild(card);
    msgsEl.scrollTop = msgsEl.scrollHeight;

    let selectedRating = 5;
    const ratingBtns = card.querySelectorAll('.dishub-rating-btn');
    ratingBtns.forEach(b => {
      b.onclick = () => {
        ratingBtns.forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
        selectedRating = parseInt(b.getAttribute('data-rating'), 10);
      };
    });

    const submitBtn = card.querySelector('#dishubFbSubmit');
    const commentInput = card.querySelector('#dishubFbComment');

    submitBtn.onclick = async () => {
      const comment = commentInput.value.trim();
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';

      try {
        const fbUrl = window.location.hostname.includes('transkoetaradja') ? '/api/cs/dishub/feedback' : 'https://transkoetaradja.web.id/api/cs/dishub/feedback';
        await fetch(fbUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: selectedRating,
            comment: comment
          })
        });
      } catch (e) {
        console.error('Feedback submit error:', e);
      }

      card.innerHTML = `
        <div class="dishub-feedback-thanks">
          ✨ Terima kasih banyak atas penilaian Anda! Kami terus berupaya meningkatkan layanan Dishub Aceh. 🙏
        </div>
      `;
      msgsEl.scrollTop = msgsEl.scrollHeight;
    };
  }

  // Expose untuk testing instan di console / developer tools
  window.triggerDishubFeedback = showFeedbackPrompt;

  btn.onclick = () => {
    box.classList.toggle('open');
    if (box.classList.contains('open')) {
      resetInactivityTimer();
    }
  };
  closeBtn.onclick = () => { box.classList.remove('open'); };

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    hasUserInteracted = true;

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'dishub-msg user';
    userMsg.textContent = text;
    msgsEl.appendChild(userMsg);
    inputEl.value = '';
    msgsEl.scrollTop = msgsEl.scrollHeight;

    resetInactivityTimer();

    // Fetch response from VPS API
    try {
      const chatUrl = window.location.hostname.includes('transkoetaradja') ? '/api/cs/dishub/chat' : 'https://transkoetaradja.web.id/api/cs/dishub/chat';
      const res = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      
      const botMsg = document.createElement('div');
      botMsg.className = 'dishub-msg bot';
      botMsg.innerHTML = (data.reply || 'Maaf, terjadi kendala respon.').replace(/\\*\\*(.*?)\\*\\*/g, '<b>$1</b>');
      msgsEl.appendChild(botMsg);
      msgsEl.scrollTop = msgsEl.scrollHeight;

      resetInactivityTimer();
    } catch (err) {
      const errMsg = document.createElement('div');
      errMsg.className = 'dishub-msg bot';
      errMsg.textContent = 'Gagal menghubungi server Dishub. Pastikan koneksi aktif.';
      msgsEl.appendChild(errMsg);
    }
  }

  sendBtn.onclick = sendMessage;
  inputEl.onkeydown = (e) => {
    if (e.key === 'Enter') sendMessage();
    else resetInactivityTimer();
  };
})();
