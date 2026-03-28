/* ═══════════════════════════════════════════════════════════════════════════
   AQUAFIRE DEALER LOCATOR
   ─────────────────────────────────────────────────────────────────────────
   To add a dealer:  Copy one of the objects below and fill in the fields.
   To remove:        Delete the entire { ... } block for that dealer.
   To edit:          Change the field values directly.

   Fields:
     name          – Business name
     type          – "Dealer" | "Regional Dealer" | "Sales Rep" | "Online Dealer" | "Temporary Dealer"
     address       – Full street address (or city/state if appointment-only)
     lat, lng      – Map coordinates (use Google Maps → right-click → "What's here?")
     phone         – Phone number string
     email         – Contact email
     website       – Full URL including https://
     byAppointment – true if visits are by appointment only
     country       – "US" | "CA"
   ═══════════════════════════════════════════════════════════════════════════ */

const DEALERS = [
  {
    name: "Bear Creative Group",
    type: "Regional Dealer",
    address: "Boca Raton, FL",
    lat: 26.3683,
    lng: -80.1289,
    phone: "954-531-7322",
    email: "brad@bearcreativegroup.com",
    website: "https://www.bearcreativegroup.com/",
    byAppointment: true,
    country: "US"
  },
  {
    name: "Bear Creative Group",
    type: "Regional Dealer",
    address: "Chicago, IL",
    lat: 41.8781,
    lng: -87.6298,
    phone: "847-404-3147",
    email: "joe@bearcreativegroup.com",
    website: "https://www.bearcreativegroup.com/",
    byAppointment: true,
    country: "US"
  },
  {
    name: "HearthCabinets Ventless Fireplaces",
    type: "Dealer",
    address: "250 W 26th St 2nd Floor, New York, NY 10001",
    lat: 40.7454,
    lng: -73.9936,
    phone: "212-242-1485",
    email: "contact@hearthcabinet.com",
    website: "https://hearthcabinet.com/",
    byAppointment: false,
    country: "US"
  },
  {
    name: "DJ's Custom Remodel & Design",
    type: "Regional Dealer",
    address: "Peoria, AZ",
    lat: 33.5806,
    lng: -112.2374,
    phone: "480-490-9778",
    email: "djshomerescue@gmail.com",
    website: "https://www.facebook.com/DJscustomremodel/",
    byAppointment: true,
    country: "US"
  },
  {
    name: "Fab Fires",
    type: "Regional Dealer",
    address: "",
    lat: null,
    lng: null,
    phone: "910-200-7688",
    email: "brett@fabfires.com",
    website: "",
    byAppointment: true,
    country: "US"
  },
  {
    name: "That's Fire!",
    type: "Regional Dealer",
    address: "",
    lat: null,
    lng: null,
    phone: "970-305-7994",
    email: "kevin@thatsfire.net",
    website: "",
    byAppointment: true,
    country: "US"
  },
  {
    name: "House Supply and Co",
    type: "Dealer",
    address: "7200 W Post Rd Unit 135, Las Vegas, NV 89113",
    lat: 36.0652,
    lng: -115.2841,
    phone: "702-805-7700",
    email: "candmhomedesigns@gmail.com",
    website: "https://housesupplyandco.com/",
    byAppointment: false,
    country: "US"
  },
  {
    name: "DSA Atlanta",
    type: "Sales Rep",
    address: "Atlanta, GA",
    lat: 33.7490,
    lng: -84.3880,
    phone: "404-218-9911",
    email: "steve@dsa-atl.com",
    website: "https://www.dsa-atl.com/",
    byAppointment: true,
    country: "US"
  },
  {
    name: "Electric Fireplaces Depot",
    type: "Online Dealer",
    address: "",
    lat: null,
    lng: null,
    phone: "1-888-957-4010",
    email: "support@electricfireplacesdepot.com",
    website: "https://electricfireplacesdepot.com/",
    byAppointment: false,
    country: "US"
  },
  {
    name: "Milano Smart Living",
    type: "Dealer",
    address: "200 Lexington Ave #103, New York, NY 10016",
    lat: 40.7445,
    lng: -73.9810,
    phone: "212-729-1938",
    email: "info@milanosmartliving.com",
    website: "https://www.milanosmartliving.com/",
    byAppointment: false,
    country: "US"
  },
  {
    name: "Frederick Flameworks",
    type: "Dealer",
    address: "1728 Shookstown Rd, Frederick, MD 21702",
    lat: 39.4443,
    lng: -77.4494,
    phone: "240-663-5263",
    email: "info@flameonfire.com",
    website: "https://frederickflameworks.com/",
    byAppointment: false,
    country: "US"
  },
  {
    name: "Todays Kitchen and Bath",
    type: "Temporary Dealer",
    address: "2476 Nissen Dr, Livermore, CA 94551",
    lat: 37.6819,
    lng: -121.7680,
    phone: "925-523-7114",
    email: "ej@todayskb.com",
    website: "https://www.todayskb.com/",
    byAppointment: false,
    country: "US"
  },
  {
    name: "Natural Stone & Tile",
    type: "Dealer",
    address: "5282 E 65th St, Indianapolis, IN 46220",
    lat: 39.8543,
    lng: -86.0956,
    phone: "317-863-5926",
    email: "lauras@naturalstonetilegallery.com",
    website: "https://naturalstonetile.co/",
    byAppointment: false,
    country: "US"
  },
  {
    name: "Belle Flame - Groupe Belleflamme",
    type: "Dealer",
    address: "175 rue Jean-Adam #100, Saint-Sauveur, QC J0R 1R6",
    lat: 45.9350,
    lng: -74.1697,
    phone: "514-893-1641",
    email: "ventes@belleflamme.ca",
    website: "https://www.belleflamme.ca/en/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Direct Air Systems",
    type: "Dealer",
    address: "162 Bullock Drive Unit 13, Markham, ON L3P 1W2",
    lat: 43.8828,
    lng: -79.2890,
    phone: "416-268-1115",
    email: "info@directairsystems.ca",
    website: "https://directairsystems.ca/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Direct Air Systems",
    type: "Dealer",
    address: "290 Healy Rd, Unit 3, Bolton, ON L7E 1C9",
    lat: 43.8762,
    lng: -79.7352,
    phone: "905-951-8080",
    email: "info@directairsystems.ca",
    website: "https://directairsystems.ca/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Erindale Fireplace",
    type: "Dealer",
    address: "1230 Corporate Dr, Burlington, ON L7L 5R6",
    lat: 43.3460,
    lng: -79.7898,
    phone: "905-847-8907",
    email: "info@erindalefireplace.ca",
    website: "https://www.erindalefireplace.ca/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Fine Line Fireplace",
    type: "Dealer",
    address: "45 Durward Pl, Waterloo, ON N2L 4E5",
    lat: 43.4643,
    lng: -80.5204,
    phone: "519-725-3055",
    email: "info@finelinefireplaces.ca",
    website: "https://www.finelinefireplaces.ca/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Fireplace Junction / Nestie Inc.",
    type: "Dealer",
    address: "132 Cartwright Ave, North York, ON M6A 1V2",
    lat: 43.7054,
    lng: -79.4505,
    phone: "(647) 955-8557",
    email: "info@fireplacejunction.com",
    website: "https://www.fireplacejunction.com/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Fireplace Gallery",
    type: "Dealer",
    address: "1210 Broadhollow Rd, Farmingdale, NY 11735",
    lat: 40.7343,
    lng: -73.4254,
    phone: "631-270-4232",
    email: "fireplacegallerynyc@gmail.com",
    website: "https://fireplacegalleryny.com/",
    byAppointment: false,
    country: "US"
  },
  {
    name: "Forrest Glade Fireplace",
    type: "Dealer",
    address: "11400 Tecumseh Rd E, Windsor, ON N8P 1N3",
    lat: 42.2873,
    lng: -82.9136,
    phone: "519-735-2229",
    email: "info@forestgladefireplaces.com",
    website: "https://forestgladefireplaces.com/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Foyer Universal",
    type: "Dealer",
    address: "8155 Boul. Saint-Laurent, Montr\u00e9al, QC H2P 2M1",
    lat: 45.5399,
    lng: -73.6527,
    phone: "514-382-8222",
    email: "infos@foyeruniversel.ca",
    website: "https://www.foyeruniversel.ca/en/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Frost and Flame",
    type: "Dealer",
    address: "621 Main St, Gorham, ME 04038",
    lat: 43.6795,
    lng: -70.4440,
    phone: "207-856-1000",
    email: "info@frostandflame.com",
    website: "https://frostandflame.com/",
    byAppointment: false,
    country: "US"
  },
  {
    name: "Hearth and Home - Calgary",
    type: "Dealer",
    address: "5740 1a St SW, Calgary, AB T2H 0A6",
    lat: 50.9970,
    lng: -114.0677,
    phone: "403-258-3732",
    email: "info@hearthandhomefireplace.com",
    website: "https://hearthandhomefireplace.com/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Heat Savers",
    type: "Dealer",
    address: "2519 Government St, Victoria, BC V8T 4P6",
    lat: 48.4380,
    lng: -123.3534,
    phone: "250-383-3512",
    email: "info@heatsavers.ca",
    website: "https://heatsavers.ca/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Home Safe Hearth and Chimney Inc.",
    type: "Dealer",
    address: "504 S St Francis Ave, Wichita, KS 67202",
    lat: 37.6858,
    lng: -97.3375,
    phone: "316-265-9828",
    email: "",
    website: "https://homesafeks.com/",
    byAppointment: false,
    country: "US"
  },
  {
    name: "Lux Fireplace",
    type: "Dealer",
    address: "Stuart Center, 1855 Kirschner Rd #183b, Kelowna, BC V1Y 4N7",
    lat: 49.8713,
    lng: -119.4771,
    phone: "778-821-3473",
    email: "don@luxfireplaces.ca",
    website: "https://luxfireplaces.ca/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Mainland Fireplaces",
    type: "Dealer",
    address: "20771 Langley Bypass #201, Langley, BC V3A 5E8",
    lat: 49.1042,
    lng: -122.6604,
    phone: "604-533-2198",
    email: "info@mainlandfireplaces.com",
    website: "https://www.mainlandfireplaces.com/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Maxwell Fireplace",
    type: "Dealer",
    address: "1380 Pemberton Ave, North Vancouver, BC V7P 2R7",
    lat: 49.3178,
    lng: -123.0669,
    phone: "604-987-1293",
    email: "info@maxwellfireplace.ca",
    website: "https://www.maxwellfireplace.ca/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "MHC Home Comfort",
    type: "Dealer",
    address: "44 Dundas St W, Mississauga, ON L5B 1H3",
    lat: 43.5890,
    lng: -79.6441,
    phone: "905-615-0880",
    email: "info@mhchomecomfort.com",
    website: "https://mhchomecomfort.com/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Muskoka Stone",
    type: "Dealer",
    address: "721 Manitoba St, Bracebridge, ON P1L 1B3",
    lat: 44.9960,
    lng: -79.3130,
    phone: "705-645-7528",
    email: "sales@muskokastoneandhearth.com",
    website: "https://www.muskokastoneandhearth.com/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Napert Quebec",
    type: "Dealer",
    address: "1078 Bd Vachon N, Sainte-Marie, QC G6E 1M7",
    lat: 46.4452,
    lng: -71.0266,
    phone: "418-387-8488",
    email: "patrick@groupenapert.com",
    website: "https://groupenapert.com/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Norea Foyer Montreal",
    type: "Dealer",
    address: "950 Rue B\u00e9gin, Saint-Laurent, QC H4R 1V4",
    lat: 45.5026,
    lng: -73.7010,
    phone: "514-254-4131",
    email: "wwhite@noreafoyersgm.com",
    website: "https://noreafoyersgm.com/en/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Odyssey Fireplace",
    type: "Dealer",
    address: "3-11 Steinway Blvd, Etobicoke, ON M9W 6S9",
    lat: 43.6721,
    lng: -79.5862,
    phone: "416-213-1888",
    email: "info@odysseyfireplaces.com",
    website: "https://www.odysseyfireplaces.com/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Ontario Hearth",
    type: "Dealer",
    address: "3425 Laird Rd Unit 2, Mississauga, ON L5L 5R8",
    lat: 43.5393,
    lng: -79.6787,
    phone: "905-569-2404",
    email: "info@ontariohearth.com",
    website: "https://www.ontariohearth.com/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Real Lighting and Fireplace",
    type: "Dealer",
    address: "12824 Anvil Way #101/102, Surrey, BC V3W 8E7",
    lat: 49.1396,
    lng: -122.8320,
    phone: "604-593-5393",
    email: "info@realfireplace.ca",
    website: "https://realfireplace.ca/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Texas Flameworks",
    type: "Dealer",
    address: "2408 Mare Road, Carrollton, TX 75010",
    lat: 33.0365,
    lng: -96.8903,
    phone: "214-551-7714",
    email: "texasflameworks@gmail.com",
    website: "https://www.facebook.com/61578313613190/",
    byAppointment: false,
    country: "US"
  },
  {
    name: "Toronto Home Comfort",
    type: "Dealer",
    address: "70 Don Park Rd Unit 11, Markham, ON L3R 1G4",
    lat: 43.8396,
    lng: -79.3618,
    phone: "416-755-8624",
    email: "info@torontohomecomfort.com",
    website: "https://torontohomecomfort.com/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Urban Fireplace",
    type: "Dealer",
    address: "328-17 Fawcett Rd, Coquitlam, BC V3K 6V2",
    lat: 49.2395,
    lng: -122.8558,
    phone: "604-424-8300",
    email: "info@urbanfp.ca",
    website: "https://urbanfp.ca/",
    byAppointment: false,
    country: "CA"
  },
  {
    name: "Zoroast The Fireplace Store",
    type: "Dealer",
    address: "Unit 2, 535 Millway Avenue, Concord, ON",
    lat: 43.7984,
    lng: -79.4902,
    phone: "416-899-9998",
    email: "info@thefireplacestore.ca",
    website: "https://www.thefireplacestore.ca/",
    byAppointment: false,
    country: "CA"
  }
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAP & UI LOGIC — no need to edit below this line
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let map, markers = [], activeCard = null;

  // ── Custom red marker icon ──
  function createMarkerIcon(isActive) {
    const color = isActive ? '#e8a838' : '#c0392b';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="6" fill="#fff" opacity="0.9"/>
    </svg>`;
    return L.divIcon({
      html: svg,
      className: 'dl-marker',
      iconSize: [28, 40],
      iconAnchor: [14, 40],
      popupAnchor: [0, -36]
    });
  }

  // ── Initialize map ──
  function initMap() {
    map = L.map('dealer-map', {
      center: [44, -90],
      zoom: 4,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    DEALERS.forEach(function (dealer, i) {
      if (dealer.lat == null || dealer.lng == null) return;
      var marker = L.marker([dealer.lat, dealer.lng], { icon: createMarkerIcon(false) });
      marker._dealerIndex = i;
      marker.bindPopup(buildPopupHTML(dealer));
      marker.on('click', function () { highlightCard(i); });
      marker.addTo(map);
      markers.push({ marker: marker, index: i });
    });
  }

  // ── Popup HTML ──
  function buildPopupHTML(d) {
    var h = '<div class="dl-popup">';
    h += '<strong>' + esc(d.name) + '</strong>';
    if (d.type) h += '<span class="dl-popup-type">' + esc(d.type) + '</span>';
    if (d.address) h += '<p>' + esc(d.address) + '</p>';
    if (d.phone) h += '<p><a href="tel:' + esc(d.phone) + '">' + esc(d.phone) + '</a></p>';
    if (d.website) h += '<p><a href="' + esc(d.website) + '" target="_blank" rel="noopener">Visit Website</a></p>';
    h += '</div>';
    return h;
  }

  function esc(s) {
    var el = document.createElement('span');
    el.textContent = s;
    return el.innerHTML;
  }

  // ── Render dealer cards ──
  function renderCards(filtered) {
    var list = document.getElementById('dealer-list');
    if (!list) return;
    list.innerHTML = '';

    if (filtered.length === 0) {
      list.innerHTML = '<div class="dl-empty">No dealers match your search.</div>';
      return;
    }

    filtered.forEach(function (item) {
      var d = item.dealer;
      var i = item.index;
      var card = document.createElement('div');
      card.className = 'dl-card';
      card.setAttribute('data-index', i);

      var badges = '<div class="dl-card-badges">';
      badges += '<span class="dl-badge dl-badge-' + slugify(d.type) + '">' + esc(d.type) + '</span>';
      if (d.byAppointment) badges += '<span class="dl-badge dl-badge-appt">By Appointment</span>';
      if (d.country) badges += '<span class="dl-badge dl-badge-country">' + (d.country === 'CA' ? 'Canada' : 'USA') + '</span>';
      badges += '</div>';

      var info = '<div class="dl-card-info">';
      if (d.address) info += '<p class="dl-card-address">' + esc(d.address) + '</p>';
      if (d.phone) info += '<p class="dl-card-phone"><a href="tel:' + esc(d.phone) + '">' + esc(d.phone) + '</a></p>';
      if (d.email) info += '<p class="dl-card-email"><a href="mailto:' + esc(d.email) + '">' + esc(d.email) + '</a></p>';
      info += '</div>';

      var actions = '<div class="dl-card-actions">';
      if (d.website) actions += '<a href="' + esc(d.website) + '" target="_blank" rel="noopener" class="dl-card-link">Visit Website</a>';
      if (d.lat != null && d.lng != null) {
        actions += '<a href="https://www.google.com/maps/dir/?api=1&destination=' + d.lat + ',' + d.lng + '" target="_blank" rel="noopener" class="dl-card-link dl-card-directions">Get Directions</a>';
      }
      actions += '</div>';

      card.innerHTML = '<h3 class="dl-card-name">' + esc(d.name) + '</h3>' + badges + info + actions;

      if (d.lat != null && d.lng != null) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function (e) {
          if (e.target.tagName === 'A') return;
          panToDealer(i);
        });
      }

      list.appendChild(card);
    });

    updateCount(filtered.length);
  }

  function slugify(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function updateCount(n) {
    var el = document.getElementById('dealer-count');
    if (el) el.textContent = n + ' dealer' + (n !== 1 ? 's' : '') + ' found';
  }

  // ── Pan to dealer on map ──
  function panToDealer(index) {
    var d = DEALERS[index];
    if (!d || d.lat == null) return;
    map.flyTo([d.lat, d.lng], 12, { duration: 0.8 });
    markers.forEach(function (m) {
      if (m.index === index) {
        m.marker.setIcon(createMarkerIcon(true));
        m.marker.openPopup();
      } else {
        m.marker.setIcon(createMarkerIcon(false));
      }
    });
    highlightCard(index);
  }

  function highlightCard(index) {
    if (activeCard) activeCard.classList.remove('dl-card-active');
    var card = document.querySelector('.dl-card[data-index="' + index + '"]');
    if (card) {
      card.classList.add('dl-card-active');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      activeCard = card;
    }
  }

  // ── Search & filter ──
  function getFiltered() {
    var query = (document.getElementById('dealer-search') || {}).value || '';
    query = query.toLowerCase().trim();
    var typeFilter = (document.getElementById('dealer-type-filter') || {}).value || 'all';
    var countryFilter = (document.getElementById('dealer-country-filter') || {}).value || 'all';

    var results = [];
    DEALERS.forEach(function (d, i) {
      if (typeFilter !== 'all' && d.type !== typeFilter) return;
      if (countryFilter !== 'all' && d.country !== countryFilter) return;
      if (query) {
        var haystack = (d.name + ' ' + d.address + ' ' + d.type).toLowerCase();
        if (haystack.indexOf(query) === -1) return;
      }
      results.push({ dealer: d, index: i });
    });
    return results;
  }

  function applyFilters() {
    var filtered = getFiltered();
    renderCards(filtered);

    // Show/hide markers
    var visibleIndices = {};
    filtered.forEach(function (item) { visibleIndices[item.index] = true; });
    markers.forEach(function (m) {
      if (visibleIndices[m.index]) {
        if (!map.hasLayer(m.marker)) m.marker.addTo(map);
      } else {
        if (map.hasLayer(m.marker)) map.removeLayer(m.marker);
      }
    });

    // Fit bounds to visible markers
    var visible = markers.filter(function (m) { return visibleIndices[m.index]; });
    if (visible.length > 0) {
      var group = L.featureGroup(visible.map(function (m) { return m.marker; }));
      map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 12 });
    }
  }

  // ── Admin panel ──
  function initAdmin() {
    var params = new URLSearchParams(window.location.search);
    if (!params.has('admin')) return;

    var panel = document.getElementById('admin-panel');
    if (!panel) return;
    panel.style.display = 'block';

    document.getElementById('admin-export').addEventListener('click', function () {
      var json = JSON.stringify(DEALERS, null, 2);
      var code = 'const DEALERS = ' + json + ';';
      var ta = document.getElementById('admin-output');
      ta.value = code;
      ta.style.display = 'block';
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* user can copy manually */ }
    });
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', function () {
    initMap();
    applyFilters();

    var searchInput = document.getElementById('dealer-search');
    var typeFilter = document.getElementById('dealer-type-filter');
    var countryFilter = document.getElementById('dealer-country-filter');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
    if (countryFilter) countryFilter.addEventListener('change', applyFilters);

    initAdmin();
  });
})();
