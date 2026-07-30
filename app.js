const TOTAL_FRAMES = 300;
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');
const progressBar = document.getElementById('progress-bar');
const loaderPercent = document.getElementById('loader-percent');
const loader = document.getElementById('loader');
const hud = document.getElementById('hud');
const frameCounter = document.getElementById('frame-counter');

const images = [];
let loadedCount = 0;
let currentFrame = 1;
let targetFrame = 1;
let lastDrawnFrame = -1;

// Format frame filename: ezgif-frame-001.jpg ... ezgif-frame-300.jpg
function getFramePath(index) {
  const paddedIndex = String(index).padStart(3, '0');
  return `ezgif-frame-${paddedIndex}.jpg`;
}

// Preload all 300 images
function preloadImages() {
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFramePath(i);
    img.onload = () => {
      loadedCount++;
      const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
      progressBar.style.width = `${percent}%`;
      loaderPercent.textContent = `${percent}%`;

      if (loadedCount === TOTAL_FRAMES) {
        onAllImagesLoaded();
      }
    };
    img.onerror = () => {
      loadedCount++;
      if (loadedCount === TOTAL_FRAMES) {
        onAllImagesLoaded();
      }
    };
    images[i] = img;
  }
}

// Setup High-DPI canvas
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  lastDrawnFrame = -1;
  drawFrame(Math.round(currentFrame));
}

// Render image maintaining cover aspect ratio
function drawFrame(frameIndex) {
  const clampedIndex = Math.min(TOTAL_FRAMES, Math.max(1, frameIndex));
  if (clampedIndex === lastDrawnFrame) return;

  const img = images[clampedIndex];
  if (!img || !img.complete || img.naturalWidth === 0) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  const canvasRatio = canvasWidth / canvasHeight;
  const imgRatio = imgWidth / imgHeight;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (canvasRatio > imgRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    offsetX = 0;
    offsetY = (canvasHeight - drawHeight) / 2;
  } else {
    drawWidth = canvasHeight * imgRatio;
    drawHeight = canvasHeight;
    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = 0;
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  lastDrawnFrame = clampedIndex;

  // Update HUD text
  const paddedCurrent = String(clampedIndex).padStart(3, '0');
  frameCounter.textContent = `FRAME ${paddedCurrent} / ${TOTAL_FRAMES}`;
}

// Calculate target frame based on current scroll depth
function updateTargetFrame() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const scrollFraction = Math.max(0, Math.min(1, window.scrollY / maxScroll));
  targetFrame = 1 + scrollFraction * (TOTAL_FRAMES - 1);
}

// Main animation loop with smooth lerp (inertia physics)
function renderLoop() {
  updateTargetFrame();

  // Smooth lerp easing factor (0.12 gives ultra-smooth fluid movement)
  const lerpFactor = 0.12;
  currentFrame += (targetFrame - currentFrame) * lerpFactor;

  if (Math.abs(targetFrame - currentFrame) < 0.01) {
    currentFrame = targetFrame;
  }

  drawFrame(Math.round(currentFrame));

  requestAnimationFrame(renderLoop);
}

// Called after preloading completes
function onAllImagesLoaded() {
  // Hide loader
  loader.classList.add('fade-out');
  hud.classList.remove('hidden');

  // Initialize Canvas layout & draw first frame
  resizeCanvas();
  
  // Start render loop
  requestAnimationFrame(renderLoop);

  // Initialize Lenis Smooth Scroll if available
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
}

// Event Listeners
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

// Toast Notification Helper
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Setup Interactive Features after DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Hamburger Menu Toggle
  const menuToggle = document.getElementById('menu-toggle');
  const navLinksContainer = document.getElementById('nav-links');

  if (menuToggle && navLinksContainer) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      menuToggle.classList.toggle('open');
      navLinksContainer.classList.toggle('nav-open');
    });

    // Close menu when clicking any nav link
    const mobileLinks = navLinksContainer.querySelectorAll('a');
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        navLinksContainer.classList.remove('nav-open');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinksContainer.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('open');
        navLinksContainer.classList.remove('nav-open');
      }
    });
  }

  // Back to Top Button
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Copy Email Link
  const copyEmailBtn = document.getElementById('copy-email-btn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      const email = 'sonianurag379@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        showToast(`Copied ${email} to clipboard! 📋`);
      }).catch(() => {
        showToast(`Email: ${email}`);
      });
    });
  }

  // Color Swatch Hex Copying
  const swatchCards = document.querySelectorAll('.swatch-card');
  swatchCards.forEach((card) => {
    card.addEventListener('click', () => {
      const hexElement = card.querySelector('.spec-code');
      if (hexElement) {
        const hexText = hexElement.textContent.trim();
        navigator.clipboard.writeText(hexText).then(() => {
          showToast(`Copied ${hexText} to clipboard! 🎨`);
        }).catch(() => {
          showToast(`Color Hex: ${hexText}`);
        });
      }
    });
  });

  // Active Navigation ScrollSpy
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  function updateActiveNav() {
    let currentSectionId = '';
    const scrollPosition = window.scrollY + 200;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // Mobile-Only App Download Popup (Appears after 10 seconds)
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  if (isMobileDevice) {
    const appModal = document.getElementById('mobile-app-modal');
    const closeBtn = document.getElementById('close-app-modal');
    const dismissBtn = document.getElementById('dismiss-app-btn');
    const downloadBtn = document.getElementById('download-app-btn');
    const overlay = document.getElementById('app-modal-overlay');

    // Trigger popup after 10 seconds (10000 ms)
    setTimeout(() => {
      if (appModal && !sessionStorage.getItem('appModalDismissed')) {
        appModal.classList.add('active');
        appModal.setAttribute('aria-hidden', 'false');
      }
    }, 10000);

    function closeModal() {
      if (appModal) {
        appModal.classList.remove('active');
        appModal.setAttribute('aria-hidden', 'true');
        sessionStorage.setItem('appModalDismissed', 'true');
      }
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (dismissBtn) dismissBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        showToast('Starting Anurag Soni Mobile App download... 📲');
        closeModal();
      });
    }
  }

  // ==========================================================================
  // AI Assistant Interactive Chat Widget Logic
  // ==========================================================================
  const aiTriggerBtn = document.getElementById('ai-trigger-btn');
  const aiChatWindow = document.getElementById('ai-chat-window');
  const aiCloseBtn = document.getElementById('ai-close-btn');
  const aiResetBtn = document.getElementById('ai-reset-btn');
  const aiChatMessages = document.getElementById('ai-chat-messages');
  const aiChatForm = document.getElementById('ai-chat-form');
  const aiChatInput = document.getElementById('ai-chat-input');
  const aiTypingIndicator = document.getElementById('ai-typing-indicator');
  const aiPresetChips = document.getElementById('ai-preset-chips');

  // Anurag Soni Portfolio Knowledge Base
  const ANURAG_KNOWLEDGE = {
    about: `<strong>Anurag Soni</strong> is a French Language Associate & Translator.<br>• <strong>Education:</strong> B.A. (Hons.) French graduate from Delhi University (July 2026).<br>• <strong>Languages:</strong> French (B1/B2 Level), Fluent English, Native Hindi.<br>• <strong>Specialization:</strong> French–English translation, document localization, client communication, and cross-cultural operations.`,

    french: `<strong>French Language Competency:</strong><br>• <strong>Proficiency Level:</strong> B1 / B2 (Intermediate to Advanced).<br>• <strong>Key Skills:</strong> French-to-English text translation, document proofreading, grammar & syntax structure analysis.<br>• <strong>Academic Training:</strong> 3-year full-time B.A. (Hons.) French degree from the Department of Germanic & Romance Studies (DGRS), Delhi University.`,

    education: `<strong>Educational Qualifications:</strong><br>1. 🎓 <strong>B.A. (Hons.) French Language:</strong> Department of Germanic & Romance Studies, Delhi University (Graduated July 2026).<br>2. 🏫 <strong>Class XII (Senior Secondary):</strong> GIC Prayagraj (71% Score - 2022, U.P. Board).<br>3. 🏫 <strong>Class X (High School):</strong> Excellent Education Center, Sant Ravidas Nagar (85% Score - 2020, U.P. Board).`,

    projects: `<strong>Key Academic & Practical Projects:</strong><br>• 🎨 <strong>Bande Dessinée Comic-Strip:</strong> Original French comic strip presented at DU (DGRS), awarded Certificate of Distinction (2024).<br>• 📜 <strong>French-English Translations:</strong> Translation of literature, articles, and corporate documents.<br>• 📊 <strong>Francophone Presentations:</strong> Group research presentations on French culture using MS PowerPoint.<br>• 🎓 <strong>FEA Communication Certification:</strong> Certified spoken English & personality development course.`,

    contact: `<strong>Contact Details & Location:</strong><br>• 📧 <strong>Email:</strong> <a href="mailto:sonianurag379@gmail.com">sonianurag379@gmail.com</a><br>• 📞 <strong>Phone:</strong> +91 95698 52025<br>• 📍 <strong>Address:</strong> D-204, Madhu Vihar, Uttam Nagar, New Delhi - 110059<br>• 💼 <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/anurag-soni-13802b322/" target="_blank">linkedin.com/in/anurag-soni-13802b322/</a>`,

    shifts: `<strong>Shift & Career Availability:</strong><br>• ✅ <strong>Rotational Shifts:</strong> 100% comfortable with rotational shifts, night shifts, and flexible MNC work hours.<br>• 🏢 <strong>Target Roles:</strong> Entry-Level French Language Associate, Translator, Client Communication Specialist.<br>• 📍 <strong>Location Preference:</strong> New Delhi / NCR, Remote, or Hybrid MNC teams.<br>• 🚀 <strong>Joining:</strong> Available for immediate joining.`,

    hinglish: `<strong>Anurag Soni ke bare me jankari:</strong><br>Anurag ne Delhi University se B.A. (Hons.) French complete kiya hai (2026 Graduate).<br>• Unka French level B1/B2 hai, English fluent aur Hindi native hai.<br>• Unhe French–English translation, document localization aur MS Office (Word, Excel, PPT) ka achha experience hai.<br>• Woh MNCs me rotational shifts me kaam karne ke liye bilkul tayar hain.<br>• Direct Contact: 📞 +91 95698 52025 | 📧 sonianurag379@gmail.com`,

    greeting: `Bonjour! 👋 How can I help you today? You can ask me about Anurag's French skills, Delhi University degree, academic projects, contact details, or shift availability!`
  };

  // Match User Query to Knowledge Base Response
  function getBotResponse(userText) {
    const text = userText.toLowerCase().trim();

    if (text.includes('french') || text.includes('b1') || text.includes('b2') || text.includes('translate') || text.includes('translation') || text.includes('language') || text.includes('bhasha')) {
      return ANURAG_KNOWLEDGE.french;
    }
    if (text.includes('education') || text.includes('college') || text.includes('university') || text.includes('du') || text.includes('degree') || text.includes('delhi') || text.includes('school') || text.includes('10th') || text.includes('12th') || text.includes('padhai') || text.includes('qualification')) {
      return ANURAG_KNOWLEDGE.education;
    }
    if (text.includes('project') || text.includes('comic') || text.includes('bande') || text.includes('dessinee') || text.includes('certificate') || text.includes('award') || text.includes('ppt') || text.includes('presentation')) {
      return ANURAG_KNOWLEDGE.projects;
    }
    if (text.includes('contact') || text.includes('email') || text.includes('phone') || text.includes('mobile') || text.includes('number') || text.includes('address') || text.includes('linkedin') || text.includes('hire') || text.includes('reach') || text.includes('mail') || text.includes('location')) {
      return ANURAG_KNOWLEDGE.contact;
    }
    if (text.includes('shift') || text.includes('rotational') || text.includes('night') || text.includes('timing') || text.includes('available') || text.includes('joining') || text.includes('mnc') || text.includes('work')) {
      return ANURAG_KNOWLEDGE.shifts;
    }
    if (text.includes('who') || text.includes('about') || text.includes('intro') || text.includes('anurag') || text.includes('summary') || text.includes('profile')) {
      return ANURAG_KNOWLEDGE.about;
    }
    if (text.includes('kaun') || text.includes('kya') || text.includes('kaise') || text.includes('jankari') || text.includes('details') || text.includes('batao') || text.includes('btaye') || text.includes('hindi') || text.includes('hinglish')) {
      return ANURAG_KNOWLEDGE.hinglish;
    }
    if (text.includes('hi') || text.includes('hello') || text.includes('bonjour') || text.includes('hey') || text.includes('namaste')) {
      return ANURAG_KNOWLEDGE.greeting;
    }

    // Default Fallback Response
    return `Anurag Soni is a B.A. (Hons.) French graduate from Delhi University specializing in French-English translation, document localization, and client support.<br><br>He has B1/B2 level French proficiency, fluent English, and is available for rotational shift roles in MNCs.<br><br>📩 <strong>Email:</strong> sonianurag379@gmail.com<br>📞 <strong>Phone:</strong> +91 95698 52025`;
  }

  // Toggle Chat Window
  if (aiTriggerBtn && aiChatWindow) {
    aiTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = aiChatWindow.classList.contains('hidden');
      if (isHidden) {
        aiChatWindow.classList.remove('hidden');
        aiChatWindow.setAttribute('aria-hidden', 'false');
        // Hide red badge once opened
        const badge = aiTriggerBtn.querySelector('.ai-trigger-badge');
        if (badge) badge.style.display = 'none';
        if (aiChatInput) setTimeout(() => aiChatInput.focus(), 100);
      } else {
        aiChatWindow.classList.add('hidden');
        aiChatWindow.setAttribute('aria-hidden', 'true');
      }
    });

    // Close chat window when clicking outside
    document.addEventListener('click', (e) => {
      if (aiChatWindow && !aiChatWindow.classList.contains('hidden')) {
        if (!aiChatWindow.contains(e.target) && !aiTriggerBtn.contains(e.target)) {
          aiChatWindow.classList.add('hidden');
          aiChatWindow.setAttribute('aria-hidden', 'true');
        }
      }
    });
  }

  if (aiCloseBtn && aiChatWindow) {
    aiCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      aiChatWindow.classList.add('hidden');
      aiChatWindow.setAttribute('aria-hidden', 'true');
    });
  }

  // Reset Chat Messages
  if (aiResetBtn && aiChatMessages) {
    aiResetBtn.addEventListener('click', () => {
      aiChatMessages.innerHTML = `
        <div class="ai-msg bot">
          <div class="ai-msg-avatar">🤖</div>
          <div class="ai-msg-content">
            <p><strong>Bonjour! 👋 Chat reset complete.</strong></p>
            <p>What else would you like to know about Anurag Soni?</p>
          </div>
        </div>
      `;
      showToast('Chat reset! 🔄');
    });
  }

  // Append Message to Chat Window
  function appendMessage(sender, htmlContent) {
    if (!aiChatMessages) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${sender}`;

    const avatar = sender === 'bot' ? '🤖' : '👤';

    msgDiv.innerHTML = `
      <div class="ai-msg-avatar">${avatar}</div>
      <div class="ai-msg-content">${htmlContent}</div>
    `;

    aiChatMessages.appendChild(msgDiv);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  }

  // Handle Sending a Message
  function handleSendMessage(userQuery) {
    if (!userQuery || !userQuery.trim()) return;

    const cleanQuery = userQuery.trim();

    // 1. Add User Message
    appendMessage('user', `<p>${cleanQuery}</p>`);

    // Clear input field
    if (aiChatInput) aiChatInput.value = '';

    // 2. Show Typing Indicator
    if (aiTypingIndicator) {
      aiTypingIndicator.classList.remove('hidden');
      aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    }

    // 3. Generate Bot Response after 400ms delay
    setTimeout(() => {
      if (aiTypingIndicator) aiTypingIndicator.classList.add('hidden');
      const botAnswer = getBotResponse(cleanQuery);
      appendMessage('bot', `<p>${botAnswer}</p>`);
    }, 450);
  }

  // Form Submit Handler
  if (aiChatForm) {
    aiChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (aiChatInput) {
        handleSendMessage(aiChatInput.value);
      }
    });
  }

  // Preset Chips Click Handler
  if (aiPresetChips) {
    aiPresetChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.ai-chip');
      if (chip) {
        const query = chip.getAttribute('data-query');
        handleSendMessage(query);
      }
    });
  }
});

// Start preloading process
preloadImages();
