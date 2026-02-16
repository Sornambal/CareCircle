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

  // ── Emergency keywords ──
  const emergencyKeywords = [
    'chest pain', 'heart attack', 'stroke', 'can\'t breathe', 'cannot breathe',
    'difficulty breathing', 'choking', 'losing consciousness', 'unconscious',
    'severe bleeding', 'suicide', 'overdose', 'seizure', 'anaphylaxis',
    'allergic shock', 'dying', 'not breathing', 'cardiac arrest',
  ];

  // ── AI Response database ──
  const responses = {
    fever: {
      keywords: ['fever', 'temperature', 'hot', 'chills', 'shivering'],
      reply: `<b>Fever Management Guide</b><br><br>
A fever is typically a sign that your body is fighting an infection. Here's what you can do:<br><br>
<b>🌡️ Immediate Steps:</b><br>
• Rest and stay hydrated — drink plenty of water, clear broths, or electrolyte drinks<br>
• Take acetaminophen (Tylenol) or ibuprofen (Advil) as directed<br>
• Wear lightweight clothing and use a light blanket<br>
• Apply a lukewarm (not cold) compress to your forehead<br><br>
<b>⚠️ Seek medical attention if:</b><br>
• Temperature exceeds 103°F (39.4°C) in adults<br>
• Fever lasts more than 3 days<br>
• You experience confusion, stiff neck, or rash<br>
• Infant under 3 months with any fever<br><br>
<em>Remember: This is general information. Please consult a healthcare professional for persistent symptoms.</em>`,
    },
    headache: {
      keywords: ['headache', 'head pain', 'migraine', 'head hurts', 'head ache'],
      reply: `<b>Headache Relief Guide</b><br><br>
Headaches can range from mild tension to severe migraines. Here's how to manage them:<br><br>
<b>💊 Quick Relief:</b><br>
• Over-the-counter pain relievers (ibuprofen, acetaminophen, aspirin)<br>
• Rest in a quiet, dark room<br>
• Apply a cold or warm compress to your head or neck<br>
• Stay hydrated and eat regular meals<br><br>
<b>🧘 Prevention Tips:</b><br>
• Manage stress through relaxation techniques<br>
• Maintain regular sleep patterns (7-9 hours)<br>
• Limit screen time and take breaks<br>
• Exercise regularly<br><br>
<b>⚠️ Seek help if:</b><br>
• Sudden, severe "thunderclap" headache<br>
• Headache with fever, stiff neck, confusion, or vision changes<br>
• Headache after a head injury<br><br>
<em>Consult a healthcare provider for recurring headaches.</em>`,
    },
    burns: {
      keywords: ['burn', 'burns', 'scalded', 'scald', 'burned'],
      reply: `<b>First Aid for Burns</b><br><br>
Quick and correct first aid can minimize burn damage:<br><br>
<b>🩹 Immediate Steps:</b><br>
• Cool the burn under cool (not ice cold) running water for at least 10-20 minutes<br>
• Remove jewelry or tight items near the burned area before swelling<br>
• Cover with a sterile, non-stick bandage or clean cloth<br>
• Take over-the-counter pain relief if needed<br><br>
<b>❌ Do NOT:</b><br>
• Apply ice, butter, toothpaste, or any home remedies<br>
• Break blisters<br>
• Peel off stuck clothing<br>
• Use fluffy cotton or adhesive bandages directly on the burn<br><br>
<b>🏥 Seek emergency care if:</b><br>
• Burns cover a large area or involve face, hands, feet, or joints<br>
• Burns appear white, brown, or black (3rd degree)<br>
• Chemical or electrical burns<br><br>
<em>Always consult a healthcare professional for serious burns.</em>`,
    },
    diabetes: {
      keywords: ['diabetes', 'blood sugar', 'glucose', 'diabetic', 'insulin'],
      reply: `<b>Understanding Diabetes Symptoms</b><br><br>
Diabetes affects how your body processes blood sugar. Here are key signs:<br><br>
<b>🔍 Common Symptoms:</b><br>
• Increased thirst and frequent urination<br>
• Unexplained weight loss<br>
• Extreme fatigue and weakness<br>
• Blurred vision<br>
• Slow-healing sores or frequent infections<br>
• Tingling or numbness in hands/feet<br><br>
<b>📋 Types of Diabetes:</b><br>
• <b>Type 1:</b> Autoimmune — body doesn't produce insulin<br>
• <b>Type 2:</b> Body doesn't use insulin effectively (most common)<br>
• <b>Gestational:</b> Develops during pregnancy<br><br>
<b>✅ Prevention & Management:</b><br>
• Maintain a healthy diet rich in fiber and low in refined sugars<br>
• Exercise at least 150 minutes per week<br>
• Monitor blood sugar regularly<br>
• Maintain a healthy weight<br><br>
<em>If you suspect diabetes, please see a healthcare provider for proper testing.</em>`,
    },
    mental: {
      keywords: ['mental health', 'anxiety', 'depression', 'stress', 'sad', 'worried', 'panic', 'lonely', 'mental'],
      reply: `<b>Mental Health Support</b><br><br>
Your mental health matters just as much as physical health. Here's some guidance:<br><br>
<b>💙 Coping Strategies:</b><br>
• Practice deep breathing: Inhale 4 sec → Hold 4 sec → Exhale 4 sec<br>
• Engage in regular physical activity<br>
• Maintain social connections — talk to someone you trust<br>
• Establish a routine with adequate sleep<br>
• Limit alcohol and caffeine intake<br><br>
<b>🧘 Mindfulness Techniques:</b><br>
• Progressive muscle relaxation<br>
• Guided meditation (try apps like Calm or Headspace)<br>
• Journaling your thoughts and feelings<br>
• Gratitude practice<br><br>
<b>📞 Resources:</b><br>
• <b>Crisis Lifeline:</b> 988 (call or text, USA)<br>
• <b>Crisis Text Line:</b> Text HOME to 741741<br>
• <b>NAMI Helpline:</b> 1-800-950-6264<br><br>
<b>⚠️ Seek immediate help if you or someone you know is in crisis.</b><br><br>
<em>You are not alone. Professional support is always available.</em>`,
    },
    nutrition: {
      keywords: ['nutrition', 'diet', 'food', 'eat', 'healthy eating', 'vitamins', 'nutrients', 'weight loss'],
      reply: `<b>Nutrition & Healthy Eating Tips</b><br><br>
Good nutrition is the foundation of a healthy life:<br><br>
<b>🥗 Balanced Diet Essentials:</b><br>
• Fill half your plate with fruits and vegetables<br>
• Choose whole grains over refined grains<br>
• Include lean proteins (fish, poultry, beans, nuts)<br>
• Limit processed foods, sugar, and sodium<br>
• Stay hydrated — aim for 8 glasses of water daily<br><br>
<b>💊 Key Nutrients:</b><br>
• <b>Vitamin D:</b> Sunlight, fortified foods, fatty fish<br>
• <b>Iron:</b> Leafy greens, red meat, legumes<br>
• <b>Omega-3:</b> Salmon, walnuts, flaxseed<br>
• <b>Calcium:</b> Dairy, fortified plant milks, leafy greens<br>
• <b>Fiber:</b> Whole grains, fruits, vegetables, legumes<br><br>
<b>📏 Portion Control:</b><br>
• Use smaller plates<br>
• Eat slowly and mindfully<br>
• Stop eating when comfortably full<br><br>
<em>For personalized dietary advice, consult a registered dietitian.</em>`,
    },
    cold: {
      keywords: ['cold', 'flu', 'cough', 'runny nose', 'sore throat', 'congestion', 'sneezing'],
      reply: `<b>Cold & Flu Management</b><br><br>
<b>🤧 Common Cold vs. Flu:</b><br>
• <b>Cold:</b> Gradual onset, mild symptoms, rarely causes fever<br>
• <b>Flu:</b> Sudden onset, high fever, body aches, fatigue<br><br>
<b>💊 Treatment:</b><br>
• Rest and stay well-hydrated<br>
• Use OTC medications for symptom relief<br>
• Gargle warm salt water for sore throat<br>
• Use a humidifier to ease congestion<br>
• Honey and lemon tea can soothe symptoms<br><br>
<b>🛡️ Prevention:</b><br>
• Wash hands frequently<br>
• Get your annual flu vaccine<br>
• Avoid close contact with sick individuals<br>
• Don't touch your face<br><br>
<em>See a doctor if symptoms worsen or last more than 10 days.</em>`,
    },
    sleep: {
      keywords: ['sleep', 'insomnia', 'can\'t sleep', 'sleeping', 'tired', 'fatigue', 'restless'],
      reply: `<b>Sleep Health Guide</b><br><br>
Quality sleep is essential for overall health:<br><br>
<b>😴 Sleep Hygiene Tips:</b><br>
• Maintain a consistent sleep schedule<br>
• Create a dark, cool, quiet sleeping environment<br>
• Avoid screens 1 hour before bedtime<br>
• Limit caffeine after 2 PM<br>
• Exercise regularly, but not close to bedtime<br><br>
<b>🌙 Relaxation Techniques:</b><br>
• Progressive muscle relaxation<br>
• 4-7-8 breathing technique<br>
• Warm bath or shower before bed<br>
• Light reading or calming music<br><br>
<b>⚠️ Consult a doctor if:</b><br>
• Insomnia persists for more than 4 weeks<br>
• You snore loudly or stop breathing during sleep<br>
• Excessive daytime sleepiness affects daily functioning<br><br>
<em>Adults should aim for 7-9 hours of sleep per night.</em>`,
    },
  };

  const fallbackResponse = `Thank you for your question! While I can provide general medical information, I want to make sure you get the most relevant advice.<br><br>
<b>Here's what I can help with:</b><br>
• Symptom information & general guidance<br>
• First aid instructions<br>
• Medication general information<br>
• Mental health resources<br>
• Nutrition & wellness tips<br>
• Preventive care recommendations<br><br>
Could you provide more details about your concern? Try describing your symptoms or select one of the quick suggestion chips below.<br><br>
<em>For specific medical advice, please consult a healthcare professional.</em>`;

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

  function checkEmergency(text) {
    const lower = text.toLowerCase();
    return emergencyKeywords.some(kw => lower.includes(kw));
  }

  function findResponse(text) {
    const lower = text.toLowerCase();
    for (const key in responses) {
      if (responses[key].keywords.some(kw => lower.includes(kw))) {
        return responses[key].reply;
      }
    }
    return fallbackResponse;
  }

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

    if (checkEmergency(text)) {
      els.emergencyOverlay.classList.add('visible');
    }

    showTyping();
    const delay = 1000 + Math.random() * 1500;
    setTimeout(() => {
      hideTyping();
      const reply = findResponse(text);
      addMessage(reply, 'bot', checkEmergency(text) ? { emergency: true } : null);
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
