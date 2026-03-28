/* ── Dealer Locator App ── */

// Dealer database — each entry has name, type, address, city, state, zip, phone, lat, lng
const DEALERS = [
  // Northeast
  { name: "Flame & Stone Design Studio", type: "showroom", address: "142 Madison Ave", city: "New York", state: "NY", zip: "10016", phone: "(212) 555-0184", lat: 40.7484, lng: -73.9857 },
  { name: "Northeast Fireplace Pros", type: "installer", address: "85 Industrial Pkwy", city: "Hartford", state: "CT", zip: "06103", phone: "(860) 555-0291", lat: 41.7658, lng: -72.6734 },
  { name: "Boston Hearth & Home", type: "showroom", address: "310 Newbury St", city: "Boston", state: "MA", zip: "02115", phone: "(617) 555-0342", lat: 42.3491, lng: -71.0870 },
  { name: "Tri-State Fire Installations", type: "installer", address: "22 Commerce Blvd", city: "Newark", state: "NJ", zip: "07102", phone: "(973) 555-0418", lat: 40.7357, lng: -74.1724 },
  { name: "Philly Fireplace Co.", type: "partner", address: "1800 Market St", city: "Philadelphia", state: "PA", zip: "19103", phone: "(215) 555-0523", lat: 39.9526, lng: -75.1652 },

  // Southeast
  { name: "Southern Flame Gallery", type: "showroom", address: "456 Peachtree Rd NE", city: "Atlanta", state: "GA", zip: "30308", phone: "(404) 555-0637", lat: 33.7734, lng: -84.3830 },
  { name: "Coastal Fire & Design", type: "showroom", address: "2100 N Ocean Blvd", city: "Fort Lauderdale", state: "FL", zip: "33305", phone: "(954) 555-0748", lat: 26.1501, lng: -80.1096 },
  { name: "Miami Luxury Fireplaces", type: "showroom", address: "8500 NW 25th St", city: "Miami", state: "FL", zip: "33122", phone: "(305) 555-0856", lat: 25.7907, lng: -80.3184 },
  { name: "Carolina Custom Hearth", type: "installer", address: "700 S Tryon St", city: "Charlotte", state: "NC", zip: "28202", phone: "(704) 555-0912", lat: 35.2209, lng: -80.8455 },
  { name: "Magnolia Fireplace Works", type: "partner", address: "520 Royal St", city: "Nashville", state: "TN", zip: "37203", phone: "(615) 555-1034", lat: 36.1543, lng: -86.7845 },

  // Midwest
  { name: "Heartland Fire & Stone", type: "showroom", address: "1200 N Michigan Ave", city: "Chicago", state: "IL", zip: "60611", phone: "(312) 555-1145", lat: 41.8966, lng: -87.6243 },
  { name: "Motor City Fireplaces", type: "installer", address: "3300 Woodward Ave", city: "Detroit", state: "MI", zip: "48201", phone: "(313) 555-1256", lat: 42.3461, lng: -83.0565 },
  { name: "Twin Cities Hearth Co.", type: "partner", address: "901 Hennepin Ave", city: "Minneapolis", state: "MN", zip: "55403", phone: "(612) 555-1367", lat: 44.9753, lng: -93.2760 },
  { name: "Buckeye Fire Design", type: "installer", address: "150 E Broad St", city: "Columbus", state: "OH", zip: "43215", phone: "(614) 555-1478", lat: 39.9612, lng: -82.9988 },
  { name: "Gateway Flame Studio", type: "showroom", address: "800 Washington Ave", city: "St. Louis", state: "MO", zip: "63101", phone: "(314) 555-1589", lat: 38.6303, lng: -90.1975 },

  // Southwest
  { name: "Desert Modern Fireplaces", type: "showroom", address: "7000 E Camelback Rd", city: "Scottsdale", state: "AZ", zip: "85251", phone: "(480) 555-1690", lat: 33.5092, lng: -111.9280 },
  { name: "Lone Star Fire & Design", type: "showroom", address: "4500 McKinney Ave", city: "Dallas", state: "TX", zip: "75205", phone: "(214) 555-1801", lat: 32.8107, lng: -96.7969 },
  { name: "Austin Hearth Collective", type: "partner", address: "1100 S Congress Ave", city: "Austin", state: "TX", zip: "78704", phone: "(512) 555-1912", lat: 30.2502, lng: -97.7487 },
  { name: "Houston Fire Gallery", type: "showroom", address: "2800 Kirby Dr", city: "Houston", state: "TX", zip: "77098", phone: "(713) 555-2023", lat: 29.7371, lng: -95.4218 },
  { name: "Santa Fe Flame Artisans", type: "installer", address: "65 E San Francisco St", city: "Santa Fe", state: "NM", zip: "87501", phone: "(505) 555-2134", lat: 35.6870, lng: -105.9378 },

  // West Coast
  { name: "Pacific Fire Studio", type: "showroom", address: "8800 Beverly Blvd", city: "Los Angeles", state: "CA", zip: "90048", phone: "(323) 555-2245", lat: 34.0751, lng: -118.3776 },
  { name: "Bay Area Hearth & Home", type: "showroom", address: "580 4th St", city: "San Francisco", state: "CA", zip: "94107", phone: "(415) 555-2356", lat: 37.7795, lng: -122.3969 },
  { name: "Cascade Fireplace Co.", type: "installer", address: "1400 NW 14th Ave", city: "Portland", state: "OR", zip: "97209", phone: "(503) 555-2467", lat: 45.5310, lng: -122.6847 },
  { name: "Emerald City Fire Design", type: "showroom", address: "200 Westlake Ave N", city: "Seattle", state: "WA", zip: "98109", phone: "(206) 555-2578", lat: 47.6218, lng: -122.3384 },
  { name: "San Diego Flame Works", type: "partner", address: "750 B St", city: "San Diego", state: "CA", zip: "92101", phone: "(619) 555-2689", lat: 32.7157, lng: -117.1638 },
  { name: "Vegas Luxury Fireplaces", type: "showroom", address: "3500 Las Vegas Blvd S", city: "Las Vegas", state: "NV", zip: "89109", phone: "(702) 555-2790", lat: 36.1263, lng: -115.1703 },
  { name: "Denver Fire & Design", type: "installer", address: "1600 Champa St", city: "Denver", state: "CO", zip: "80202", phone: "(303) 555-2891", lat: 39.7472, lng: -104.9903 },
  { name: "Salt Lake Hearth Studio", type: "partner", address: "50 W Broadway", city: "Salt Lake City", state: "UT", zip: "84101", phone: "(801) 555-2990", lat: 40.7608, lng: -111.8910 },
];

// Approximate ZIP code → lat/lng lookup (first 3 digits)
const ZIP_COORDS = {
  "100": [40.75, -73.99], "101": [40.75, -73.99], "060": [41.77, -72.67], "061": [41.77, -72.67],
  "021": [42.35, -71.08], "022": [42.35, -71.08], "071": [40.74, -74.17], "070": [40.74, -74.17],
  "191": [39.95, -75.17], "190": [39.95, -75.17], "303": [33.77, -84.38], "300": [33.77, -84.38],
  "333": [26.15, -80.11], "331": [25.79, -80.32], "282": [35.22, -80.85], "372": [36.15, -86.78],
  "606": [41.90, -87.62], "482": [42.35, -83.06], "554": [44.98, -93.28], "432": [39.96, -83.00],
  "631": [38.63, -90.20], "852": [33.51, -111.93], "752": [32.81, -96.80], "787": [30.25, -97.75],
  "770": [29.74, -95.42], "875": [35.69, -105.94], "900": [34.08, -118.38], "941": [37.78, -122.40],
  "972": [45.53, -122.68], "981": [47.62, -122.34], "921": [32.72, -117.16], "891": [36.13, -115.17],
  "802": [39.75, -104.99], "841": [40.76, -111.89],
  // Broad regional fallbacks
  "0": [42.0, -72.0], "1": [41.0, -74.0], "2": [38.0, -78.0], "3": [33.0, -84.0],
  "4": [41.0, -83.0], "5": [44.0, -93.0], "6": [40.0, -90.0], "7": [32.0, -97.0],
  "8": [35.0, -110.0], "9": [38.0, -120.0],
};

// City name → approximate coords for city search
const CITY_COORDS = {};
DEALERS.forEach(d => {
  CITY_COORDS[d.city.toLowerCase()] = [d.lat, d.lng];
  CITY_COORDS[(d.city + " " + d.state).toLowerCase()] = [d.lat, d.lng];
});

function getCoords(query) {
  query = query.trim();
  // Check if it looks like a ZIP code
  if (/^\d{3,5}$/.test(query)) {
    const z5 = query.padEnd(5, "0");
    const prefix3 = z5.substring(0, 3);
    const prefix1 = z5.substring(0, 1);
    return ZIP_COORDS[prefix3] || ZIP_COORDS[prefix1] || null;
  }
  // City search
  const lower = query.toLowerCase();
  for (const key of Object.keys(CITY_COORDS)) {
    if (key.includes(lower) || lower.includes(key)) {
      return CITY_COORDS[key];
    }
  }
  return null;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 3959; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function searchDealers(query, filterType) {
  const coords = getCoords(query);
  if (!coords) return null;

  const [lat, lng] = coords;
  let results = DEALERS.map(d => ({
    ...d,
    distance: haversine(lat, lng, d.lat, d.lng)
  }));

  if (filterType && filterType !== "all") {
    results = results.filter(d => d.type === filterType);
  }

  results.sort((a, b) => a.distance - b.distance);
  return { results, center: coords };
}

// ── US Map SVG (simplified state outlines) ──
function createMapSVG(dealers, center, activeIndex) {
  // Mercator projection helpers
  const mapW = 800, mapH = 500;
  const lonMin = -125, lonMax = -66, latMin = 24, latMax = 50;

  function project(lat, lng) {
    const x = ((lng - lonMin) / (lonMax - lonMin)) * mapW;
    const latRad = lat * Math.PI / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const latMinRad = latMin * Math.PI / 180;
    const latMaxRad = latMax * Math.PI / 180;
    const mercMin = Math.log(Math.tan(Math.PI / 4 + latMinRad / 2));
    const mercMax = Math.log(Math.tan(Math.PI / 4 + latMaxRad / 2));
    const y = mapH - ((mercN - mercMin) / (mercMax - mercMin)) * mapH;
    return [x, y];
  }

  // US outline (simplified polygon)
  const usOutline = `M 60,120 L 120,95 180,85 220,80 280,75 320,80 370,75 420,78
    470,85 520,80 560,85 600,90 640,100 680,95 720,90 740,100
    730,130 735,160 740,190 738,220 730,250 720,280 710,310
    700,340 680,360 650,380 620,390 590,395 560,400 530,395
    500,390 470,395 440,400 410,395 380,390 350,380 320,370
    290,380 260,390 230,395 200,390 170,380 140,370 110,355
    90,340 75,320 65,290 60,260 55,230 52,200 55,170 58,140 Z`;

  let pins = "";
  const maxDealers = 10;
  const shown = dealers.slice(0, maxDealers);

  shown.forEach((d, i) => {
    const [px, py] = project(d.lat, d.lng);
    const isActive = i === activeIndex;
    const color = d.type === "showroom" ? "#c0392b" : d.type === "installer" ? "#4da6e8" : "#e8a838";
    const size = isActive ? 10 : 7;
    const glow = isActive ? `<circle cx="${px}" cy="${py}" r="${size + 6}" fill="${color}" opacity="0.2"/>` : "";
    pins += `
      ${glow}
      <circle class="map-pin ${isActive ? 'active' : ''}" data-index="${i}" cx="${px}" cy="${py}" r="${size}"
        fill="${color}" stroke="#121417" stroke-width="2"/>
      ${isActive ? `<text x="${px}" y="${py - 16}" text-anchor="middle" fill="${color}" font-size="11" font-weight="600" font-family="Inter, sans-serif">${d.name}</text>` : ""}
    `;
  });

  // Center marker
  const [cx, cy] = project(center[0], center[1]);

  return `<svg viewBox="0 0 ${mapW} ${mapH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${mapW}" height="${mapH}" fill="#1b1e24"/>
    <path d="${usOutline}" fill="#22262e" stroke="#2c3038" stroke-width="1.5"/>
    <!-- Search center -->
    <circle cx="${cx}" cy="${cy}" r="5" fill="none" stroke="#878c99" stroke-width="2" stroke-dasharray="3,3"/>
    <circle cx="${cx}" cy="${cy}" r="2" fill="#878c99"/>
    ${pins}
  </svg>`;
}

// ── Rendering ──
let currentResults = null;
let activeCardIndex = -1;
let currentFilter = "all";

function renderResults(data) {
  currentResults = data;
  activeCardIndex = -1;
  const container = document.getElementById("dealer-content");

  if (!data || data.results.length === 0) {
    container.innerHTML = `
      <div class="dealer-empty">
        <span class="empty-icon">&#x1f50d;</span>
        <h3>No dealers found</h3>
        <p>We couldn't find any dealers matching your search. Try a different ZIP code or city, or broaden your filter.</p>
      </div>`;
    return;
  }

  const { results, center } = data;

  let cards = results.map((d, i) => `
    <div class="dealer-card" data-index="${i}" onclick="setActiveCard(${i})">
      <div class="dealer-name">${d.name}</div>
      <span class="dealer-type ${d.type}">${d.type}</span>
      <div class="dealer-address">${d.address}<br>${d.city}, ${d.state} ${d.zip}</div>
      <div class="dealer-meta">
        <span class="dealer-distance">${d.distance.toFixed(1)} mi</span>
        <span class="dealer-phone"><a href="tel:${d.phone.replace(/\D/g, '')}">${d.phone}</a></span>
        <span class="dealer-directions"><a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d.address + ', ' + d.city + ', ' + d.state + ' ' + d.zip)}" target="_blank" rel="noopener">Directions &rarr;</a></span>
      </div>
    </div>
  `).join("");

  container.innerHTML = `
    <div class="dealer-layout">
      <div class="results-panel">
        <div class="results-count">${results.length} dealer${results.length !== 1 ? "s" : ""} found</div>
        ${cards}
      </div>
      <div class="map-panel">
        <div class="map-container" id="map-container">
          ${createMapSVG(results, center, -1)}
        </div>
      </div>
    </div>`;

  // Bind map pin clicks
  document.querySelectorAll(".map-pin").forEach(pin => {
    pin.addEventListener("click", () => {
      const idx = parseInt(pin.dataset.index);
      setActiveCard(idx);
    });
  });
}

function setActiveCard(index) {
  if (!currentResults) return;
  activeCardIndex = index;

  // Update card highlights
  document.querySelectorAll(".dealer-card").forEach((card, i) => {
    card.classList.toggle("active", i === index);
  });

  // Scroll card into view
  const activeCard = document.querySelector(`.dealer-card[data-index="${index}"]`);
  activeCard?.scrollIntoView({ behavior: "smooth", block: "nearest" });

  // Re-render map with active pin
  const mapContainer = document.getElementById("map-container");
  if (mapContainer) {
    mapContainer.innerHTML = createMapSVG(currentResults.results, currentResults.center, index);
    // Re-bind pin clicks
    document.querySelectorAll(".map-pin").forEach(pin => {
      pin.addEventListener("click", () => {
        const idx = parseInt(pin.dataset.index);
        setActiveCard(idx);
      });
    });
  }
}

function doSearch() {
  const query = document.getElementById("zip-input").value.trim();
  if (!query) return;
  const data = searchDealers(query, currentFilter);
  renderResults(data);
}

// ── Event Listeners ──
document.getElementById("search-btn").addEventListener("click", doSearch);
document.getElementById("zip-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
});

// Filter chips
document.querySelectorAll(".filter-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilter = chip.dataset.filter;
    // Re-search if we have a query
    const query = document.getElementById("zip-input").value.trim();
    if (query) doSearch();
  });
});
