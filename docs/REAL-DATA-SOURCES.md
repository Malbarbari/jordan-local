# Reviewed real tourism dataset and photographs

Reviewed 2026-10-09 (Asia/Amman). `data/tourism.real.json` contains 32 unique source-backed introductions, 17 local licensed photographs and six site pins taken from exact official-source map links. This is a curated snapshot, not a live booking feed. Every record has Arabic/English names and original short summaries, a location, type, category/tags, provenance, source URL and nullable facts. Currency is JOD; **all real prices are unknown**. No admission prices, capacity, opening hours, availability or safety certification were invented.

The original 16 synthetic activities and five additive demonstration records remain separate and clearly labelled. The new real tourism endpoint does not count fictional seed offers as verified data. Supabase mode additionally discovers genuine provider-submitted base records; those keep owner-declared provenance.

## Fact sources and listing coverage

| Primary source | Introductions supported |
| --- | --- |
| [Petra, Jordan Tourism Board](https://international.visitjordan.com/wheretogo/petra/) | Petra; Little Petra |
| [Umm Qais, JTB](https://international.visitjordan.com/wheretogo/umm-qais/) | Umm Qais/Gadara |
| [Ajloun, JTB](https://international.visitjordan.com/wheretogo/ajloun/) | Ajloun Castle; Forest Reserve; Roe Deer Trail; Summaga Café/Al Kifah Society |
| [Irbid, JTB](https://international.visitjordan.com/wheretogo/irbid/) and [Jordan EcoPark](https://jordanecopark.com/?lang=2) | EcoPark cabins in the northern Jordan Valley |
| [Pella, JTB](https://international.visitjordan.com/wheretogo/pella/) | Tabaqat Fahl/Pella |
| [Jordan Museums / Dar As-Saraya](https://museums.visitjordan.com/en/Museum/14) | Dar As-Saraya Museum, Irbid |
| [Government accessibility tourism booklet](https://hcd.gov.jo/EBV4.0/Root_Storage/EN/Tourism_Booklet_2.pdf) | Ajloun Cable Car introduction only; no current operational/accessibility guarantees |
| [RSCN Ajloun accommodation document](https://www.rscn.org.jo/uploaded_files/reservation/63e4ed7188aab1675947377.pdf) | Ajloun reserve cabins. Historical accommodation document; its 2022 prices were deliberately not reused |
| [Jerash, JTB](https://international.visitjordan.com/wheretogo/jerash/) | Archaeological city |
| [Dead Sea, JTB](https://international.visitjordan.com/wheretogo/the-dead-sea/) | Jordanian shore and floating introduction, no unverified medical claims |
| [Wadi Mujib, JTB](https://international.visitjordan.com/wheretogo/wadi-mujib/) | Mujib reserve; Siq water trail. Access, seasonal operation, supervision and age rules require operator confirmation |
| [Madaba, JTB](https://international.visitjordan.com/wheretogo/madaba/) | Ma'in springs; St. George mosaic church; Archaeological Park; Mount Nebo; Carob Farms' farming experience |
| [As-Salt, JTB](https://international.visitjordan.com/wheretogo/as-salt/) | Historic city |
| [Amman, JTB](https://international.visitjordan.com/wheretogo/amman/) | Citadel; Roman Theatre; Iraq Al-Amir |
| [Wadi Rum, JTB](https://international.visitjordan.com/wheretogo/wadi-rum/) | Desert destination |
| [Aqaba, JTB](https://international.visitjordan.com/wheretogo/aqaba/) | Diving/snorkelling introduction; Aqaba Castle. No unverified dive operator or price |
| [Dana/Feynan, JTB](https://international.visitjordan.com/wheretogo/dana-feynan/) | Dana reserve; Dana village |
| [RSCN Rummana](https://www.rscn.org.jo/activities-view/1) | Rummana Campsite, with RSCN provider identity; no current booking claim |
| [EcoHotels](https://ecohotels.me/) | Feynan Ecolodge and its actual operator identity |

Public destinations have no business/provider owner. Curated commercial introductions reference real, source-supported provider names and stable internal UUIDs. SQL provisions those businesses without an Auth owner; that does not establish that the operator has joined this app or endorsed it. `source_checked` on the tourism provider refers to the published identity/introduction, not certified safety, account ownership or partnership. The separate businesses table retains `unverified` for those unclaimed profiles.

No suitable current quote was verified with sufficient ticket/group/night rules, so null prices remain null. These records are discoverable without hard price/capacity conditions; adding such conditions excludes unconfirmed rows. Licensed-image availability does not establish current physical condition.

## Photos and rights

No JTB, resort, booking-site or operator photography was copied. Every photograph was selected against its exact Wikimedia Commons file description, fetched only after inspecting the file's stated reusable licence, and stored under `public/images/tourism/`. Credits and licence/source links are visible per card. Full evidence is in `data/tourism.images.json`: author, licence/version, licence URL, Commons file page, original URL, download URL, checked date and display changes.

| Local file | Creator | Selected licence |
| --- | --- | --- |
| petra.jpg | Faraheed | CC BY-SA 3.0 |
| umm-qais.jpg | Samir I. Sharbaty | CC BY-SA 3.0 |
| ajloun-castle.jpg | Bashar Tabbah | CC BY-SA 4.0 |
| ajloun-forest.jpg | Krzysztof Ziarnek, Kenraiz | CC BY-SA 4.0 |
| pella.jpg | Mohammad hajeer | CC BY-SA 4.0 |
| dead-sea.jpg | Faris El-Gwely | CC BY-SA 3.0 |
| wadi-mujib.jpg | Berthold Werner | CC BY 3.0 |
| main.jpg | Davide Mauro | CC BY-SA 4.0 |
| jerash.jpg | Michael Gunther | CC BY-SA 3.0 |
| amman-citadel.jpg | David Bjorgen | CC BY 2.5 |
| roman-theatre.jpg | Dosseman | CC BY-SA 4.0 |
| wadi-rum.jpg | Bernard Gagnon | CC BY-SA 3.0 |
| dana-village.jpg | Bernard Gagnon | CC BY-SA 3.0 |
| aqaba-castle.jpg | Alexey Komarov | CC BY 3.0 |
| mount-nebo.jpg | Faris El-Gwely | CC BY-SA 4.0 |
| cable-car.jpg | Randa107 | CC BY-SA 4.0 |
| little-petra.jpg | Carole Raddato | CC BY-SA 2.0 |

Images use Wikimedia-generated thumbnails and responsive CSS display cropping; no other edits were made. Preserve creator credit, exact source/licence links and change notices. Share-alike photo versions retain their image licence; do not claim exclusive ownership. These are existing place photographs, not proof of current conditions. Where a suitable reusable photo was not confirmed, the app displays a neutral “no confirmed licensed photo” placeholder rather than substituting another location or synthetic photography.

## Coordinates and maintenance

Six site pins (Umm Qais, Ajloun Castle, Ajloun Reserve, Ma'in, Mount Nebo and Madaba Archaeological Park) use the place latitude/longitude encoded in exact maps linked by JTB. Coordinates were not taken from the map viewport centre or camera GPS. Their map URLs are stored per record. Repeated generic trail/visitor-centre pins were not reused for other destinations. No directions, route distances or live map feature is implied.

`scripts/tourism-seed.mjs` regenerates the reviewed JSON and SQL locally without network/database writes. Its review date is fixed to the actual manual review; do not refresh that date without checking the facts. `scripts/import-tourism-images.mjs` performs explicit missing-file image preparation using manually selected file titles, allowed licences and local JPEG validation; it is never called during build or user requests. Existing photos are retained, and licensing must be reviewed again before adding/changing assets.
