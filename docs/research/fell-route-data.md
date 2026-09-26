# Route-level data for the 214 Wainwright fell pages: sources, licences, completeness

Research for Andesphere/wainwright-tracker#43. Accessed 2026-09-26. Live data probes were run on the same day (OSM snapshot `timestamp_osm_base` 2026-09-26T04:02Z).

## Question

Fell pages on wainwrightsbaggers.com (commercial, paid Pro tier) show only summit data from a CC BY 4.0 catalogue. Which sources could give each of the 214 fells route-level detail (common start points, parking, public transport, GPX tracks or ascent lines)? Under what licence, how complete and accurate is each, can it be used commercially with attribution, and does it need field checks by a walker before publishing?

## Short answer

1. **Use OpenStreetMap (ODbL 1.0) for the path network and ascent lines.** It is the only openly licensed source that reaches every summit. In the live probe, all 214 DoBIH Wainwright summits have a mapped OSM path, track or bridleway within 100 m, and 205 have one within 25 m. For 210 of the 214, the summit's path network connects to a mapped car park without leaving paths or tracks.
2. **Add UK government open data (all OGL v3, commercial use allowed with attribution) as separate layers:** NaPTAN for bus stops, Bus Open Data Service for timetables, LDNPA public rights of way for legal status, Natural England CRoW access land, and OS Terrain 50 and OS Open Names for heights and place names. Keep each layer single-source. Then the OGL layers stay outside ODbL share-alike.
3. **Write your own ascent text.** The Wainwright books, Walking Englishman, WalkLakes, Hill Bagging logs, the Wainwright Society site and the GitHub Wainwright repos found here have no open licence, so none of their route text or GPX can be reused.
4. **Licence consequence:** map images and your own prose are ODbL "Produced Works" and need only an OSM attribution notice. Any GPX download, or any stored route dataset offered to users, is a Derivative Database. It must be published under ODbL, and you cannot stop buyers from sharing it. Selling GPX in Pro is allowed, but the data can't be kept exclusive.
5. **Field checks: yes, but targeted.** Every route should be desk-verified. A walker should field-check a prioritised subset first (the flagged summits below, the start points and car parks, and any pathless or scramble ascent) before those pages are shown as "verified". Push corrections back to OSM. That improves the data and removes most ODbL alteration-file bookkeeping.

---

## Per-source findings

### 1. OpenStreetMap (path network, parking, peaks, bus stops)

**What it has.** A tagged path network (`highway=path|footway|track|bridleway`), summit nodes (`natural=peak`), car parks (`amenity=parking`), bus stops (`highway=bus_stop`), difficulty tags (`sac_scale`), visibility (`trail_visibility`) and UK rights-of-way tags (`designation`).

**Licence.** ODbL 1.0 ([openstreetmap.org/copyright](https://www.openstreetmap.org/copyright)). ODbL grants rights that "explicitly include commercial use, and do not exclude any field of endeavour" ([ODbL 1.0 text](https://opendatacommons.org/licenses/odbl/1-0/)).

**Commercial use.** Yes. Obligations depend on Produced Work versus Derivative Database; see "Licence obligations" below.

**Attribution wording.** Credit "OpenStreetMap" in a way that makes clear the data comes from OSM, linked to `https://www.openstreetmap.org/copyright`. "© OpenStreetMap contributors" is still acceptable. On interactive maps it usually goes in a map corner and may collapse or fade after 5 seconds. For databases it goes in the readme or metadata ([OSMF Attribution Guidelines, adopted 2021-06-25](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines)).

**Completeness in the Lakes (live probe, 2026-09-26).**

Bounding box 54.20,-3.45,54.72,-2.68 via [Overpass API](https://overpass-api.de/api/interpreter):

| Measure | Count |
|---|---|
| `highway=path` or `footway` ways | 20,679 |
| of those with `sac_scale` | 1,152 (5.6%) |
| of those with `trail_visibility` | 285 (1.4%) |
| path/footway/bridleway/track ways with a `designation` (PRoW) tag | 7,561 |
| `amenity=parking` (nodes, ways, relations) | 2,519 |
| `highway=bus_stop` nodes | 1,091 |
| `natural=peak` nodes | 910 |
| `route=hiking` relations | 60 |

**Per-summit check for all 214 Wainwrights.** Method: summits from DoBIH (`W=1`, 214 rows). OSM path, track, bridleway and footway geometry was downloaded for 54.33,-3.46,54.75,-2.73 (22,136 ways, from the maps.mail.ru Overpass mirror because overpass-api.de timed out). Car parks and bus stops came from a slightly wider box.

| Check | Result |
|---|---|
| OSM `natural=peak` node within 50 m of the DoBIH summit | 213/214. Bonscale Pike's nearest peak node is 135 m away (DoBIH and OSM likely pick different tops). |
| Nearest mapped path/track within 25 m / 50 m / 100 m | 205 / 211 / 214 |
| Largest summit-to-path gaps | Great End 94 m, Broom Fell 72 m, Shipman Knotts 60 m, Pavey Ark 47 m, Ling Fell 36 m, Hart Crag 36 m |
| A path within 100 m carries `sac_scale` | 111/214 |
| Summit's path/track component reaches a car park (within 150 m) using only paths, tracks and bridleways | 210/214. Not connected: Raven Crag, Low Fell, Fellbarrow, Great Mell Fell. Roads were excluded from the graph, so these most likely join via a lane. Unverified. |
| Straight-line summit to nearest mapped car park | median 1.7 km, max 4.8 km |
| Straight-line summit to nearest mapped bus stop | median 2.4 km, max 8.8 km |

Spot checks by name (peak node present, path ways within 60 m): Scafell Pike 4, Helvellyn 3, Hen Comb 1, Lank Rigg 1, Mungrisdale Common 3, Great Borne 4, Mellbreak 1, Gowbarrow Fell 7, Caw Fell 3, Loadpot Hill 1, Starling Dodd 3.

**Quality caveats from the same probe.**
- Car park tagging is uneven. Of 2,546 parking features, only 256 have a `name`. 1,245 are tagged `access=private|customers|no`, so hotel and farm car parks are mixed in. 1,269 have `fee`, and 586 have `capacity`. Choosing "the" start car park needs human curation.
- 1,108 of 1,152 OSM bus stops carry `naptan:AtcoCode`. They largely mirror NaPTAN, so use NaPTAN directly (source 3).
- Difficulty tags are sparse (5.6% of paths). `sac_scale` is an Alpine scale ("hiking", "mountain_hiking", "demanding_mountain_hiking", "alpine_hiking" = hands needed, UIAA I, and so on), and the OSM wiki gives no UK-specific calibration ([Key:sac_scale](https://wiki.openstreetmap.org/wiki/Key:sac_scale)). Don't derive a published difficulty grade from it without checking.
- Positional accuracy of OSM paths against the ground was not measured. Presence near the summit is not proof that the mapped line is the usual ascent, or that it exists on the ground.

**Verdict.** Primary source for ascent lines, path networks and candidate start points. Complete enough to build a route for every fell. Not reliable enough to publish difficulty, visibility or car park details unchecked.

### 2. Ordnance Survey OpenData (OGL v3)

**Licence.** OS uses the Open Government Licence for OS OpenData, with its own attribution statement: "Contains OS data © Crown copyright [and database right] [year]". The same acknowledgement must pass into any sub-licences ([OS copyright acknowledgements](https://www.ordnancesurvey.co.uk/business-government/licensing-agreements/copyright-acknowledgements)). OGL v3 allows you to "exploit the Information commercially and non-commercially" and requires attribution. It excludes personal data, third-party rights, logos, trademarks and similar ([OGL v3](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)).

**What the open products have, and don't have, for routes.**
- **OS Open Zoomstack.** Layers: airports, boundaries, buildings, contours (10 m), electricity transmission lines, foreshore, greenspace, land, names, National Parks, railway stations, rail, roads ("a metalled way for vehicles"), sea, sites, surface water, urban areas, waterlines, woodland. No paths, rights of way or car parks ([List of layers](https://docs.os.uk/os-downloads/products/maps-and-imagery-portfolio/os-open-zoomstack/os-open-zoomstack-technical-specification/list-of-layers.md)). Updated every six months ([product page](https://www.ordnancesurvey.co.uk/products/os-open-zoomstack)).
- **OS OpenMap Local.** Feature types: Building, CarChargingPoint, ElectricityTransmissionLine, Foreshore, FunctionalSite, Glasshouse, ImportantBuilding, MotorwayJunction, NamedPlace, RailwayStation/Track/Tunnel, Road, RoadTunnel, Roundabout, SurfaceWater, TidalBoundary, TidalWater, Woodland. No path or car park feature type ([feature types index](https://docs.os.uk/os-downloads/llms.txt); [RoadClassification code list](https://docs.os.uk/os-downloads/products/maps-and-imagery-portfolio/os-openmap-local/os-openmap-local-technical-specification/code-lists/roadclassification.md)).
- **OS Open Roads.** Road network only (not verified field by field here).
- **OS Open Names.** Includes local types "Hill Or Mountain", "Valley" and "Named Road" ([LocalTypeValue](https://docs.os.uk/os-downloads/products/addresses-and-names-portfolio/os-open-names/os-open-names-technical-specification/code-lists/localtypevalue.md)). Useful for naming start points (valleys, hamlets, roads).
- **OS Terrain 50.** 50 m grid and 10 m contours, "verified to be 4m RMSE" ([overview](https://docs.os.uk/os-downloads/products/land-and-terrain-portfolio/os-terrain-50/os-terrain-50-overview.md)). Good enough for route ascent totals and elevation profiles, not for summit heights (use DoBIH for those).
- **OS Open Greenspace, OS Open UPRN.** Not relevant to fell routes (not examined in detail).
- **OS Detailed Path Network** was the OS product for National Park paths and rights of way, not an open one. Its final publication was October 2025 and full withdrawal is **30 September 2026**, with "no direct replacement" ([End of Life notice](https://docs.os.uk/os-downloads/resources/product-resources/end-of-life-product-notices/end-of-life-notice-os-detailed-path-network.md); [product details](https://docs.os.uk/os-downloads/products/transport-network-portfolio/os-detailed-path-network/os-detailed-path-network-overview/product-details.md)). Don't plan around it.

**Verdict.** OS OpenData has no footpath network, so it can't supply routes. Use it only for elevation (Terrain 50), names (Open Names) and, optionally, a basemap.

### 3. NaPTAN: bus stops (OGL v3)

**What it has.** "The national dataset for uniquely identifying all public transport access points in England, Scotland and Wales" ([NaPTAN](https://beta-naptan.dft.gov.uk/)).

**Licence.** OGL v3, publisher DfT, updated daily, XML/CSV ([data.gov.uk NaPTAN](https://www.data.gov.uk/dataset/ff93ffc1-6656-47d8-9155-85ea0b8f2251/national-public-transport-access-nodes-naptan)).

**Attribution.** OGL default: "Contains public sector information licensed under the Open Government Licence v3.0."

**Live probe.** `https://naptan.api.dft.gov.uk/v1/access-nodes?atcoAreaCodes=090&dataFormat=csv` returned 5,365 Cumbria (ATCO 090) nodes. In an approximate Lake District box in British National Grid (E 305,000–365,000, N 482,000–540,000) there are 1,972 stops: 1,455 active and 517 inactive, mostly on-street bus stops (BCT). Lat/long columns were empty in this extract; easting/northing were populated. Many records were last modified 2013–2021, so check stop status as well as location.

**Verdict.** Use it for "nearest bus stop to start point", filtered on `Status=active`. It is authoritative for stop identity. It says nothing about which services run or when.

### 4. Bus Open Data Service (BODS): timetables (OGL)

**What it has.** Timetables, fares and vehicle locations for every local bus service in England, as TransXChange and GTFS, updated daily ([DfT Find Transport Data listing](https://findtransportdata.dft.gov.uk/dataset/bus-open-data---download-all-timetable-data--18335fb19c4)).

**Licence.** UK OGL (same listing).

**Unverified.** `data.bus-data.dft.gov.uk` returned 403 to automated fetches. Whether downloads need a registered account was not confirmed from the primary page.

**Verdict.** Use it for "which services serve this stop, and seasonally when". Lake District services are seasonal, so re-import on a schedule and never hard-code times into page text.

### 5. LDNPA Public Rights of Way (OGL)

**What it has.** Registered rights of way managed by the LDNPA ("over 3,200 miles"), derived from Cumbria's Definitive Map. It is a Shapefile plus a WFS, last updated 2024-01-25 ([data.gov.uk: LDNPA Public Rights Of Way](https://www.data.gov.uk/dataset/767931ee-c98a-4030-bb87-eb6b6512fb1f/ldnpa-public-rights-of-way)). Downloaded and parsed: 2,944 line features, with fields `NUMBER_` and `Type_Text`: FP 2,235, BW 651, BOAT 37, RB 21 ([shapefile](https://volunteering.lake-district.gov.uk/PublishedGIS/LDNPA_PROW.shz)).

**Licence.** UK OGL. Caveat from the publisher: "provided for information only and must not be relied on for legal, statutory or any other formal purposes". It excludes Bowness, Keswick and Ambleside (same listing). The data is OS-derived, so add the OS attribution as well (per source 2).

**Completeness for summits.** Only 116/214 Wainwright summits have a PRoW within 100 m, and 203/214 within 1 km. Most high-fell ascents use paths on open access land rather than rights of way. PRoW data is therefore a legal-status overlay, not a route source.

**Council definitive map (Cumberland / Westmorland and Furness).** No current council open-data download was found. A third-party copy on rowmaps.com was obtained from Cumbria County Council in 2017 under OGL v3, with attribution "Data has been provided by the council of Cumbria" ([rowmaps CU](https://www.rowmaps.com/datasets/CU/)). It is stale (pre-2023 reorganisation). Prefer the LDNPA layer.

**Verdict.** Use it as a separate "public right of way" overlay layer. Don't merge its attributes into OSM paths (that would trigger share-alike on the merged layer; see below).

### 6. Natural England CRoW access land (OGL)

Access land (open country and registered common land) under the CRoW Act 2000, available as SHP, GPKG, GeoJSON and via APIs. Licence OGL, with attribution "© Natural England copyright. Contains Ordnance Survey data © Crown copyright and database right [year]" ([data.gov.uk: CRoW Act 2000 – Access Layer](https://www.data.gov.uk/dataset/05fa192a-06ba-4b2b-b98c-5b6bec5ff638/crow-act-2000-access-layer2)).

**Verdict.** A useful overlay to show that an off-PRoW ascent line is on access land. Keep it as its own layer.

### 7. Lake District National Park Authority open data (other)

The data.gov.uk catalogue lists 8 LDNPA datasets, all OGL: conservation areas, Article 4 directions, Local Plan 2021, brownfield register, TPOs, rights of way, park boundary, World Heritage Site ([CKAN search "LDNPA"](https://ckan.publishing.service.gov.uk/api/3/action/package_search?q=LDNPA)). There is **no car park dataset**. Only the rights of way layer and the park boundary are relevant.

### 8. Database of British and Irish Hills (DoBIH)

**What it has.** Summit data only: name, height, grid reference, classification (column `W` flags exactly 214 Wainwrights), plus links to Hill Bagging. No routes.

**Licence (verified).** "The Database of British and Irish Hills is licensed under a Creative Commons Attribution 4.0 International Licence. Our preferred method of attribution is to reference The Database of British and Irish Hills v18.6 (or other version) and link to www.hill-bagging.co.uk/dobih" ([DoBIH downloads](https://www.hills-database.co.uk/downloads.html)). Commercial use is allowed.

**Note.** The page states the current release is v18.6 (11 September 2026), but `hillcsv.zip` downloaded today contains `DoBIH_v18_3.csv`. Check which version the site's catalogue uses and cite that version.

**Verdict.** Probably already the "existing catalogue". It gives no route detail.

### 9. Hill Bagging (hill-bagging.co.uk)

It lets users "share starting points and route descriptions for each hill" through ascent logs ([About](https://www.hill-bagging.co.uk/about/)). Hill pages show user logs under "© Hill Bagging CIC 2026" with no open licence ([Hen Comb page](https://www.hill-bagging.co.uk/hill-view/?qu=S&rf=2481)). The CC BY 4.0 licence covers the DoBIH database, not the user-contributed logs.

**Verdict.** Not reusable. The DoBIH CC BY licence doesn't extend to logs.

### 10. The Wainwright Society

It publishes challenge books, member magazine, reprints and similar, but no fell data, routes or GPX were found on the site. The site states that copyright in Wainwright material "remains with the Estate of A. Wainwright" and thanks "the Estate of A. Wainwright and Frances Lincoln" for permission. The T&Cs contain no open licence ([home](https://www.wainwright.org.uk/); [T&Cs](https://wainwright.org.uk/the-wainwright-society-terms-conditions/)).

**Verdict.** Not a data source. A possible partner, but any use needs permission.

### 11. The Pictorial Guides (Frances Lincoln / Quarto)

They are still in print as Walkers Editions revised by Clive Hutchby ([Quarto: The Northern Fells (Walkers Edition)](https://www.quarto.com/books/9780711236585/the-northern-fells-walkers-edition)). UK copyright lasts 70 years from the end of the year the author dies ([CDPA 1988 s.12(2)](https://www.legislation.gov.uk/ukpga/1988/48/section/12)). Wainwright died in 1991, which would put expiry at the end of 2061 (**death year not verified against a primary source in this pass**). The revised editions carry newer copyrights on top.

**Verdict.** Don't copy ascent descriptions, diagrams or route selections word for word or trace them. Facts such as "a path leaves Seathwaite" are not protected, but the expression and drawings are.

### 12. Community GPX and route sites

| Source | What it has | Terms found | Verdict |
|---|---|---|---|
| Walking Englishman | "Complete the Wainwrights in 36 walks" with maps | "Copyright © 2003-2026 Walking Englishman. All rights reserved", and "My walk reports are not route guides" ([page](https://www.walkingenglishman.com/walkingthewainwrights.html)) | Not reusable |
| WalkLakes | Walk reports and routes | Own text and images: "Please ask permission before copying"; hill data CC BY 3.0; maps OS/OSM ([copyright](https://www.walklakes.co.uk/copyright.html)) | Not reusable without permission |
| Out and About Adventures | "Free GPX" for all 214 ([page](https://outandaboutadventures.com/Wainwrights.php)) | No licence statement found | Treat as all rights reserved |
| GitHub Wainwright repos (graemefox/lakedistrict-wainwrights, clayton-rossiter/flask-wainwrights, DanielWaller/Wainwrights, Bmack1915/…, others) | Summit lists and apps; no curated route GPX sets found | No licence on any (GitHub search, 2026-09-26) | Not reusable. No licence means all rights reserved. |
| FKT "Wainwrights 214" GPX, Komoot collections | Round-route GPX | Terms not verified (fetch failed / not checked) | Unverified. Don't use. |

---

## Licence obligations for the recommended combination

### ODbL: Produced Work vs Derivative Database

- **Produced Work**: "a work (such as an image, audiovisual material, text, or sounds) resulting from using the whole or a Substantial part of the Contents (via a search or other query)". **Derivative Database**: "any translation, adaptation, arrangement, modification, or any other alteration of the Database or of a Substantial part of the Contents" ([ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)).
- OSMF test: "If the published result of your project is intended for the extraction of the original data, then it is a database and not a Produced Work." PNG, JPG, PDF and SVG images and printed maps are usually Produced Works. Database dumps are usually not ([Produced Work guideline, endorsed 2014-06-06](https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline)).
- Creating a Produced Work "does not create a Derivative Database for purposes of Section 4.4" (ODbL 4.5b). Internal use of a Derivative Database is not public (4.5c).
- **Substantial**: fewer than 100 features is insubstantial, but "repeated small extractions" count as one big extraction ([Substantial guideline](https://osmfoundation.org/wiki/Licence/Community_Guidelines/Substantial_-_Guideline)). Extracting routes systematically for 214 fells is Substantial.

### What each planned output triggers

| Output | ODbL class | Obligation |
|---|---|---|
| Map image or vector-rendered map on the fell page, route line drawn on it | Produced Work | OSM attribution notice on or next to the map (ODbL 4.3; Attribution Guidelines). Your map styling and page stay under your own terms. |
| Your own prose ("Start at the NT car park at Seathwaite, follow the path up Sourmilk Gill…") written from looking at the data | Produced Work (text) | OSM attribution on the page. The text itself is yours. |
| Distance and ascent figures computed from OSM geometry plus OS Terrain 50 | Produced Work if shown as numbers on a page | OSM attribution plus OS attribution |
| **Downloadable GPX of a route** built from OSM path geometry | **Derivative Database.** A GPX is intended for extracting the coordinates, so it is not a Produced Work. | ODbL 4.2: publish it under ODbL, include the licence URI or notice, keep notices intact. 4.4: share-alike. 4.7: you may not impose terms or technical measures that restrict ODbL rights. Paying for access is fine, but a buyer may redistribute the GPX. If you lock it inside the app, 4.7b requires you to also make an unrestricted copy available "without additional fee". |
| Your internal route store (OSM way IDs, geometry, your curated start point and route labels) | Derivative Database if it alters or adds to OSM content | Internal use: no share-alike (4.5c). Once Produced Works *from* it are public, 4.6 applies: offer recipients, free of charge over the internet, the whole Derivative Database **or** "a file containing all of the alterations made … or the method of making the alterations (such as an algorithm), including any additional Contents". |
| Format conversion, bbox or tag filtering, simplification, routing or graph algorithms on OSM data alone | "Trivial transformation": no need to publish the result, provided you tell users where to get the equivalent OSM data ([Trivial Transformations guideline](https://osmfoundation.org/wiki/Licence/Community_Guidelines/Trivial_Transformations_-_Guideline)) | Caution: that page still says "This is at the proposal stage", while the [guideline index](https://osmfoundation.org/wiki/Licence/Community_Guidelines) lists it among the guidelines. Treat it as persuasive, not settled. |

### Keeping OGL layers outside share-alike

- **Horizontal layers**: if all data for a feature type comes from non-OSM sources, share-alike doesn't reach it. It does apply if you mix OSM and non-OSM data for the same feature type, or use your data to correct OSM ([Horizontal Map Layers guideline](https://osmfoundation.org/wiki/Licence/Community_Guidelines/Horizontal_Map_Layers_-_Guideline)).
- **Collective Database**: OSM and non-OSM data in one database stay independent if they don't reference each other, or if non-OSM data fully supplies a feature type or property within a regional cut. Mixing your list with OSM's for the same type and de-duplicating is *not* covered ([Collective Database guideline, endorsed 2016-06-17](https://osmfoundation.org/wiki/Licence/Community_Guidelines/Collective_Database_Guideline_Guideline)).

Practical rules for the fell pages:
1. **Bus stops**: all NaPTAN, never OSM bus stops. That layer stays OGL.
2. **Rights of way and access land**: all LDNPA and Natural England, as separate overlays. Don't write `designation` onto OSM ways in your store.
3. **Car parks and start points**: pick one source per layer. Either (a) use OSM parking and accept ODbL on that layer (low cost), or (b) keep a hand-curated start-point list made from field visits and OS Open Names, with **no** OSM coordinates copied in. Don't de-duplicate your list against OSM.
4. **Route lines**: OSM geometry, so the GPX is ODbL. Your non-OSM properties of the route (name, description, season notes) fully supplied by you can be kept separate as a property layer (Collective Database guideline, "adds a property … uses … no OSM data"). Whether a hand-picked list of OSM way IDs forming "the Seathwaite ascent" counts as independent data or a derivative is not settled. See open questions.
5. **Upstream corrections**: when a walker finds a mapped path is wrong, fix OSM itself rather than patching your copy. The alteration file then stays small or empty.

### Attribution block (combined)

For fell pages and the map, a footer or map-corner credit linked as indicated:

```
Map data © OpenStreetMap contributors (openstreetmap.org/copyright), ODbL.
Contains OS data © Crown copyright and database right 2026.
Contains public sector information licensed under the Open Government Licence v3.0 (NaPTAN, Bus Open Data Service, Lake District National Park Authority).
© Natural England copyright. Contains Ordnance Survey data © Crown copyright and database right 2026.
Summit data: The Database of British and Irish Hills v18.x (hill-bagging.co.uk/dobih), CC BY 4.0.
```

GPX files: include ODbL notice text and the URI `https://opendatacommons.org/licenses/odbl/1-0/` in the GPX `<metadata>` (`<copyright>` / `<link>`) and in the download page text, plus "© OpenStreetMap contributors".

---

## Field-check recommendation

**Yes, before a route is labelled as recommended.** Reasons from the evidence:
- OSM proximity (214/214 within 100 m) shows a path is mapped near the summit, not that it is the usual, safe or legal ascent. Difficulty tags cover 5.6% of paths and visibility tags 1.4%.
- Car parks are poorly described in OSM: 10% are named, and half are private or customer-only.
- LDNPA PRoW data is "for information only" and 2.5 years old. It excludes three towns. Bus services are seasonal.

Suggested tiers:
1. **Desk check for all 214 before launch.** Route line from start to summit on OSM, cross-checked against the PRoW and access-land layers and Terrain 50 profile. Car park confirmed as public (operator, fee). Nearest active NaPTAN stop with at least one BODS service.
2. **Walker field check first for:** summits with the largest path gaps (Great End, Broom Fell, Shipman Knotts, Pavey Ark); the four not connected via paths or tracks (Raven Crag, Low Fell, Fellbarrow, Great Mell Fell); Bonscale Pike (summit position mismatch); any route whose line crosses `sac_scale` of `demanding_mountain_hiking` or above, or that you describe as a scramble; and every start car park you name.
3. **Publish with a status field** ("desk-verified" / "walked on [date]") and a report-a-problem link. Push geometry fixes to OSM.

---

## Open questions

1. Is a curated list of OSM way IDs, defining "the recommended ascent from X", independent data (Collective Database) or a Derivative Database? The guidelines don't settle it. **Recommendation:** assume derivative and publish the route GPX/GeoJSON under ODbL. The cost is low, since the routes are OSM geometry anyway.
2. Will Pro sell GPX downloads? If yes, product and pricing copy must not promise exclusivity, and in-app-only delivery needs a parallel unrestricted copy (ODbL 4.7b). **Recommendation:** sell convenience (offline maps, tracking) and treat GPX as a free or low-friction ODbL file.
3. Does BODS bulk download require an account, and what are its portal terms beyond OGL? The portal returned 403 to automated fetches. Unverified.
4. Is there a current Cumberland or Westmorland and Furness definitive map download (post-2023)? None was found. The LDNPA layer (2024-01-25) is the best open copy.
5. Wainwright's death year (1991) and so the copyright term were not verified against a primary source.
6. Which DoBIH version does the existing catalogue cite? The site says v18.6, but the CSV zip is v18.3.
7. Positional accuracy of OSM paths in the Lakes was not measured. A sample comparison against walked GPS traces would quantify it.
8. Terms for the FKT Wainwrights GPX and Komoot collections were not checked. Assume they can't be used.

---

## Sources (all accessed 2026-09-26)

Licences and guidelines
- ODbL 1.0 full text: https://opendatacommons.org/licenses/odbl/1-0/
- OSM copyright page: https://www.openstreetmap.org/copyright
- OSMF Attribution Guidelines: https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
- OSMF Community Guidelines index: https://osmfoundation.org/wiki/Licence/Community_Guidelines
- Produced Work guideline: https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline
- Substantial guideline: https://osmfoundation.org/wiki/Licence/Community_Guidelines/Substantial_-_Guideline
- Horizontal Map Layers guideline: https://osmfoundation.org/wiki/Licence/Community_Guidelines/Horizontal_Map_Layers_-_Guideline
- Trivial Transformations guideline: https://osmfoundation.org/wiki/Licence/Community_Guidelines/Trivial_Transformations_-_Guideline
- Collective Database guideline: https://osmfoundation.org/wiki/Licence/Community_Guidelines/Collective_Database_Guideline_Guideline
- Regional Cuts guideline: https://osmfoundation.org/wiki/Licence/Community_Guidelines/Regional_Cuts_-_Guideline
- Open Government Licence v3.0: https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
- CDPA 1988 s.12: https://www.legislation.gov.uk/ukpga/1988/48/section/12

Ordnance Survey
- Copyright acknowledgements: https://www.ordnancesurvey.co.uk/business-government/licensing-agreements/copyright-acknowledgements
- OS Open Zoomstack product page: https://www.ordnancesurvey.co.uk/products/os-open-zoomstack
- OS Open Zoomstack layers: https://docs.os.uk/os-downloads/products/maps-and-imagery-portfolio/os-open-zoomstack/os-open-zoomstack-technical-specification/list-of-layers.md
- OS docs index (OpenMap Local feature types): https://docs.os.uk/os-downloads/llms.txt
- OS OpenMap Local RoadClassification: https://docs.os.uk/os-downloads/products/maps-and-imagery-portfolio/os-openmap-local/os-openmap-local-technical-specification/code-lists/roadclassification.md
- OS Open Names LocalTypeValue: https://docs.os.uk/os-downloads/products/addresses-and-names-portfolio/os-open-names/os-open-names-technical-specification/code-lists/localtypevalue.md
- OS Terrain 50 overview: https://docs.os.uk/os-downloads/products/land-and-terrain-portfolio/os-terrain-50/os-terrain-50-overview.md
- OS DPN product details: https://docs.os.uk/os-downloads/products/transport-network-portfolio/os-detailed-path-network/os-detailed-path-network-overview/product-details.md
- OS DPN End of Life notice: https://docs.os.uk/os-downloads/resources/product-resources/end-of-life-product-notices/end-of-life-notice-os-detailed-path-network.md

Transport
- NaPTAN: https://beta-naptan.dft.gov.uk/
- NaPTAN on data.gov.uk: https://www.data.gov.uk/dataset/ff93ffc1-6656-47d8-9155-85ea0b8f2251/national-public-transport-access-nodes-naptan
- NaPTAN API (Cumbria 090 CSV): https://naptan.api.dft.gov.uk/v1/access-nodes?atcoAreaCodes=090&dataFormat=csv
- BODS listing: https://findtransportdata.dft.gov.uk/dataset/bus-open-data---download-all-timetable-data--18335fb19c4

Rights of way and access
- LDNPA Public Rights of Way: https://www.data.gov.uk/dataset/767931ee-c98a-4030-bb87-eb6b6512fb1f/ldnpa-public-rights-of-way
- LDNPA PRoW shapefile: https://volunteering.lake-district.gov.uk/PublishedGIS/LDNPA_PROW.shz
- data.gov.uk CKAN search "LDNPA": https://ckan.publishing.service.gov.uk/api/3/action/package_search?q=LDNPA
- Natural England CRoW Access Layer: https://www.data.gov.uk/dataset/05fa192a-06ba-4b2b-b98c-5b6bec5ff638/crow-act-2000-access-layer2
- rowmaps Cumbria: https://www.rowmaps.com/datasets/CU/

Hill and route sites
- DoBIH downloads and licence: https://www.hills-database.co.uk/downloads.html
- DoBIH CSV: https://www.hills-database.co.uk/hillcsv.zip
- Hill Bagging about: https://www.hill-bagging.co.uk/about/
- Hill Bagging Hen Comb: https://www.hill-bagging.co.uk/hill-view/?qu=S&rf=2481
- Wainwright Society: https://www.wainwright.org.uk/ and https://wainwright.org.uk/the-wainwright-society-terms-conditions/
- Quarto, Northern Fells Walkers Edition: https://www.quarto.com/books/9780711236585/the-northern-fells-walkers-edition
- Walking Englishman: https://www.walkingenglishman.com/walkingthewainwrights.html
- WalkLakes copyright: https://www.walklakes.co.uk/copyright.html
- Out and About Adventures: https://outandaboutadventures.com/Wainwrights.php
- OSM wiki Key:sac_scale: https://wiki.openstreetmap.org/wiki/Key:sac_scale

Live data
- Overpass API: https://overpass-api.de/api/interpreter (counts, per-peak spot checks)
- Overpass mirror used for the bulk geometry pull: https://maps.mail.ru/osm/tools/overpass/api/interpreter
- Working files (not published): /tmp/fellres/ (DoBIH CSV, OSM extracts, LDNPA PRoW, NaPTAN CSV, analysis scripts)
