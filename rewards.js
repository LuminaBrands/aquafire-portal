/* ═══════════════════════════════════════════════════════════════
   Aquafire Rewards – Firebase Auth + Firestore Points Engine
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Firebase Config ── */
  const firebaseConfig = {
    apiKey: "AIzaSyAAeoOt4NJxh_ITaWNMBV-Ed-mM5Ac5a7Q",
    authDomain: "aquafire-portal.firebaseapp.com",
    projectId: "aquafire-portal",
    storageBucket: "aquafire-portal.firebasestorage.app",
    messagingSenderId: "589960398521",
    appId: "1:589960398521:web:3c5852186e59fdf0847d68",
    measurementId: "G-8NEGKCN6RD"
  };

  /* ── Reward Definitions ── */
  const REWARDS = {
    'setup-guide':       { points: 500, label: 'Complete Setup Guide' },
    'enclosure-builder': { points: 200, label: 'Use Enclosure Builder' },
    'water-hardness':    { points: 250, label: 'Check Water Hardness' },
    'light-trap':        { points: 200, label: 'Configure Light Trap' },
    'fireplace-tour':    { points: 200, label: 'Complete Fireplace Tour' },
    'mist-maker':        { points: 250, label: 'Mist Maker Cleaning' },
    'system-cleaning':   { points: 300, label: 'System Cleaning' },
    'follow-instagram':  { points: 150, label: 'Follow on Instagram' },
    'watch-youtube':     { points: 100, label: 'Watch on YouTube' },
    'ar-cutout':         { points: 200, label: 'Use AR Visualizer' },
    'quick-start':       { points: 150, label: 'View Quick Start Guide' },
    'support-hub':       { points: 100, label: 'Visit Support Hub' },
    'contact-sales':     { points: 100, label: 'Contact Sales' },
    'shop-accessories':  { points: 100, label: 'Browse Shop' },
    'fireplace-setup':   { points: 500, label: 'Complete Fireplace Setup' },
    'register-warranty': { points: 300, label: 'Register Warranty' },
    'submit-review':     { points: 500, label: 'Submit a Review' },
  };

  /* ── State ── */
  let auth = null;
  let db = null;
  let currentUser = null;
  let userPoints = 0;
  let completedRewards = {};
  let firebaseReady = false;

  /* ── Initialize Firebase ── */
  function initFirebase() {
    if (typeof firebase === 'undefined') return;
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      auth = firebase.auth();
      db = firebase.firestore();
      firebaseReady = true;

      auth.onAuthStateChanged(function (user) {
        currentUser = user;
        if (user) {
          loadUserData();
          updateNavUI();
          closeModal();
        } else {
          userPoints = 0;
          completedRewards = {};
          updateNavUI();
          updateAllBadges();
        }
      });
    } catch (e) {
      console.warn('Firebase init error:', e);
    }
  }

  /* ── Firestore: Load / Save ── */
  function loadUserData() {
    if (!db || !currentUser) return;
    db.collection('users').doc(currentUser.uid).get().then(function (doc) {
      if (doc.exists) {
        var data = doc.data();
        userPoints = data.points || 0;
        completedRewards = data.completed || {};
      } else {
        userPoints = 0;
        completedRewards = {};
        saveUserData();
      }
      updateNavUI();
      updateAllBadges();
    }).catch(function (e) {
      console.warn('Load user data error:', e);
      // Fallback to localStorage
      loadLocal();
      updateNavUI();
      updateAllBadges();
    });
  }

  // Resolves when the most recent save has been accepted by Firestore (or
  // immediately when there's nothing to wait for). Used before navigating away
  // so a click-triggered award isn't lost mid-flight.
  var lastSave = Promise.resolve();
  function whenSaved() { return lastSave; }

  function saveUserData() {
    if (db && currentUser) {
      lastSave = db.collection('users').doc(currentUser.uid).set({
        points: userPoints,
        completed: completedRewards,
        email: currentUser.email || '',
        displayName: currentUser.displayName || '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(function (e) {
        console.warn('Save error:', e);
      });
    }
    // Always mirror to localStorage as backup
    saveLocal();
  }

  /* ── localStorage fallback ── */
  function loadLocal() {
    try {
      var d = JSON.parse(localStorage.getItem('aquafire_rewards') || '{}');
      userPoints = d.points || 0;
      completedRewards = d.completed || {};
    } catch (e) { /* ignore */ }
  }

  function saveLocal() {
    try {
      localStorage.setItem('aquafire_rewards', JSON.stringify({
        points: userPoints,
        completed: completedRewards
      }));
    } catch (e) { /* ignore */ }
  }

  /* ── Award Points ── */
  function awardPoints(rewardId) {
    if (completedRewards[rewardId]) return false; // Already earned
    var reward = REWARDS[rewardId];
    if (!reward) return false;

    completedRewards[rewardId] = Date.now();
    userPoints += reward.points;
    saveUserData();
    updateNavUI();
    updateAllBadges();
    showPointsToast(reward.points, reward.label);
    return true;
  }

  /* ── Points Toast ── */
  function showPointsToast(points, label) {
    var toast = document.createElement('div');
    toast.className = 'af-toast';
    toast.innerHTML =
      '<div class="af-toast-inner">' +
        '<div class="af-toast-icon-ring"><span class="af-toast-flame">&#x1f525;</span></div>' +
        '<div class="af-toast-content">' +
          '<span class="af-toast-points">+' + points + ' pts</span>' +
          '<span class="af-toast-label">' + label + '</span>' +
        '</div>' +
        '<div class="af-toast-sparkles">' +
          '<span class="af-spark af-spark-1"></span>' +
          '<span class="af-spark af-spark-2"></span>' +
          '<span class="af-spark af-spark-3"></span>' +
          '<span class="af-spark af-spark-4"></span>' +
          '<span class="af-spark af-spark-5"></span>' +
          '<span class="af-spark af-spark-6"></span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add('af-toast--show');
    });
    setTimeout(function () {
      toast.classList.remove('af-toast--show');
      toast.classList.add('af-toast--hide');
      setTimeout(function () { toast.remove(); }, 500);
    }, 3500);
  }

  /* ── Nav UI ── */
  function updateNavUI() {
    var btn = document.getElementById('af-rewards-btn');
    if (!btn) return;

    if (currentUser) {
      var name = currentUser.displayName || currentUser.email || 'Account';
      var initial = (name.charAt(0) || 'A').toUpperCase();
      btn.innerHTML =
        '<span class="af-nav-avatar">' + initial + '</span>' +
        '<span class="af-nav-points">' +
          '<span class="af-nav-pts-icon">&#x1f525;</span>' +
          '<span class="af-nav-pts-num">' + userPoints.toLocaleString() + '</span>' +
        '</span>';
      btn.onclick = showProfileDropdown;
    } else {
      btn.innerHTML =
        '<span class="af-nav-login-label">Sign In</span>' +
        '<span class="af-nav-pts-icon">&#x1f525;</span>';
      btn.onclick = showModal;
    }

    updateBannerCTA();
  }

  /* ── Banner CTA (Sign In / View Profile) ── */
  function updateBannerCTA() {
    // index.html banner button
    var homeCta = document.getElementById('rb-signin-cta');
    if (homeCta) {
      if (currentUser) {
        homeCta.innerHTML =
          'View Profile' +
          ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
        homeCta.onclick = function () { window.location.href = 'rewards.html'; };
      } else {
        homeCta.innerHTML =
          'Sign In to Start Earning' +
          ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>';
        homeCta.onclick = function () { window.AquafireRewards && window.AquafireRewards.showLogin(); };
      }
    }

    // rewards.html banner button
    var rwCta = document.getElementById('rw-score-cta');
    if (rwCta) {
      if (currentUser) {
        rwCta.innerHTML =
          '<button onclick="window.location.href=\'rewards.html#rw-profile\'">View Profile</button>';
      } else {
        rwCta.innerHTML =
          '<button onclick="window.AquafireRewards && window.AquafireRewards.showLogin()">Sign In to Start Earning</button>';
      }
    }
  }

  /* ── Profile Dropdown ── */
  function showProfileDropdown(e) {
    e.stopPropagation();
    closeProfileDropdown();
    var btn = document.getElementById('af-rewards-btn');
    var rect = btn.getBoundingClientRect();

    var dd = document.createElement('div');
    dd.id = 'af-profile-dropdown';
    dd.className = 'af-dropdown';
    dd.innerHTML =
      '<div class="af-dd-header">' +
        '<span class="af-dd-name">' + (currentUser.displayName || currentUser.email || 'Aquafire Member') + '</span>' +
        '<span class="af-dd-email">' + (currentUser.email || '') + '</span>' +
      '</div>' +
      '<div class="af-dd-points">' +
        '<span class="af-dd-pts-num">&#x1f525; ' + userPoints.toLocaleString() + ' pts</span>' +
        '<span class="af-dd-pts-label">Aquafire Reward Points</span>' +
      '</div>' +
      '<div class="af-dd-progress">' + buildProgressHTML() + '</div>' +
      '<a href="rewards.html#redeem-rewards" class="af-dd-redeem" id="af-redeem-btn">Redeem Your Points</a>' +
      '<button class="af-dd-signout" id="af-signout-btn">Sign Out</button>';

    document.body.appendChild(dd);

    // Position
    var ddW = 280;
    var left = rect.right - ddW;
    if (left < 8) left = 8;
    dd.style.top = (rect.bottom + 8) + 'px';
    dd.style.left = left + 'px';

    document.getElementById('af-signout-btn').onclick = function () {
      auth.signOut();
      closeProfileDropdown();
    };

    setTimeout(function () {
      document.addEventListener('click', closeProfileDropdown, { once: true });
    }, 10);
  }

  function closeProfileDropdown() {
    var dd = document.getElementById('af-profile-dropdown');
    if (dd) dd.remove();
  }

  function buildProgressHTML() {
    var total = Object.keys(REWARDS).length;
    var done = Object.keys(completedRewards).length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    return (
      '<div class="af-dd-bar-wrap">' +
        '<div class="af-dd-bar"><div class="af-dd-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="af-dd-bar-label">' + done + '/' + total + ' modules completed</span>' +
      '</div>'
    );
  }

  /* ── Login Modal ── */
  function showModal() {
    if (document.getElementById('af-auth-modal')) return;
    var overlay = document.createElement('div');
    overlay.id = 'af-auth-modal';
    overlay.className = 'af-modal-overlay';
    overlay.innerHTML =
      '<div class="af-modal">' +
        '<button class="af-modal-close" id="af-modal-close" aria-label="Close">&times;</button>' +
        '<div class="af-modal-header">' +
          '<div class="af-modal-flame">&#x1f525;</div>' +
          '<h2 class="af-modal-title">Aquafire Rewards</h2>' +
          '<p class="af-modal-sub">Sign in to earn points as you explore</p>' +
        '</div>' +
        '<div class="af-modal-body">' +
          '<button class="af-auth-btn af-auth-google" id="af-auth-google">' +
            '<svg class="af-auth-icon" viewBox="0 0 24 24" width="20" height="20">' +
              '<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>' +
              '<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>' +
              '<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>' +
              '<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>' +
            '</svg>' +
            'Continue with Google' +
          '</button>' +
          '<div class="af-auth-divider"><span>or</span></div>' +
          '<form id="af-email-form" class="af-email-form">' +
            '<label class="af-form-label">Email address</label>' +
            '<input type="email" id="af-email-input" class="af-form-input" placeholder="Enter your email address" required />' +
            '<div id="af-password-group" class="af-password-group" style="display:none">' +
              '<label class="af-form-label">Password</label>' +
              '<input type="password" id="af-password-input" class="af-form-input" placeholder="Enter your password" minlength="6" />' +
            '</div>' +
            '<div id="af-auth-error" class="af-auth-error"></div>' +
            '<button type="submit" class="af-auth-submit" id="af-email-submit">Continue</button>' +
          '</form>' +
        '</div>' +
        '<p class="af-modal-footer">Earn points by exploring guides, using tools, and more!</p>' +
      '</div>';

    document.body.appendChild(overlay);

    // Events
    document.getElementById('af-modal-close').onclick = closeModal;
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) closeModal();
    });

    // Google Auth
    document.getElementById('af-auth-google').onclick = function () {
      if (!firebaseReady) return;
      var provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).catch(function (err) {
        showAuthError(err.message);
      });
    };

    // Email Auth
    var emailStep = 'email'; // 'email' | 'password'
    document.getElementById('af-email-form').onsubmit = function (ev) {
      ev.preventDefault();
      if (!firebaseReady) return;
      var email = document.getElementById('af-email-input').value.trim();
      var errEl = document.getElementById('af-auth-error');
      errEl.textContent = '';

      if (emailStep === 'email') {
        // Check if user exists, then show password
        auth.fetchSignInMethodsForEmail(email).then(function (methods) {
          document.getElementById('af-password-group').style.display = 'block';
          document.getElementById('af-password-input').focus();
          emailStep = 'password';
          if (methods.length === 0) {
            document.getElementById('af-email-submit').textContent = 'Create Account';
          } else {
            document.getElementById('af-email-submit').textContent = 'Sign In';
          }
        }).catch(function (err) {
          showAuthError(err.message);
        });
      } else {
        var password = document.getElementById('af-password-input').value;
        var submitBtn = document.getElementById('af-email-submit');
        var btnText = submitBtn.textContent;

        if (btnText === 'Create Account') {
          auth.createUserWithEmailAndPassword(email, password).catch(function (err) {
            showAuthError(err.message);
          });
        } else {
          auth.signInWithEmailAndPassword(email, password).catch(function (err) {
            showAuthError(err.message);
          });
        }
      }
    };

    // Animate in
    requestAnimationFrame(function () {
      overlay.classList.add('af-modal--open');
    });
  }

  function showAuthError(msg) {
    var el = document.getElementById('af-auth-error');
    if (el) el.textContent = msg;
  }

  function closeModal() {
    var m = document.getElementById('af-auth-modal');
    if (m) {
      m.classList.remove('af-modal--open');
      m.classList.add('af-modal--closing');
      setTimeout(function () { m.remove(); }, 250);
    }
  }

  /* ── Reward Badges on Sections ── */
  function updateAllBadges() {
    document.querySelectorAll('[data-reward]').forEach(function (el) {
      var rid = el.getAttribute('data-reward');
      var reward = REWARDS[rid];
      if (!reward) return;

      var badge = el.querySelector('.af-reward-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'af-reward-badge';
        el.insertBefore(badge, el.firstChild);
      }

      var completed = completedRewards[rid];
      if (completed) {
        badge.className = 'af-reward-badge af-reward-badge--done';
        badge.innerHTML = '<span class="af-rb-check">&#x2713;</span><span class="af-rb-pts">+' + reward.points + '</span>';
      } else {
        badge.className = 'af-reward-badge';
        badge.innerHTML = '<span class="af-rb-flame">&#x1f525;</span><span class="af-rb-pts">+' + reward.points + ' pts</span>';
      }
    });
    updateHomeBanner();
  }

  /* ── Home Banner Update ── */
  function updateHomeBanner() {
    var barFill = document.getElementById('rb-home-bar-fill');
    var barLabel = document.getElementById('rb-home-bar-label');
    var ptsDisplay = document.getElementById('rb-home-points');
    if (!barFill) return;

    var total = Object.keys(REWARDS).length;
    var done = Object.keys(completedRewards).length;
    var pct = total ? Math.round((done / total) * 100) : 0;

    barFill.style.width = pct + '%';
    if (barLabel) barLabel.textContent = done + ' / ' + total + ' modules completed';
    if (ptsDisplay) ptsDisplay.textContent = userPoints.toLocaleString() + ' pts';
  }

  /* ── Auto-detection of section completion ── */
  function setupAutoTracking() {
    // Track external link clicks (Instagram, YouTube, Shop, Contact)
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href') || '';

      if (href.includes('instagram.com/aquafire')) awardPoints('follow-instagram');
      if (href.includes('youtube.com') && href.includes('Aquafire')) awardPoints('watch-youtube');
      if (href === 'https://www.aquafire.com' && !href.includes('contact') && !href.includes('products')) awardPoints('shop-accessories');
      if (href.includes('contact')) awardPoints('contact-sales');
    });

    // Page-specific tracking
    var path = window.location.pathname;

    if (path.includes('enclosure-guide')) {
      setupEnclosureTracking();
    } else if (path.includes('water-care')) {
      setupWaterCareTracking();
    } else if (path.includes('quick-start')) {
      setupQuickStartTracking();
    } else if (path.includes('support')) {
      setTimeout(function () { awardPoints('support-hub'); }, 3000);
    }
  }

  /* ── Quick Start page ──────────────────────────────────────────────────
     Two rewards, deliberately at different depths:
       'quick-start' (150) — for landing on the page.
       'setup-guide' (500) — for actually opening a model's setup guide from
         here. It used to sit on getting-started.html, which is a "coming soon"
         placeholder that never awarded anything, so the badge was unearnable. */
  function setupQuickStartTracking() {
    setTimeout(function () { awardPoints('quick-start'); }, 3000);

    var grid = document.querySelector('.model-grid');
    if (!grid) return;

    grid.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link || !grid.contains(link)) return;
      // Model guides only — not the "Coming Soon" Lite card, which isn't a link.
      if (!/^aquafire-[a-z-]+\.html/.test(link.getAttribute('href') || '')) return;
      if (!awardPoints('setup-guide')) return;   // already earned — let the click through

      // Opening in a new tab/window leaves this page alive, so the save
      // finishes on its own and we must not hijack the click.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

      // Same-tab navigation can cut off the Firestore write mid-flight, and the
      // next page load reads Firestore back over local state — so the 500
      // points would vanish. Hold navigation until the save lands, capped so a
      // slow network never traps the customer on the page.
      e.preventDefault();
      var href = link.href, went = false;
      var go = function () { if (!went) { went = true; window.location.href = href; } };
      whenSaved().then(go, go);
      setTimeout(go, 700);
    });
  }

  function setupEnclosureTracking() {
    var interactions = { model: false, lightTrap: false, tour: false };

    // Track model/size selection
    var modelSel = document.getElementById('model');
    var sizeSel = document.getElementById('size');
    if (modelSel) modelSel.addEventListener('change', function () {
      interactions.model = true;
      checkEnclosureComplete(interactions);
    });
    if (sizeSel) sizeSel.addEventListener('change', function () {
      interactions.model = true;
      checkEnclosureComplete(interactions);
    });

    // Track light trap slider interaction
    var setbackSlider = document.getElementById('setback-slider');
    var openingSlider = document.getElementById('opening-slider');
    if (setbackSlider) setbackSlider.addEventListener('input', function () {
      interactions.lightTrap = true;
      awardPoints('light-trap');
      checkEnclosureComplete(interactions);
    });
    if (openingSlider) openingSlider.addEventListener('input', function () {
      interactions.lightTrap = true;
      awardPoints('light-trap');
      checkEnclosureComplete(interactions);
    });

    // Track tour completion
    var tourNext = document.getElementById('tour-next');
    if (tourNext) {
      tourNext.addEventListener('click', function () {
        var count = document.getElementById('tour-stop-count');
        if (count && count.textContent.includes('6 / 6')) {
          interactions.tour = true;
          awardPoints('fireplace-tour');
          checkEnclosureComplete(interactions);
        }
      });
    }
  }

  function checkEnclosureComplete(interactions) {
    if (interactions.model && interactions.lightTrap && interactions.tour) {
      awardPoints('enclosure-builder');
    }
  }

  function setupWaterCareTracking() {
    // Track when user gets a hardness result
    var zipSearch = document.getElementById('zipSearch');
    var ppmInput = document.getElementById('ppmInput');

    if (zipSearch) {
      zipSearch.addEventListener('change', function () {
        if (zipSearch.value.length >= 3) {
          setTimeout(function () { awardPoints('water-hardness'); }, 1000);
        }
      });
    }
    if (ppmInput) {
      ppmInput.addEventListener('change', function () {
        if (ppmInput.value) awardPoints('water-hardness');
      });
    }
  }

  /* ── Inject nav button ── */
  function injectNavButton() {
    var nav = document.querySelector('.nav-links');
    if (!nav) return;

    // Insert before the CTA li
    var cta = nav.querySelector('.nav-cta');
    var li = document.createElement('li');
    li.className = 'nav-rewards';
    li.innerHTML = '<button id="af-rewards-btn" class="af-rewards-btn"><span class="af-nav-login-label">Sign In</span><span class="af-nav-pts-icon">&#x1f525;</span></button>';

    if (cta) {
      nav.insertBefore(li, cta);
    } else {
      nav.appendChild(li);
    }

    document.getElementById('af-rewards-btn').onclick = showModal;
  }

  /* ── Boot ── */
  function boot() {
    injectNavButton();
    initFirebase();
    setupAutoTracking();
    // If not logged in, try localStorage
    if (!currentUser) {
      loadLocal();
      updateNavUI();
    }
    // Delay badge rendering to let page finish loading
    setTimeout(updateAllBadges, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Expose for manual triggering
  window.AquafireRewards = {
    award: awardPoints,
    showLogin: showModal,
    getPoints: function () { return userPoints; },
    getCompleted: function () { return Object.assign({}, completedRewards); }
  };

})();
