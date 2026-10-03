/* no.com.au prototype: shared data, store and helpers */
(function () {
  "use strict";
  var NO = (window.NO = {});
  var H = 3600e3, M = 60e3, D = 86400e3;
  NO.H = H; NO.M = M; NO.D = D;

  /* ---------- tiny helpers ---------- */
  NO.$ = function (s, el) { return (el || document).querySelector(s); };
  NO.$$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var pad = function (n) { return String(n).padStart(2, "0"); };
  NO.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  NO.clock = function (ms) {
    ms = Math.max(0, ms); var s = Math.floor(ms / 1000), d = Math.floor(s / 86400); s %= 86400;
    return (d ? d + "d " : "") + pad(Math.floor(s / 3600)) + ":" + pad(Math.floor((s % 3600) / 60)) + ":" + pad(s % 60);
  };
  NO.human = function (ms) {
    var m = Math.max(1, Math.round(ms / M)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    return d ? d + "d " + h + "h" : h ? h + "h " + mm + "m" : mm + "m";
  };
  NO.time = function (t) { return new Date(t).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).replace(" ", " "); };
  NO.day = function (t) {
    var d = new Date(t), n = new Date(), y = new Date(Date.now() - D), tm = new Date(Date.now() + D);
    var same = function (a, b) { return a.toDateString() === b.toDateString(); };
    if (same(d, n)) return "Today";
    if (same(d, y)) return "Yesterday";
    if (same(d, tm)) return "Tomorrow";
    return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
  };
  NO.when = function (t) { return NO.day(t) + ", " + NO.time(t); };
  NO.dayl = function (t) { var d = NO.day(t); return /^(Today|Yesterday|Tomorrow)$/.test(d) ? d.toLowerCase() : d; };
  NO.whenl = function (t) { return NO.dayl(t) + ", " + NO.time(t); };
  NO.hr = function (t) { var h = new Date(t).getHours(); return (h % 12 || 12) + (h < 12 ? "am" : "pm"); };
  NO.sep = '<i class="sep" aria-hidden="true"></i>';
  NO.dist = function (a, b, c, d) {
    var R = 6371000, r = Math.PI / 180, x = (d - b) * r * Math.cos(((a + c) / 2) * r), y = (c - a) * r;
    return Math.sqrt(x * x + y * y) * R;
  };
  NO.median = function (a) {
    if (!a.length) return 0; var s = a.slice().sort(function (x, y) { return x - y; }), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  NO.buzz = function () { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {} };
  NO.toast = function (msg) {
    var t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("in"); });
    setTimeout(function () { t.classList.remove("in"); setTimeout(function () { t.remove(); }, 300); }, 2600);
  };
  NO.img = function (id, w, h) {
    if (!id) return null; if (/^data:|^blob:|^https?:/.test(id)) return id;
    return "https://images.unsplash.com/photo-" + id + "?w=" + (w || 900) + (h ? "&h=" + h : "") + "&q=70&auto=format&fit=crop";
  };

  /* collection target: next working day, 5pm */
  NO.due = function (t) {
    var d = new Date(t); d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    d.setHours(17, 0, 0, 0); return d.getTime();
  };
  NO.window = function (t) { /* crew window on the due day */
    var d = new Date(NO.due(t)); d.setHours(7, 0, 0, 0); return d.getTime();
  };

  /* ---------- icons ---------- */
  var P = {
    mattress: '<rect x="3" y="10" width="26" height="12" rx="3"/><path d="M3 17.5h26M9.5 10v7.5M16 10v7.5M22.5 10v7.5"/>',
    couch: '<path d="M6.5 14v-3a3 3 0 0 1 3-3h13a3 3 0 0 1 3 3v3"/><path d="M3.5 14h4.5v4.5h16V14h4.5v8h-25z"/><path d="M6 22v3M26 22v3"/>',
    bags: '<path d="M13 9.5 11 5h10l-2 4.5"/><path d="M13 9.5c-5 3-7.5 8-7.5 12a5 5 0 0 0 5 5h11a5 5 0 0 0 5-5c0-4-2.5-9-7.5-12z"/>',
    whitegoods: '<rect x="8.5" y="3" width="15" height="26" rx="2.5"/><path d="M8.5 12h15M12 6.5v2.5M12 15v4.5"/>',
    ewaste: '<rect x="3.5" y="6" width="25" height="15" rx="2"/><path d="M11 26.5h10M16 21v5.5"/>',
    tyres: '<circle cx="16" cy="16" r="11.5"/><circle cx="16" cy="16" r="4.5"/><path d="M16 4.5v3.5M16 24v3.5M4.5 16H8M24 16h3.5M7.9 7.9l2.4 2.4M21.7 21.7l2.4 2.4M7.9 24.1l2.4-2.4M21.7 10.3l2.4-2.4"/>',
    rubble: '<path d="M2.5 26.5 7 19l5 2 3.5-6.5 6 3.5 3-4.5 5 13z"/><path d="M12 21l1.5 5.5M21.5 18l-1.5 8.5"/>',
    green: '<path d="M5 27C9.5 18.5 16 12 27 5.5"/><path d="M11.5 19.5C8 18.5 6 15.5 6 11.5c4 0 7.5 3 7.5 6.5M18.5 13.5c0-4 2-7 6.5-8 1 4.5-1 7.5-4.5 9.5M16 21.5c3-1.5 6.5-.5 8.5 2.5-3 2.5-6.5 2-8.5-1.5"/>',
    boxes: '<path d="M4 10.5 16 5.5l12 5V22l-12 5.5L4 22z"/><path d="M4 10.5l12 5.5 12-5.5M16 16v11.5"/>',
    car: '<path d="M3.5 21v-5l3.5-5.5h13l5.5 5.5h3v5"/><path d="M3.5 21h2.5M12 21h8M26 21h2.5"/><circle cx="9" cy="21" r="3"/><circle cx="23" cy="21" r="3"/>',
    other: '<circle cx="8.5" cy="16" r="2.2"/><circle cx="16" cy="16" r="2.2"/><circle cx="23.5" cy="16" r="2.2"/>',
    hazard: '<path d="M16 4 29 27H3z"/><path d="M16 12.5v7M16 23.5v.01"/>',
    camera: '<path d="M4 10h5l2.5-3.5h9L23 10h5v15.5H4z"/><circle cx="16" cy="17.5" r="5"/>',
    gallery: '<rect x="4" y="5" width="24" height="22" rx="2.5"/><circle cx="11" cy="12" r="2.5"/><path d="m4 23 7-7 5 5 4-4 8 8"/>',
    pin: '<path d="M16 29s-9-8.5-9-15a9 9 0 0 1 18 0c0 6.5-9 15-9 15z"/><circle cx="16" cy="14" r="3.2"/>',
    locate: '<circle cx="16" cy="16" r="6.5"/><circle cx="16" cy="16" r="1.5"/><path d="M16 3v4.5M16 24.5V29M3 16h4.5M24.5 16H29"/>',
    search: '<circle cx="14" cy="14" r="8.5"/><path d="m20.5 20.5 7 7"/>',
    check: '<path d="M6 16.5l6.5 6.5L26 9.5"/>',
    right: '<path d="M6 16h19M17.5 8.5 25 16l-7.5 7.5"/>',
    back: '<path d="M26 16H7M14.5 8.5 7 16l7.5 7.5"/>',
    close: '<path d="M8.5 8.5l15 15M23.5 8.5l-15 15"/>',
    share: '<path d="M16 4.5V20M10 10.5l6-6 6 6"/><path d="M8 15.5v11h16v-11"/>',
    few: '<rect x="11" y="15" width="10" height="10" rx="1.5"/><path d="M11 18.5h10"/>',
    boot: '<path d="M4 23.5v-7l4.5-7.5h15l4.5 7.5v7z"/><path d="M4 16.5h24M8.5 23.5v3M23.5 23.5v3"/>',
    trailer: '<path d="M2.5 11.5H23v10H2.5z"/><path d="M23 18.5h6.5"/><circle cx="12.5" cy="24" r="3"/>',
    truck: '<path d="M2 8.5h17.5v14H2z"/><path d="M19.5 12.5H25l4.5 5.5v4.5h-10"/><circle cx="8" cy="24" r="3"/><circle cx="24" cy="24" r="3"/>',
    phone: '<rect x="9" y="3" width="14" height="26" rx="3"/><path d="M14 25.5h4"/>',
    mail: '<rect x="3.5" y="7" width="25" height="18" rx="2"/><path d="m4 8.5 12 9 12-9"/>',
    crew: '<path d="M2 9h17.5v13H2z"/><path d="M19.5 13H25l4.5 5v4h-10"/><circle cx="8" cy="23.5" r="2.8"/><circle cx="24" cy="23.5" r="2.8"/><path d="M6 15.5h8"/>',
    pass: '<path d="M4 11h20M18 5l6 6-6 6"/><path d="M28 21H8M14 15l-6 6 6 6"/>',
    eye: '<path d="M2.5 16S7.5 7.5 16 7.5 29.5 16 29.5 16 24.5 24.5 16 24.5 2.5 16 2.5 16z"/><circle cx="16" cy="16" r="4"/>',
    doc: '<path d="M7 3.5h12l6 6v19H7z"/><path d="M19 3.5v6h6M11 16h10M11 20.5h10M11 25h6"/>',
    plus: '<path d="M16 6v20M6 16h20"/>',
    minus: '<path d="M6 16h20"/>',
    menu: '<path d="M5 9h22M5 16h22M5 23h22"/>',
    recycle: '<path d="M11 8.5 14 3.5h4l3 5.5"/><path d="M24 12.5l3.5 6-2 3.5h-6"/><path d="M13.5 25.5h-6l-2-3.5 3.5-6"/><path d="M18.5 6.5 21 9l-3.5.5M23 25.5l-3.5 0 1.5-3M6 13l1.5-3.5 2.5 2"/>',
    clock: '<circle cx="16" cy="16" r="12.5"/><path d="M16 8.5V16l5 3"/>',
    sign: '<rect x="5" y="3.5" width="22" height="17" rx="2"/><path d="M16 20.5v8M11 28.5h10M10 9h12M10 14h8"/>'
  };
  NO.icon = function (n, cls) {
    return '<svg class="ic ' + (cls || "") + '" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || "") + "</svg>";
  };

  /* ---------- what can be reported ---------- */
  NO.TYPES = [
    { id: "mattress", label: "Mattress" },
    { id: "couch", label: "Couch or furniture" },
    { id: "bags", label: "Bags or household" },
    { id: "whitegoods", label: "Fridge or washer" },
    { id: "ewaste", label: "TV or electronics" },
    { id: "tyres", label: "Tyres", epa: true },
    { id: "rubble", label: "Building rubble", epa: true },
    { id: "green", label: "Green waste", epa: true },
    { id: "boxes", label: "Boxes or packaging", epa: true },
    { id: "car", label: "Car or car parts", epa: true },
    { id: "other", label: "Something else" },
    { id: "hazard", label: "Asbestos or chemicals?", short: "Possible asbestos or chemicals", epa: true, hazard: true }
  ];
  NO.T = {}; NO.TYPES.forEach(function (t) { NO.T[t.id] = t; });
  NO.typeList = function (ids) {
    return ids.map(function (i, n) {
      var l = NO.T[i] ? (NO.T[i].short || NO.T[i].label) : i;
      return n ? l.replace(/^([A-Z])(?![A-Z])/, function (c) { return c.toLowerCase(); }) : l;
    }).join(", ");
  };
  NO.SIZES = [
    { id: "few", label: "A few items", sub: "1 to 5 things", icon: "few" },
    { id: "boot", label: "Car boot", sub: "Bags, small stuff", icon: "boot" },
    { id: "trailer", label: "Trailer load", sub: "Furniture, a pile", icon: "trailer" },
    { id: "truck", label: "Truck load", sub: "Or more", icon: "truck" }
  ];
  NO.S = {}; NO.SIZES.forEach(function (s) { NO.S[s.id] = s; });

  /* ---------- routing: who is responsible ---------- */
  NO.STATES = { "Victoria": "VIC", "Queensland": "QLD", "New South Wales": "NSW", "South Australia": "SA", "Western Australia": "WA", "Tasmania": "TAS", "Northern Territory": "NT", "Australian Capital Territory": "ACT" };
  var CN = {
    "Hume": "Hume City Council", "Merri-bek": "Merri-bek City Council", "Darebin": "Darebin City Council", "Whittlesea": "City of Whittlesea",
    "Brimbank": "Brimbank City Council", "Maribyrnong": "Maribyrnong City Council", "Wyndham": "Wyndham City Council", "Melton": "City of Melton",
    "Greater Dandenong": "City of Greater Dandenong", "Casey": "City of Casey", "Frankston": "Frankston City Council", "Greater Geelong": "City of Greater Geelong",
    "Ballarat": "City of Ballarat", "Hepburn": "Hepburn Shire Council", "Melbourne": "City of Melbourne", "Yarra": "City of Yarra", "Moonee Valley": "Moonee Valley City Council",
    "Hobsons Bay": "Hobsons Bay City Council", "Port Phillip": "City of Port Phillip", "Stonnington": "City of Stonnington", "Boroondara": "City of Boroondara",
    "Monash": "City of Monash", "Kingston": "City of Kingston", "Glen Eira": "Glen Eira City Council", "Bayside": "Bayside City Council", "Banyule": "Banyule City Council",
    "Manningham": "Manningham City Council", "Whitehorse": "Whitehorse City Council", "Knox": "Knox City Council", "Maroondah": "Maroondah City Council",
    "Yarra Ranges": "Yarra Ranges Council", "Cardinia": "Cardinia Shire Council", "Mornington Peninsula": "Mornington Peninsula Shire", "Nillumbik": "Nillumbik Shire Council",
    "Mitchell": "Mitchell Shire Council", "Macedon Ranges": "Macedon Ranges Shire Council", "Moorabool": "Moorabool Shire Council", "Surf Coast": "Surf Coast Shire",
    "Golden Plains": "Golden Plains Shire Council", "Bass Coast": "Bass Coast Shire Council", "Brisbane": "Brisbane City Council", "Logan": "Logan City Council",
    "Ipswich": "Ipswich City Council", "Moreton Bay": "City of Moreton Bay", "Gold Coast": "City of Gold Coast", "Redland": "Redland City Council", "Sydney": "City of Sydney"
  };
  NO.councilName = function (lga) {
    if (!lga) return null; lga = String(lga).replace(/\s*\(.*\)\s*$/, "").trim();
    return CN[lga] || lga + " Council";
  };
  NO.landKind = function (cat, type) {
    cat = cat || ""; type = type || "";
    if (cat === "highway" && /^(motorway|trunk|primary)(_link)?$/.test(type)) return "road";
    if (cat === "railway" || (cat === "landuse" && type === "railway")) return "rail";
    if ((cat === "boundary" && /national_park|protected_area/.test(type)) || (cat === "leisure" && type === "nature_reserve")) return "park";
    return "council";
  };
  NO.route = function (place, types) {
    place = place || {}; types = types || [];
    var st = place.state, council = NO.councilName(place.lga), to, why, cc = [];
    if (place.kind === "road") {
      to = { VIC: "Department of Transport and Planning", QLD: "Department of Transport and Main Roads", NSW: "Transport for NSW" }[st] || "The state roads authority";
      why = "Main road, looked after by the state"; if (council) cc.push(council);
    } else if (place.kind === "rail") {
      to = { VIC: "VicTrack", QLD: "Queensland Rail" }[st] || "The rail land owner"; why = "Rail land";
    } else if (place.kind === "park") {
      to = { VIC: "Parks Victoria", QLD: "Queensland Parks and Wildlife Service" }[st] || "The parks authority"; why = "National or state park";
    } else if (place.kind === "private") {
      to = "Private landowner"; why = "Private land";
    } else { to = council || "Your local council"; why = "Council street or land"; }
    var epa = types.filter(function (t) { return NO.T[t] && NO.T[t].epa; });
    if (st === "VIC" && epa.length) cc.push("EPA Victoria");
    return { to: to, why: why, cc: cc, epa: epa };
  };

  /* lookups: council boundary (ABS) + nearest street and land use (OpenStreetMap) */
  var cache = {};
  NO.lookup = function (lat, lon) {
    var key = lat.toFixed(4) + "," + lon.toFixed(4);
    if (cache[key]) return cache[key];
    var abs = fetch("https://geo.abs.gov.au/arcgis/rest/services/ASGS2023/LGA/MapServer/0/query?geometry=" + lon + "," + lat +
      "&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=lga_name_2023,state_name_2021&returnGeometry=false&f=json")
      .then(function (r) { return r.json(); })
      .then(function (j) { var a = j && j.features && j.features[0] && j.features[0].attributes; return a ? { lga: a.lga_name_2023, state: NO.STATES[a.state_name_2021] || "" } : {}; })
      .catch(function () { return {}; });
    var osm = fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=" + lat + "&lon=" + lon, { headers: { "Accept-Language": "en-AU" } })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var a = (j && j.address) || {};
        return { road: a.road || a.pedestrian || a.footway || a.path || "", house: a.house_number || "", suburb: a.suburb || a.town || a.village || a.city_district || a.hamlet || a.city || "",
          state2: NO.STATES[a.state] || "", kind: NO.landKind(j && j.category, j && j.type), feature: (j && j.name) || "" };
      })
      .catch(function () { return {}; });
    var p = Promise.all([abs, osm]).then(function (r) {
      var o = Object.assign({}, r[1], r[0]); if (!o.state) o.state = o.state2 || "";
      o.street = o.road ? (o.house ? o.house + " " : "") + o.road : "";
      o.ok = !!(o.lga || o.road || o.suburb); return o;
    });
    cache[key] = p; return p;
  };
  NO.search = function (q) {
    return fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=au&limit=5&q=" + encodeURIComponent(q), { headers: { "Accept-Language": "en-AU" } })
      .then(function (r) { return r.json(); })
      .then(function (a) { return (a || []).map(function (x) { return { label: x.display_name.replace(/, Australia$/, ""), lat: +x.lat, lon: +x.lon }; }); })
      .catch(function () { return []; });
  };

  /* ---------- recovery: what happens to each thing ---------- */
  NO.TMRC = {
    mattress: { single: { kg: 25, steel: 0.71, label: "Single" }, queen: { kg: 66, steel: 0.72, label: "Double or queen" }, king: { kg: 78, steel: 0.70, label: "King" } },
    couch: { "1": { kg: 40, steel: 0.25, timber: 0.30, label: "1 seater" }, "2": { kg: 55, steel: 0.1091, timber: 0.40, label: "2 seater" }, "3": { kg: 70, steel: 0.1143, timber: 0.40, label: "3 seater" } }
  };
  NO.FATE = {
    mattress: { how: "Recycled", where: "The Mattress Recycling Company", note: "Steel, foam and fabric separated" },
    couch: { how: "Reuse first", where: "Hard Waste Program", note: "Good pieces go to charity partners. The rest is pulled apart for steel and timber." },
    bags: { how: "Sorted", where: "Resource recovery centre", note: "Recyclables pulled out. What can't be recycled is landfilled." },
    whitegoods: { how: "Recycled", where: "Metal recycling", note: "Metals recovered" },
    ewaste: { how: "Recycled", where: "E-waste recycling", note: "E-waste can't go to landfill in Victoria" },
    tyres: { how: "Recycled", where: "Licensed tyre recycler", note: "" },
    rubble: { how: "Crushed for reuse", where: "Crushing and recycling", note: "" },
    green: { how: "Mulched", where: "Organics processing", note: "" },
    boxes: { how: "Recycled", where: "Cardboard and polystyrene recycling", note: "Polystyrene goes to Styro" },
    car: { how: "Recycled", where: "Licensed auto recycler", note: "" },
    other: { how: "Sorted", where: "Resource recovery centre", note: "" },
    hazard: { how: "Specialist removal", where: "Licensed contractor", note: "Never handled by the public" }
  };
  NO.defaultItems = function (types) {
    return types.map(function (t) {
      if (t === "mattress") return { t: t, size: "queen", qty: 1 };
      if (t === "couch") return { t: t, size: "3", qty: 1 };
      return { t: t, qty: 1 };
    });
  };
  NO.receipt = function (items) {
    var tot = { kg: 0, steel: 0, timber: 0 };
    var lines = (items || []).map(function (it) {
      var f = NO.FATE[it.t] || NO.FATE.other, T = NO.T[it.t] || {}, L = { t: it.t, qty: it.qty || 1, how: f.how, where: f.where, note: f.note, label: T.short || T.label || it.t };
      var spec = NO.TMRC[it.t] && NO.TMRC[it.t][it.size];
      if (spec) {
        L.label = spec.label + (it.t === "mattress" ? " mattress" : " couch");
        L.kg = spec.kg * L.qty; L.steel = Math.round(spec.kg * spec.steel * L.qty); L.timber = Math.round(spec.kg * (spec.timber || 0) * L.qty);
        tot.kg += L.kg; tot.steel += L.steel; tot.timber += L.timber;
      }
      return L;
    });
    return { lines: lines, tot: tot };
  };
  NO.receiptHTML = function (r, opts) {
    opts = opts || {};
    var rc = NO.receipt(r.items || NO.defaultItems(r.types)), c = NO.collectedAt(r);
    var rows = rc.lines.map(function (L) {
      var w = L.kg ? '<div class="rc-row sub"><span>' + L.kg + " kg</span><span>" + (L.steel ? "steel " + L.steel + " kg" : "") + (L.timber ? ", timber " + L.timber + " kg" : "") + "</span></div>" : "";
      return '<div class="rc-row"><span>' + (L.qty > 1 ? L.qty + " × " : "") + NO.esc(L.label) + "</span><b>" + NO.esc(L.how) + "</b></div>" + w +
        '<div class="rc-row sub"><span>' + NO.esc(L.where) + "</span></div>" + (L.note ? '<div class="rc-note">' + NO.esc(L.note) + "</div>" : "");
    }).join('<hr class="rc-hr">');
    var tot = rc.tot.kg ? '<hr class="rc-hr dbl"><div class="rc-row tot"><span>Weighed items</span><b>' + rc.tot.kg + ' kg</b></div><div class="rc-row tot"><span>Steel and timber recovered</span><b>' + (rc.tot.steel + rc.tot.timber) + " kg</b></div>" : "";
    return '<div class="receipt' + (opts.cls ? " " + opts.cls : "") + '"><div class="rc-head"><div class="rc-logo">no.com.au</div><div>RECOVERY RECEIPT</div></div>' +
      '<div class="rc-row sub"><span>' + NO.esc(r.id) + "</span><span>" + NO.esc(r.suburb || "") + "</span></div>" +
      '<div class="rc-row sub"><span>Collected</span><span>' + (c ? NO.when(c) : "Not yet") + "</span></div>" +
      '<div class="rc-row sub"><span>Time on the street</span><span>' + (c ? NO.human(c - r.created) : NO.human(Date.now() - r.created)) + "</span></div>" +
      '<hr class="rc-hr dbl">' + rows + tot +
      '<div class="rc-foot">' + (rc.tot.kg ? "Weights use The Mattress Recycling Company's per-item figures. " : "") + "Thanks for reporting it.</div></div>";
  };

  /* ---------- report state ---------- */
  NO.status = function (r) {
    var k = (r.events || []).map(function (e) { return e.k; });
    if (k.indexOf("collected") > -1) return "done";
    if (k.indexOf("scheduled") > -1) return "sched";
    if (k.indexOf("ack") > -1 || k.indexOf("passed") > -1) return "ack";
    return "open";
  };
  NO.LABEL = { open: "Sent, waiting", ack: "On it", sched: "Booked", done: "Collected" };
  NO.statusLabel = function (r) {
    var s = NO.status(r);
    if (s === "open") return "Sent, waiting";
    return NO.LABEL[s];
  };
  NO.collectedAt = function (r) { var e = (r.events || []).filter(function (e) { return e.k === "collected"; })[0]; return e ? e.t : null; };
  NO.overdue = function (r) { return NO.status(r) !== "done" && Date.now() > NO.due(r.created); };
  NO.chip = function (r) {
    var s = NO.status(r), lab = NO.statusLabel(r);
    if (s !== "done" && NO.overdue(r)) return '<span class="st st-late">Overdue</span>';
    return '<span class="st st-' + s + '">' + lab + "</span>";
  };
  NO.eventText = function (e, r) {
    switch (e.k) {
      case "reported": return "Reported by a resident";
      case "notified": return "Sent to " + e.to;
      case "cc": return "Copied to " + e.to;
      case "confirmed": return e.n + (e.n > 1 ? " more people" : " more person") + " reported the same pile";
      case "ack": return (e.by || r.to) + " is on it";
      case "passed": return "Passed to " + e.to + ". The clock keeps running.";
      case "scheduled": return "Collection booked for " + NO.dayl(e.at) + ", " + NO.hr(e.at) + " to " + NO.hr(e.at + 4 * H) + (e.crew ? " (" + e.crew + ")" : "");
      case "collected": return "Collected" + (e.by ? " by " + e.by : "");
      case "receipt": return "Recovery receipt issued";
      case "evidence": return "Evidence pack sent to " + e.to;
    }
    return e.k;
  };
  NO.addEvent = function (r, k, data) { r.events.push(Object.assign({ k: k, t: Date.now() }, data || {})); return r; };
  NO.newId = function () { return "NO-" + (24830 + Math.floor(Math.random() * 900)); };

  /* ---------- sample reports (relative to now) ---------- */
  var SAMPLE_DEF = [
    { id: "NO-24817", age: 21 * H + 14 * M, suburb: "Craigieburn VIC", state: "VIC", lga: "Hume", kind: "council", lat: -37.6012, lon: 144.9426, place: "Gravel verge beside a reserve",
      types: ["couch"], size: "trailer", photo: "1703296958227-d01823347876", alt: "Two couches dumped on a gravel verge", seen: "Yesterday",
      flow: [["confirmed", 2 * H, { n: 2 }], ["ack", 3 * H], ["scheduled", 4 * H, { crew: "Recycle Group crew" }]] },
    { id: "NO-24822", age: 41 * M, suburb: "Reservoir VIC", state: "VIC", lga: "Darebin", kind: "council", lat: -37.7158, lon: 145.0107, place: "Beside the street bins",
      types: ["bags"], size: "boot", photo: "1740471348165-2aac81fff608", alt: "Bags and clothes dumped beside street bins", seen: "Today", flow: [] },
    { id: "NO-24811", age: 5 * H + 12 * M, suburb: "Epping VIC", state: "VIC", lga: "Whittlesea", kind: "council", lat: -37.6497, lon: 145.0233, place: "Footpath outside the shops",
      types: ["couch"], size: "few", photo: "1681013106634-6e880f17a81f", alt: "An armchair left on a footpath", seen: "Today", flow: [["ack", 1 * H + 10 * M]] },
    { id: "NO-24806", age: 26 * H + 8 * M, suburb: "Sunshine VIC", state: "VIC", lga: "Brimbank", kind: "road", lat: -37.7883, lon: 144.8335, place: "Main road verge",
      types: ["rubble"], size: "truck", photo: "1773614359232-8eef10578150", alt: "A pile of broken concrete", seen: "This week",
      flow: [["ack", 6 * H, { by: "Department of Transport and Planning" }], ["scheduled", 8 * H, { crew: "Recycle Group crew" }]] },
    { id: "NO-24798", age: 3 * H + 5 * M, suburb: "Norlane VIC", state: "VIC", lga: "Greater Geelong", kind: "council", lat: -38.0945, lon: 144.3545, place: "Laneway behind houses",
      types: ["whitegoods"], size: "few", photo: "1764162694555-ead0298de316", alt: "An old fridge dumped in long grass", seen: "Today", flow: [] },
    { id: "NO-24790", age: 3 * D + 4 * H, suburb: "Corio VIC", state: "VIC", lga: "Greater Geelong", kind: "council", lat: -38.0702, lon: 144.3746, place: "Vacant industrial lot",
      types: ["tyres"], size: "truck", photo: "1709118960725-89f9f8042b09", alt: "A large pile of dumped tyres", seen: "This week",
      flow: [["passed", 5 * H, { to: "Private landowner", by: "City of Greater Geelong" }]] },
    { id: "NO-24781", age: 3 * D + 2 * H, suburb: "Werribee VIC", state: "VIC", lga: "Wyndham", kind: "council", lat: -37.8985, lon: 144.6620, place: "Park entrance",
      types: ["bags"], size: "boot", photo: "1631174755309-39c5cd515636", alt: "Bags, bottles and boxes dumped around a park bin", seen: "Today",
      flow: [["ack", 2 * H], ["scheduled", 3 * H, { crew: "Recycle Group crew" }], ["collected", 18 * H + 40 * M, { by: "Recycle Group crew" }]], items: [{ t: "bags", qty: 1 }] },
    { id: "NO-24772", age: 2 * D + 1 * H, suburb: "Broadmeadows VIC", state: "VIC", lga: "Hume", kind: "council", lat: -37.6815, lon: 144.9196, place: "Footpath",
      types: ["couch"], size: "few", photo: "1774524140294-6fad9e78b1a8", alt: "A grey couch left on a paved footpath", seen: "Today",
      flow: [["ack", 1 * H], ["scheduled", 1 * H + 30 * M, { crew: "Recycle Group crew" }], ["collected", 6 * H + 5 * M, { by: "Recycle Group crew" }]], items: [{ t: "couch", size: "3", qty: 1 }] },
    { id: "NO-24768", age: 4 * D + 3 * H, suburb: "Footscray VIC", state: "VIC", lga: "Maribyrnong", kind: "council", lat: -37.8001, lon: 144.8991, place: "Rear of the shops",
      types: ["boxes"], size: "trailer", photo: "1785484267277-0b0cd3c50015", alt: "Broken polystyrene and plaster dumped on concrete", seen: "Yesterday",
      flow: [["ack", 4 * H], ["collected", 26 * H + 10 * M, { by: "Council crew" }]], items: [{ t: "boxes", qty: 1 }] },
    { id: "NO-24760", age: 9 * H + 20 * M, suburb: "Logan Central QLD", state: "QLD", lga: "Logan", kind: "council", lat: -27.6389, lon: 153.1093, place: "Nature strip",
      types: ["mattress"], size: "few", photo: null, alt: "", seen: "Today", flow: [["ack", 2 * H]] },
    { id: "NO-24755", age: 5 * D + 6 * H, suburb: "Coburg VIC", state: "VIC", lga: "Merri-bek", kind: "rail", lat: -37.7469, lon: 144.9616, place: "Rail fence line",
      types: ["mattress", "bags"], size: "boot", photo: "1592890278983-18616401d4ed", alt: "Bags and rubbish piled around a bin by a fence", seen: "This week",
      flow: [["ack", 3 * H, { by: "VicTrack" }], ["scheduled", 5 * H, { crew: "Recycle Group crew" }], ["collected", 22 * H + 15 * M, { by: "Recycle Group crew" }]],
      items: [{ t: "mattress", size: "queen", qty: 2 }, { t: "bags", qty: 1 }] },
    { id: "NO-24749", age: 6 * D + 2 * H, suburb: "Chermside QLD", state: "QLD", lga: "Brisbane", kind: "council", lat: -27.3855, lon: 153.0306, place: "Beside the bins",
      types: ["couch"], size: "few", photo: "1722461073223-d2f5356e7c43", alt: "An armchair left beside wheelie bins", seen: "Today",
      flow: [["ack", 3 * H], ["collected", 28 * H, { by: "Council crew" }]], items: [{ t: "couch", size: "1", qty: 1 }] }
  ];
  var base = Date.now(), sampleCache = null;
  NO.samples = function () {
    if (sampleCache) return sampleCache.map(function (r) { return JSON.parse(JSON.stringify(r)); });
    sampleCache = SAMPLE_DEF.map(function (s) {
      var created = base - s.age, rt = NO.route({ lga: s.lga, state: s.state, kind: s.kind }, s.types);
      var r = { id: s.id, sample: true, created: created, suburb: s.suburb, state: s.state, lga: s.lga, kind: s.kind, lat: s.lat, lon: s.lon, place: s.place,
        types: s.types, size: s.size, photos: s.photo ? [s.photo] : [], alt: s.alt, seen: s.seen, blocking: false, notes: "", rego: "",
        to: rt.to, why: rt.why, cc: rt.cc, items: s.items || null, events: [] };
      r.events.push({ k: "reported", t: created });
      r.events.push({ k: "notified", t: created + 20e3, to: rt.to });
      rt.cc.forEach(function (c) { r.events.push({ k: "cc", t: created + 25e3, to: c }); });
      var next7 = function (t) { var d = new Date(t); d.setDate(d.getDate() + 1); d.setHours(7, 0, 0, 0); return d.getTime(); };
      var willCollect = s.flow.some(function (f) { return f[0] === "collected"; });
      s.flow.forEach(function (f) {
        var e = Object.assign({ k: f[0], t: created + f[1] }, f[2] || {});
        if (e.k === "scheduled") {
          e.at = next7(created);
          if (willCollect && e.at + 3 * H > base - 25 * M) { e.at = Math.max(created + 2 * H, base - 6 * H); e.at -= e.at % H; }
        }
        if (e.k === "collected") {
          var sc = r.events.filter(function (x) { return x.k === "scheduled"; })[0];
          var t = sc ? sc.at + 2 * H + 20 * M : Math.min(e.t, NO.due(created) - 40 * M);
          e.t = Math.max(created + 90 * M, Math.min(t, base - 25 * M));
        }
        if (e.k === "passed") r.to = e.to;
        r.events.push(e);
        if (e.k === "collected") r.events.push({ k: "receipt", t: e.t + 60e3 });
      });
      return r;
    });
    return NO.samples();
  };

  /* past reports for hotspot analysis (deterministic) */
  NO.history = function () {
    var seed = 20261004; var rnd = function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    var spots = [
      { name: "Reserve car park, Craigieburn", lat: -37.6012, lon: 144.9426, n: 7, types: ["couch", "mattress", "bags"] },
      { name: "Laneway behind shops, Reservoir", lat: -37.7158, lon: 145.0107, n: 6, types: ["bags", "boxes"] },
      { name: "Main road verge, Sunshine", lat: -37.7883, lon: 144.8335, n: 5, types: ["rubble", "tyres"] },
      { name: "Industrial estate, Corio", lat: -38.0702, lon: 144.3746, n: 4, types: ["tyres", "rubble", "car"] },
      { name: "Rail fence line, Coburg", lat: -37.7469, lon: 144.9616, n: 3, types: ["mattress", "bags"] }
    ];
    var out = [];
    spots.forEach(function (s) {
      for (var i = 0; i < s.n; i++) out.push({ name: s.name, lat: s.lat + (rnd() - 0.5) * 0.0016, lon: s.lon + (rnd() - 0.5) * 0.0016, daysAgo: Math.floor(rnd() * 30), t: s.types[Math.floor(rnd() * s.types.length)] });
    });
    for (var j = 0; j < 22; j++) out.push({ name: null, lat: -37.65 - rnd() * 0.25, lon: 144.75 + rnd() * 0.35, daysAgo: Math.floor(rnd() * 30), t: NO.TYPES[Math.floor(rnd() * 10)].id });
    return { spots: spots, points: out };
  };

  /* ---------- store (this browser only) ---------- */
  var KEY = "nocomau.v1", mem = null, subs = [];
  function read() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)); } catch (e) { mem = null; }
    if (!mem || !mem.mine) mem = { mine: [], patch: {} };
    return mem;
  }
  function write() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} subs.forEach(function (f) { try { f(); } catch (e) {} }); }
  NO.store = {
    all: function () {
      var d = read(), s = NO.samples().map(function (r) { return d.patch[r.id] ? d.patch[r.id] : r; });
      return d.mine.slice().reverse().concat(s);
    },
    mine: function () { return read().mine.slice().reverse(); },
    get: function (id) { return NO.store.all().filter(function (r) { return r.id === id; })[0] || null; },
    add: function (r) { read().mine.push(r); write(); },
    save: function (r) {
      var d = read();
      if (r.sample) d.patch[r.id] = r;
      else { var i = d.mine.map(function (x) { return x.id; }).indexOf(r.id); if (i > -1) d.mine[i] = r; else d.mine.push(r); }
      write();
    },
    reset: function () { mem = { mine: [], patch: {} }; write(); },
    purge: function (fn) { var d = read(); d.mine = d.mine.filter(function (r) { return !fn(r); }); write(); }
  };
  NO.onChange = function (f) { subs.push(f); };
  window.addEventListener("storage", function (e) { if (e.key === KEY) { mem = null; subs.forEach(function (f) { try { f(); } catch (x) {} }); } });

  /* ---------- live clocks ---------- */
  var clocks = [];
  NO.clockEl = function (el, from, until) { if (el) { clocks = clocks.filter(function (c) { return c.el !== el; }); clocks.push({ el: el, from: from, until: until || null }); el.textContent = NO.clock((until || Date.now()) - from); } };
  NO.tick = function () { var n = Date.now(); clocks = clocks.filter(function (c) { return c.el.isConnected; }); clocks.forEach(function (c) { c.el.textContent = NO.clock((c.until || n) - c.from); }); };
  setInterval(NO.tick, 1000);
  NO.bindClocks = function (root) {
    NO.$$("[data-from]", root).forEach(function (el) { NO.clockEl(el, +el.dataset.from, el.dataset.until ? +el.dataset.until : null); });
  };

  /* ---------- maps ---------- */
  var ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/";
  NO.satellite = function () { return L.tileLayer(ESRI + "World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics", maxNativeZoom: 19, maxZoom: 20 }); };
  NO.tiles = function (map, labels, mode) {
    var A = 'Tiles &copy; Esri &middot; Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    if (mode === "street") {
      map.getContainer().classList.add("street");
      return L.tileLayer(ESRI + "World_Street_Map/MapServer/tile/{z}/{y}/{x}", { attribution: "Tiles &copy; Esri, HERE, Garmin, OpenStreetMap contributors", maxNativeZoom: 19, maxZoom: 20 }).addTo(map);
    }
    var B = ESRI + "Canvas/World_Light_Gray_";
    L.tileLayer(B + "Base/MapServer/tile/{z}/{y}/{x}", { attribution: A, maxNativeZoom: 16, maxZoom: 19 }).addTo(map);
    if (labels !== false) L.tileLayer(B + "Reference/MapServer/tile/{z}/{y}/{x}", { maxNativeZoom: 16, maxZoom: 19 }).addTo(map);
  };
  /* fetch street tiles around a spot ahead of time, so a map opens already drawn */
  NO.warm = function (lat, lon, z, r) {
    var n = Math.pow(2, z), x = Math.floor((lon + 180) / 360 * n), la = lat * Math.PI / 180;
    var y = Math.floor((1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * n);
    for (var i = -r; i <= r; i++) for (var j = -r; j <= r; j++) { var im = new Image(); im.src = ESRI + "World_Street_Map/MapServer/tile/" + z + "/" + (y + j) + "/" + (x + i); }
  };
  NO.marker = function (r, extra) {
    var s = NO.status(r), late = s !== "done" && NO.overdue(r);
    return L.marker([r.lat, r.lon], Object.assign({ icon: L.divIcon({ className: "mk mk-" + (late ? "late" : s), html: "<i></i>", iconSize: [22, 22], iconAnchor: [11, 11] }), keyboard: true, title: r.id }, extra || {}));
  };

  /* photo compression for storage */
  NO.compress = function (file, max) {
    max = max || 900;
    return new Promise(function (res) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        var out; try { out = c.toDataURL("image/jpeg", 0.72); } catch (e) { out = url; }
        res(out);
      };
      im.onerror = function () { res(url); };
      im.src = url;
    });
  };

  /* ---------- page chrome ---------- */
  /* Inside Richard's version (tour.html) pages run in a frame: keep them still and calm */
  var inTour = false;
  try { inTour = window.self !== window.top; } catch (e) { inTour = true; }
  NO.inTour = inTour;
  NO.SPOT = { lat: -38.1385, lon: 144.3489 }; /* sample spot: Pakington St, Geelong West */
  NO.SAMPLE_PHOTO = "1703296958227-d01823347876";
  if (inTour) {
    document.documentElement.classList.add("in-tour");
    if (window.L && L.Map) L.Map.mergeOptions({ zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-menu]");
    if (b) { document.body.classList.toggle("menu-open"); b.setAttribute("aria-expanded", document.body.classList.contains("menu-open")); }
  });
})();
