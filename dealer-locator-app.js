/* ── Dealer Locator with Leaflet Map ── */

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

// City coordinates from dealer locations
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
    return { name: d.name, type: d.type, address: d.address, city: d.city, state: d.state, zip: d.zip, phone: d.phone, lat: d.lat, lng: d.lng, distance: haversine(coords[0], coords[1], d.lat, d.lng) };
  });
  results.sort(function(a, b) { return a.distance - b.distance; });
  return { results: results.slice(0, MAX_RESULTS), center: coords, total: results.length };
}


// ── Leaflet Map ──

var map = null;
var markers = [];
var userMarker = null;
var activeCardIndex = -1;
var currentResults = null;

function createPinSVG(color) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">' +
    '<path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="' + color + '" stroke="#121417" stroke-width="1.5"/>' +
    '<circle cx="14" cy="14" r="5" fill="#fff" opacity="0.9"/>' +
    '</svg>';
}

var PIN_COLORS = {
  showroom: '#c0392b',
  installer: '#4da6e8',
  partner: '#e8a838'
};

function initMap() {
  map = L.map('dealer-map', {
    zoomControl: true,
    scrollWheelZoom: true,
    attributionControl: true
  }).setView([39.5, -98.35], 4);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Add all dealer markers initially
  addDealerMarkers(DEALERS);
  renderCards(DEALERS, false);
}

function addDealerMarkers(dealers) {
  // Clear existing markers
  markers.forEach(function(m) { map.removeLayer(m); });
  markers = [];

  dealers.forEach(function(d, i) {
    var color = PIN_COLORS[d.type] || '#c0392b';
    var icon = L.divIcon({
      html: createPinSVG(color),
      className: 'map-marker',
      iconSize: [28, 40],
      iconAnchor: [14, 40],
      popupAnchor: [0, -40]
    });

    var marker = L.marker([d.lat, d.lng], { icon: icon }).addTo(map);

    var popupHTML = '<b>' + d.name + '</b><br>' +
      '<span style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.5px;color:' + color + '">' + d.type + '</span><br>' +
      d.address + '<br>' + d.city + ', ' + d.state + ' ' + d.zip + '<br>' +
      '<a href="tel:' + d.phone.replace(/\D/g, '') + '">' + d.phone + '</a>' +
      ' &middot; <a href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(d.address + ', ' + d.city + ', ' + d.state + ' ' + d.zip) + '" target="_blank" rel="noopener">Directions</a>';

    marker.bindPopup(popupHTML);

    marker.on('click', function() {
      setActiveCard(i);
    });

    markers.push(marker);
  });
}

function setActiveCard(index) {
  activeCardIndex = index;

  // Update card highlighting
  var cards = document.querySelectorAll('.dealer-card');
  cards.forEach(function(card, i) {
    card.classList.toggle('active', i === index);
  });

  // Scroll card into view
  var activeCard = document.querySelector('.dealer-card[data-index="' + index + '"]');
  if (activeCard) activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Open popup and pan to marker
  if (markers[index]) {
    markers[index].openPopup();
    map.panTo(markers[index].getLatLng(), { animate: true });
  }
}


// ── Card Rendering ──

function renderCards(dealers, showDistance) {
  var panel = document.getElementById('results-panel');
  var countEl = document.getElementById('results-count');
  if (!panel || !countEl) return;

  // Remove old cards (keep the count element)
  var oldCards = panel.querySelectorAll('.dealer-card');
  oldCards.forEach(function(c) { c.remove(); });

  if (dealers.length === 0) {
    countEl.textContent = 'No dealers found';
    var empty = document.createElement('div');
    empty.className = 'dealer-empty';
    empty.innerHTML = '<h3>No results</h3><p>Try a different ZIP code, city, or dealer name.</p>';
    panel.appendChild(empty);
    return;
  }

  countEl.textContent = dealers.length + ' dealer' + (dealers.length !== 1 ? 's' : '') + (showDistance ? ' nearby' : ' nationwide');

  dealers.forEach(function(d, i) {
    var distText = (showDistance && d.distance != null) ? d.distance.toFixed(1) + ' mi' : d.city + ', ' + d.state;
    var card = document.createElement('div');
    card.className = 'dealer-card';
    card.dataset.index = i;
    card.innerHTML =
      '<div class="dealer-name">' + d.name + '</div>' +
      '<span class="dealer-type ' + d.type + '">' + d.type + '</span>' +
      '<div class="dealer-address">' + d.address + '<br>' + d.city + ', ' + d.state + ' ' + d.zip + '</div>' +
      '<div class="dealer-meta">' +
        '<span class="dealer-distance">' + distText + '</span>' +
        '<span class="dealer-phone"><a href="tel:' + d.phone.replace(/\D/g, '') + '">' + d.phone + '</a></span>' +
        '<span class="dealer-directions"><a href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(d.address + ', ' + d.city + ', ' + d.state + ' ' + d.zip) + '" target="_blank" rel="noopener">Directions &rarr;</a></span>' +
      '</div>';
    card.addEventListener('click', function() { setActiveCard(i); });
    panel.appendChild(card);
  });
}


// ── Search ──

function doSearch(coordsOverride) {
  var coords = coordsOverride || null;
  var inputEl = document.getElementById('zip-input');
  var query = inputEl ? inputEl.value.trim() : '';

  if (coords) {
    // Location-based search
    var locData = searchByLocation(coords);
    currentResults = locData.results;
    addDealerMarkers(currentResults);
    renderCards(currentResults, true);

    // Show user location marker
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.circleMarker([coords[0], coords[1]], {
      radius: 8, fillColor: '#c0392b', fillOpacity: 0.9, color: '#fff', weight: 2
    }).addTo(map).bindPopup('Your location');

    // Fit map to show user + nearest dealers
    var bounds = L.latLngBounds([[coords[0], coords[1]]]);
    currentResults.forEach(function(d) { bounds.extend([d.lat, d.lng]); });
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    return;
  }

  if (!query) return;

  // Try ZIP/city coords
  coords = getCoords(query);
  if (coords) {
    var locData2 = searchByLocation(coords);
    currentResults = locData2.results;
    addDealerMarkers(currentResults);
    renderCards(currentResults, true);

    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.circleMarker([coords[0], coords[1]], {
      radius: 8, fillColor: '#c0392b', fillOpacity: 0.9, color: '#fff', weight: 2
    }).addTo(map).bindPopup('Search location');

    var bounds2 = L.latLngBounds([[coords[0], coords[1]]]);
    currentResults.forEach(function(d) { bounds2.extend([d.lat, d.lng]); });
    map.fitBounds(bounds2, { padding: [40, 40], maxZoom: 12 });
    return;
  }

  // Try name search
  var nameData = searchByName(query);
  if (nameData) {
    currentResults = nameData.results;
    addDealerMarkers(currentResults);
    renderCards(currentResults, false);

    if (userMarker) { map.removeLayer(userMarker); userMarker = null; }
    var bounds3 = L.latLngBounds();
    currentResults.forEach(function(d) { bounds3.extend([d.lat, d.lng]); });
    map.fitBounds(bounds3, { padding: [40, 40], maxZoom: 12 });
    return;
  }

  // No results
  currentResults = [];
  addDealerMarkers([]);
  renderCards([], false);
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


// ── Init ──

document.addEventListener('DOMContentLoaded', function() {
  initMap();

  document.getElementById('search-btn').addEventListener('click', function() { doSearch(); });
  document.getElementById('zip-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doSearch();
  });
  document.getElementById('locate-btn').addEventListener('click', requestGeolocation);

  // Nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (toggle) {
    toggle.addEventListener('click', function() {
      var open = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
});
