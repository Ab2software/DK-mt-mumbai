/**
 * BHARAT MATKA - OFFICIAL LANDING PAGE APPLICATION SCRIPT
 * Features:
 * - Multi-Host Resilient API Fetch (/landing/info, /landing/rates, /landing/markets, /landing/chart)
 * - Clean Light Tricolor UI (Saffron, Royal Blue, Emerald Green)
 * - Dynamic Game Win Rates (2-column grid)
 * - Live Auto-Refreshed Markets & Interactive Jodi / Panna Charts (3-column grid)
 * - Direct APK Download on all Play / Register / Download CTAs
 */

// 1. Dynamic API Base URL Resolution with Smart Multi-Host Auto-Fallback
const CANDIDATE_API_BASES = (() => {
  const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : '';
  const hostname = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : '';
  const port = (typeof window !== 'undefined' && window.location.port) ? window.location.port : '';
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');

  const candidates = [];

  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const explicitApi = urlParams.get('api');
    if (explicitApi) {
      if (explicitApi === 'local') candidates.push('http://localhost:5001/api');
      else if (explicitApi === 'live') candidates.push('https://backend-mt-dk.onrender.com/api');
      else candidates.push(explicitApi.replace(/\/$/, ''));
    }
  }

  if (isLocal) {
    if (port === '5001' || port === '5000') {
      candidates.push('/api');
    }
    if (hostname === '127.0.0.1') {
      candidates.push('http://127.0.0.1:5001/api');
      candidates.push('http://localhost:5001/api');
    } else {
      candidates.push('http://localhost:5001/api');
      candidates.push('http://127.0.0.1:5001/api');
    }
    candidates.push('http://localhost:5000/api');
  }

  if (origin && !isLocal) {
    candidates.push(`${origin}/api`);
    candidates.push('/api');
  }

  candidates.push('https://backend-mt-dk.onrender.com/api');

  return [...new Set(candidates)];
})();

let activeApiBase = CANDIDATE_API_BASES[0] || '/api';

async function isValidJsonResponse(res) {
  if (!res || !res.ok) return false;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return true;
  try {
    const clone = res.clone();
    const text = await clone.text();
    const trimmed = text.trim();
    if (trimmed.startsWith('<') || trimmed.startsWith('<!doctype') || trimmed.startsWith('<!DOCTYPE')) {
      return false;
    }
    JSON.parse(trimmed);
    return true;
  } catch (e) {
    return false;
  }
}

async function fetchFromApi(endpoint) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${activeApiBase}${endpoint}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (await isValidJsonResponse(res)) return res;
  } catch (err) {
    // Fallback below
  }

  for (const candidate of CANDIDATE_API_BASES) {
    if (candidate === activeApiBase) continue;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const testRes = await fetch(`${candidate}${endpoint}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (await isValidJsonResponse(testRes)) {
        activeApiBase = candidate;
        return testRes;
      }
    } catch (e) {}
  }

  return fetch(`/api${endpoint}`);
}

const APK_STORE_FILE = 'apk/Bharat-Matka.apk';
const FALLBACK_BACKEND_APK = 'https://backend-mt-dk.onrender.com/api/download-apk';

const APK_CANDIDATES = [
  'apk/Bharat-Matka.apk',
  'public/apk/Bharat-Matka.apk',
  FALLBACK_BACKEND_APK
];

let verifiedApkUrl = APK_STORE_FILE;

let appConfig = {
  appName: 'Bharat Matka',
  appLink: APK_STORE_FILE,
  mobile: '',
  wpMobile: '',
  privacyPolicyUrl: '/privacy-policy',
  dataDeletionUrl: '/data-deletion'
};

let allMarkets = [];
let allRates = [];
let currentFilter = 'all';
let searchQuery = '';

function getFrontendAppOrigin() {
  if (typeof window === 'undefined') return 'https://bharat-matka.onrender.com';
  const host = window.location.hostname || '';
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5173';
  if (host.includes('bharat-matka-website')) return 'https://bharat-matka.onrender.com';
  return window.location.origin;
}

async function resolveWorkingApkUrl() {
  for (const candidate of APK_CANDIDATES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(candidate, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
      // Skip SPA HTML fallback rewrites or tiny error pages
      if (contentType.includes('text/html')) continue;
      if (contentLength > 0 && contentLength < 100000) continue;
      verifiedApkUrl = candidate;
      appConfig.appLink = candidate;
      applyDownloadLinksToDOM();
      return candidate;
    } catch (e) {
      // Try next candidate
    }
  }
  verifiedApkUrl = FALLBACK_BACKEND_APK;
  appConfig.appLink = FALLBACK_BACKEND_APK;
  applyDownloadLinksToDOM();
  return FALLBACK_BACKEND_APK;
}

function applyDownloadLinksToDOM() {
  const targetApk = verifiedApkUrl || APK_STORE_FILE;
  document.querySelectorAll('.apk-download-btn').forEach(el => {
    el.setAttribute('href', targetApk);
    el.setAttribute('download', 'Bharat-Matka.apk');
  });
}

function triggerApkDownload(e) {
  if (e) e.preventDefault();
  const targetApk = verifiedApkUrl || APK_STORE_FILE;
  const a = document.createElement('a');
  a.href = targetApk;
  a.setAttribute('download', 'Bharat-Matka.apk');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
window.triggerApkDownload = triggerApkDownload;

// =========================================================================
// INITIALIZATION
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  renderWebsiteSliders(DEFAULT_WEBSITE_SLIDES);
  updateDomainBanner();
  applyDownloadLinksToDOM();
  resolveWorkingApkUrl();
  loadAllDynamicData();
  setInterval(loadLiveMarkets, 30000);
});

function updateDomainBanner() {
  const domainEl = document.getElementById('heroDomainLabel');
  if (domainEl && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      domainEl.textContent = `www.${host.replace(/^www\./, '')}`;
    } else {
      domainEl.textContent = 'www.bharatmatka.com';
    }
  }
}

async function loadAllDynamicData() {
  await Promise.allSettled([
    loadAppInfo(),
    loadWebsiteSliders(),
    loadGameRates(),
    loadLiveMarkets()
  ]);
}

// =========================================================================
// 1. FETCH APP INFO & BRANDING
// =========================================================================
async function loadAppInfo() {
  try {
    const res = await fetchFromApi('/landing/info');
    const data = await res.json();
    if (data && data.success === '1' && data.data) {
      const d = data.data;
      appConfig.appName = d.app_name || 'Bharat Matka';
      if (d.mobile) appConfig.mobile = d.mobile;
      if (d.wp_mobile) appConfig.wpMobile = d.wp_mobile;
      if (d.privacy_policy_url) appConfig.privacyPolicyUrl = d.privacy_policy_url;
      if (d.data_deletion_url) appConfig.dataDeletionUrl = d.data_deletion_url;

      if (Array.isArray(d.rates) && d.rates.length > 0 && allRates.length === 0) {
        allRates = d.rates;
        renderDynamicRates(allRates);
      }
      applyBrandingDOM();
    }
  } catch (err) {
    applyBrandingDOM();
  }
}

function applyBrandingDOM() {
  const appOrigin = getFrontendAppOrigin();

  document.querySelectorAll('.dyn-app-name').forEach(el => {
    el.textContent = appConfig.appName;
  });

  const privacyUrl = (appConfig.privacyPolicyUrl || '/privacy-policy').startsWith('http')
    ? appConfig.privacyPolicyUrl
    : `${appOrigin}${appConfig.privacyPolicyUrl.startsWith('/') ? '' : '/'}${appConfig.privacyPolicyUrl || 'privacy-policy'}`;

  const deletionUrl = (appConfig.dataDeletionUrl || '/data-deletion').startsWith('http')
    ? appConfig.dataDeletionUrl
    : `${appOrigin}${appConfig.dataDeletionUrl.startsWith('/') ? '' : '/'}${appConfig.dataDeletionUrl || 'data-deletion'}`;

  document.querySelectorAll('.dyn-privacy-link').forEach(el => {
    el.setAttribute('href', privacyUrl);
  });
  document.querySelectorAll('.dyn-deletion-link').forEach(el => {
    el.setAttribute('href', deletionUrl);
  });

  applyDownloadLinksToDOM();

  document.querySelectorAll('.dyn-chat-link').forEach(el => {
    el.setAttribute('href', `${appOrigin}/support`);
  });
}

// =========================================================================
// 2. GAME WIN RATES (2-COLUMN HORIZONTAL PILL CARDS)
// =========================================================================
async function loadGameRates() {
  try {
    let res = await fetchFromApi('/landing/rates');
    let data = await res.json();

    if (!data || data.success !== '1' || !Array.isArray(data.data) || data.data.length === 0) {
      res = await fetchFromApi('/landing/info');
      data = await res.json();
      if (data && data.data && Array.isArray(data.data.rates)) {
        data.data = data.data.rates;
      }
    }

    if (data && Array.isArray(data.data) && data.data.length > 0) {
      allRates = data.data;
      renderDynamicRates(allRates);
    }
  } catch (err) {
    console.warn('Error fetching game rates:', err.message);
  }
}

function formatRateLabel(minVal, maxVal) {
  if (minVal > 0 && maxVal % minVal === 0) {
    return `₹ 1 KA ₹ ${maxVal / minVal}`;
  }
  return `₹ ${minVal} KA ₹ ${maxVal}`;
}

function renderDynamicRates(rates) {
  const container = document.getElementById('ratesGrid');
  if (!container || !rates || rates.length === 0) return;

  container.innerHTML = rates.map(r => {
    const typeName = r.type || r.name || 'Game Rate';
    const minVal = Number(r.min_value) || 10;
    const maxVal = Number(r.max_value) || (r.rate ? Number(r.rate) : 950);
    const formattedRate = formatRateLabel(minVal, maxVal);

    return `
      <div class="rate-row-card">
        <div class="rate-left">
          <span class="rate-arrow-icon"><i class="fa-solid fa-arrow-right-to-bracket"></i></span>
          <span class="rate-title">${typeName}</span>
        </div>
        <div class="rate-value">${formattedRate}</div>
      </div>
    `;
  }).join('');
}

// =========================================================================
// 3. AVAILABLE GAMES & LIVE SERVER RESULTS (3-COLUMN CARDS)
// =========================================================================
async function loadLiveMarkets() {
  try {
    const res = await fetchFromApi('/landing/markets');
    const data = await res.json();

    if (data && data.success === '1' && Array.isArray(data.data) && data.data.length > 0) {
      allMarkets = data.data;
      renderLiveMarketsDOM();
      updateHeroLiveMockup(allMarkets);
    }
  } catch (err) {
    const container = document.getElementById('marketsGrid');
    if (container && (!allMarkets || allMarkets.length === 0)) {
      container.innerHTML = `
        <div class="loading-markets-box">
          <i class="fa-solid fa-circle-exclamation" style="color: #f97316;"></i>
          <h4>Connecting to Live Server...</h4>
          <p style="margin-bottom: 14px;">Unable to fetch live market results right now.</p>
          <button type="button" onclick="loadLiveMarkets()" class="btn-play-royal" style="margin: 0 auto;">
            <i class="fa-solid fa-rotate-right"></i> Retry Now
          </button>
        </div>
      `;
    }
  }
}

function renderLiveMarketsDOM() {
  const container = document.getElementById('marketsGrid');
  if (!container) return;

  const filtered = allMarkets.filter(m => {
    const nameMatch = !searchQuery || m.market_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!nameMatch) return false;
    if (currentFilter === 'declared') return m.is_declared_today;
    if (currentFilter === 'open') return m.is_betting_open && !m.is_declared_today;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="loading-markets-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <h4>No markets matched "${searchQuery || currentFilter}"</h4>
        <p style="margin-bottom: 14px;">Try another market name or reset filter.</p>
        <button type="button" onclick="clearSearch()" class="btn-play-royal" style="margin: 0 auto;">
          Show All Markets
        </button>
      </div>
    `;
    return;
  }

  const apkUrl = verifiedApkUrl || APK_STORE_FILE;

  container.innerHTML = filtered.map(m => {
    const resultStr = m.result_display || '***-**-***';
    const encodedName = encodeURIComponent(m.market_name);

    return `
      <div class="game-market-card">
        <div class="gm-left">
          <h3 class="gm-title" title="${m.market_name}">${m.market_name}</h3>
          <div class="gm-result">${resultStr}</div>
          <div class="gm-charts-row">
            <span class="gm-chart-link" onclick="openChartModal('jodi', '${encodedName}')">Jodi Chart</span>
            <span class="gm-chart-sep">|</span>
            <span class="gm-chart-link" onclick="openChartModal('panel', '${encodedName}')">Panna Chart</span>
          </div>
        </div>
        <a href="${apkUrl}" download="Bharat-Matka.apk" class="btn-play-royal apk-download-btn">
          <span>Play now</span>
          <span class="play-circle-icon"><i class="fa-solid fa-play"></i></span>
        </a>
      </div>
    `;
  }).join('');
}

function updateHeroLiveMockup(markets) {
  if (!markets || markets.length === 0) return;

  const topMarkets = markets.slice(0, 4);
  const heroList = document.getElementById('heroPhoneMarkets');
  if (heroList) {
    heroList.innerHTML = topMarkets.map(m => `
      <div class="pp-market-row">
        <div>
          <div class="pp-mname">${m.market_name}</div>
          <div class="pp-mres">${m.result_display || '***-**-***'}</div>
        </div>
        <span class="pp-bet-btn">Place Bet</span>
      </div>
    `).join('');
  }

  const showcaseList = document.getElementById('showcaseMarketsList');
  if (showcaseList) {
    showcaseList.innerHTML = markets.slice(0, 3).map(m => `
      <div class="sp-market-item">
        <div>
          <strong>${m.market_name}</strong>
          <small>${m.result_display || '***-**-***'}</small>
        </div>
        <span class="sp-play-mini">Play Now</span>
      </div>
    `).join('');
  }
}

// =========================================================================
// 4. INTERACTIVE JODI & PANNA CHART MODAL + HOW-TO-PLAY MODAL
// =========================================================================
window.openChartModal = async (chartType, encodedGame) => {
  const gameName = decodeURIComponent(encodedGame);
  const modal = document.getElementById('chartModal');
  const modalTitle = document.getElementById('chartModalTitle');
  const modalBody = document.getElementById('chartModalBody');
  if (!modal || !modalTitle || !modalBody) return;

  const typeLabel = chartType === 'jodi' ? 'Jodi Chart' : 'Panna Chart';
  modalTitle.textContent = `${gameName} - Official ${typeLabel}`;
  modalBody.innerHTML = `
    <div style="text-align: center; padding: 48px; color: var(--royal-blue);">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.8rem; margin-bottom: 12px; display: block;"></i>
      <p style="font-weight: 700;">Loading historical ${typeLabel} from server...</p>
    </div>
  `;
  modal.classList.add('active');

  try {
    const res = await fetchFromApi(`/landing/chart/${chartType}/${encodeURIComponent(gameName)}`);
    const data = await res.json();

    if (data && data.success === '1' && Array.isArray(data.weeks) && data.weeks.length > 0) {
      renderChartTable(data.weeks, chartType);
    } else {
      modalBody.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i class="fa-solid fa-database" style="font-size: 2rem; margin-bottom: 12px; color: var(--royal-blue); display: block;"></i>
          <p style="font-size: 1rem; font-weight: 700; color: var(--text-dark);">No records found for ${gameName}</p>
          <p style="font-size: 0.85rem; margin-top: 4px;">Historical chart entries appear once results are declared.</p>
        </div>
      `;
    }
  } catch (err) {
    modalBody.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #dc2626;">
        <p>Failed to load chart data. Please try again shortly.</p>
      </div>
    `;
  }
};

window.closeChartModal = () => {
  const modal = document.getElementById('chartModal');
  if (modal) modal.classList.remove('active');
};

window.openHowToPlayModal = (e) => {
  if (e) e.preventDefault();
  const modal = document.getElementById('howToPlayModal');
  if (modal) modal.classList.add('active');
};

window.closeHowToPlayModal = () => {
  const modal = document.getElementById('howToPlayModal');
  if (modal) modal.classList.remove('active');
};

function renderChartTable(weeks, chartType) {
  const modalBody = document.getElementById('chartModalBody');
  if (!modalBody) return;

  const daysHeader = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let html = `
    <div style="overflow-x: auto;">
      <table class="chart-table">
        <thead>
          <tr>
            <th>Week Date</th>
            ${daysHeader.map(d => `<th>${d}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;

  weeks.slice(0, 20).forEach(w => {
    html += `<tr><td style="font-weight: 700; color: #6b7280; font-size: 0.78rem; white-space: nowrap;">${w.weekStart}</td>`;
    const dayOrder = [1, 2, 3, 4, 5, 6, 0];
    dayOrder.forEach(dayIdx => {
      const d = w.days ? w.days[dayIdx] : null;
      if (d) {
        if (chartType === 'jodi') {
          html += `<td class="chart-jodi-cell">${d.jodi || '**'}</td>`;
        } else {
          html += `<td>
            <div style="font-size: 0.7rem; color: #6b7280;">${d.open_pana || '***'}</div>
            <div class="chart-jodi-cell">${d.jodi || '**'}</div>
            <div style="font-size: 0.7rem; color: #6b7280;">${d.close_pana || '***'}</div>
          </td>`;
        }
      } else {
        html += `<td style="color: #9ca3af;">**</td>`;
      }
    });
    html += `</tr>`;
  });

  html += `</tbody></table></div>`;
  modalBody.innerHTML = html;
}

// =========================================================================
// 5. SEARCH, FILTER & GLOBAL LISTENERS
// =========================================================================
window.clearSearch = () => {
  searchQuery = '';
  const searchInput = document.getElementById('marketSearchInput');
  if (searchInput) searchInput.value = '';
  currentFilter = 'all';
  updateFilterButtons();
  renderLiveMarketsDOM();
};

function updateFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === currentFilter);
  });
}

function initEventListeners() {
  const searchInput = document.getElementById('marketSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value.trim();
      renderLiveMarketsDOM();
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.getAttribute('data-filter');
      updateFilterButtons();
      renderLiveMarketsDOM();
    });
  });

  document.addEventListener('click', e => {
    const btn = e.target.closest('.apk-download-btn');
    if (btn) {
      btn.setAttribute('href', verifiedApkUrl || APK_STORE_FILE);
      btn.setAttribute('download', 'Bharat-Matka.apk');
    }
  });

  const chartModal = document.getElementById('chartModal');
  if (chartModal) {
    chartModal.addEventListener('click', e => {
      if (e.target === chartModal) closeChartModal();
    });
  }

  const howModal = document.getElementById('howToPlayModal');
  if (howModal) {
    howModal.addEventListener('click', e => {
      if (e.target === howModal) closeHowToPlayModal();
    });
  }

  initWebsiteSliderEvents();
}

// =========================================================================
// 6. DYNAMIC ADMIN-MANAGED WEBSITE IMAGE SLIDER
// =========================================================================
const DEFAULT_WEBSITE_SLIDES = [
  {
    id: 'default-1',
    title: 'Play Live Matka Markets 24x7',
    subtitle: 'Instant UPI Deposit & Fast Auto Payout on Bharat Matka',
    image_url: 'img/slider-banner-1.jpg',
    redirect_url: '#available-games',
    status: '1'
  },
  {
    id: 'default-2',
    title: 'Bharat Ka Sabse Trusted & Safe App',
    subtitle: 'Best Game Win Rates & Instant Withdrawal Support',
    image_url: 'img/slider-banner-2.jpg',
    redirect_url: 'apk/Bharat-Matka.apk',
    status: '1'
  }
];

let websiteSlidesData = [];
let currentWebsiteSlideIdx = 0;
let websiteSliderTimer = null;

function getBackendOrigin() {
  if (typeof activeApiBase === 'string' && /^https?:\/\//i.test(activeApiBase)) {
    return activeApiBase.replace(/\/api\/?$/i, '');
  }
  return window.location.origin;
}

function resolveLandingAssetUrl(rawUrl) {
  const clean = String(rawUrl || '').trim();
  if (!clean) return '';
  if (/^(data:|https?:\/\/)/i.test(clean)) return clean;
  if (/^\/?img\//i.test(clean)) return clean.replace(/^\/+/, '');
  const origin = getBackendOrigin();
  if (clean.startsWith('/')) return `${origin}${clean}`;
  return `${origin}/uploads/${clean}`;
}

function getSafeRedirectUrl(rawUrl) {
  const clean = String(rawUrl || '').trim();
  if (!clean) return '';
  if (/^(https?:\/\/|\/|#)/i.test(clean)) return clean;
  if (/^[a-z0-9][a-z0-9/_.-]*$/i.test(clean)) return clean;
  return '';
}

async function loadWebsiteSliders() {
  const section = document.getElementById('websiteSliderSection');
  if (!section) return;
  try {
    const res = await fetchFromApi('/landing/sliders');
    const json = await res.json();
    if (!json || json.success !== '1') {
      return;
    }
    const list = Array.isArray(json.data) ? json.data : [];
    const activeSlides = list.filter(item => item && item.image_url && String(item.status ?? '1') === '1');
    const totalCount = Number(json.total_count);
    if (activeSlides.length > 0) {
      renderWebsiteSliders(activeSlides);
    } else if (!Number.isNaN(totalCount) && totalCount > 0) {
      // Admin intentionally created slides and marked all inactive
      renderWebsiteSliders([]);
    }
  } catch (err) {
    console.warn('Could not load website sliders from API, keeping default banner slider:', err.message);
  }
}

function renderWebsiteSliders(slides) {
  const section = document.getElementById('websiteSliderSection');
  const track = document.getElementById('websiteSliderTrack');
  const dotsEl = document.getElementById('websiteSliderDots');
  const prevBtn = document.getElementById('wsPrevBtn');
  const nextBtn = document.getElementById('wsNextBtn');
  if (!section || !track || !dotsEl) return;

  stopWebsiteSliderAutoPlay();
  const validSlides = Array.isArray(slides) ? slides : [];
  websiteSlidesData = validSlides;

  if (validSlides.length === 0) {
    section.style.display = 'none';
    track.innerHTML = '';
    dotsEl.innerHTML = '';
    return;
  }

  track.innerHTML = '';
  dotsEl.innerHTML = '';
  currentWebsiteSlideIdx = 0;

  validSlides.forEach((slide, idx) => {
    const safeHref = getSafeRedirectUrl(slide.redirect_url);
    const slideEl = document.createElement(safeHref ? 'a' : 'div');
    slideEl.className = 'ws-slide';
    if (safeHref) {
      slideEl.href = safeHref;
      if (/^https?:\/\//i.test(safeHref)) {
        slideEl.target = '_blank';
        slideEl.rel = 'noopener noreferrer';
      }
    }

    const img = document.createElement('img');
    img.className = 'ws-slide-img';
    img.src = resolveLandingAssetUrl(slide.image_url);
    img.alt = slide.title || `Bharat Matka Banner ${idx + 1}`;
    img.loading = idx === 0 ? 'eager' : 'lazy';
    img.addEventListener('error', () => {
      img.style.visibility = 'hidden';
    });
    slideEl.appendChild(img);

    const hasTitle = Boolean(slide.title && String(slide.title).trim());
    const hasSubtitle = Boolean(slide.subtitle && String(slide.subtitle).trim());
    if (hasTitle || hasSubtitle) {
      const caption = document.createElement('div');
      caption.className = 'ws-caption';
      if (hasTitle) {
        const titleEl = document.createElement('h3');
        titleEl.className = 'ws-caption-title';
        titleEl.textContent = String(slide.title).trim();
        caption.appendChild(titleEl);
      }
      if (hasSubtitle) {
        const subEl = document.createElement('p');
        subEl.className = 'ws-caption-subtitle';
        subEl.textContent = String(slide.subtitle).trim();
        caption.appendChild(subEl);
      }
      slideEl.appendChild(caption);
    }

    track.appendChild(slideEl);

    if (validSlides.length > 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `ws-dot${idx === 0 ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
      dot.addEventListener('click', () => {
        goToWebsiteSlide(idx);
        restartWebsiteSliderAutoPlay();
      });
      dotsEl.appendChild(dot);
    }
  });

  const showControls = validSlides.length > 1;
  if (prevBtn) prevBtn.style.display = showControls ? 'inline-flex' : 'none';
  if (nextBtn) nextBtn.style.display = showControls ? 'inline-flex' : 'none';
  dotsEl.style.display = showControls ? 'flex' : 'none';

  section.style.display = 'block';
  updateWebsiteSliderTransform();
  if (showControls) {
    startWebsiteSliderAutoPlay();
  }
}

function updateWebsiteSliderTransform() {
  const track = document.getElementById('websiteSliderTrack');
  const dotsEl = document.getElementById('websiteSliderDots');
  if (!track) return;
  track.style.transform = `translate3d(-${currentWebsiteSlideIdx * 100}%, 0, 0)`;
  if (dotsEl) {
    const dots = dotsEl.querySelectorAll('.ws-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentWebsiteSlideIdx);
    });
  }
}

function goToWebsiteSlide(index) {
  if (!websiteSlidesData || websiteSlidesData.length === 0) return;
  const total = websiteSlidesData.length;
  currentWebsiteSlideIdx = ((index % total) + total) % total;
  updateWebsiteSliderTransform();
}

function startWebsiteSliderAutoPlay() {
  stopWebsiteSliderAutoPlay();
  if (websiteSlidesData.length <= 1) return;
  websiteSliderTimer = setInterval(() => {
    goToWebsiteSlide(currentWebsiteSlideIdx + 1);
  }, 4500);
}

function stopWebsiteSliderAutoPlay() {
  if (websiteSliderTimer) {
    clearInterval(websiteSliderTimer);
    websiteSliderTimer = null;
  }
}

function restartWebsiteSliderAutoPlay() {
  stopWebsiteSliderAutoPlay();
  startWebsiteSliderAutoPlay();
}

function initWebsiteSliderEvents() {
  const prevBtn = document.getElementById('wsPrevBtn');
  const nextBtn = document.getElementById('wsNextBtn');
  const carousel = document.getElementById('websiteSliderCarousel');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goToWebsiteSlide(currentWebsiteSlideIdx - 1);
      restartWebsiteSliderAutoPlay();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goToWebsiteSlide(currentWebsiteSlideIdx + 1);
      restartWebsiteSliderAutoPlay();
    });
  }
  if (carousel) {
    let touchStartX = 0;
    carousel.addEventListener('mouseenter', stopWebsiteSliderAutoPlay);
    carousel.addEventListener('mouseleave', startWebsiteSliderAutoPlay);
    carousel.addEventListener('touchstart', e => {
      stopWebsiteSliderAutoPlay();
      if (e.touches && e.touches[0]) touchStartX = e.touches[0].clientX;
    }, { passive: true });
    carousel.addEventListener('touchend', e => {
      if (e.changedTouches && e.changedTouches[0]) {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
          goToWebsiteSlide(diff > 0 ? currentWebsiteSlideIdx + 1 : currentWebsiteSlideIdx - 1);
        }
      }
      startWebsiteSliderAutoPlay();
    }, { passive: true });
  }
}
