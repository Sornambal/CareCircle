/* ===== MediAssist AI – Application Logic ===== */
(function () {
  'use strict';

  // ── DOM refs ──
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const els = {
    banner: $('#emergencyBanner'), bannerClose: $('#bannerClose'),
    hamburger: $('#hamburger'), navLinks: $('#navLinks'),
    themeToggle: $('#themeToggle'), themeIcon: $('#themeIcon'),
    langBtn: $('#langBtn'), langDropdown: $('#langDropdown'), langLabel: $('#langLabel'),
    welcomeState: $('#welcomeState'), chatMessages: $('#chatMessages'),
    typingIndicator: $('#typingIndicator'), bottomChips: $('#bottomChips'),
    userInput: $('#userInput'), sendBtn: $('#sendBtn'),
    voiceBtn: $('#voiceBtn'), uploadBtn: $('#uploadBtn'), fileInput: $('#fileInput'),
    saveBtn: $('#saveBtn'), uploadPreview: $('#uploadPreview'),
    uploadFilename: $('#uploadFilename'), uploadRemove: $('#uploadRemove'),
    emergencyOverlay: $('#emergencyOverlay'), dismissEmergency: $('#dismissEmergency'),
    fabChat: $('#fabChat'), loginForm: $('#loginForm'),
  };

  let attachedFile = null;
  let conversationHistory = [];
  let isRecording = false;

  // ── ML Engine reference ──
  const mlEngine = window.MediAssistML;

  // ── Helpers ──
  function getTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function showToast(message) {
    const existing = $('.toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="material-symbols-rounded">check_circle</span> ${message}`;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('visible'));
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 2500);
  }

  function scrollToBottom() {
    const main = $('.chat-main');
    setTimeout(() => { main.scrollTop = main.scrollHeight; }, 100);
  }

  // Emergency & response are now handled by MediAssistML engine

  // ── Message creation ──
  function addMessage(text, sender, extra) {
    els.welcomeState.classList.add('hidden');
    els.bottomChips.classList.add('visible');
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;
    const iconName = sender === 'bot' ? 'health_and_safety' : 'person';
    let fileHtml = '';
    if (extra && extra.file) {
      fileHtml = `<div class="msg-file"><span class="material-symbols-rounded">description</span> ${extra.file}</div>`;
    }
    const isEmergencyMsg = extra && extra.emergency;
    msg.innerHTML = `
      <div class="msg-avatar"><span class="material-symbols-rounded">${iconName}</span></div>
      <div class="msg-content">
        <div class="msg-bubble ${isEmergencyMsg ? 'emergency-msg' : ''}">${text}${fileHtml}</div>
        <span class="msg-time">${getTime()}</span>
      </div>`;
    els.chatMessages.appendChild(msg);
    conversationHistory.push({ sender, text: text.replace(/<[^>]+>/g, ''), time: getTime() });
    scrollToBottom();
  }

  function showTyping() { els.typingIndicator.classList.add('visible'); scrollToBottom(); }
  function hideTyping() { els.typingIndicator.classList.remove('visible'); }

  function sendMessage() {
    const text = els.userInput.value.trim();
    if (!text && !attachedFile) return;
    const fileInfo = attachedFile ? { file: attachedFile.name } : null;
    addMessage(text || `📎 Uploaded: ${attachedFile.name}`, 'user', fileInfo);
    els.userInput.value = '';
    els.sendBtn.disabled = true;
    clearAttachment();
    autoResizeInput();

    // ML-powered response generation
    const mlResult = mlEngine.generateResponse(text);

    if (mlResult.emergency.isEmergency) {
      els.emergencyOverlay.classList.add('visible');
      // Update overlay severity text
      const cardH2 = els.emergencyOverlay.querySelector('h2');
      if (cardH2) {
        const sevText = mlResult.emergency.severity === 'critical' ? '🚨 Critical Emergency Detected'
          : mlResult.emergency.severity === 'high' ? '⚠️ High-Risk Emergency Detected'
            : '⚡ Emergency Indicators Detected';
        cardH2.textContent = sevText;
      }
    }

    showTyping();
    const delay = 1200 + Math.random() * 1300;
    setTimeout(() => {
      hideTyping();
      addMessage(mlResult.responseHTML, 'bot', mlResult.emergency.isEmergency ? { emergency: true } : null);
    }, delay);
  }

  // ── Auto-resize textarea ──
  function autoResizeInput() {
    els.userInput.style.height = 'auto';
    els.userInput.style.height = Math.min(els.userInput.scrollHeight, 120) + 'px';
  }

  // ── Attachment ──
  function clearAttachment() {
    attachedFile = null;
    els.uploadPreview.classList.remove('visible');
    els.fileInput.value = '';
  }

  // ── Banner ──
  els.bannerClose.addEventListener('click', () => els.banner.classList.add('hidden'));

  // ── Hamburger ──
  els.hamburger.addEventListener('click', () => {
    els.hamburger.classList.toggle('active');
    els.navLinks.classList.toggle('open');
  });

  // ── Theme Toggle ──
  const savedTheme = localStorage.getItem('mediassist-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  els.themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mediassist-theme', next);
    updateThemeIcon(next);
  });

  function updateThemeIcon(theme) {
    els.themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  }

  // ── Language ──
  els.langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    els.langDropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => els.langDropdown.classList.remove('open'));

  $$('.lang-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      $$('.lang-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      els.langLabel.textContent = opt.dataset.lang.toUpperCase();
      els.langDropdown.classList.remove('open');
      showToast(`Language set to ${opt.textContent}`);
    });
  });

  // ── Modals ──
  $$('[data-modal]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = $(`#${trigger.dataset.modal}`);
      if (modal) modal.classList.add('visible');
      els.navLinks.classList.remove('open');
      els.hamburger.classList.remove('active');
    });
  });
  $$('.modal-close').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('.modal-overlay').classList.remove('visible'));
  });
  $$('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('visible');
    });
  });

  // ── Input handling ──
  els.userInput.addEventListener('input', () => {
    els.sendBtn.disabled = !els.userInput.value.trim() && !attachedFile;
    autoResizeInput();
  });
  els.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  els.sendBtn.addEventListener('click', sendMessage);

  // ── Chips ──
  $$('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      els.userInput.value = chip.dataset.msg;
      els.sendBtn.disabled = false;
      sendMessage();
    });
  });

  // ── Upload ──
  els.uploadBtn.addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      attachedFile = file;
      els.uploadFilename.textContent = file.name;
      els.uploadPreview.classList.add('visible');
      els.sendBtn.disabled = false;
    }
  });
  els.uploadRemove.addEventListener('click', clearAttachment);

  // ── Voice ──
  els.voiceBtn.addEventListener('click', () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      showToast('Voice input not supported in this browser');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (isRecording) return;
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    isRecording = true;
    els.voiceBtn.classList.add('recording');
    recognition.start();
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      els.userInput.value = transcript;
      els.sendBtn.disabled = false;
      autoResizeInput();
    };
    recognition.onend = () => { isRecording = false; els.voiceBtn.classList.remove('recording'); };
    recognition.onerror = () => { isRecording = false; els.voiceBtn.classList.remove('recording'); showToast('Voice recognition error'); };
  });

  // ── Save ──
  els.saveBtn.addEventListener('click', () => {
    if (conversationHistory.length === 0) { showToast('No conversation to save'); return; }
    let content = 'MediAssist AI — Conversation Log\n';
    content += '='.repeat(40) + '\n\n';
    conversationHistory.forEach((m) => {
      content += `[${m.time}] ${m.sender === 'user' ? 'You' : 'MediAssist AI'}:\n${m.text}\n\n`;
    });
    content += '\nDisclaimer: This chatbot provides general medical information and is not a substitute for professional medical advice.\n';
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `MediAssist_Conversation_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Conversation saved!');
  });

  // ── Emergency dismiss ──
  els.dismissEmergency.addEventListener('click', () => els.emergencyOverlay.classList.remove('visible'));

  // ── Login form ──
  els.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Login feature coming soon!');
    $('#loginModal').classList.remove('visible');
  });

  // ── FAB (mobile) ──
  els.fabChat.addEventListener('click', () => {
    els.userInput.focus();
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });

  // ── Keyboard shortcut ──
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $$('.modal-overlay.visible, .emergency-overlay.visible').forEach(o => o.classList.remove('visible'));
    }
  });
})();
