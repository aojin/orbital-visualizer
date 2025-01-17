// utils/mappings.js

const OWNER_MAP = {
  AB: "Arab Satellite Communications Organization",
  ABS: "Asia Broadcast Satellite",
  AC: "Asia Satellite Telecommunications Company (ASIASAT)",
  ALG: "Algeria",
  ANG: "Angola",
  ARGN: "Argentina",
  ARM: "Republic of Armenia",
  ASRA: "Austria",
  AUS: "Australia",
  AZER: "Azerbaijan",
  BEL: "Belgium",
  BELA: "Belarus",
  BERM: "Bermuda",
  BGD: "People's Republic of Bangladesh",
  BHUT: "Kingdom of Bhutan",
  BOL: "Bolivia",
  BRAZ: "Brazil",
  BUL: "Bulgaria",
  CA: "Canada",
  CHBZ: "China/Brazil",
  CHTU: "China/Turkey",
  CHLE: "Chile",
  CIS: "Commonwealth of Independent States (former USSR)",
  COL: "Colombia",
  CRI: "Republic of Costa Rica",
  CZCH: "Czech Republic (former Czechoslovakia)",
  DEN: "Denmark",
  DJI: "Republic of Djibouti",
  ECU: "Ecuador",
  EGYP: "Egypt",
  ESA: "European Space Agency",
  ESRO: "European Space Research Organization",
  EST: "Estonia",
  ETH: "Ethiopia",
  EUME: "European Organization for the Exploitation of Meteorological Satellites (EUMETSAT)",
  EUTE: "European Telecommunications Satellite Organization (EUTELSAT)",
  FGER: "France/Germany",
  FIN: "Finland",
  FR: "France",
  FRIT: "France/Italy",
  GER: "Germany",
  GHA: "Republic of Ghana",
  GLOB: "Globalstar",
  GREC: "Greece",
  GRSA: "Greece/Saudi Arabia",
  GUAT: "Guatemala",
  HUN: "Hungary",
  IM: "International Mobile Satellite Organization (INMARSAT)",
  IND: "India",
  INDO: "Indonesia",
  IRAN: "Iran",
  IRAQ: "Iraq",
  IRID: "Iridium",
  IRL: "Ireland",
  ISRA: "Israel",
  ISRO: "Indian Space Research Organisation",
  ISS: "International Space Station",
  IT: "Italy",
  ITSO: "International Telecommunications Satellite Organization (INTELSAT)",
  JPN: "Japan",
  KAZ: "Kazakhstan",
  KEN: "Republic of Kenya",
  LAOS: "Laos",
  LKA: "Democratic Socialist Republic of Sri Lanka",
  LTU: "Lithuania",
  LUXE: "Luxembourg",
  MA: "Morocco",
  MALA: "Malaysia",
  MCO: "Principality of Monaco",
  MDA: "Republic of Moldova",
  MEX: "Mexico",
  MMR: "Republic of the Union of Myanmar",
  MNG: "Mongolia",
  MUS: "Mauritius",
  NATO: "North Atlantic Treaty Organization",
  NETH: "Netherlands",
  NICO: "New ICO",
  NIG: "Nigeria",
  NKOR: "Democratic People's Republic of Korea",
  NOR: "Norway",
  NPL: "Federal Democratic Republic of Nepal",
  NZ: "New Zealand",
  O3B: "O3b Networks",
  ORB: "ORBCOMM",
  PAKI: "Pakistan",
  PERU: "Peru",
  POL: "Poland",
  POR: "Portugal",
  PRC: "People's Republic of China",
  PRY: "Republic of Paraguay",
  PRES: "People's Republic of China/European Space Agency",
  QAT: "State of Qatar",
  RASC: "RascomStar-QAF",
  ROC: "Taiwan (Republic of China)",
  ROM: "Romania",
  RP: "Philippines (Republic of the Philippines)",
  RWA: "Republic of Rwanda",
  SAFR: "South Africa",
  SAUD: "Saudi Arabia",
  SDN: "Republic of Sudan",
  SEAL: "Sea Launch",
  SES: "SES",
  SGJP: "Singapore/Japan",
  SING: "Singapore",
  SKOR: "Republic of Korea",
  SPN: "Spain",
  STCT: "Singapore/Taiwan",
  SVN: "Slovenia",
  SWED: "Sweden",
  SWTZ: "Switzerland",
  TBD: "To Be Determined",
  THAI: "Thailand",
  TMMC: "Turkmenistan/Monaco",
  TUN: "Republic of Tunisia",
  TURK: "Turkey",
  UAE: "United Arab Emirates",
  UK: "United Kingdom",
  UKR: "Ukraine",
  UNK: "Unknown",
  URY: "Uruguay",
  US: "United States",
  USBZ: "United States/Brazil",
  VAT: "Vatican City State",
  VENZ: "Venezuela",
  VTNM: "Vietnam",
  ZWE: "Republic of Zimbabwe",
};

// countryCodeMapping.js
const COUNTRY_CODE_MAP = {
  Algeria: "dz",
  Angola: "ao",
  "Arab Satellite Communications Organization": "sa",
  Argentina: "ar",
  "Asia Broadcast Satellite": "hk",
  "Asia Satellite Telecommunications Company (ASIASAT)": "hk",
  "Republic of Armenia": "am",
  Austria: "at",
  Australia: "au",
  Azerbaijan: "az",
  Belgium: "be",
  Belarus: "by",
  Bermuda: "bm",
  "People's Republic of Bangladesh": "bd",
  "Kingdom of Bhutan": "bt",
  Bolivia: "bo",
  Brazil: "br",
  Bulgaria: "bg",
  Canada: "ca",
  "China/Brazil": "cn",
  "China/Turkey": "cn",
  Chile: "cl",
  "Commonwealth of Independent States (former USSR)": "ru",
  Colombia: "co",
  "Republic of Costa Rica": "cr",
  "Czech Republic (former Czechoslovakia)": "cz",
  Denmark: "dk",
  "Republic of Djibouti": "dj",
  Ecuador: "ec",
  Egypt: "eg",
  "European Space Agency": "eu",
  "European Space Research Organization": "eu",
  Estonia: "ee",
  Ethiopia: "et",
  "European Organization for the Exploitation of Meteorological Satellites (EUMETSAT)":
    "eu",
  "European Telecommunications Satellite Organization (EUTELSAT)": "eu",
  "France/Germany": "fr",
  Finland: "fi",
  France: "fr",
  "France/Italy": "fr",
  Germany: "de",
  "Republic of Ghana": "gh",
  Globalstar: "us",
  Greece: "gr",
  "Greece/Saudi Arabia": "gr",
  Guatemala: "gt",
  Hungary: "hu",
  "International Mobile Satellite Organization (INMARSAT)": "gb",
  India: "in",
  Indonesia: "id",
  Iran: "ir",
  Iraq: "iq",
  Iridium: "us",
  Ireland: "ie",
  Israel: "il",
  "Indian Space Research Organisation": "in",
  "International Space Station": "us",
  Italy: "it",
  "International Telecommunications Satellite Organization (INTELSAT)": "us",
  Japan: "jp",
  Kazakhstan: "kz",
  "Republic of Kenya": "ke",
  Laos: "la",
  "Democratic Socialist Republic of Sri Lanka": "lk",
  Lithuania: "lt",
  Luxembourg: "lu",
  Morocco: "ma",
  Malaysia: "my",
  "Principality of Monaco": "mc",
  "Republic of Moldova": "md",
  Mexico: "mx",
  "Republic of the Union of Myanmar": "mm",
  Mongolia: "mn",
  Mauritius: "mu",
  "North Atlantic Treaty Organization": "us",
  Netherlands: "nl",
  "New ICO": "us",
  Nigeria: "ng",
  "Democratic People's Republic of Korea": "kp",
  Norway: "no",
  "Federal Democratic Republic of Nepal": "np",
  "New Zealand": "nz",
  "O3b Networks": "lu",
  ORBCOMM: "us",
  Pakistan: "pk",
  Peru: "pe",
  Poland: "pl",
  Portugal: "pt",
  "People's Republic of China": "cn",
  "Republic of Paraguay": "py",
  "People's Republic of China/European Space Agency": "cn",
  "State of Qatar": "qa",
  "RascomStar-QAF": "zw",
  "Taiwan (Republic of China)": "tw",
  Romania: "ro",
  "Philippines (Republic of the Philippines)": "ph",
  "Republic of Rwanda": "rw",
  "South Africa": "za",
  "Saudi Arabia": "sa",
  "Republic of Sudan": "sd",
  "Sea Launch": "us",
  SES: "lu",
  "Singapore/Japan": "sg",
  Singapore: "sg",
  "Republic of Korea": "kr",
  Spain: "es",
  "Singapore/Taiwan": "sg",
  Slovenia: "si",
  Sweden: "se",
  Switzerland: "ch",
  "To Be Determined": "us",
  Thailand: "th",
  "Turkmenistan/Monaco": "tm",
  "Republic of Tunisia": "tn",
  Turkey: "tr",
  "United Arab Emirates": "ae",
  "United Kingdom": "gb",
  Ukraine: "ua",
  Unknown: "unk",
  Uruguay: "uy",
  "United States": "us",
  "United States/Brazil": "us",
  "Vatican City State": "va",
  Venezuela: "ve",
  Vietnam: "vn",
  "Republic of Zimbabwe": "zw",
};

const OWNER_TO_COUNTRY_CODE_MAP = {
  AB: "sa", // Arab Satellite Communications Organization
  ABS: "hk", // Asia Broadcast Satellite
  AC: "hk", // Asia Satellite Telecommunications Company (ASIASAT)
  ALG: "dz", // Algeria
  ANG: "ao", // Angola
  ARGN: "ar", // Argentina
  ARM: "am", // Republic of Armenia
  ASRA: "at", // Austria
  AUS: "au", // Australia
  AZER: "az", // Azerbaijan
  BEL: "be", // Belgium
  BELA: "by", // Belarus
  BERM: "bm", // Bermuda
  BGD: "bd", // People's Republic of Bangladesh
  BHUT: "bt", // Kingdom of Bhutan
  BOL: "bo", // Bolivia
  BRAZ: "br", // Brazil
  BUL: "bg", // Bulgaria
  CA: "ca", // Canada
  CHBZ: "cn", // China/Brazil
  CHTU: "cn", // China/Turkey
  CHLE: "cl", // Chile
  CIS: "ru", // Commonwealth of Independent States (former USSR)
  COL: "co", // Colombia
  CRI: "cr", // Republic of Costa Rica
  CZCH: "cz", // Czech Republic (former Czechoslovakia)
  DEN: "dk", // Denmark
  DJI: "dj", // Republic of Djibouti
  ECU: "ec", // Ecuador
  EGYP: "eg", // Egypt
  ESA: "eu", // European Space Agency
  ESRO: "eu", // European Space Research Organization
  EST: "ee", // Estonia
  ETH: "et", // Ethiopia
  EUME: "eu", // European Organization for the Exploitation of Meteorological Satellites (EUMETSAT)
  EUTE: "eu", // European Telecommunications Satellite Organization (EUTELSAT)
  FGER: "fr", // France/Germany
  FIN: "fi", // Finland
  FR: "fr", // France
  FRIT: "fr", // France/Italy
  GER: "de", // Germany
  GHA: "gh", // Republic of Ghana
  GLOB: "us", // Globalstar
  GREC: "gr", // Greece
  GRSA: "gr", // Greece/Saudi Arabia
  GUAT: "gt", // Guatemala
  HUN: "hu", // Hungary
  IM: "gb", // International Mobile Satellite Organization (INMARSAT)
  IND: "in", // India
  INDO: "id", // Indonesia
  IRAN: "ir", // Iran
  IRAQ: "iq", // Iraq
  IRID: "us", // Iridium
  IRL: "ie", // Ireland
  ISRA: "il", // Israel
  ISRO: "in", // Indian Space Research Organisation
  ISS: "us", // International Space Station
  IT: "it", // Italy
  ITSO: "us", // International Telecommunications Satellite Organization (INTELSAT)
  JPN: "jp", // Japan
  KAZ: "kz", // Kazakhstan
  KEN: "ke", // Republic of Kenya
  LAOS: "la", // Laos
  LKA: "lk", // Democratic Socialist Republic of Sri Lanka
  LTU: "lt", // Lithuania
  LUXE: "lu", // Luxembourg
  MA: "ma", // Morocco
  MALA: "my", // Malaysia
  MCO: "mc", // Principality of Monaco
  MDA: "md", // Republic of Moldova
  MEX: "mx", // Mexico
  MMR: "mm", // Republic of the Union of Myanmar
  MNG: "mn", // Mongolia
  MUS: "mu", // Mauritius
  NATO: "us", // North Atlantic Treaty Organization
  NETH: "nl", // Netherlands
  NICO: "us", // New ICO
  NIG: "ng", // Nigeria
  NKOR: "kp", // Democratic People's Republic of Korea
  NOR: "no", // Norway
  NPL: "np", // Federal Democratic Republic of Nepal
  NZ: "nz", // New Zealand
  O3B: "lu", // O3b Networks
  ORB: "us", // ORBCOMM
  PAKI: "pk", // Pakistan
  PERU: "pe", // Peru
  POL: "pl", // Poland
  POR: "pt", // Portugal
  PRC: "cn", // People's Republic of China
  PRY: "py", // Republic of Paraguay
  PRES: "cn", // People's Republic of China/European Space Agency
  QAT: "qa", // State of Qatar
  RASC: "zw", // RascomStar-QAF
  ROC: "tw", // Taiwan (Republic of China)
  ROM: "ro", // Romania
  RP: "ph", // Philippines (Republic of the Philippines)
  RWA: "rw", // Republic of Rwanda
  SAFR: "za", // South Africa
  SAUD: "sa", // Saudi Arabia
  SDN: "sd", // Republic of Sudan
  SEAL: "us", // Sea Launch
  SES: "lu", // SES
  SGJP: "sg", // Singapore/Japan
  SING: "sg", // Singapore
  SKOR: "kr", // Republic of Korea
  SPN: "es", // Spain
  STCT: "sg", // Singapore/Taiwan
  SVN: "si", // Slovenia
  SWED: "se", // Sweden
  SWTZ: "ch", // Switzerland
  TBD: "us", // To Be Determined
  THAI: "th", // Thailand
  TMMC: "tm", // Turkmenistan/Monaco
  TUN: "tn", // Republic of Tunisia
  TURK: "tr", // Turkey
  UAE: "ae", // United Arab Emirates
  UK: "gb", // United Kingdom
  UKR: "ua", // Ukraine
  UNK: "unk", // Unknown
  URY: "uy", // Uruguay
  US: "us", // United States
  USBZ: "us", // United States/Brazil
  VAT: "va", // Vatican City State
  VENZ: "ve", // Venezuela
  VTNM: "vn", // Vietnam
  ZWE: "zw", // Republic of Zimbabwe
};

const OPS_STATUS_DESCRIPTIONS = {
  "+": "Operational",
  "-": "Nonoperational",
  P: "Partially Operational",
  B: "Backup/Standby",
  S: "Spare",
  X: "Extended Mission",
  D: "Decayed",
  "?": "Unknown",
};

const OBJECT_TYPE_MAP = {
  PAY: "Payload",
  "R/B": "Rocket body",
  DEB: "Other debris",
  UNK: "Unknown",
};

const ORBIT_TYPE_MAP = {
  ORB: "Orbit",
  LAN: "Landing",
  IMP: "Impact",
  DOC: "Docked to another object in the SATCAT",
  "R/T": "Roundtrip",
};

const LAUNCH_SITE_MAP = {
  AFETR: "Air Force Eastern Test Range",
  AFWTR: "Air Force Western Test Range",
  ALEXA: "Alexander Launch Facility",
  ALM: "Alcantara Launch Center",
  BA: "Baikonur Cosmodrome",
  BIK: "Bikini Atoll",
  BRO: "Broglio Space Center",
  CAP: "Cape Canaveral",
  CAS: "Caspian Sea",
  EKA: "Eka Pad 2",
  ELM: "Elmendorf Air Force Base",
  ESMR: "Esrange",
  FPK: "Fort Polk",
  GAN: "Guam Naval Station",
  GTI: "Grand Turk Island",
  HOB: "Hobbs Island",
  JIU: "Jiuquan Space Center",
  KAP: "Kapustin Yar",
  KAU: "Kauai Test Facility",
  KAZ: "Kazakhstan",
  KEA: "Kea Track",
  KMR: "Kwajalein Missile Range",
  KOD: "Kodiak Launch Complex",
  KOU: "Kourou",
  KYM: "Kymer",
  MA: "Mahia Peninsula",
  MAS: "Masudpur",
  MT: "Matagorda Island",
  MUR: "Musudan-ri",
  NOR: "Naro Space Center",
  OCA: "Oca Pad",
  OHI: "O'Higgins Base",
  PAL: "Palmas Pad",
  PALM: "Palmer Station",
  PLE: "Plesetsk Cosmodrome",
  PTK: "Point Thomson",
  SANM: "San Marco Platform",
  SEA: "Sea Launch",
  SEGA: "Segar",
  SHAR: "Satish Dhawan Space Centre (SHAR)",
  SHEL: "Shelton",
  SIMP: "Simpad",
  SRI: "Sriharikota",
  SSC: "Shanxi",
  SVOB: "Svobodny",
  TAIY: "Taiyuan",
  TAN: "Tanegashima",
  TERA: "Tereshkova",
  TEX: "Tex Pad",
  TNUG: "Tonghae Satellite Launching Ground",
  TTS: "Titusville",
  UKRA: "Ukrainian Cosmodrome",
  UZH: "Uzhgorod",
  WAL: "Wallops Island",
  WLP: "Woomera",
  WSAL: "Western Sahara",
  XLC: "Xichang",
  YAV: "Yavne Launch Facility",
  YSLA: "Yellow Sea Launch Area",
  YUN: "Yunsong Launch Site",
};

export {
  OWNER_MAP,
  COUNTRY_CODE_MAP,
  OWNER_TO_COUNTRY_CODE_MAP,
  OPS_STATUS_DESCRIPTIONS,
  OBJECT_TYPE_MAP,
  ORBIT_TYPE_MAP,
  LAUNCH_SITE_MAP,
};
