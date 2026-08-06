// ── Water Care Calculator ──
// Vapor Pure softener replacement timeline calculator

// ── ZIP Code Water Hardness Database ──
const ZIP_RANGES = [
  [10,13,"Springfield","MA",15],[14,16,"Worcester","MA",20],[17,19,"Fall River","MA",18],
  [20,24,"Boston","MA",18],[25,26,"Cape Cod","MA",15],
  [27,29,"Providence","RI",18],
  [30,34,"Manchester","NH",18],[35,38,"Concord","NH",15],
  [39,39,"Portsmouth","NH",18],[40,41,"Portland","ME",12],[42,44,"Lewiston","ME",15],[45,49,"Bangor","ME",18],
  [50,54,"White River Jct","VT",55],[55,59,"Burlington","VT",90],
  [60,62,"Hartford","CT",25],[63,64,"New Haven","CT",22],[65,66,"Bridgeport","CT",30],[67,69,"Stamford","CT",35],
  [70,73,"Newark","NJ",50],[74,76,"Trenton","NJ",95],[77,79,"Red Bank","NJ",65],[80,84,"South Jersey","NJ",70],[85,89,"Jersey City","NJ",60],
  [100,104,"New York City","NY",25],[105,109,"Yonkers","NY",25],[110,114,"Queens","NY",25],[115,119,"Long Island","NY",30],
  [120,124,"Albany","NY",45],[125,129,"Poughkeepsie","NY",55],[130,134,"Syracuse","NY",150],[135,139,"Utica","NY",100],
  [140,144,"Buffalo","NY",120],[145,149,"Rochester","NY",130],
  [150,154,"Pittsburgh","PA",130],[155,159,"Johnstown","PA",120],[160,164,"Erie","PA",120],[165,169,"State College","PA",115],
  [170,174,"Harrisburg","PA",120],[175,179,"Lancaster","PA",130],[180,184,"Allentown","PA",100],[185,189,"Scranton","PA",90],
  [190,196,"Philadelphia","PA",110],
  [197,199,"Wilmington","DE",95],
  [200,205,"Washington","DC",75],[206,209,"Southern MD","MD",80],[210,212,"Baltimore","MD",80],[213,219,"Frederick","MD",120],
  [220,224,"Arlington","VA",70],[225,229,"Richmond","VA",75],[230,234,"Richmond","VA",75],[235,239,"Norfolk","VA",65],
  [240,244,"Roanoke","VA",60],[245,246,"Lynchburg","VA",55],
  [247,253,"Charleston","WV",110],[254,259,"Martinsburg","WV",115],[260,264,"Wheeling","WV",120],[265,268,"Clarksburg","WV",120],
  [270,274,"Greensboro","NC",45],[275,279,"Raleigh","NC",48],[280,284,"Charlotte","NC",35],[285,289,"Fayetteville","NC",40],
  [290,294,"Columbia","SC",25],[295,299,"Charleston","SC",30],
  [300,303,"Atlanta","GA",30],[304,307,"Macon","GA",28],[308,312,"Augusta","GA",25],[313,316,"Savannah","GA",45],
  [317,319,"Columbus","GA",22],[398,399,"Atlanta","GA",30],
  [320,324,"Jacksonville","FL",240],[325,329,"Tallahassee","FL",160],[330,334,"Miami","FL",220],[335,339,"Tampa","FL",250],
  [340,344,"Orlando","FL",170],[345,347,"West Palm Beach","FL",190],[348,349,"Fort Myers","FL",200],
  [350,352,"Birmingham","AL",48],[353,356,"Tuscaloosa","AL",30],[357,359,"Huntsville","AL",100],
  [360,362,"Montgomery","AL",55],[363,366,"Dothan","AL",40],[367,369,"Mobile","AL",40],
  [370,374,"Nashville","TN",110],[375,377,"Chattanooga","TN",80],[378,381,"Knoxville","TN",60],[382,385,"Memphis","TN",65],
  [386,389,"Jackson","MS",35],[390,393,"Hattiesburg","MS",30],[394,397,"Tupelo","MS",40],
  [400,406,"Louisville","KY",130],[407,412,"Frankfort","KY",135],[413,418,"Lexington","KY",140],
  [419,422,"Bowling Green","KY",125],[423,427,"Pikeville","KY",120],
  [430,436,"Columbus","OH",150],[437,438,"Zanesville","OH",160],[439,441,"Cleveland","OH",120],
  [442,443,"Akron","OH",110],[444,446,"Youngstown","OH",125],[447,449,"Canton","OH",140],
  [450,455,"Cincinnati","OH",140],[456,458,"Dayton","OH",300],
  [460,462,"Indianapolis","IN",290],[463,466,"Gary","IN",270],[467,469,"Fort Wayne","IN",280],
  [470,472,"South Bend","IN",310],[473,476,"Terre Haute","IN",260],[477,479,"Evansville","IN",200],
  [480,483,"Detroit","MI",130],[484,487,"Flint","MI",180],[488,491,"Lansing","MI",340],
  [492,495,"Grand Rapids","MI",300],[496,499,"Traverse City","MI",270],
  [500,503,"Des Moines","IA",220],[504,509,"Waterloo","IA",260],[510,514,"Sioux City","IA",240],
  [515,519,"Ames","IA",250],[520,524,"Dubuque","IA",280],[525,528,"Cedar Rapids","IA",300],
  [530,532,"Milwaukee","WI",140],[533,535,"Madison","WI",320],[536,539,"La Crosse","WI",250],
  [540,544,"Wausau","WI",230],[545,549,"Green Bay","WI",280],
  [550,553,"Minneapolis","MN",170],[554,557,"St. Paul","MN",170],[558,560,"Duluth","MN",55],
  [561,564,"Mankato","MN",200],[565,567,"Rochester","MN",350],
  [570,573,"Sioux Falls","SD",280],[574,577,"Rapid City","SD",200],
  [580,583,"Fargo","ND",250],[584,588,"Bismarck","ND",220],
  [590,593,"Billings","MT",180],[594,596,"Great Falls","MT",130],[597,599,"Missoula","MT",75],
  [600,605,"Chicago","IL",140],[606,608,"Chicago Suburbs","IL",250],[609,612,"Kankakee","IL",260],
  [613,616,"Peoria","IL",270],[617,619,"Champaign","IL",290],[620,623,"Springfield","IL",260],
  [624,627,"Quincy","IL",280],[628,629,"Centralia","IL",250],
  [630,631,"St. Louis","MO",140],[632,635,"Springfield","MO",300],[636,639,"Cape Girardeau","MO",200],
  [640,643,"Kansas City","MO",120],[644,647,"Jefferson City","MO",220],[648,651,"Joplin","MO",250],
  [652,655,"Columbia","MO",240],[656,658,"St. Joseph","MO",180],
  [660,662,"Kansas City","KS",180],[663,666,"Topeka","KS",200],[667,670,"Wichita","KS",250],
  [671,673,"Dodge City","KS",220],[674,676,"Salina","KS",210],[677,679,"Liberal","KS",230],
  [680,683,"Omaha","NE",150],[684,687,"Lincoln","NE",200],[688,691,"Grand Island","NE",180],[692,693,"North Platte","NE",170],
  [700,701,"New Orleans","LA",100],[702,705,"Baton Rouge","LA",120],[706,709,"Lake Charles","LA",80],[710,714,"Shreveport","LA",45],
  [716,720,"Little Rock","AR",20],[721,724,"Pine Bluff","AR",30],[725,729,"Fayetteville","AR",50],
  [730,731,"Oklahoma City","OK",95],[732,733,"Oklahoma City","OK",95],[734,738,"Tulsa","OK",85],
  [739,741,"Lawton","OK",90],[742,742,"Enid","OK",95],[743,749,"Oklahoma City","OK",95],
  [750,754,"Dallas","TX",80],[755,759,"Texarkana","TX",60],[760,764,"Fort Worth","TX",100],
  [765,769,"Waco","TX",140],[770,774,"Houston","TX",140],[775,779,"Beaumont","TX",80],
  [780,784,"San Antonio","TX",300],[785,789,"Austin","TX",200],[790,794,"Amarillo","TX",180],
  [795,799,"El Paso","TX",220],
  [800,804,"Denver","CO",70],[805,808,"Colorado Springs","CO",75],[809,812,"Pueblo","CO",65],[813,816,"Fort Collins","CO",55],
  [820,824,"Cheyenne","WY",120],[825,828,"Casper","WY",180],[829,831,"Sheridan","WY",150],
  [832,834,"Boise","ID",150],[835,836,"Idaho Falls","ID",200],[837,838,"Nampa","ID",180],
  [840,842,"Salt Lake City","UT",220],[843,844,"Provo","UT",280],[845,846,"Ogden","UT",250],[847,847,"St. George","UT",400],
  [850,853,"Phoenix","AZ",232],[854,856,"Tucson","AZ",200],[857,859,"Flagstaff","AZ",150],
  [860,863,"Mesa","AZ",250],[864,865,"Scottsdale","AZ",250],
  [870,874,"Albuquerque","NM",120],[875,879,"Santa Fe","NM",80],[880,884,"Las Cruces","NM",260],
  [889,891,"Las Vegas","NV",274],[893,895,"Reno","NV",80],[897,898,"Carson City","NV",90],
  [900,905,"Los Angeles","CA",210],[906,908,"Whittier","CA",220],[910,912,"Pasadena","CA",230],
  [913,916,"Santa Ana","CA",260],[917,918,"Anaheim","CA",250],[919,921,"San Diego","CA",250],
  [922,925,"San Bernardino","CA",280],[926,928,"Riverside","CA",290],[930,933,"Santa Barbara","CA",350],
  [934,935,"Bakersfield","CA",180],[936,938,"Fresno","CA",150],[939,941,"San Francisco","CA",30],
  [942,944,"Sacramento","CA",50],[945,948,"Oakland","CA",40],[949,951,"San Jose","CA",180],
  [952,954,"Stockton","CA",120],[955,958,"Eureka","CA",40],[959,961,"Irvine","CA",230],
  [967,968,"Honolulu","HI",90],
  [970,973,"Portland","OR",10],[974,975,"Eugene","OR",15],[976,979,"Salem","OR",25],
  [980,983,"Seattle","WA",25],[984,986,"Tacoma","WA",22],[987,987,"Olympia","WA",20],
  [988,989,"Spokane","WA",120],[990,992,"Bellevue","WA",30],[993,994,"Spokane Valley","WA",120],
  [995,997,"Anchorage","AK",28],[998,999,"Fairbanks","AK",160]
];

// Build lookup
const ZIP_DATA = {};
ZIP_RANGES.forEach(([s, e, city, state, ppm]) => {
  for (let i = s; i <= e; i++) {
    ZIP_DATA[String(i).padStart(3, '0')] = { city, state, ppm };
  }
});

const ZIP_LIST = ZIP_RANGES.map(([s, e, city, state, ppm]) => ({
  from: String(s).padStart(3, '0'),
  to: String(e).padStart(3, '0'),
  city, state, ppm
}));

const CITY_LIST = [];
const citySet = new Set();
ZIP_RANGES.forEach(([s, e, city, state, ppm]) => {
  const key = city + ',' + state;
  if (!citySet.has(key)) {
    citySet.add(key);
    CITY_LIST.push({ city, state, ppm, zip: String(s).padStart(3, '0') });
  }
});
CITY_LIST.sort((a, b) => a.city.localeCompare(b.city));

// ── Regional Tile Map ──
const REGION_TILES = [
  [0,0,"ANC","Anchorage","AK",28],[0,1,"FBK","Fairbanks","AK",160],
  [1,24,"BAN","Bangor","ME",18],[1,25,"POR","Portland","ME",12],[2,24,"LEW","Lewiston","ME",15],
  [2,21,"BUR","Burlington","VT",90],[3,21,"WRJ","White Rvr","VT",55],
  [2,22,"MAN","Manchester","NH",18],[3,22,"CON","Concord","NH",15],
  [2,1,"SEA","Seattle","WA",25],[2,2,"SPO","Spokane","WA",120],
  [3,1,"TAC","Tacoma","WA",22],[3,2,"OLY","Olympia","WA",20],
  [2,5,"GFL","Great Falls","MT",130],[2,6,"BIL","Billings","MT",180],[3,5,"MIS","Missoula","MT",75],
  [2,8,"BIS","Bismarck","ND",220],[2,9,"FAR","Fargo","ND",250],
  [2,11,"DUL","Duluth","MN",55],[2,12,"MPL","Minneapolis","MN",170],
  [3,11,"MNK","Mankato","MN",200],[3,12,"ROC","Rochester","MN",350],
  [3,13,"WAU","Wausau","WI",230],[3,14,"GBY","Green Bay","WI",280],
  [4,13,"MAD","Madison","WI",320],[4,14,"MIL","Milwaukee","WI",140],
  [3,16,"TVC","Traverse Cty","MI",270],[3,17,"FLN","Flint","MI",180],
  [4,16,"GRR","Grand Rapids","MI",300],[4,17,"DET","Detroit","MI",130],
  [3,19,"BUF","Buffalo","NY",120],[3,20,"SYR","Syracuse","NY",150],
  [4,19,"ALB","Albany","NY",45],[4,20,"NYC","New York City","NY",25],
  [4,22,"SPR","Springfield","MA",15],[4,23,"WOR","Worcester","MA",20],
  [5,22,"BOS","Boston","MA",18],[5,23,"CCO","Cape Cod","MA",15],
  [4,21,"HFD","Hartford","CT",25],[5,21,"NHV","New Haven","CT",22],
  [5,24,"PVD","Providence","RI",18],
  [4,1,"PDX","Portland","OR",10],[4,2,"SLM","Salem","OR",25],[5,1,"EUG","Eugene","OR",15],
  [4,4,"BOI","Boise","ID",150],[4,5,"IFL","Idaho Falls","ID",200],[5,4,"NMP","Nampa","ID",180],
  [4,6,"SHE","Sheridan","WY",150],[4,7,"CAS","Casper","WY",180],[5,6,"CHE","Cheyenne","WY",120],
  [4,8,"RAP","Rapid City","SD",200],[4,9,"SFD","Sioux Falls","SD",280],
  [4,11,"SXC","Sioux City","IA",240],[4,12,"WTL","Waterloo","IA",260],
  [5,11,"DSM","Des Moines","IA",220],[5,12,"CRA","Cedar Rapids","IA",300],
  [5,13,"CHI","Chicago","IL",140],[5,14,"PIA","Peoria","IL",270],
  [6,13,"SPI","Springfield","IL",260],[6,14,"CHM","Champaign","IL",290],
  [5,15,"SBN","South Bend","IN",310],[5,16,"FWA","Fort Wayne","IN",280],
  [6,15,"IND","Indianapolis","IN",290],[6,16,"EVV","Evansville","IN",200],
  [5,17,"CLE","Cleveland","OH",120],[5,18,"YNG","Youngstown","OH",125],
  [6,17,"CMH","Columbus","OH",150],[6,18,"CIN","Cincinnati","OH",140],
  [5,19,"ERI","Erie","PA",120],[5,20,"SCR","Scranton","PA",90],
  [6,19,"PIT","Pittsburgh","PA",130],[6,20,"PHL","Philadelphia","PA",110],
  [6,21,"NWK","Newark","NJ",50],[6,22,"JCY","Jersey City","NJ",60],
  [7,21,"TRN","Trenton","NJ",95],[7,22,"SNJ","S. Jersey","NJ",70],
  [7,3,"RNO","Reno","NV",80],[7,4,"CSN","Carson City","NV",90],[8,3,"LAS","Las Vegas","NV",274],
  [6,5,"OGD","Ogden","UT",250],[6,6,"SLC","Salt Lake City","UT",220],
  [7,5,"PVU","Provo","UT",280],[7,6,"SGU","St. George","UT",400],
  [6,7,"FTC","Ft Collins","CO",55],[6,8,"DEN","Denver","CO",70],
  [7,7,"COS","Colo. Spgs","CO",75],[7,8,"PUE","Pueblo","CO",65],
  [6,9,"NPL","N. Platte","NE",170],[6,10,"GRI","Grand Isl.","NE",180],
  [7,9,"LNK","Lincoln","NE",200],[7,10,"OMA","Omaha","NE",150],
  [7,11,"KCM","Kansas City","MO",120],[7,12,"STJ","St. Joseph","MO",180],
  [8,11,"STL","St. Louis","MO",140],[8,12,"SGF","Springfield","MO",300],
  [7,15,"LEX","Lexington","KY",140],[7,16,"FRA","Frankfort","KY",135],
  [8,15,"LOU","Louisville","KY",130],[8,16,"BWG","Bowling Grn","KY",125],
  [7,17,"WHL","Wheeling","WV",120],[7,18,"MBG","Martinsburg","WV",115],
  [8,17,"CHS","Charleston","WV",110],[8,18,"CKB","Clarksburg","WV",120],
  [8,19,"ARL","Arlington","VA",70],[8,20,"ROA","Roanoke","VA",60],
  [9,19,"RIC","Richmond","VA",75],[9,20,"NFK","Norfolk","VA",65],
  [7,23,"BAL","Baltimore","MD",80],[7,24,"FRD","Frederick","MD",120],
  [8,23,"WDC","Washington","DC",75],[8,24,"SMD","S. Maryland","MD",80],
  [8,25,"WLM","Wilmington","DE",95],
  [6,1,"EUR","Eureka","CA",40],[7,1,"SFO","San Francisco","CA",30],[7,2,"SAC","Sacramento","CA",50],
  [8,1,"FRE","Fresno","CA",150],[9,1,"LAX","Los Angeles","CA",210],[9,2,"SAN","San Diego","CA",250],
  [8,4,"FLG","Flagstaff","AZ",150],[8,5,"PHX","Phoenix","AZ",232],
  [9,4,"TUS","Tucson","AZ",200],[9,5,"MSA","Mesa","AZ",250],
  [8,6,"SAF","Santa Fe","NM",80],[8,7,"ABQ","Albuquerque","NM",120],[9,6,"LCR","Las Cruces","NM",260],
  [8,9,"TOP","Topeka","KS",200],[8,10,"KCK","Kansas City","KS",180],
  [9,9,"ICT","Wichita","KS",250],[9,10,"DDC","Dodge City","KS",220],
  [9,11,"FAY","Fayetteville","AR",50],[9,12,"LRK","Little Rock","AR",20],[10,11,"PBF","Pine Bluff","AR",30],
  [9,15,"NSH","Nashville","TN",110],[9,16,"KNX","Knoxville","TN",60],
  [10,15,"MEM","Memphis","TN",65],[10,16,"CHA","Chattanooga","TN",80],
  [10,19,"GBO","Greensboro","NC",45],[10,20,"RAL","Raleigh","NC",48],
  [11,19,"CLT","Charlotte","NC",35],[11,20,"FAV","Fayetteville","NC",40],
  [11,21,"COL","Columbia","SC",25],[12,21,"CHL","Charleston","SC",30],
  [10,9,"OKC","Okla City","OK",95],[10,10,"ENI","Enid","OK",95],
  [11,9,"TUL","Tulsa","OK",85],[11,10,"LAW","Lawton","OK",90],
  [11,11,"SHV","Shreveport","LA",45],[11,12,"LCH","Lake Charles","LA",80],
  [12,11,"BTR","Baton Rouge","LA",120],[12,12,"MSY","New Orleans","LA",100],
  [11,15,"TUP","Tupelo","MS",40],[11,16,"JAN","Jackson","MS",35],[12,15,"HTB","Hattiesburg","MS",30],
  [11,17,"HSV","Huntsville","AL",100],[11,18,"BHM","Birmingham","AL",48],
  [12,17,"MGM","Montgomery","AL",55],[12,18,"MOB","Mobile","AL",40],
  [12,19,"ATL","Atlanta","GA",30],[12,20,"AUG","Augusta","GA",25],
  [13,18,"MCN","Macon","GA",28],[13,19,"SAV","Savannah","GA",45],
  [16,1,"HNL","Honolulu","HI",90],
  [11,7,"AMA","Amarillo","TX",180],
  [12,5,"ELP","El Paso","TX",220],[12,6,"DFW","Dallas","TX",80],[12,7,"FTW","Fort Worth","TX",100],[12,8,"WAC","Waco","TX",140],
  [13,6,"SAT","San Antonio","TX",300],[13,7,"AUS","Austin","TX",200],[13,8,"HOU","Houston","TX",140],
  [13,20,"TLH","Tallahassee","FL",160],[13,21,"JAX","Jacksonville","FL",240],
  [14,21,"ORL","Orlando","FL",170],
  [15,20,"TPA","Tampa","FL",250],[15,21,"WPB","W Palm Bch","FL",190],
  [16,21,"MIA","Miami","FL",220]
];

// ── DOM Refs ──
const zipSearch = document.getElementById('zipSearch');
const autocompleteList = document.getElementById('autocompleteList');
const ppmInput = document.getElementById('ppmInput');
const hardnessDisplay = document.getElementById('hardnessDisplay');
const hardnessText = document.getElementById('hardnessText');
const hardnessClassification = document.getElementById('hardnessClassification');
const hpdSlider = document.getElementById('hpdSlider');
const dpwSlider = document.getElementById('dpwSlider');
const hpdValue = document.getElementById('hpdValue');
const dpwValue = document.getElementById('dpwValue');
const fireplaceRows = document.getElementById('fireplaceRows');
const addFireplaceBtn = document.getElementById('addFireplaceBtn');
const totalSegments = document.getElementById('totalSegments');
const resultContainer = document.getElementById('resultContainer');
const noResultCard = document.getElementById('noResultCard');
const tileMap = document.getElementById('tileMap');
const mapCityLabel = document.getElementById('mapCityLabel');
const cityNameDisplay = document.getElementById('cityNameDisplay');
const cityNameText = document.getElementById('cityNameText');
const hardnessMarker = document.getElementById('hardnessMarker');

let selectedPPM = null;
let highlightedIndex = -1;

// ── Hardness scale colors ──
// Token references, not literals: these go into inline styles on the map
// tiles, and the four levels are rebound per theme in redesign.css (the dark
// theme's greens and yellows are unreadable on a light card).
function hardnessToken(ppm) {
  if (ppm === null || ppm === undefined) return null;
  if (ppm <= 60) return 'var(--hard-soft)';
  if (ppm <= 120) return 'var(--hard-moderate)';
  if (ppm <= 180) return 'var(--hard-hard)';
  return 'var(--hard-vhard)';
}

function getHardnessColor(ppm) {
  var c = hardnessToken(ppm);
  return c ? 'color-mix(in srgb, ' + c + ' 38%, transparent)' : 'var(--surface)';
}

function getHardnessTextColor(ppm) {
  return hardnessToken(ppm) || 'var(--text-dim)';
}

// Continental US silhouette
const US_SILHOUETTE = [
  [1, 24, 25],
  [2, 1, 2], [2, 5, 12], [2, 21, 24],
  [3, 1, 22],
  [4, 1, 23],
  [5, 1, 24],
  [6, 1, 22],
  [7, 1, 24],
  [8, 1, 25],
  [9, 1, 20],
  [10, 9, 20],
  [11, 7, 21],
  [12, 5, 21],
  [13, 6, 8], [13, 18, 21],
  [14, 21, 21],
  [15, 20, 21],
  [16, 21, 21],
];

function buildMap() {
  const dataCells = new Set();
  REGION_TILES.forEach(([r, c]) => dataCells.add(r + ',' + c));

  US_SILHOUETTE.forEach(([row, startCol, endCol]) => {
    for (let c = startCol; c <= endCol; c++) {
      if (dataCells.has(row + ',' + c)) continue;
      const bg = document.createElement('div');
      bg.className = 'silhouette-tile';
      bg.style.gridRow = row + 1;
      bg.style.gridColumn = c + 1;
      tileMap.appendChild(bg);
    }
  });

  REGION_TILES.forEach(([r, c, abbr, city, state, ppm]) => {
    const tile = document.createElement('div');
    tile.className = 'state-tile';
    tile.dataset.state = state;
    tile.dataset.city = city;
    tile.dataset.ppm = ppm;
    tile.style.gridRow = r + 1;
    tile.style.gridColumn = c + 1;
    tile.textContent = abbr;
    tile.style.background = getHardnessColor(ppm);
    tile.style.color = getHardnessTextColor(ppm);

    const label = ppm <= 60 ? 'Soft' : ppm <= 120 ? 'Moderate' : ppm <= 180 ? 'Hard' : 'Very Hard';
    tile.title = `${city}, ${state}: ${ppm} PPM (${label})`;

    tile.addEventListener('click', function() {
      ppmInput.value = ppm;
      selectedPPM = ppm;
      showHardnessInfo(ppm);
      showCityName(city, state);
      highlightState(state, `${city}, ${state}`, ppm);
      zipSearch.value = `${city}, ${state}`;
      calculate();
    });

    tileMap.appendChild(tile);
  });
}

function highlightState(stateCode, cityName, ppm) {
  document.querySelectorAll('.state-tile.active').forEach(t => t.classList.remove('active'));
  if (stateCode) {
    const tiles = document.querySelectorAll(`.state-tile[data-state="${stateCode}"]`);
    tiles.forEach(t => t.classList.add('active'));
  }
  mapCityLabel.textContent = cityName ? `\u{1F4CD} ${cityName} \u2014 ${ppm} PPM` : '';
}

// ── ZIP / City Search ──
zipSearch.addEventListener('input', function() {
  const raw = this.value;
  highlightedIndex = -1;
  const isZip = /^\d+$/.test(raw.trim());

  if (raw.trim().length < 2) {
    autocompleteList.classList.remove('active');
    return;
  }

  let matches;

  if (isZip) {
    const query = raw.trim();
    matches = ZIP_LIST.filter(r => {
      if (query.length <= 3) {
        const qPad = query.padEnd(3, '0');
        const qMax = query.padEnd(3, '9');
        return r.to >= qPad && r.from <= qMax;
      } else {
        const prefix = query.slice(0, 3);
        return prefix >= r.from && prefix <= r.to;
      }
    }).slice(0, 15).map(m => ({
      label: (m.from === m.to ? `${m.from}xx` : `${m.from}xx\u2013${m.to}xx`) + `  ${m.city}, ${m.state}`,
      city: m.city, state: m.state, ppm: m.ppm, zip: m.from
    }));

    if (query.length === 5) {
      const prefix = query.slice(0, 3);
      const data = ZIP_DATA[prefix];
      if (data) {
        ppmInput.value = data.ppm;
        selectedPPM = data.ppm;
        showHardnessInfo(data.ppm);
        showCityName(data.city, data.state);
        highlightState(data.state, `${data.city}, ${data.state}`, data.ppm);
        autocompleteList.classList.remove('active');
        calculate();
        return;
      }
    }
  } else {
    const q = raw.trim().toLowerCase();
    matches = CITY_LIST.filter(c => {
      const full = (c.city + ', ' + c.state).toLowerCase();
      return full.includes(q);
    }).slice(0, 15).map(c => ({
      label: `${c.city}, ${c.state}`,
      city: c.city, state: c.state, ppm: c.ppm, zip: c.zip
    }));
  }

  if (matches.length === 0) {
    autocompleteList.classList.remove('active');
    return;
  }

  autocompleteList.innerHTML = matches.map((m, i) =>
    `<div class="autocomplete-item" data-index="${i}" data-ppm="${m.ppm}" data-state="${m.state}" data-city="${m.city}" data-zip="${m.zip}">
      <span>${m.label}</span>
      <span class="ppm-badge">${m.ppm} PPM</span>
    </div>`
  ).join('');
  autocompleteList.classList.add('active');

  autocompleteList.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', function() {
      const ppm = parseInt(this.dataset.ppm);
      const state = this.dataset.state;
      const city = this.dataset.city;
      const name = `${city}, ${state}`;
      zipSearch.value = name;
      ppmInput.value = ppm;
      selectedPPM = ppm;
      autocompleteList.classList.remove('active');
      showHardnessInfo(ppm);
      showCityName(city, state);
      highlightState(state, name, ppm);
      calculate();
    });
  });
});

zipSearch.addEventListener('keydown', function(e) {
  const items = autocompleteList.querySelectorAll('.autocomplete-item');
  if (!autocompleteList.classList.contains('active') || items.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
    updateHighlight(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightedIndex = Math.max(highlightedIndex - 1, 0);
    updateHighlight(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (highlightedIndex >= 0 && highlightedIndex < items.length) {
      items[highlightedIndex].click();
    }
  } else if (e.key === 'Escape') {
    autocompleteList.classList.remove('active');
  }
});

function updateHighlight(items) {
  items.forEach((it, i) => it.classList.toggle('highlighted', i === highlightedIndex));
  if (highlightedIndex >= 0) items[highlightedIndex].scrollIntoView({ block: 'nearest' });
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.search-wrapper')) {
    autocompleteList.classList.remove('active');
  }
});

// ── PPM Manual Input ──
ppmInput.addEventListener('input', function() {
  const val = parseInt(this.value);
  if (!isNaN(val) && val > 0) {
    selectedPPM = val;
    showHardnessInfo(val);
    if (document.activeElement === ppmInput) {
      zipSearch.value = '';
      hideCityName();
      highlightState(null);
    }
  } else {
    selectedPPM = null;
    hardnessDisplay.classList.remove('active');
    hardnessMarker.classList.remove('active');
  }
  calculate();
});

function showHardnessInfo(ppm) {
  let cls, label;
  if (ppm <= 60) { cls = 'soft'; label = 'Soft'; }
  else if (ppm <= 120) { cls = 'moderate'; label = 'Moderately Hard'; }
  else if (ppm <= 180) { cls = 'hard'; label = 'Hard'; }
  else { cls = 'very-hard'; label = 'Very Hard'; }

  const grpg = (ppm / 17.1).toFixed(1);
  hardnessDisplay.className = 'water-hardness-display active ' + cls;
  hardnessText.textContent = `${ppm} PPM = ${grpg} GPG`;
  hardnessClassification.textContent = label;
  updateHardnessMarker(ppm);
}

function updateHardnessMarker(ppm) {
  if (!ppm || ppm <= 0) {
    hardnessMarker.classList.remove('active');
    return;
  }
  const maxPpm = 240;
  const clampedPpm = Math.min(ppm, maxPpm);
  let percent;
  if (clampedPpm <= 60) {
    percent = (clampedPpm / 60) * 25;
  } else if (clampedPpm <= 120) {
    percent = 25 + ((clampedPpm - 60) / 60) * 25;
  } else if (clampedPpm <= 180) {
    percent = 50 + ((clampedPpm - 120) / 60) * 25;
  } else {
    percent = 75 + ((clampedPpm - 180) / 60) * 25;
  }
  percent = Math.max(1, Math.min(99, percent));
  hardnessMarker.style.left = percent + '%';
  hardnessMarker.classList.add('active');
}

function showCityName(city, state) {
  if (city && state) {
    cityNameText.textContent = `${city}, ${state}`;
    cityNameDisplay.classList.add('active');
  } else {
    cityNameDisplay.classList.remove('active');
  }
}

function hideCityName() {
  cityNameDisplay.classList.remove('active');
}

// ── Sliders ──
hpdSlider.addEventListener('input', function() {
  hpdValue.textContent = this.value + ' hrs';
  calculate();
});

dpwSlider.addEventListener('input', function() {
  dpwValue.textContent = this.value + ' days';
  calculate();
});

// ── Fireplace Rows ──
function getFireplaceRowHTML(index) {
  return `<div class="fireplace-row" data-index="${index}">
    <div class="form-group">
      <label>Fireplace size</label>
      <select class="fp-size">
        <option value="1">20" (1 segment)</option>
        <option value="2">40" (2 segments)</option>
        <option value="3" selected>60" (3 segments)</option>
      </select>
    </div>
    <div class="form-group">
      <label>Quantity</label>
      <select class="fp-qty">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
    </div>
    <span class="fp-per-label">per</span>
    <div class="form-group fp-softener-group">
      <label>Softener</label>
      <select class="fp-softener">
        <option value="300">300 grain (Residential)</option>
        <option value="700">700 grain (Commercial)</option>
      </select>
    </div>
    <button class="remove-btn" onclick="removeFireplace(this)" title="Remove">&times;</button>
  </div>`;
}

addFireplaceBtn.addEventListener('click', function() {
  const rows = fireplaceRows.querySelectorAll('.fireplace-row');
  fireplaceRows.insertAdjacentHTML('beforeend', getFireplaceRowHTML(rows.length));
  bindFireplaceEvents();
  updateTotalSegments();
  calculate();
});

function removeFireplace(btn) {
  const rows = fireplaceRows.querySelectorAll('.fireplace-row');
  if (rows.length <= 1) return;
  btn.closest('.fireplace-row').remove();
  updateTotalSegments();
  calculate();
}

function bindFireplaceEvents() {
  fireplaceRows.querySelectorAll('select').forEach(sel => {
    sel.removeEventListener('change', onFireplaceChange);
    sel.addEventListener('change', onFireplaceChange);
  });
}

function onFireplaceChange() {
  updateTotalSegments();
  calculate();
}

function getTotalSegments() {
  let total = 0;
  fireplaceRows.querySelectorAll('.fireplace-row').forEach(row => {
    const size = parseInt(row.querySelector('.fp-size').value);
    const qty = parseInt(row.querySelector('.fp-qty').value);
    total += size * qty;
  });
  return total;
}

function updateTotalSegments() {
  totalSegments.innerHTML = `Total 20" segments: <strong>${getTotalSegments()}</strong>`;
}

// ── Calculation ──
function formatDuration(months) {
  let val, unit;
  if (months >= 120) {
    val = (months / 12).toFixed(1);
    unit = months / 12 === 1 ? 'year' : 'years';
  } else {
    val = months.toFixed(1);
    unit = 'months';
  }
  if (val.endsWith('.0')) val = val.slice(0, -2);
  return { val, unit };
}

function calculate() {
  const ppm = selectedPPM;
  if (!ppm || ppm <= 0) {
    resultContainer.innerHTML = '';
    noResultCard.style.display = '';
    return;
  }

  const hpd = parseFloat(hpdSlider.value);
  const dpw = parseFloat(dpwSlider.value);
  const wpm = 4.3;
  const grpg = ppm / 17.1;

  const fpResults = [];
  let overallMinMonths = Infinity;

  fireplaceRows.querySelectorAll('.fireplace-row').forEach((row, idx) => {
    const sizeVal = parseInt(row.querySelector('.fp-size').value);
    const qty = parseInt(row.querySelector('.fp-qty').value);
    const capacity = parseInt(row.querySelector('.fp-softener').value);
    const segments = sizeVal * qty;
    const sizeLabel = sizeVal === 1 ? '20"' : sizeVal === 2 ? '40"' : '60"';

    const gallonsPerMonth = hpd * 0.025 * dpw * wpm * segments;
    const grainsPerMonth = gallonsPerMonth * grpg;
    const months = grainsPerMonth > 0 ? capacity / grainsPerMonth : Infinity;

    fpResults.push({ idx: idx + 1, sizeLabel, qty, segments, capacity, gallonsPerMonth, grainsPerMonth, months });
    if (months < overallMinMonths) overallMinMonths = months;
  });

  noResultCard.style.display = 'none';

  const isMulti = fpResults.length > 1;

  if (!isMulti) {
    const fp = fpResults[0];
    const { val: displayVal, unit: unitText } = formatDuration(fp.months);

    const singleWarning = fp.months > 12
      ? `<div class="replace-warning"><span class="warn-icon">&#9888;</span><span>Based on your usage the softener capacity lasts beyond 12 months, but <strong>we recommend replacing the softener at least once every 12 months</strong> to ensure optimal water quality and appliance protection.</span></div>`
      : '';

    resultContainer.innerHTML = `
      <div class="result-card">
        <div class="result-label">Estimated time before replacement</div>
        <div class="result-value">${fp.months > 12 ? 12 : displayVal}</div>
        <div class="result-unit">${fp.months > 12 ? 'months (max recommended)' : unitText}</div>
        <div class="result-breakdown">
          <div class="row"><span class="label">Water hardness</span><span>${ppm} PPM (${grpg.toFixed(1)} GrPG)</span></div>
          <div class="row"><span class="label">Usage</span><span>${hpd} hrs/day, ${dpw} days/wk</span></div>
          <div class="divider"></div>
          <div class="row"><span class="label">${fp.qty}&times;${fp.sizeLabel} (${fp.capacity}g softener)</span><span>${fp.segments} segments</span></div>
          <div class="row"><span class="label">Water per month</span><span>${fp.gallonsPerMonth.toFixed(2)} gal</span></div>
          <div class="row"><span class="label">Grains per month</span><span>${fp.grainsPerMonth.toFixed(2)}</span></div>
          <div class="divider"></div>
          <div class="row"><span class="label"><strong>Replace every</strong></span><span><strong>${fp.months > 12 ? '12 months (max)' : displayVal + ' ' + unitText}</strong></span></div>
        </div>
        ${singleWarning}
      </div>`;
  } else {
    let cardsHtml = '<div class="results-grid">';

    let anyOver12 = false;
    fpResults.forEach(fp => {
      const { val: fpVal, unit: fpUnit } = formatDuration(fp.months);
      const capped = fp.months > 12;
      if (capped) anyOver12 = true;

      cardsHtml += `
        <div class="result-card">
          <div class="result-config-label">Fireplace ${fp.idx}</div>
          <div class="result-label">Replace softener in</div>
          <div class="result-value">${capped ? 12 : fpVal}</div>
          <div class="result-unit">${capped ? 'months (max)' : fpUnit}</div>
          <div class="result-breakdown">
            <div class="row"><span class="label">Size</span><span>${fp.qty}&times;${fp.sizeLabel}</span></div>
            <div class="row"><span class="label">Segments</span><span>${fp.segments}</span></div>
            <div class="row"><span class="label">Softener</span><span>${fp.capacity} grain</span></div>
            <div class="divider"></div>
            <div class="row"><span class="label">Water/month</span><span>${fp.gallonsPerMonth.toFixed(2)} gal</span></div>
            <div class="row"><span class="label">Grains/month</span><span>${fp.grainsPerMonth.toFixed(2)}</span></div>
            <div class="divider"></div>
            <div class="row"><span class="label"><strong>Replace every</strong></span><span><strong>${capped ? '12 months (max)' : fpVal + ' ' + fpUnit}</strong></span></div>
          </div>
        </div>`;
    });

    cardsHtml += '</div>';

    const cappedOverallMonths = overallMinMonths > 12 ? 12 : overallMinMonths;
    const { val: summaryVal, unit: summaryUnit } = formatDuration(cappedOverallMonths);
    cardsHtml += `
      <div class="results-summary">
        \u23F1 Soonest replacement: <strong>${summaryVal} ${summaryUnit}${overallMinMonths > 12 ? ' (max)' : ''}</strong> &nbsp;|&nbsp; Water hardness: ${ppm} PPM &nbsp;|&nbsp; Usage: ${hpd} hrs/day, ${dpw} days/wk
      </div>`;

    if (anyOver12) {
      cardsHtml += `<div class="replace-warning"><span class="warn-icon">&#9888;</span><span>One or more configurations show a softener capacity lasting beyond 12 months, but <strong>we recommend replacing every softener at least once every 12 months</strong> to ensure optimal water quality and appliance protection.</span></div>`;
    }

    resultContainer.innerHTML = cardsHtml;
  }
}

// ── Init ──
buildMap();
bindFireplaceEvents();
updateTotalSegments();
