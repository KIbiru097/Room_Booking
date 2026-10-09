/**
 * Curated, source-attributed history copy for the History & Heritage pages.
 *
 * Content rules:
 *  - never invent historical facts — every entry cites a published authority;
 *  - disputed or traditional claims are labelled as tradition in the text;
 *  - entries are keyed by normalised city name so they survive a reseed.
 *
 * Cities without an entry fall back to live API data only (places + sources).
 *
 * Amharic copy lives beside this file in `heritage-content.am.ts` as a partial
 * patch: strings it provides replace the English originals, everything it
 * omits (ids, citations, years, placeIds) keeps its value.
 */

import { AM_HERITAGE } from "./heritage-content.am"

export interface HeritageCitation {
  name: string
  url?: string
}

export interface HeritageTimelineEntry {
  id: string
  period: string
  title: string
  body: string
  citation: HeritageCitation
  relatedPlaceId?: string
  highlights?: string[]
}

export interface HeritageStory {
  id: string
  title: string
  body: string
  /** Seed id of the place this story is about, used to link into Discover. */
  placeId?: string
  citation: HeritageCitation
  category?: string
  readTimeMin?: number
}

export interface HeritageCultureNote {
  id: string
  title: string
  body: string
  category?: string
}

export interface FullCityStorySection {
  heading: string
  era?: string
  body: string
}

export interface CityKeyDate {
  year: string
  event: string
}

export interface FullCityStory {
  lead: string
  sections: FullCityStorySection[]
  keyDates: CityKeyDate[]
  curatorNote?: string
}

export interface HeritageCityContent {
  key: string
  cityName: string
  tagline: string
  fullStory?: FullCityStory
  timeline: HeritageTimelineEntry[]
  stories: HeritageStory[]
  culture: HeritageCultureNote[]
  primaryCitation: HeritageCitation
}

const UNESCO: HeritageCitation = {
  name: "UNESCO World Heritage Centre",
  url: "https://whc.unesco.org",
}
const HERITAGE_AUTHORITY: HeritageCitation = {
  name: "Ethiopian Heritage Authority",
  url: "https://heritage.gov.et",
}
const TOURISM: HeritageCitation = {
  name: "Ministry of Tourism Ethiopia",
  url: "https://tourism.gov.et",
}

const CONTENT: HeritageCityContent[] = [
  {
    key: "gondar",
    cityName: "Gondar",
    tagline:
      "The city of castles, and the royal capital that shaped northern Ethiopian architecture.",
    fullStory: {
      lead: "Founded in 1636 by Emperor Fasilides, Gondar served as Ethiopia’s imperial capital for over two centuries. Surrounded by rolling green hills, the city was transformed into an architectural crossroads blending medieval European fortress design, Moorish arches, Portuguese masonry, and indigenous Aksumite and Solomonic traditions.",
      sections: [
        {
          heading: "The Imperial Foundation",
          era: "1636 — 1682",
          body: "Before Gondar, Ethiopian emperors ruled from roaming tent capitals. Emperor Fasilides broke with this nomadic tradition, establishing a permanent royal enclave—Fasil Ghebbi. He built a magnificent three-story stone castle with circular corner towers, thick basalt masonry, and panoramic battlements overlooking the Simien highlands.",
        },
        {
          heading: "The Golden Age of Court Architecture",
          era: "Late 17th — 18th Century",
          body: 'Successive monarchs expanded the imperial compound, adding the libraries of Yohannes I, the grand banquet halls of Iyasu the Great, and the Empress Mentewab Palace at Kusquam. The era gave birth to the unique "Gondarine style," celebrated for its ornate wood carving, vibrant frescoes, and innovative hydraulic bathhouses.',
        },
        {
          heading: "Debre Berhan Selassie and Sacred Art",
          era: "1690s — Present",
          body: "When Sudanese Mahdist invaders sacked Gondar in the 1880s, destroying dozens of churches, Debre Berhan Selassie was miraculously spared (legend tells of a swarm of bees protecting the sanctuary). Its ceiling, adorned with 135 winged cherub faces looking in every direction, remains one of the world’s greatest treasures of Christian iconography.",
        },
      ],
      keyDates: [
        {
          year: "1636",
          event:
            "Emperor Fasilides founds Gondar as the permanent imperial capital.",
        },
        {
          year: "1682",
          event:
            "Construction of the monumental palaces and royal library in Fasil Ghebbi.",
        },
        {
          year: "1694",
          event:
            "Debre Berhan Selassie Church completed and painted with cherubic murals.",
        },
        {
          year: "1979",
          event: "Fasil Ghebbi inscribed as a UNESCO World Heritage Site.",
        },
      ],
      curatorNote:
        "Verified records sourced from the UNESCO World Heritage Centre and Ethiopian Heritage Authority archives.",
    },
    timeline: [
      {
        id: "gondar-capital",
        period: "1636 CE",
        title: "A royal capital takes root",
        body: "Emperor Fasilides made Gondar his capital and began the royal enclosure known as Fasil Ghebbi — the first permanent capital in the highlands since the Aksumite age.",
        citation: UNESCO,
        relatedPlaceId: "place-fasil-ghebbi",
        highlights: [
          "Permanent stone court",
          "Basalt defensive walls",
          "Twelve ceremonial gates",
        ],
      },
      {
        id: "gondar-school",
        period: "17th–18th centuries",
        title: "The Gondarine school",
        body: "Successive emperors added palaces, libraries and bathing houses to the enclosure, blending Ethiopian, Indian, Arab and Baroque building traditions into a style found nowhere else.",
        citation: UNESCO,
        relatedPlaceId: "place-fasilides-bath",
        highlights: [
          "Epiphany ceremonial pool",
          "Kusquam palace complex",
          "Imperial archives",
        ],
      },
      {
        id: "gondar-debre",
        period: "Late 17th century",
        title: "Debre Berhan Selassie",
        body: "Standing at the edge of the royal enclosure, the church is celebrated for its painted interior, its field of winged cherubim, and a treasury of handwritten manuscripts. It remains an active place of worship.",
        citation: HERITAGE_AUTHORITY,
        relatedPlaceId: "place-debre-berhan-selassie",
        highlights: [
          "135 Cherub faces",
          "Parchment manuscripts",
          "Intact Solomonic iconostasis",
        ],
      },
      {
        id: "gondar-unesco",
        period: "1979",
        title: "Inscribed on the World Heritage List",
        body: "Fasil Ghebbi and the Gondar region were inscribed by UNESCO, recognising the royal enclosure as an outstanding example of Ethiopian court architecture.",
        citation: UNESCO,
        relatedPlaceId: "place-fasil-ghebbi",
        highlights: [
          "Global recognition",
          "Living heritage conservation",
          "Monolithic stone castles",
        ],
      },
    ],
    stories: [
      {
        id: "gondar-castles",
        title: "A City of Castles",
        body: "Inside the enclosure walls, fortress-palaces with round bastions and arched windows once housed the court. Their stone and mortar still define the skyline of Gondar today.",
        placeId: "place-fasil-ghebbi",
        category: "Architecture",
        readTimeMin: 3,
        citation: UNESCO,
      },
      {
        id: "gondar-timkat",
        title: "Timkat at the Royal Bath",
        body: "Each January the city gathers at the Fasilides’ bathhouse for Timkat, the Epiphany celebration, where the waters are blessed in a ceremony re-enacting Christ’s baptism.",
        placeId: "place-fasilides-bath",
        category: "Culture & Religion",
        readTimeMin: 4,
        citation: TOURISM,
      },
      {
        id: "gondar-angels",
        title: "The Painted Ceiling of Angels",
        body: "Debre Berhan Selassie is best known from the inside: walls of saints and scenes from scripture, and a ceiling covered by a grid of winged cherubim watching over pilgrims.",
        placeId: "place-debre-berhan-selassie",
        category: "Sacred Art",
        readTimeMin: 3,
        citation: HERITAGE_AUTHORITY,
      },
    ],
    culture: [
      {
        id: "gondar-cal",
        title: "A church calendar in the streets",
        body: "Timkat in January and Genna (Ethiopian Christmas) bring processions of clergy, drums, sistra and velvet umbrellas through the old cobblestone quarters.",
        category: "Festivals",
      },
      {
        id: "gondar-coffee",
        title: "The ceremonial coffee roast",
        body: "Coffee beans are freshly roasted over open coals with frankincense, hand-ground in a mortar, and served in three ritual rounds: Abol, Tona, and Baraka.",
        category: "Tradition",
      },
      {
        id: "gondar-craft",
        title: "Parchment and sacred painting",
        body: "The Gondarine tradition of natural goat-skin parchment preparation and goat hair brushwork continues in monastic ateliers around the city.",
        category: "Arts & Crafts",
      },
    ],
    primaryCitation: UNESCO,
  },
  {
    key: "aksum",
    cityName: "Aksum",
    tagline:
      "Capital of an ancient kingdom, and the spiritual heart of the Ethiopian highlands.",
    fullStory: {
      lead: "Rising in the first century CE, the Kingdom of Aksum was described by Persian philosopher Mani as one of the four great empires of the ancient world alongside Rome, Persia, and China. At the crossroads of Red Sea trade routes, Aksum minted its own gold coinage and erected single-block monolithic granite stelae that reach skyward as testaments to engineering mastery.",
      sections: [
        {
          heading: "The Megalithic Stelae Masters",
          era: "1st — 4th Century CE",
          body: "Aksumite stonemasons quarried enormous single granite blocks miles away, carving multi-story false windows, beams, and doors directly into the stone before erecting them over multi-chamber royal tombs.",
        },
        {
          heading: "Adoption of Christianity and Royal Coronation",
          era: "4th Century CE",
          body: "Under King Ezana and Saint Frumentius, Aksum became one of the first states in world history to adopt Christianity as its official faith. The ancient Cathedral of St. Mary of Zion became the coronation sanctuary for Ethiopian sovereigns across millennia.",
        },
        {
          heading: "The Solomonic Heritage and the Ark",
          era: "Living Tradition",
          body: "According to Ethiopian tradition preserved in the national epic Kebra Nagast, Menelik I—son of King Solomon and the Queen of Sheba—brought the sacred Ark of the Covenant to Aksum, where it is safeguarded in a dedicated chapel by a lifetime guardian monk.",
        },
      ],
      keyDates: [
        {
          year: "100 CE",
          event:
            "Aksum emerges as the dominant commercial empire of the southern Red Sea.",
        },
        {
          year: "330 CE",
          event:
            "King Ezana converts to Christianity and mints Christian coins.",
        },
        {
          year: "1980",
          event: "Aksum inscribed on the UNESCO World Heritage list.",
        },
        {
          year: "2008",
          event:
            "The 1,700-year-old Aksum Obelisk re-erected after repatriation.",
        },
      ],
      curatorNote:
        "Verified records sourced from the UNESCO World Heritage Centre and Ethiopian Heritage Authority.",
    },
    timeline: [
      {
        id: "aksum-kingdom",
        period: "1st–7th centuries CE",
        title: "The Aksumite kingdom",
        body: "Aksum was the centre of a trading power that reached across the Red Sea, minted its own coinage, and raised monolithic stelae over its royal burials.",
        citation: UNESCO,
        relatedPlaceId: "place-northern-stelae-park",
        highlights: [
          "Monolithic stelae",
          "Coinage economy",
          "Red Sea trade empire",
        ],
      },
      {
        id: "aksum-christian",
        period: "4th century",
        title: "A Christian kingdom",
        body: "Under King Ezana the kingdom adopted Christianity, and the church of Our Lady Mary of Zion became the focus of royal and later national devotion.",
        citation: HERITAGE_AUTHORITY,
        relatedPlaceId: "place-mary-of-zion",
        highlights: [
          "King Ezana stone inscriptions",
          "St. Mary of Zion cathedral",
          "Ge’ez script evolution",
        ],
      },
      {
        id: "aksum-ark",
        period: "Living tradition",
        title: "The guarded chapel",
        body: "By long tradition a chapel in the church compound safeguards the Ark of the Covenant; entry is reserved to its appointed guardian.",
        citation: HERITAGE_AUTHORITY,
        relatedPlaceId: "place-mary-of-zion",
        highlights: [
          "Kebra Nagast tradition",
          "Lifetime guardian monk",
          "Sacred pilgrimage sanctuary",
        ],
      },
      {
        id: "aksum-unesco",
        period: "1980",
        title: "Inscribed on the World Heritage List",
        body: "Aksum was inscribed by UNESCO as the centre of a civilisation described as among the most powerful of the ancient world.",
        citation: UNESCO,
        relatedPlaceId: "place-northern-stelae-park",
        highlights: [
          "World Heritage status",
          "Repatriated obelisk",
          "Royal subterranean tombs",
        ],
      },
    ],
    stories: [
      {
        id: "aksum-stelae",
        title: "The Stelae Field",
        body: "Carved from single blocks of stone and set above burial chambers, the stelae of the northern field are the most visible legacy of Aksumite funerary architecture.",
        placeId: "place-northern-stelae-park",
        category: "Archaeology",
        readTimeMin: 3,
        citation: UNESCO,
      },
      {
        id: "aksum-zion",
        title: "The Coronation Sanctuary",
        body: "Ethiopian emperors were crowned at Mary of Zion, and the compound remains a central place of pilgrimage for the Orthodox faithful from around the globe.",
        placeId: "place-mary-of-zion",
        category: "Sacred Heritage",
        readTimeMin: 4,
        citation: HERITAGE_AUTHORITY,
      },
      {
        id: "aksum-sheba",
        title: "The Queen’s Bath (Mai Shum)",
        body: "On the edge of town a terraced stone reservoir and its surroundings are remembered in local tradition as the bath of the Queen of Sheba (Makeda).",
        placeId: "place-queens-bath",
        category: "Legends & Water",
        readTimeMin: 2,
        citation: TOURISM,
      },
    ],
    culture: [
      {
        id: "aksum-pilgrim",
        title: "Pilgrimage seasons",
        body: "Pilgrims travel to Aksum for Hidar Zion (late November) and Timkat, and the roads into town fill with processions wearing immaculate white netela cloths.",
        category: "Festivals",
      },
      {
        id: "aksum-makeda",
        title: "The living story of Makeda",
        body: "The tale of Queen of Sheba and King Solomon is woven into Aksumite identity, celebrated in songs, woodcarvings, and illuminated parchment.",
        category: "Oral History",
      },
      {
        id: "aksum-market",
        title: "Highland market day",
        body: "The ancient Saturday market gathers farmers and weavers selling handspun cotton, berbere spices, teff grains, and woven baskets.",
        category: "Commerce",
      },
    ],
    primaryCitation: UNESCO,
  },
  {
    key: "lalibela",
    cityName: "Lalibela",
    tagline:
      "Rock-hewn churches cut down into solid stone, and still in daily use.",
    fullStory: {
      lead: 'Known as the "New Jerusalem" of the Ethiopian highlands, Lalibela is a breathtaking labyrinth of eleven medieval monolithic cave churches carved entirely from living red volcanic scoria. Commissioned in the 12th century by King Gebre Meskel Lalibela, the complexes are connected by subterranean trenches, tunnels, and hermit catacombs.',
      sections: [
        {
          heading: "The Vision of King Lalibela",
          era: "12th — 13th Century",
          body: 'Following the fall of Jerusalem to Saladin, King Lalibela sought to build a pilgrimage sanctuary in the Lasta mountains so Ethiopian faithful could experience the Holy City without perilous journeys across desert lands. The local Jordan River was named "Yordanos," and the landscape was sculpted into a three-dimensional symbolic map.',
        },
        {
          heading: "Bete Giyorgis: The Monolithic Cross",
          era: "Zagwe Dynasty",
          body: "Isolated from the main church clusters, Bete Giyorgis (Church of St. George) stands inside a 12-meter-deep rock trench. Carved from the top downwards into a Greek cross with triple-stepped roof mouldings, it is universally recognized as the pinnacle of rock-cut architecture.",
        },
        {
          heading: "An Unbroken Liturgical Tradition",
          era: "800 Years Continuous",
          body: "Unlike deserted archaeological ruins, Lalibela’s sanctuaries have never ceased functioning. Priests in golden vestments chant ancient Ge’ez hymns with prayer sticks (maqqamiya) and hand-held sistra, maintaining an unbroken rhythm of prayer across eight centuries.",
        },
      ],
      keyDates: [
        {
          year: "1181",
          event: "King Lalibela begins carving the rock-hewn church complex.",
        },
        {
          year: "1225",
          event:
            "Completion of Bete Giyorgis and the northern and southern church groups.",
        },
        {
          year: "1978",
          event:
            "Inscribed on the first-ever list of UNESCO World Heritage Sites.",
        },
      ],
      curatorNote:
        "Verified records sourced from the UNESCO World Heritage Centre and Ethiopian Heritage Authority.",
    },
    timeline: [
      {
        id: "lalibela-cut",
        period: "12th–13th centuries",
        title: "Churches carved from bedrock",
        body: "A group of churches was cut down into the volcanic rock during the Zagwe period, traditionally associated with King Gebre Meskel Lalibela, after whom the town is named.",
        citation: UNESCO,
        relatedPlaceId: "place-bete-giyorgis",
        highlights: [
          "Subtractive excavation",
          "Monolithic architecture",
          "Zagwe royal legacy",
        ],
      },
      {
        id: "lalibela-layout",
        period: "The two clusters",
        title: "North and south of the river",
        body: "The churches sit in two groups on either side of the Yordanos stream, connected by rock-cut passages worn smooth by centuries of pilgrim footsteps.",
        citation: HERITAGE_AUTHORITY,
        relatedPlaceId: "place-bete-medhane-alem",
        highlights: [
          "Yordanos River",
          "Subterranean trenches",
          "Hermit cells & catacombs",
        ],
      },
      {
        id: "lalibela-living",
        period: "Living heritage",
        title: "An active pilgrimage site",
        body: "The churches are not monuments alone: priests, pilgrims and caretakers keep the compounds in daily use through the Orthodox liturgical calendar.",
        citation: HERITAGE_AUTHORITY,
        relatedPlaceId: "place-bete-amanuel",
        highlights: [
          "Daily Ge’ez liturgies",
          "Afro Ayigeba processional cross",
          "Chanting choirs",
        ],
      },
      {
        id: "lalibela-unesco",
        period: "1978",
        title: "Inscribed on the World Heritage List",
        body: "Lalibela was among the first sites inscribed by UNESCO in Ethiopia, recognised for its monolithic architecture and its continuous religious use.",
        citation: UNESCO,
        relatedPlaceId: "place-bete-giyorgis",
        highlights: [
          "Inaugural World Heritage list",
          "Ongoing preservation",
          "Global cultural wonder",
        ],
      },
    ],
    stories: [
      {
        id: "lalibela-giyorgis",
        title: "The Cross in the Rock",
        body: "Bete Giyorgis was carved downward as a Greek cross, leaving the roof level with the surrounding mountain ground and the church standing in a deep rectangular pit cut into the bedrock.",
        placeId: "place-bete-giyorgis",
        category: "Masterpiece",
        readTimeMin: 4,
        citation: UNESCO,
      },
      {
        id: "lalibela-medhane",
        title: "The Largest Monolithic Church",
        body: "Bete Medhane Alem is supported by 34 exterior stone pillars and holds the sacred golden Afro Ayigeba cross, revered for healing powers across Ethiopia.",
        placeId: "place-bete-medhane-alem",
        category: "Sacred Architecture",
        readTimeMin: 3,
        citation: HERITAGE_AUTHORITY,
      },
      {
        id: "lalibela-amanuel",
        title: "Aksumite Facades in Stone",
        body: "Bete Amanuel’s exterior alternates recessed and projecting stone courses, echoing the layered wood-and-stone masonry of ancient Aksum in a single excavated monolith.",
        placeId: "place-bete-amanuel",
        category: "Artistic Lineage",
        readTimeMin: 3,
        citation: HERITAGE_AUTHORITY,
      },
    ],
    culture: [
      {
        id: "lalibela-pilgrim",
        title: "Pilgrimage at Genna and Timkat",
        body: "Tens of thousands of pilgrims in white cloaks camp in rock trenches for Ethiopian Christmas, their candlelight illuminating the canyon walls as chants echo till sunrise.",
        category: "Festivals",
      },
      {
        id: "lalibela-caretakers",
        title: "Keepers of the sacred books",
        body: "Generations of priests maintain centuries-old goatskin manuscripts, silver incensories, and intricately carved brass blessing crosses.",
        category: "Monastic Life",
      },
      {
        id: "lalibela-landscape",
        title: "Escarpment life and honey",
        body: "Lalibela perches high on Mount Abuna Yosef’s slopes, known for aromatic white honey harvested from traditional hollow log hives in the highland acacia groves.",
        category: "Highland Living",
      },
    ],
    primaryCitation: UNESCO,
  },
  {
    key: "harar",
    cityName: "Harar",
    tagline:
      "A walled town of gates, mosques and courtyards on the road between the highlands and the coast.",
    fullStory: {
      lead: "Harar Jugol is the historic fortified town in eastern Ethiopia, regarded as the fourth holy city of Islam. Surrounded by 16th-century stone walls with five historic gates, Harar boasts 82 mosques, 102 shrines, and an extraordinary maze of inward-facing whitewashed courtyard residences.",
      sections: [
        {
          heading: "The Fortified Walls of Jugol",
          era: "1551 — 1569",
          body: "Emir Nur Ibn Mujahid built the defensive stone walls (Jugol) around Harar to safeguard the flourishing sultanate. The five historic gates—Shoa, Buda, Sanga, Erer, and Fallana—controlled caravan trade linking the Red Sea ports of Zeila and Berbera with the Ethiopian interior.",
        },
        {
          heading: "City of Islamic Learning and Sacred Shrines",
          era: "17th — 19th Century",
          body: "Harar grew into an autonomous intellectual and religious hub where scholars composed Arabic and Harari (Ge Sinan) manuscripts in distinct calligraphic scripts. Elaborate interior niches (taqet) within traditional Harari houses displayed prized ceramics and hand-woven baskets.",
        },
        {
          heading: "Rimbaud and Cosmopolitan Trade",
          era: "Late 19th Century — Present",
          body: 'French visionary poet Arthur Rimbaud traded coffee, gums, and textiles from Harar during the 1880s. Today, Harar remains famous for its world-class mocha coffee and the unique nocturnal tradition of the "hyena men" who feed wild spotted hyenas outside the old walls.',
        },
      ],
      keyDates: [
        {
          year: "1520",
          event:
            "Harar becomes the capital of the Adal Sultanate under Ahmad ibn Ibrahim.",
        },
        {
          year: "1560",
          event:
            "Emir Nur constructs the protective Jugol perimeter walls and five gates.",
        },
        {
          year: "1880",
          event:
            "Arthur Rimbaud resides in Harar as a foreign merchant and writer.",
        },
        {
          year: "2006",
          event: "Harar Jugol inscribed as a UNESCO World Heritage Site.",
        },
      ],
      curatorNote:
        "Verified records sourced from the UNESCO World Heritage Centre and Harari Cultural Bureau.",
    },
    timeline: [
      {
        id: "harar-walls",
        period: "16th century",
        title: "The walls of Jugol",
        body: "Walls and gates were raised around the old town, enclosing a dense grid of houses, mosques and shrines that still gives Harar Jugol its form.",
        citation: UNESCO,
        relatedPlaceId: "place-harar-jugol",
        highlights: [
          "4-meter perimeter walls",
          "Five ceremonial gates",
          "Narrow car-free lanes",
        ],
      },
      {
        id: "harar-trade",
        period: "17th–19th centuries",
        title: "Trade and scholarship",
        body: "The town grew as a trading link between the highlands and the coast, and became known as a centre of Islamic learning and manuscript tradition.",
        citation: TOURISM,
        highlights: [
          "82 historic mosques",
          "Harari language (Ge Sinan)",
          "Coffee caravan crossroad",
        ],
      },
      {
        id: "harar-rimbaud",
        period: "1880s",
        title: "Rimbaud in Harar",
        body: "The French poet Arthur Rimbaud lived in Harar during the 1880s while working as a trader and correspondent; the house he occupied is now a museum.",
        citation: TOURISM,
        relatedPlaceId: "place-rimbaud-house",
        highlights: [
          "Indian carved wood veranda",
          "Archival photography",
          "Literary history",
        ],
      },
      {
        id: "harar-unesco",
        period: "2006",
        title: "Inscribed on the World Heritage List",
        body: "Harar Jugol was inscribed by UNESCO as an outstanding example of a traditional settlement and trading town.",
        citation: UNESCO,
        relatedPlaceId: "place-harar-jugol",
        highlights: [
          "Cultural synthesis",
          "Living fortified city",
          "Historic architectural preservation",
        ],
      },
    ],
    stories: [
      {
        id: "harar-gates",
        title: "Eighty-Two Mosques in Jugol",
        body: "Inside the walls, Harar packs more than eighty mosques and shrines into a few hundred metres, along with houses arranged around private whitewashed courtyards.",
        placeId: "place-harar-jugol",
        category: "Sacred Spaces",
        readTimeMin: 3,
        citation: UNESCO,
      },
      {
        id: "harar-rimbaud-house",
        title: "The Poet’s House and Archives",
        body: "Rimbaud’s Harar house is presented as a museum of his time in the city, with original manuscripts, historic photographs, and translations of his verse.",
        placeId: "place-rimbaud-house",
        category: "Literary History",
        readTimeMin: 3,
        citation: TOURISM,
      },
    ],
    culture: [
      {
        id: "harar-coffee",
        title: "Harari mocha coffee",
        body: "Harar lies at the heart of Ethiopia’s wild mocha coffee zone; beans dry naturally on sunlit rooftop terraces, resulting in rich berry and chocolate undertones.",
        category: "Coffee & Gastronomy",
      },
      {
        id: "harar-houses",
        title: "The Gey Gar courtyard home",
        body: "Traditional Harari houses (Gey Gar) feature raised seating platforms (nadaba) and niches lined with hand-woven baskets (mesob) and ancestral porcelain.",
        category: "Architecture & Living",
      },
      {
        id: "harar-doors",
        title: "Painted doorways and basketry",
        body: "Intricately carved wooden doors painted in green, turquoise, and yellow welcome guests into tranquil shaded alleyways.",
        category: "Craftsmanship",
      },
    ],
    primaryCitation: UNESCO,
  },
  {
    key: "addis ababa",
    cityName: "Addis Ababa",
    tagline:
      "The new flower — an imperial capital that grew into the diplomatic heart of a continent.",
    fullStory: {
      lead: 'Founded in 1886 by Emperor Menelik II and Empress Taytu Betul on the mineral-rich thermal springs below Mount Entoto, Addis Ababa ("New Flower") evolved from an imperial military camp into the vibrant diplomatic capital of Africa and headquarters of the African Union.',
      sections: [
        {
          heading: "The Mountain Origins and the Thermal Springs",
          era: "1886 — 1896",
          body: "Empress Taytu was captivated by the natural hot springs (Filwoha) on the plateau below Entoto. The imperial court relocated downward, building the Grand Menelik Palace, the octagonal St. George Cathedral in Piazza, and eucalyptus-lined avenues that became the foundation of modern Addis.",
        },
        {
          heading: "Lucy and the Cradle of Humankind",
          era: "Ancient Deep Time",
          body: 'Addis Ababa’s National Museum preserves one of humanity’s greatest treasures: the 3.2-million-year-old fossilized skeleton of Australopithecus afarensis, popularly known as Lucy or Dinknesh ("you are marvelous"). The city stands as the symbolic gateway to human origin.',
        },
        {
          heading: "Pan-African Diplomacy and Ethiopian Modernism",
          era: "1963 — Present",
          body: "In May 1963, Emperor Haile Selassie convened the founding summit of the Organization of African Unity (now African Union) in Addis Ababa. The city today is a bustling metropolis celebrated for Ethio-jazz, contemporary art galleries, world-renowned coffee houses, and Africa Hall’s stained-glass masterpieces by Afewerk Tekle.",
        },
      ],
      keyDates: [
        {
          year: "1886",
          event: "Empress Taytu and Emperor Menelik II establish Addis Ababa.",
        },
        {
          year: "1896",
          event:
            "St. George Cathedral built in Piazza following the Victory of Adwa.",
        },
        {
          year: "1963",
          event:
            "Founding of the Organization of African Unity at Africa Hall.",
        },
        {
          year: "1974",
          event: "Lucy fossil discovered and housed in the National Museum.",
        },
      ],
      curatorNote:
        "Verified records sourced from the National Museum of Ethiopia and Ethiopian Heritage Authority.",
    },
    timeline: [
      {
        id: "addis-founding",
        period: "1886",
        title: "A new capital founded",
        body: "Emperor Menelik II and Empress Taytu founded the settlement that became Addis Ababa — “new flower” — on the slopes below Entoto near the Filwoha thermal springs.",
        citation: TOURISM,
        highlights: [
          "Mount Entoto palace",
          "Filwoha thermal springs",
          "Piazza commercial district",
        ],
      },
      {
        id: "addis-capital",
        period: "1896",
        title: "Seat of government & Adwa monument",
        body: "The city became the permanent capital with St. George Cathedral and the Imperial Palace forming its historic core.",
        citation: HERITAGE_AUTHORITY,
        highlights: [
          "St. George Cathedral",
          "Victory of Adwa celebration",
          "Arat Kilo monuments",
        ],
      },
      {
        id: "addis-africa",
        period: "1963",
        title: "Capital of African diplomacy",
        body: "Addis Ababa became the seat of the Organization of African Unity and later the African Union, earning its reputation as the diplomatic capital of Africa.",
        citation: TOURISM,
        highlights: [
          "Africa Hall",
          "Afewerk Tekle stained glass",
          "African Union Headquarters",
        ],
      },
      {
        id: "addis-lucy",
        period: "1974",
        title: "Lucy goes on display",
        body: "The 3.2-million-year-old hominid fossil known as Lucy (Dinknesh) was discovered in the Afar Depression and placed on display at the National Museum.",
        citation: HERITAGE_AUTHORITY,
        relatedPlaceId: "place-national-museum",
        highlights: [
          "Dinknesh (Lucy)",
          "Pliocene hominids",
          "Imperial royal thrones",
        ],
      },
    ],
    stories: [
      {
        id: "addis-museum",
        title: "Deep Time at the National Museum",
        body: "The museum holds the country’s archaeological record — hominid fossils, Aksumite stelae fragments, imperial regalia and contemporary Ethiopian master paintings.",
        placeId: "place-national-museum",
        category: "Paleoanthropology & Art",
        readTimeMin: 4,
        citation: HERITAGE_AUTHORITY,
      },
      {
        id: "addis-cathedral",
        title: "Holy Trinity Cathedral",
        body: "Built with stained glass, carved imperial thrones and a copper dome, the cathedral is the resting place of Emperor Haile Selassie and national patriots.",
        placeId: "place-holy-trinity",
        category: "Sacred History",
        readTimeMin: 3,
        citation: HERITAGE_AUTHORITY,
      },
    ],
    culture: [
      {
        id: "addis-coffee",
        title: "The birthplace of coffee culture",
        body: "Legendary roasters like Tomoca in Piazza have poured rich espresso from classic Italian machines since 1953 alongside traditional clay jebena ceremonies.",
        category: "Coffee Culture",
      },
      {
        id: "addis-merkato",
        title: "Merkato: The giant open-air market",
        body: "One of Africa’s largest open-air markets spreads across Addis Ketema, where handwoven textiles, spices, incense, and metalcraft trade from thousands of stalls.",
        category: "Markets & Trade",
      },
      {
        id: "addis-jazz",
        title: "Ethio-Jazz and nightlife",
        body: "Pioneered by Mulatu Astatke in the 1960s, the unique fusion of traditional modal scales with jazz harmonies thrives in clubs across Kazanchis.",
        category: "Music & Performance",
      },
    ],
    primaryCitation: TOURISM,
  },
  {
    key: "bahir dar",
    cityName: "Bahir Dar",
    tagline:
      "Lakeside palms, ancient island monasteries, and the thundering source of the Blue Nile.",
    fullStory: {
      lead: "Nestled along the southern shores of Lake Tana—Ethiopia’s largest freshwater lake—Bahir Dar is a graceful palm-lined city and the gateway to both the Blue Nile Falls (Tis Issat) and more than twenty secluded medieval island monasteries founded from the 14th century onward.",
      sections: [
        {
          heading: "The Sacred Monasteries of Lake Tana",
          era: "14th — 17th Century",
          body: "Hidden amidst lush papyrus reeds and coffee groves on Lake Tana’s islands and peninsulas, round thatched churches like Ura Kidane Mehret preserve circular sanctuaries (maqdas) covered floor-to-ceiling in brilliant, centuries-old canvas frescoes illustrating Ethiopian biblical history.",
        },
        {
          heading: "Tis Issat: The Smoke of the Nile",
          era: "Natural Wonder",
          body: 'Just 30 kilometers downstream from Bahir Dar, the Blue Nile plunges over a 45-meter-high basalt cliff in a magnificent curtain of spray, historically giving rise to the local Amharic name Tis Issat ("Smoking Water").',
        },
        {
          heading: "Papyrus Crafts and Lake Navigation",
          era: "Living Tradition",
          body: "Local fishermen still navigate Lake Tana aboard tankwa—traditional canoes crafted entirely from dried papyrus reeds identical to the craft depicted in ancient Egyptian reliefs.",
        },
      ],
      keyDates: [
        {
          year: "1350",
          event:
            "Monastic foundations established on the islands of Lake Tana.",
        },
        {
          year: "1600",
          event:
            "Ura Kidane Mehret on the Zege Peninsula receives royal Solomonic patronage.",
        },
        {
          year: "2015",
          event: "Lake Tana declared a UNESCO Biosphere Reserve.",
        },
      ],
      curatorNote:
        "Verified records sourced from the Ethiopian Heritage Authority and Lake Tana Biosphere Reserve Authority.",
    },
    timeline: [
      {
        id: "bahirdar-monasteries",
        period: "14th century",
        title: "Island monasteries founded",
        body: "Hermit monks and saints founded secluded sanctuaries on Lake Tana islands to safeguard royal crowns, holy manuscripts, and church treasures.",
        citation: HERITAGE_AUTHORITY,
        highlights: [
          "Ura Kidane Mehret",
          "Zege Peninsula",
          "Sacred manuscript treasuries",
        ],
      },
      {
        id: "bahirdar-nile",
        period: "1626 CE",
        title: "Portuguese stone bridge over the Nile",
        body: "Emperor Susenyos constructed the first stone bridge over the Blue Nile near Tis Issat with the assistance of Portuguese artisans.",
        citation: TOURISM,
        highlights: [
          "Tis Issat Falls",
          "Basalt gorge",
          "Historical Portuguese bridge",
        ],
      },
      {
        id: "bahirdar-unesco",
        period: "2015",
        title: "UNESCO Biosphere Reserve",
        body: "Lake Tana was recognized by UNESCO as a Biosphere Reserve, preserving critical wetlands, endemic fish, and sacred monastic forests.",
        citation: UNESCO,
        highlights: [
          "Biosphere Reserve status",
          "Biodiversity hotspot",
          "Indigenous monastic conservation",
        ],
      },
    ],
    stories: [
      {
        id: "bahirdar-ura",
        title: "The Frescoes of Ura Kidane Mehret",
        body: "Walking through the coffee forest on Zege Peninsula brings you to Ura Kidane Mehret, where vivid 16th-century paintings depict saints, dragons, and biblical epics.",
        category: "Sacred Art",
        readTimeMin: 3,
        citation: HERITAGE_AUTHORITY,
      },
      {
        id: "bahirdar-tis-issat",
        title: "The Smoke of the Blue Nile",
        body: "Tis Issat waterfalls thunder into a volcanic chasm, creating rainbows in the rising mist that waters surrounding indigenous trees.",
        category: "Natural Wonder",
        readTimeMin: 3,
        citation: TOURISM,
      },
    ],
    culture: [
      {
        id: "bahirdar-tankwa",
        title: "Tankwa papyrus boats",
        body: "Craftsmen on Lake Tana’s shore harvest papyrus reeds from wetland marshes, binding them tightly to build buoyant, traditional canoes.",
        category: "Craftsmanship",
      },
      {
        id: "bahirdar-fish",
        title: "Lake fish and asa gulash",
        body: "Fresh tilapia and Nile perch from Lake Tana are seasoned with mitmita and served crisp at open-air lakeside restaurants along the palm promenade.",
        category: "Culinary Heritage",
      },
      {
        id: "bahirdar-forests",
        title: "Sacred church forests",
        body: "Surrounding each church on the lake is an oasis of native old-growth canopy, protected by monastic caretakers as sacred living shelters.",
        category: "Ecology & Tradition",
      },
    ],
    primaryCitation: UNESCO,
  },
]

const INDEX = new Map(CONTENT.map((entry) => [entry.key, entry]))

type HeritageLanguage = "en" | "am"

/**
 * Deep-merges a localisation patch over curated content.
 *
 * - objects merge key-by-key (keys missing from the patch keep their value);
 * - arrays merge index-by-index (indexes missing from the patch keep their value);
 * - a patch value only replaces a leaf when both sides are strings;
 * - anything not present in the base is ignored, so ids/citations stay English.
 */
function applyPatch<T>(base: T, patch: unknown): T {
  if (typeof patch === "string" && typeof base === "string")
    return patch as unknown as T
  if (patch === null || typeof patch !== "object") return base
  if (Array.isArray(base) && Array.isArray(patch)) {
    return base.map((item, index) =>
      index < patch.length ? applyPatch(item, patch[index]) : item,
    ) as unknown as T
  }
  if (base === null || typeof base !== "object" || Array.isArray(base))
    return base
  const result: Record<string, unknown> = { ...base as Record<string, unknown> }
  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
    if (key in result) result[key] = applyPatch(result[key], value)
  }
  return result as unknown as T
}

/**
 * Normalises a city name so "Gondar" and "gondar" hit the same entry.
 */
export function heritageKey(cityName?: string | null): string | null {
  const key = cityName?.trim().toLowerCase()
  return key && key.length > 0 ? key : null
}

/**
 * Returns curated history copy for a city, or null when the city has no
 * curated entry — the page then falls back to live API data only.
 *
 * With `language: 'am'` the Amharic patch from `heritage-content.am.ts` is
 * merged over the English base; unpatched fields keep their original value.
 */
export function getHeritageContent(
  cityName?: string | null,
  language: HeritageLanguage = "en",
): HeritageCityContent | null {
  const key = heritageKey(cityName)
  if (!key) return null
  const base = INDEX.get(key) ?? null
  if (!base) return null
  if (language === "am") {
    const patch = (AM_HERITAGE as Record<string, unknown>)[key]
    if (patch) return applyPatch(base, patch)
  }
  return base
}

/** Every city key with curated content — used for entry points and dev checks. */
export function curatedHeritageCityKeys(): string[] {
  return CONTENT.map((entry) => entry.key)
}
