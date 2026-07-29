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
});

// Start preloading process
preloadImages();
