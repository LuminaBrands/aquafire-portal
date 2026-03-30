/* ── Dealer Locator ── */

// Dealer data: [name, type(0=showroom,1=installer,2=partner), address, city, state, zip, phone, lat, lng]
var DEALER_RAW = [
  ["Flame & Stone Design Studio",0,"142 Madison Ave","New York","NY","10016","(212) 555-0184",40.7484,-73.9857],
  ["Northeast Fireplace Pros",1,"85 Industrial Pkwy","Hartford","CT","06103","(860) 555-0291",41.7658,-72.6734],
  ["Boston Hearth & Home",0,"310 Newbury St","Boston","MA","02115","(617) 555-0342",42.3491,-71.0870],
  ["Tri-State Fire Installations",1,"22 Commerce Blvd","Newark","NJ","07102","(973) 555-0418",40.7357,-74.1724],
  ["Philly Fireplace Co.",2,"1800 Market St","Philadelphia","PA","19103","(215) 555-0523",39.9526,-75.1652],
  ["Southern Flame Gallery",0,"456 Peachtree Rd NE","Atlanta","GA","30308","(404) 555-0637",33.7734,-84.3830],
  ["Coastal Fire & Design",0,"2100 N Ocean Blvd","Fort Lauderdale","FL","33305","(954) 555-0748",26.1501,-80.1096],
  ["Miami Luxury Fireplaces",0,"8500 NW 25th St","Miami","FL","33122","(305) 555-0856",25.7907,-80.3184],
  ["Carolina Custom Hearth",1,"700 S Tryon St","Charlotte","NC","28202","(704) 555-0912",35.2209,-80.8455],
  ["Magnolia Fireplace Works",2,"520 Royal St","Nashville","TN","37203","(615) 555-1034",36.1543,-86.7845],
  ["Heartland Fire & Stone",0,"1200 N Michigan Ave","Chicago","IL","60611","(312) 555-1145",41.8966,-87.6243],
  ["Motor City Fireplaces",1,"3300 Woodward Ave","Detroit","MI","48201","(313) 555-1256",42.3461,-83.0565],
  ["Twin Cities Hearth Co.",2,"901 Hennepin Ave","Minneapolis","MN","55403","(612) 555-1367",44.9753,-93.2760],
  ["Buckeye Fire Design",1,"150 E Broad St","Columbus","OH","43215","(614) 555-1478",39.9612,-82.9988],
  ["Gateway Flame Studio",0,"800 Washington Ave","St. Louis","MO","63101","(314) 555-1589",38.6303,-90.1975],
  ["Desert Modern Fireplaces",0,"7000 E Camelback Rd","Scottsdale","AZ","85251","(480) 555-1690",33.5092,-111.9280],
  ["Lone Star Fire & Design",0,"4500 McKinney Ave","Dallas","TX","75205","(214) 555-1801",32.8107,-96.7969],
  ["Austin Hearth Collective",2,"1100 S Congress Ave","Austin","TX","78704","(512) 555-1912",30.2502,-97.7487],
  ["Houston Fire Gallery",0,"2800 Kirby Dr","Houston","TX","77098","(713) 555-2023",29.7371,-95.4218],
  ["Santa Fe Flame Artisans",1,"65 E San Francisco St","Santa Fe","NM","87501","(505) 555-2134",35.6870,-105.9378],
  ["Pacific Fire Studio",0,"8800 Beverly Blvd","Los Angeles","CA","90048","(323) 555-2245",34.0751,-118.3776],
  ["Bay Area Hearth & Home",0,"580 4th St","San Francisco","CA","94107","(415) 555-2356",37.7795,-122.3969],
  ["Cascade Fireplace Co.",1,"1400 NW 14th Ave","Portland","OR","97209","(503) 555-2467",45.5310,-122.6847],
  ["Emerald City Fire Design",0,"200 Westlake Ave N","Seattle","WA","98109","(206) 555-2578",47.6218,-122.3384],
  ["San Diego Flame Works",2,"750 B St","San Diego","CA","92101","(619) 555-2689",32.7157,-117.1638],
  ["Vegas Luxury Fireplaces",0,"3500 Las Vegas Blvd S","Las Vegas","NV","89109","(702) 555-2790",36.1263,-115.1703],
  ["Denver Fire & Design",1,"1600 Champa St","Denver","CO","80202","(303) 555-2891",39.7472,-104.9903],
  ["Salt Lake Hearth Studio",2,"50 W Broadway","Salt Lake City","UT","84101","(801) 555-2990",40.7608,-111.8910]
];

var DEALER_TYPES = ["showroom", "installer", "partner"];
var DEALERS = DEALER_RAW.map(function(r) {
  return { name: r[0], type: DEALER_TYPES[r[1]], address: r[2], city: r[3], state: r[4], zip: r[5], phone: r[6], lat: r[7], lng: r[8] };
});

var MAX_RESULTS = 8;

// ZIP prefix to approximate lat/lng
var ZIP_COORDS = {
  "100":[40.75,-73.99],"101":[40.75,-73.99],"060":[41.77,-72.67],"061":[41.77,-72.67],
  "021":[42.35,-71.08],"022":[42.35,-71.08],"071":[40.74,-74.17],"070":[40.74,-74.17],
  "191":[39.95,-75.17],"190":[39.95,-75.17],"303":[33.77,-84.38],"300":[33.77,-84.38],
  "333":[26.15,-80.11],"331":[25.79,-80.32],"282":[35.22,-80.85],"372":[36.15,-86.78],
  "606":[41.90,-87.62],"482":[42.35,-83.06],"554":[44.98,-93.28],"432":[39.96,-83.00],
  "631":[38.63,-90.20],"852":[33.51,-111.93],"752":[32.81,-96.80],"787":[30.25,-97.75],
  "770":[29.74,-95.42],"875":[35.69,-105.94],"900":[34.08,-118.38],"941":[37.78,-122.40],
  "972":[45.53,-122.68],"981":[47.62,-122.34],"921":[32.72,-117.16],"891":[36.13,-115.17],
  "802":[39.75,-104.99],"841":[40.76,-111.89],
  "0":[42.0,-72.0],"1":[41.0,-74.0],"2":[38.0,-78.0],"3":[33.0,-84.0],
  "4":[41.0,-83.0],"5":[44.0,-93.0],"6":[40.0,-90.0],"7":[32.0,-97.0],
  "8":[35.0,-110.0],"9":[38.0,-120.0]
};

// Build city lookup from dealer locations
var CITY_COORDS = {};
DEALERS.forEach(function(d) {
  CITY_COORDS[d.city.toLowerCase()] = [d.lat, d.lng];
  CITY_COORDS[(d.city + " " + d.state).toLowerCase()] = [d.lat, d.lng];
});


// ── Geo Utilities ──

function getCoords(query) {
  query = query.trim();
  if (/^\d{3,5}$/.test(query)) {
    var z5 = query.padEnd(5, "0");
    return ZIP_COORDS[z5.substring(0, 3)] || ZIP_COORDS[z5.substring(0, 1)] || null;
  }
  var lower = query.toLowerCase();
  var keys = Object.keys(CITY_COORDS);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].indexOf(lower) !== -1 || lower.indexOf(keys[i]) !== -1) {
      return CITY_COORDS[keys[i]];
    }
  }
  return null;
}

function haversine(lat1, lng1, lat2, lng2) {
  var R = 3959;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLng = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


// ── Search Functions ──

function searchByName(query) {
  var lower = query.toLowerCase();
  var matches = DEALERS.filter(function(d) {
    return d.name.toLowerCase().indexOf(lower) !== -1 ||
      d.city.toLowerCase().indexOf(lower) !== -1 ||
      d.state.toLowerCase() === lower;
  });
  if (matches.length === 0) return null;
  return { results: matches.slice(0, MAX_RESULTS), center: [matches[0].lat, matches[0].lng], total: matches.length };
}

function searchByLocation(coords) {
  var results = DEALERS.map(function(d) {
    var dist = haversine(coords[0], coords[1], d.lat, d.lng);
    return { name: d.name, type: d.type, address: d.address, city: d.city, state: d.state, zip: d.zip, phone: d.phone, lat: d.lat, lng: d.lng, distance: dist };
  });
  results.sort(function(a, b) { return a.distance - b.distance; });
  return { results: results.slice(0, MAX_RESULTS), center: coords, total: results.length };
}

function showAllDealers() {
  var center = [39.5, -98.35]; // center of US
  return { results: DEALERS.slice(), center: center, total: DEALERS.length, showAll: true };
}


// ── SVG Map Rendering ──

function svgPin(cx, cy, size, isActive) {
  var s = size;
  var path = 'M ' + cx + ' ' + (cy + s) +
    ' C ' + (cx - s * 0.6) + ' ' + (cy + s * 0.2) + ', ' +
    (cx - s * 0.8) + ' ' + (cy - s * 0.3) + ', ' +
    cx + ' ' + (cy - s * 0.8) +
    ' C ' + (cx + s * 0.8) + ' ' + (cy - s * 0.3) + ', ' +
    (cx + s * 0.6) + ' ' + (cy + s * 0.2) + ', ' +
    cx + ' ' + (cy + s) + ' Z';
  var fill = isActive ? '#c0392b' : '#a93226';
  var glow = isActive ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + (s + 10) + '" fill="#c0392b" opacity="0.15"/>' : '';
  return glow +
    '<path d="' + path + '" fill="' + fill + '" stroke="#121417" stroke-width="1.5" style="cursor:pointer;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.4))"/>' +
    '<circle cx="' + cx + '" cy="' + (cy - s * 0.15) + '" r="' + (s * 0.25) + '" fill="#fff" opacity="0.9"/>';
}

function createMapSVG(dealers, center, activeIndex, isWide) {
  var mapW = 800, mapH = 500;
  var zoomRange = isWide ? 18 : 3;
  var lonMin = center[1] - zoomRange * 1.4;
  var lonMax = center[1] + zoomRange * 1.4;
  var latMin = center[0] - zoomRange;
  var latMax = center[0] + zoomRange;

  function project(lat, lng) {
    var x = ((lng - lonMin) / (lonMax - lonMin)) * mapW;
    var latRad = lat * Math.PI / 180;
    var mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    var latMinRad = latMin * Math.PI / 180;
    var latMaxRad = latMax * Math.PI / 180;
    var mercMin = Math.log(Math.tan(Math.PI / 4 + latMinRad / 2));
    var mercMax = Math.log(Math.tan(Math.PI / 4 + latMaxRad / 2));
    var y = mapH - ((mercN - mercMin) / (mercMax - mercMin)) * mapH;
    return [x, y];
  }

  // Grid lines
  var gridStep = isWide ? 5 : 1;
  var grid = '';
  for (var gLat = Math.ceil(latMin / gridStep) * gridStep; gLat <= Math.floor(latMax); gLat += gridStep) {
    var p1 = project(gLat, lonMin), p2 = project(gLat, lonMax);
    grid += '<line x1="' + p1[0] + '" y1="' + p1[1] + '" x2="' + p2[0] + '" y2="' + p2[1] + '" stroke="#2c3038" stroke-width="0.5" stroke-dasharray="4,6"/>';
  }
  for (var gLon = Math.ceil(lonMin / gridStep) * gridStep; gLon <= Math.floor(lonMax); gLon += gridStep) {
    var q1 = project(latMin, gLon), q2 = project(latMax, gLon);
    grid += '<line x1="' + q1[0] + '" y1="' + q1[1] + '" x2="' + q2[0] + '" y2="' + q2[1] + '" stroke="#2c3038" stroke-width="0.5" stroke-dasharray="4,6"/>';
  }

  // Center marker (only in zoomed/search view)
  var centerMarker = '';
  if (!isWide) {
    var cp = project(center[0], center[1]);
    var ringR = (mapW / (zoomRange * 2.8)) * 1.5;
    centerMarker =
      '<circle cx="' + cp[0] + '" cy="' + cp[1] + '" r="' + ringR + '" fill="none" stroke="rgba(192,57,43,0.15)" stroke-width="1.5"/>' +
      '<circle cx="' + cp[0] + '" cy="' + cp[1] + '" r="6" fill="none" stroke="#c0392b" stroke-width="2" stroke-dasharray="3,3"/>' +
      '<circle cx="' + cp[0] + '" cy="' + cp[1] + '" r="2.5" fill="#c0392b"/>' +
      '<text x="' + (cp[0] + 10) + '" y="' + (cp[1] - 10) + '" fill="#878c99" font-size="10" font-family="Inter,sans-serif">Your location</text>';
  }

  // Render pins (active one last, on top)
  var pinsBehind = '';
  var pinFront = '';
  dealers.forEach(function(d, i) {
    var pt = project(d.lat, d.lng);
    // Skip pins that are outside the viewBox
    if (pt[0] < -30 || pt[0] > mapW + 30 || pt[1] < -30 || pt[1] > mapH + 30) return;
    var isActive = (i === activeIndex);
    var pinSize = isActive ? 18 : (isWide ? 10 : 13);
    var pin = '<g class="map-pin' + (isActive ? ' active' : '') + '" data-index="' + i + '">' +
      svgPin(pt[0], pt[1], pinSize, isActive);
    if (isActive) {
      pin += '<text x="' + pt[0] + '" y="' + (pt[1] - pinSize - 8) + '" text-anchor="middle" fill="#e4e5e9" font-size="11" font-weight="600" font-family="Inter,sans-serif">' + d.name + '</text>';
    }
    pin += '</g>';
    if (isActive) {
      pinFront = pin;
    } else {
      pinsBehind += pin;
    }
  });

  return '<svg viewBox="0 0 ' + mapW + ' ' + mapH + '" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="' + mapW + '" height="' + mapH + '" fill="#1b1e24"/>' +
    grid + centerMarker + pinsBehind + pinFront +
    '</svg>';
}


// ── State & Rendering ──

var currentResults = null;
var activeCardIndex = -1;
var currentCenter = null;
var isShowingAll = false;

function renderResults(data) {
  currentResults = data;
  activeCardIndex = -1;
  isShowingAll = !!data.showAll;

  var container = document.getElementById('dealer-content');
  if (!container) { console.error('dealer-content not found'); return; }

  if (!data || data.results.length === 0) {
    container.innerHTML =
      '<div class="dealer-empty">' +
      '<span class="empty-icon">&#x1f50d;</span>' +
      '<h3>No dealers found</h3>' +
      '<p>Try a different ZIP code, city, or dealer name.</p>' +
      '</div>';
    return;
  }

  var results = data.results;
  var center = data.center;

  // Build cards
  var cards = '';
  results.forEach(function(d, i) {
    var distText = (d.distance != null && !data.showAll) ? d.distance.toFixed(1) + ' mi' : d.city + ', ' + d.state;
    var phoneDigits = d.phone.replace(/[^0-9]/g, '');
    var dirUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(d.address + ', ' + d.city + ', ' + d.state + ' ' + d.zip);
    cards +=
      '<div class="dealer-card" data-index="' + i + '">' +
      '<div class="dealer-name">' + d.name + '</div>' +
      '<span class="dealer-type ' + d.type + '">' + d.type + '</span>' +
      '<div class="dealer-address">' + d.address + '<br>' + d.city + ', ' + d.state + ' ' + d.zip + '</div>' +
      '<div class="dealer-meta">' +
      '<span class="dealer-distance">' + distText + '</span>' +
      '<span class="dealer-phone"><a href="tel:' + phoneDigits + '">' + d.phone + '</a></span>' +
      '<span class="dealer-directions"><a href="' + dirUrl + '" target="_blank" rel="noopener">Directions &rarr;</a></span>' +
      '</div>' +
      '</div>';
  });

  var countText;
  if (data.showAll) {
    countText = data.results.length + ' dealers across the US';
  } else if (data.total > results.length) {
    countText = results.length + ' nearest of ' + data.total + ' dealers';
  } else {
    countText = results.length + ' dealer' + (results.length !== 1 ? 's' : '') + ' found';
  }

  var mapSVG = createMapSVG(results, center, -1, !!data.showAll);

  container.innerHTML =
    '<div class="dealer-layout">' +
    '<div class="results-panel">' +
    '<div class="results-count">' + countText + '</div>' +
    cards +
    '</div>' +
    '<div class="map-panel">' +
    '<div class="map-container" id="map-container">' + mapSVG + '</div>' +
    '</div>' +
    '</div>';

  // Bind click events on cards and pins
  bindCardClicks();
  bindMapPins();
}

function bindCardClicks() {
  var cards = document.querySelectorAll('.dealer-card[data-index]');
  for (var i = 0; i < cards.length; i++) {
    (function(card) {
      card.addEventListener('click', function() {
        setActiveCard(parseInt(card.getAttribute('data-index'), 10));
      });
    })(cards[i]);
  }
}

function bindMapPins() {
  var pins = document.querySelectorAll('.map-pin[data-index]');
  for (var i = 0; i < pins.length; i++) {
    (function(pin) {
      pin.addEventListener('click', function(e) {
        e.stopPropagation();
        setActiveCard(parseInt(pin.getAttribute('data-index'), 10));
      });
    })(pins[i]);
  }
}

function setActiveCard(index) {
  if (!currentResults) return;
  activeCardIndex = index;

  // Highlight active card
  var cards = document.querySelectorAll('.dealer-card[data-index]');
  for (var i = 0; i < cards.length; i++) {
    if (parseInt(cards[i].getAttribute('data-index'), 10) === index) {
      cards[i].classList.add('active');
      cards[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      cards[i].classList.remove('active');
    }
  }

  // Re-render map with active pin
  var mapContainer = document.getElementById('map-container');
  if (mapContainer && currentResults) {
    // When clicking a card in "show all" mode, zoom into that dealer's area
    var mapCenter = currentResults.center;
    var wide = isShowingAll;
    if (isShowingAll && currentResults.results[index]) {
      var d = currentResults.results[index];
      mapCenter = [d.lat, d.lng];
      wide = false;
    }
    mapContainer.innerHTML = createMapSVG(currentResults.results, mapCenter, index, wide);
    bindMapPins();
  }
}


// ── Main Search ──

function doSearch(coordsOverride) {
  var coords = coordsOverride || null;
  var inputEl = document.getElementById('zip-input');
  var query = inputEl ? inputEl.value.trim() : '';

  // Direct coordinates (geolocation)
  if (coords) {
    currentCenter = coords;
    renderResults(searchByLocation(coords));
    return;
  }

  // Empty query — show all
  if (!query) {
    renderResults(showAllDealers());
    return;
  }

  // Try ZIP/city location search
  coords = getCoords(query);
  if (coords) {
    currentCenter = coords;
    renderResults(searchByLocation(coords));
    return;
  }

  // Try name/city text search
  var nameResults = searchByName(query);
  if (nameResults) {
    currentCenter = nameResults.center;
    renderResults(nameResults);
    return;
  }

  // No results
  var container = document.getElementById('dealer-content');
  if (container) {
    container.innerHTML =
      '<div class="dealer-empty">' +
      '<span class="empty-icon">&#x1f50d;</span>' +
      '<h3>No results found</h3>' +
      '<p>Try a US ZIP code, city name, or dealer name.</p>' +
      '</div>';
  }
}


// ── Geolocation ──

function requestGeolocation() {
  if (!navigator.geolocation) return;
  var btn = document.getElementById('locate-btn');
  var input = document.getElementById('zip-input');
  if (btn) { btn.textContent = 'Locating...'; btn.disabled = true; }

  navigator.geolocation.getCurrentPosition(
    function(pos) {
      if (input) input.value = 'My Location';
      if (btn) { btn.textContent = 'Use My Location'; btn.disabled = false; }
      doSearch([pos.coords.latitude, pos.coords.longitude]);
    },
    function() {
      if (btn) { btn.textContent = 'Use My Location'; btn.disabled = false; }
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}


// ── Initialize ──

function initDealerLocator() {
  var searchBtn = document.getElementById('search-btn');
  var zipInput = document.getElementById('zip-input');
  var locateBtn = document.getElementById('locate-btn');

  if (searchBtn) {
    searchBtn.addEventListener('click', function() { doSearch(); });
  }
  if (zipInput) {
    zipInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') doSearch();
    });
  }
  if (locateBtn) {
    locateBtn.addEventListener('click', function() { requestGeolocation(); });
  }

  // Show all dealers on initial load
  renderResults(showAllDealers());

  // Try geolocation after a short delay
  setTimeout(function() {
    if (navigator.geolocation) requestGeolocation();
  }, 800);
}

// Nav toggle (shared pattern)
var toggle = document.querySelector('.nav-toggle');
var navLinks = document.querySelector('.nav-links');
if (toggle && navLinks) {
  toggle.addEventListener('click', function() {
    var open = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDealerLocator);
} else {
  initDealerLocator();
}
