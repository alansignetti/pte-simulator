// Pre-loaded question bank. Topics chosen to mirror PTE Academic — academic
// passages, lectures, charts, short questions. Each task type has 2-3 items
// so you can practice all 20 task types out of the box.
//
// To add new items, append to the relevant array. To get fresh items at
// runtime, use the "Generate with AI" button which calls Claude API.

export const CONTENT = {
  // ============== SPEAKING ==============
  readAloud: [
    {
      text: "The widespread adoption of renewable energy has accelerated dramatically in the past decade, with solar and wind capacity now accounting for a substantial share of new electricity generation worldwide. Falling costs, supportive policies, and improvements in storage technology have made these sources increasingly competitive with fossil fuels.",
    },
    {
      text: "Sleep plays a critical role in consolidating memories formed during the day. Researchers have found that the brain replays neural patterns associated with recent experiences while we sleep, strengthening the connections that underpin long-term recall and emotional regulation.",
    },
    {
      text: "Coral reefs are among the most biologically productive ecosystems on Earth, sustaining roughly a quarter of all marine species despite covering less than one percent of the ocean floor. Rising sea temperatures and ocean acidification, however, threaten their structure and the communities that depend on them.",
    },
  ],

  repeatSentence: [
    "Most undergraduate courses require a research dissertation in the final year.",
    "The library will be closed on public holidays throughout the summer.",
    "Tutorial groups meet every Wednesday afternoon in the science building.",
    "Students must submit their assignments through the online portal before midnight.",
    "Regular attendance is essential for understanding the lecture material thoroughly.",
  ],

  describeImage: [
    {
      type: "bar",
      title: "University enrolment by faculty, 2024",
      data: [
        { label: "Engineering", value: 4200 },
        { label: "Business", value: 3800 },
        { label: "Arts", value: 2900 },
        { label: "Science", value: 3100 },
        { label: "Medicine", value: 1500 },
      ],
      yLabel: "Students",
    },
    {
      type: "line",
      title: "Average global temperature anomaly, 1980-2020",
      data: [
        { label: "1980", value: 0.27 },
        { label: "1990", value: 0.45 },
        { label: "2000", value: 0.40 },
        { label: "2010", value: 0.72 },
        { label: "2020", value: 1.02 },
      ],
      yLabel: "Anomaly (°C)",
    },
    {
      type: "pie",
      title: "Household energy use breakdown",
      data: [
        { label: "Heating", value: 42 },
        { label: "Hot water", value: 18 },
        { label: "Appliances", value: 15 },
        { label: "Lighting", value: 10 },
        { label: "Cooking", value: 8 },
        { label: "Other", value: 7 },
      ],
    },
    {
      type: "table",
      title: "Top-5 export commodities, Australia 2023",
      columns: ["Commodity", "Value (AUD bn)", "Main market", "YoY change"],
      rows: [
        ["Iron ore", "124", "China", "+8%"],
        ["Coal", "92", "Japan / India", "-3%"],
        ["Natural gas", "67", "Japan / Korea", "+12%"],
        ["Gold", "27", "UK / China", "+5%"],
        ["Beef", "12", "USA / Japan", "+2%"],
      ],
    },
    {
      type: "process",
      title: "The water cycle",
      steps: [
        "Evaporation from oceans",
        "Condensation into clouds",
        "Precipitation as rain",
        "Runoff into rivers",
        "Return to ocean",
      ],
    },
    {
      type: "process",
      title: "Stages of clinical drug trials",
      steps: [
        "Pre-clinical lab testing",
        "Phase I safety trial",
        "Phase II efficacy trial",
        "Phase III large-scale trial",
        "Regulatory approval",
      ],
    },
    {
      type: "map",
      title: "Population by Australian state, millions (2023)",
      regions: [
        { region: "NSW", value: 8.3 },
        { region: "VIC", value: 6.7 },
        { region: "QLD", value: 5.4 },
        { region: "WA", value: 2.9 },
        { region: "SA", value: 1.8 },
        { region: "TAS", value: 0.57 },
        { region: "NT", value: 0.25 },
        { region: "ACT", value: 0.46 },
      ],
      unit: "M",
    },
    {
      type: "map",
      title: "Annual rainfall by Australian state, average mm",
      regions: [
        { region: "NSW", value: 560 },
        { region: "VIC", value: 650 },
        { region: "QLD", value: 630 },
        { region: "WA", value: 340 },
        { region: "SA", value: 250 },
        { region: "TAS", value: 1450 },
        { region: "NT", value: 580 },
      ],
      unit: "mm",
    },
    {
      type: "comboBarLine",
      title: "Online sales (bars) vs physical stores (line), 2019-2024",
      barLabel: "Online (AUD bn)",
      lineLabel: "Stores (000s)",
      yLabel: "Online sales",
      data: [
        { label: "2019", bar: 28, line: 142 },
        { label: "2020", bar: 41, line: 134 },
        { label: "2021", bar: 55, line: 121 },
        { label: "2022", bar: 62, line: 115 },
        { label: "2023", bar: 71, line: 108 },
        { label: "2024", bar: 78, line: 102 },
      ],
    },
  ],

  retellLecture: [
    {
      title: "Urbanisation and migration",
      transcript:
        "Today I want to talk about how urbanisation is reshaping patterns of human migration in the twenty-first century. For most of human history, people moved primarily from rural to urban areas within their own country. But that pattern is changing. We're now seeing increased movement between cities across national borders, often driven by economic opportunity, climate pressures, and digital connectivity. Researchers estimate that by 2050, around two-thirds of the world's population will live in cities. This shift has significant implications for housing, infrastructure, and social cohesion. Megacities in Asia and Africa are growing fastest, while many cities in Europe and North America are seeing slower or even negative growth. Understanding these flows is essential for policymakers planning the next generation of urban infrastructure.",
    },
    {
      title: "The placebo effect in clinical trials",
      transcript:
        "The placebo effect is one of the most fascinating phenomena in medicine. When patients receive an inactive treatment they believe to be real, they often experience genuine improvements in their symptoms. This isn't simply imagination — measurable physiological changes occur. In clinical trials, researchers use placebo-controlled designs to separate the genuine effect of a drug from the patient's expectations. What's interesting is that the strength of the placebo effect has increased over time, particularly in trials of pain medications and antidepressants conducted in the United States. This makes drug development more difficult. Some researchers argue that ritual, expectation, and the therapeutic relationship itself are powerful drivers of healing — components that traditional medicine sometimes overlooks.",
    },
    {
      title: "Microplastics in the food chain",
      transcript:
        "Microplastics — particles smaller than five millimetres — are now found in virtually every corner of the planet, from deep ocean sediment to mountain snow. They enter the environment from the breakdown of larger plastic items, from synthetic textile fibres released in laundry, and from tyre wear on roads. Once in the environment, these particles are ingested by marine organisms, working their way up the food chain. Studies have detected microplastics in seafood, table salt, drinking water, and human blood. The health implications are still being investigated, but early research suggests possible links to inflammation, hormone disruption, and the transport of toxic chemicals. Reducing plastic production at the source remains the most effective intervention.",
    },
  ],

  answerShortQuestion: [
    { q: "What do we call the device used to measure atmospheric pressure?", a: ["barometer"] },
    { q: "What is the largest planet in our solar system?", a: ["Jupiter"] },
    { q: "What is the chemical symbol for gold?", a: ["Au"] },
    { q: "What do we call a doctor who specialises in treating children?", a: ["pediatrician", "paediatrician"] },
    { q: "What is the longest river in South America?", a: ["Amazon", "the Amazon"] },
    { q: "What do we call the study of weather?", a: ["meteorology"] },
    { q: "What instrument do scientists use to see very small objects?", a: ["microscope"] },
  ],

  summarizeWrittenText: [
    {
      text: "Honeybees are facing a global decline that has alarmed scientists, farmers, and conservationists. The phenomenon, known as colony collapse disorder, involves worker bees abandoning their hives, leaving the queen and immature bees behind. Researchers have identified multiple contributing factors rather than a single cause. Among these are widespread use of neonicotinoid pesticides, which impair bee navigation and immune function; loss of wildflower habitat due to intensive agriculture; the spread of the parasitic Varroa mite; and climate change, which disrupts the synchronisation between flowering plants and pollinator activity. Because bees pollinate roughly a third of the food crops humans rely on, including fruits, vegetables, nuts, and oilseeds, their decline threatens both biodiversity and food security. Some governments have responded by restricting certain pesticides and incentivising the planting of pollinator-friendly hedgerows along farm boundaries, while urban beekeeping has gained popularity as a way to support local populations. However, experts caution that piecemeal measures are unlikely to reverse the trend, and that a coordinated, landscape-scale response is needed.",
    },
    {
      text: "The rapid growth of e-commerce has transformed retail logistics and reshaped urban environments in ways few predicted a decade ago. Consumers in major cities now expect same-day or next-day delivery as standard, which has driven retailers and platforms to build dense networks of warehouses, sorting centres, and last-mile distribution hubs on the urban fringe. These facilities require thousands of workers, many in precarious employment, and they generate substantial truck and van traffic that adds to local air pollution and road congestion. At the same time, the convenience offered by online shopping has accelerated the decline of brick-and-mortar retail, with vacancy rates on traditional high streets rising in many countries. Some city governments are responding by zoning new logistics facilities away from residential areas, encouraging cargo bikes for the final delivery leg, and offering grants to repurpose vacant retail space for housing, services, or community uses. Whether these measures can offset the broader disruption remains an open question, as the underlying consumer behaviour shows no sign of reversing.",
    },
    {
      text: "Artificial intelligence systems based on large language models are being rapidly integrated into education, raising both opportunities and concerns among teachers, parents, and policymakers. Advocates argue that these tools can offer personalised tutoring at scale, helping students work through difficult material at their own pace and providing instant feedback on writing assignments. They can also free teachers from routine tasks like marking, allowing more time for one-on-one engagement. Critics, however, point to several risks. Students may use AI tools to bypass the cognitive effort required for genuine learning, particularly for writing assignments where the process of drafting is itself the educational goal. There are also concerns about the accuracy of AI outputs, which can confidently present incorrect information, and about the equity implications when access to high-quality tools depends on a family's ability to pay for premium services. Schools are now navigating these tensions through new policies, often combining outright bans in some contexts with structured integration in others, while assessment formats are shifting to emphasise in-class oral examinations and supervised practical work.",
    },
  ],

  writeEssay: [
    "Some people believe that universities should focus on providing academic knowledge, while others argue that universities should prepare students for their future careers. Discuss both views and give your own opinion.",
    "In many countries, governments are spending large sums of money on space exploration. Some argue that this money would be better spent on solving problems on Earth. To what extent do you agree or disagree?",
    "The widespread use of social media has changed how people communicate and form relationships. What are the advantages and disadvantages of this development?",
  ],

  // ============== READING ==============
  readingFillBlanksRW: [
    {
      // R&W FIB — dropdown blanks
      text: [
        "The development of modern transportation systems has profoundly ",
        { blank: 0, correct: "shaped", options: ["shaped", "shapeless", "shaping", "shapes"] },
        " urban growth. Cities that grew around rail networks tend to have ",
        { blank: 1, correct: "denser", options: ["dense", "denser", "density", "densely"] },
        " centres, while those built around the automobile spread outwards in low-density ",
        { blank: 2, correct: "suburbs", options: ["suburbs", "suburban", "suburb", "suburbia"] },
        ". This pattern has lasting consequences for energy use and ",
        { blank: 3, correct: "social", options: ["socially", "social", "socialise", "society"] },
        " interaction.",
      ],
    },
    {
      text: [
        "Recent advances in genetic research have ",
        { blank: 0, correct: "transformed", options: ["transformed", "transformation", "transform", "transformer"] },
        " our understanding of inherited disease. Scientists are now able to ",
        { blank: 1, correct: "identify", options: ["identify", "identification", "identical", "identified"] },
        " specific mutations responsible for conditions that were once considered untreatable, opening new ",
        { blank: 2, correct: "avenues", options: ["avenues", "avenue", "avenger", "averages"] },
        " for therapy.",
      ],
    },
  ],

  readingMCMA: [
    {
      passage:
        "The transition to renewable energy is reshaping global labour markets in unexpected ways. While employment in coal and oil sectors has declined sharply over the past decade, jobs in solar, wind, and battery manufacturing have grown rapidly, particularly in regions that have invested in domestic supply chains. However, the new jobs are not always located where the old jobs disappear, and the skill profiles often differ significantly. Workers displaced from extractive industries frequently require retraining, and many local economies built around a single dominant employer struggle to attract replacement investment quickly. Policymakers in several countries have responded with targeted transition funds, although the scale and effectiveness of these programmes vary widely.",
      question: "Which statements about the energy transition are supported by the passage?",
      options: [
        "Renewable energy jobs are growing faster than fossil fuel jobs are declining.",
        "Displaced fossil fuel workers can easily move into renewable energy roles.",
        "New renewable energy jobs are not always in the same locations as the lost jobs.",
        "Retraining is often necessary for workers transitioning between sectors.",
        "Government transition funds have uniformly succeeded across countries.",
      ],
      correct: [2, 3],
    },
    {
      passage:
        "Sleep is increasingly recognised as a foundational pillar of physical and mental health. Studies consistently associate insufficient sleep with elevated risks of cardiovascular disease, obesity, impaired immune function, and depression. The mechanisms involve hormonal disruption, including changes to cortisol and insulin sensitivity, as well as reduced clearance of metabolic waste from brain tissue. Despite this growing body of evidence, average sleep duration has declined in many industrialised societies, driven by longer working hours, increased screen use, and irregular schedules. Public health campaigns have begun to emphasise sleep alongside diet and exercise, although awareness remains lower than for those more traditional pillars of health.",
      question: "Which statements are supported by the passage?",
      options: [
        "Lack of sleep is linked to multiple chronic conditions.",
        "Sleep deprivation only affects mental health, not physical health.",
        "Average sleep duration has increased over recent decades.",
        "Hormonal changes are one mechanism through which sleep loss affects health.",
        "Sleep is now treated as more important than diet in public health campaigns.",
      ],
      correct: [0, 3],
    },
  ],

  reorderParagraphs: [
    {
      paragraphs: [
        // Index 0 in correct order
        "The discovery of antibiotics in the early twentieth century transformed medicine, turning infections that were once routinely fatal into easily treatable conditions.",
        "Initially, these new drugs were celebrated as a near-miraculous victory over bacterial disease, and their use expanded rapidly through both medicine and agriculture.",
        "Over decades, however, the overuse and misuse of antibiotics created strong selection pressure on bacterial populations, driving the emergence of resistant strains.",
        "Today, antimicrobial resistance is one of the most serious threats facing global public health, with some infections again becoming difficult or impossible to treat.",
      ],
    },
    {
      paragraphs: [
        "Solar panels convert sunlight into electricity using the photovoltaic effect, in which photons knock electrons loose from atoms in a semiconductor material.",
        "Early panels in the 1970s were extremely expensive and inefficient, limiting their use to specialised applications such as satellites and remote installations.",
        "Decades of research, manufacturing improvements, and supportive policy have driven costs down by more than ninety percent, making solar competitive with fossil fuel generation in many markets.",
        "As a result, solar capacity has become the fastest-growing source of new electricity generation worldwide, with deployment expected to accelerate through the coming decade.",
      ],
    },
  ],

  readingFillBlanks: [
    {
      text: [
        "The growing popularity of remote work has changed how companies ",
        { blank: 0 },
        " their workforce. Many organisations have adopted flexible ",
        { blank: 1 },
        " that allow employees to work from home several days a week, reducing the need for large office ",
        { blank: 2 },
        " in city centres. While productivity gains have been reported in some studies, others highlight challenges around team cohesion and ",
        { blank: 3 },
        ".",
      ],
      correct: ["manage", "arrangements", "spaces", "collaboration"],
      bank: ["manage", "arrangements", "spaces", "collaboration", "controlled", "buildings", "people", "expensive"],
    },
    {
      text: [
        "Effective language learning depends on ",
        { blank: 0 },
        " exposure rather than occasional intensive study. Learners who engage with the target language ",
        { blank: 1 },
        " — through reading, listening, conversation, and writing — generally make faster ",
        { blank: 2 },
        " than those who rely on textbooks alone.",
      ],
      correct: ["consistent", "daily", "progress"],
      bank: ["consistent", "daily", "progress", "occasional", "weekly", "regression", "automatic"],
    },
  ],

  readingMCSA: [
    {
      passage:
        "While many people associate creativity with sudden flashes of insight, research suggests that most creative breakthroughs are the result of long periods of careful, often tedious preparation. Domain expertise, deliberate practice, and exposure to a wide range of ideas all contribute to the conditions under which a novel solution can emerge. The moment of insight, when it comes, is best understood as the visible peak of a much larger hidden process.",
      question: "What does the passage suggest about creativity?",
      options: [
        "Creative breakthroughs are mostly random and cannot be cultivated.",
        "Creativity is primarily the result of sustained preparation and practice.",
        "Only people with natural talent can be creative.",
        "Domain expertise tends to limit rather than enable creativity.",
      ],
      correct: 1,
    },
    {
      passage:
        "Traditional public libraries are evolving rapidly in the digital age. Beyond lending books, many now offer free internet access, training in digital skills, makerspaces with 3D printers, and rooms for community meetings. In areas where commercial third places have declined, libraries increasingly serve as one of the few civic spaces accessible to all, regardless of income.",
      question: "What is the main point of the passage?",
      options: [
        "Libraries are becoming obsolete because of digital technology.",
        "Libraries are increasingly important civic spaces with broader functions than before.",
        "Most libraries no longer lend physical books.",
        "Library funding has increased dramatically due to digital expansion.",
      ],
      correct: 1,
    },
  ],

  // ============== LISTENING ==============
  summarizeSpokenText: [
    {
      title: "Bilingual brains",
      transcript:
        "Research over the past two decades has revealed surprising effects of bilingualism on brain structure and function. People who regularly use two languages appear to develop stronger executive function — the cognitive system responsible for attention, switching between tasks, and ignoring distractions. Imaging studies show denser grey matter in regions associated with language control, and some research suggests that bilingual individuals develop dementia symptoms several years later than monolingual peers, even when the underlying brain pathology is similar. The constant juggling between two language systems appears to act as a form of mental exercise, building cognitive reserves that may protect against age-related decline.",
    },
    {
      title: "Soil carbon and farming",
      transcript:
        "Agricultural soils contain enormous quantities of carbon, accumulated over thousands of years from decomposed plant matter. Modern intensive farming, with frequent ploughing and bare fallow periods, accelerates the release of this carbon back into the atmosphere as carbon dioxide. Researchers estimate that historical agricultural practices have released roughly a hundred billion tonnes of soil carbon globally. The good news is that this process is partially reversible. Practices such as cover cropping, no-till farming, and integrating livestock can rebuild soil carbon levels, simultaneously improving soil fertility, water retention, and climate outcomes. Some governments are now exploring payments to farmers for measured increases in soil carbon, though the verification methods remain technically challenging.",
    },
  ],

  listeningMCMA: [
    {
      title: "Urban green spaces",
      transcript:
        "Recent research on urban planning has highlighted the significant role that green spaces play in city health. Parks, street trees, and community gardens not only improve air quality and reduce urban temperatures during heat waves, but also support mental health by providing places for relaxation and informal social contact. Studies in several European cities have shown measurable reductions in rates of anxiety and depression among residents living within walking distance of substantial green space. However, the distribution of these benefits is often uneven, with lower-income neighbourhoods having significantly less access. Planners are increasingly trying to address this imbalance, though competing pressures for housing and commercial development can make new green space difficult to create.",
      question: "Which of the following are mentioned as benefits of urban green spaces?",
      options: [
        "Improving air quality",
        "Reducing crime rates",
        "Supporting mental health",
        "Lowering urban temperatures",
        "Increasing property tax revenue",
      ],
      correct: [0, 2, 3],
    },
  ],

  listeningFillBlanks: [
    {
      title: "Coffee production",
      transcript:
        "Coffee is grown primarily in tropical regions along a belt near the equator. Brazil remains the largest producer globally, followed by Vietnam, Colombia, and Indonesia. The crop is highly sensitive to temperature and rainfall, and climate change is already shifting the areas where high-quality coffee can be cultivated. Many smallholder farmers face difficult choices about whether to adapt their practices, move to higher altitudes, or abandon coffee altogether.",
      // _____ marks blanks the user has to fill. Correct word at the same
      // index in `correct`.
      template:
        "Coffee is grown primarily in _____ regions along a belt near the equator. Brazil remains the largest producer globally, followed by _____, Colombia, and Indonesia. The crop is highly sensitive to temperature and _____, and climate change is already shifting the areas where high-quality coffee can be cultivated.",
      correct: ["tropical", "Vietnam", "rainfall"],
    },
  ],

  highlightCorrectSummary: [
    {
      title: "Plastic recycling",
      transcript:
        "Despite decades of public messaging about recycling, the global recycling rate for plastic remains stubbornly low — under ten percent according to most estimates. The reasons are partly technical: many plastics are chemically incompatible, contamination from food residue ruins entire batches, and recycled plastic often has degraded properties that limit its use. The reasons are also economic: virgin plastic, derived from cheap oil, has consistently undercut recycled material on price. Researchers and policymakers increasingly argue that reducing plastic production at the source — through bans on single-use items, refill systems, and material substitutions — must be a higher priority than expanding recycling infrastructure.",
      options: [
        "Plastic recycling rates are low because of technical and economic challenges, leading experts to argue that reducing plastic production should be prioritised over recycling.",
        "Plastic recycling is highly successful globally, with most plastic being recovered and reused thanks to consumer awareness campaigns.",
        "The main reason plastic recycling fails is that consumers are unwilling to participate in recycling programmes despite public messaging.",
        "Most countries have already banned single-use plastics and built large recycling networks, which have solved the plastic waste problem.",
      ],
      correct: 0,
    },
  ],

  listeningMCSA: [
    {
      title: "Tidal energy",
      transcript:
        "Tidal energy is among the most predictable forms of renewable power, since tide cycles can be forecast accurately for decades in advance. Despite this advantage, tidal generation has scaled much more slowly than solar or wind. The main barriers are the high cost of building structures that can withstand the marine environment, the limited number of suitable coastal sites, and the environmental impact on local ecosystems. Recent prototypes using floating turbines suggest there may be room for cost reduction, but tidal energy is unlikely to become a major component of the global energy mix in the next decade.",
      question: "What is the main reason tidal energy has scaled slowly?",
      options: [
        "Tides are too unpredictable to rely on.",
        "Costs and site limitations have held back deployment.",
        "Tidal turbines cannot generate enough power to be useful.",
        "Most coastal countries have banned tidal generation.",
      ],
      correct: 1,
    },
  ],

  selectMissingWord: [
    {
      title: "Volcanic eruptions",
      // The last word is replaced with a beep — the user has to pick from options.
      transcript:
        "Predicting when a volcano will erupt is one of the most difficult challenges in geology. While monitoring of earthquakes, gas emissions, and ground deformation can indicate that a volcano is becoming active, the precise timing remains hard to forecast. This uncertainty makes evacuation decisions extremely difficult for local",
      options: ["authorities", "tourists", "scientists", "students"],
      correct: 0,
    },
    {
      title: "Vaccine development",
      transcript:
        "Developing a new vaccine traditionally takes ten to fifteen years, involving multiple phases of testing for safety and effectiveness. The rapid development of COVID vaccines was possible because researchers had been working on related coronaviruses for years and because regulatory processes were accelerated without compromising safety",
      options: ["standards", "concerns", "agencies", "documents"],
      correct: 0,
    },
  ],

  highlightIncorrectWords: [
    {
      title: "Renewable energy growth",
      // Words that differ from the spoken transcript are marked with the
      // index of the wrong word in `wrongIndices` (0-based word index in `display`).
      spoken:
        "The growth of renewable energy capacity worldwide has been driven primarily by sharp reductions in the cost of solar panels and wind turbines over the past decade.",
      display:
        "The growth of renewable energy capacity globally has been driven primarily by sharp reductions in the price of solar panels and wind machines over the past decade.",
      // Indexes within `display` words array. Computed lazily in tasks.js by diffing.
    },
  ],

  writeFromDictation: [
    "The new research facility will open to graduate students next September.",
    "Most economic theories assume that consumers behave in a rational way.",
    "Students are required to attend at least eighty percent of all lectures.",
    "The university will introduce a new programme in environmental policy.",
    "Innovation in renewable technology continues to drive economic growth worldwide.",
  ],
};

// Friendly display names + section grouping.
export const TASKS = [
  // Speaking
  { id: "readAloud", section: "Speaking", name: "Read Aloud", code: "RA", time: 40, prep: 35 },
  { id: "repeatSentence", section: "Speaking", name: "Repeat Sentence", code: "RS", time: 15, prep: 0 },
  { id: "describeImage", section: "Speaking", name: "Describe Image", code: "DI", time: 40, prep: 25 },
  { id: "retellLecture", section: "Speaking", name: "Re-tell Lecture", code: "RL", time: 40, prep: 10 },
  { id: "answerShortQuestion", section: "Speaking", name: "Answer Short Question", code: "ASQ", time: 10, prep: 0 },
  // Writing
  { id: "summarizeWrittenText", section: "Writing", name: "Summarize Written Text", code: "SWT", time: 600 },
  { id: "writeEssay", section: "Writing", name: "Write Essay", code: "WE", time: 1200 },
  // Reading
  { id: "readingFillBlanksRW", section: "Reading", name: "R&W Fill in the Blanks", code: "R&W FIB", time: 180 },
  { id: "readingMCMA", section: "Reading", name: "Multiple Choice — Multiple Answers", code: "MCMA-R", time: 120 },
  { id: "reorderParagraphs", section: "Reading", name: "Re-order Paragraphs", code: "RO", time: 150 },
  { id: "readingFillBlanks", section: "Reading", name: "Reading Fill in the Blanks", code: "R FIB", time: 150 },
  { id: "readingMCSA", section: "Reading", name: "Multiple Choice — Single Answer", code: "MCSA-R", time: 90 },
  // Listening
  { id: "summarizeSpokenText", section: "Listening", name: "Summarize Spoken Text", code: "SST", time: 600 },
  { id: "listeningMCMA", section: "Listening", name: "Multiple Choice — Multiple Answers", code: "MCMA-L", time: 90 },
  { id: "listeningFillBlanks", section: "Listening", name: "Listening Fill in the Blanks", code: "L FIB", time: 60 },
  { id: "highlightCorrectSummary", section: "Listening", name: "Highlight Correct Summary", code: "HCS", time: 90 },
  { id: "listeningMCSA", section: "Listening", name: "Multiple Choice — Single Answer", code: "MCSA-L", time: 60 },
  { id: "selectMissingWord", section: "Listening", name: "Select Missing Word", code: "SMW", time: 30 },
  { id: "highlightIncorrectWords", section: "Listening", name: "Highlight Incorrect Words", code: "HIW", time: 60 },
  { id: "writeFromDictation", section: "Listening", name: "Write from Dictation", code: "WFD", time: 40 },
];

export function getTaskMeta(id) {
  return TASKS.find((t) => t.id === id);
}

export function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
