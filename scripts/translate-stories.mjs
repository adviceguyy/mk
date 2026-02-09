import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, "..", "vertexkey.json");
if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
  console.error("vertexkey.json not found in project root");
  process.exit(1);
}

// All 18 story IDs and chapters (extracted from StoryCatalogScreen)
const STORIES = [
  { id: "pan-hu-dragon-dog", chapters: [
    { title: "The Emperor's Challenge", content: "Long ago, in the ancient days of the Chinese empire, there lived a powerful emperor named Ping Huang. His kingdom was vast, but it was threatened by a fearsome enemy from across the borders. The emperor, desperate for a champion, made a bold proclamation throughout the land:\n\n\"Whoever brings me the head of my enemy shall receive my daughter's hand in marriage and be granted lands of their own.\"\n\nMany brave warriors attempted the task, but none returned victorious. The court fell into despair, believing no mortal could accomplish such a feat." },
    { title: "The Dragon Dog Appears", content: "In the emperor's court lived a remarkable creature - a dog unlike any other, with fur that shimmered like dragon scales. This was Pan Hu, known in Iu Mien as Bienh Huh, the Dragon Dog. The ancient scrolls of the Jiex Sen Borngv refer to him as long quan - 'dragon dog' - appearing twenty-three times throughout the sacred text.\n\nPan Hu understood the emperor's challenge. With courage that no human warrior had shown, the Dragon Dog slipped away from the palace under cover of darkness and crossed treacherous seas and mountains to reach the enemy's stronghold." },
    { title: "The Triumph and the Marriage", content: "Pan Hu accomplished what no warrior could. He returned to the emperor bearing proof of his victory. The entire court was astonished - a dog had succeeded where the mightiest generals had failed.\n\nTrue to his word, Emperor Ping Huang gave his daughter in marriage to Pan Hu. But this was no ordinary union. Through divine transformation, Pan Hu took on a form worthy of a king. The sacred scrolls record that he progressed from being called a humble 'animal' to 'Dragon Dog Hu,' then to 'King Pan the Ancestor,' and finally simply 'the Dragon' - a title of the highest honor.\n\nFrom this union between the emperor's daughter and Pan Hu came the foundation of an entire people." },
    { title: "The Birth of a People", content: "After some years of marriage, the couple was blessed with twelve children - six sons and six daughters. The eldest inherited his father's surname Pan, which in Iu Mien is Bienh. These twelve children became the founders of the twelve clans of the Iu Mien people.\n\nEmperor Ping Huang, recognizing his grandchildren, issued an imperial decree: the twelve clans of the descendants of King Yao shall worship Pan Hu as their ancestor with 'songs, drums, and joy.' Any who failed to observe this duty would 'become a monster.'\n\nTo this day, the Iu Mien honor Pan Hu as their progenitor, and his story forms the very first chapter of who they are as a people." },
  ]},
  { id: "twelve-clans", chapters: [
    { title: "The Children of Pan Hu", content: "From the union of Pan Hu the Dragon Dog and the emperor's daughter came twelve children - six sons and six daughters. As recorded in the ancient P'a'lae Scroll, Line 55 reads: 'After some years of Panhu's marriage with the court maid, six boys and six girls were born between them.'\n\nThe eldest son inherited his father's surname Pan, and from him the other clans took their names. These twelve surnames became the foundation of all Iu Mien social organization, a system that persists unchanged to this day." },
    { title: "The Names of the Twelve", content: "The twelve clan names, as recorded across five different ancient manuscripts found in Thailand and China, are:\n\nBienh (Pan) - the first clan, bearing the Dragon Dog's own name\nZiang (Shen) - the clan of depth\nYangh (Huang) - the golden clan\nDangc (Deng) - the clan of ascent\nLeiz (Li) - the plum clan\nCaauh (Zhou) - the encompassing clan\nZeuz (Zhao) - the illuminating clan\nBorngh (Hu) - the protecting clan\nDorngh (Tang) - the enduring clan\nBungz (Feng) - the abundant clan\nLuih (Lei) - the thunder clan\nSiauh (Jiang) - the river clan\n\nThese names link every Mien person to their ancient origins. When two Mien strangers meet, the first question is always about their fingx - their clan name." },
    { title: "The Clan System Today", content: "The twelve-clan system, known as fingx in Iu Mien, is far more than a matter of surnames. It is the organizing principle of Mien society. Every Mien person inherits their father's clan name, which determines:\n\nWho they may marry - members of the same clan are considered siblings and marriage between them is forbidden.\n\nTheir ceremonial duties - each clan has specific responsibilities during community rituals and festivals.\n\nTheir community bonds - clan members are obligated to help one another, even if they are strangers from different countries.\n\nWhether in the mountains of Thailand, the villages of Laos, the cities of China, or the neighborhoods of Sacramento, California, the twelve clans of the Iu Mien remain the threads that bind the people together across all borders." },
  ]},
  { id: "lost-thirteenth-clan", chapters: [
    { title: "Thirteen, Not Twelve", content: "The Iu Mien tell of a time when there were not twelve clans, but thirteen. As Elder Zeuz Gueix-Zoih recounted in 2013: 'As for us Iu Mien of old days, we used to have thirteen clans.'\n\nThe thirteenth clan was Ziang - the Shen clan, whose Chinese character can be read as 'to sink.' This name, the elders say, was no coincidence. It was destiny written into the very word." },
    { title: "The Voyage and the Separation", content: "When the Mien ancestors set out on their great sea crossing, each clan occupied its own boat. Thirteen boats sailed together across the vast ocean. But during the voyage, something terrible happened.\n\n'When the Voyage Across the Sea took place, one boat separated itself from the group,' the ancient narrative tells us. 'Each clan had their own boat to board. Each clan occupied one boat.'\n\nThe clan Ziang, for reasons lost to time, did not stay with the convoy. Their boat drifted away from the others." },
    { title: "Lost to the Waters", content: "The story concludes with devastating simplicity: 'The reason why the clan Ziang do not exist any longer - they fell into the sea and all died.'\n\nThe symbolism is hauntingly preserved in the Chinese character for the clan's name. The character for Ziang can mean 'to sink' - as if the clan's fate was encoded in their very identity. Some storytellers note that in the years of Tiger and Rabbit, during a great drought that lasted three years, the clans were forced to take to the sea. In those desperate times, the thirteenth clan was lost.\n\nThis is why the Iu Mien today have twelve clans, not thirteen. The memory of the Ziang lives on only in the stories passed from elder to child, a reminder of the price their ancestors paid in their long journey to find a new home." },
  ]},
  { id: "sea-crossing-odyssey", chapters: [
    { title: "The Peaceful Plains", content: "Before the great crossing, the ancestors of the Iu Mien lived peacefully near Nanjing, on the shores of the sea. The storyteller Zeuz Gueix-Zoih describes this time: 'As for living on Nanjing sea shore, the country was very fertile. There were many fields for farming, and the Iu Mien were happy.'\n\nThis was a time of abundance, when the land provided generously and the twelve clans lived without the burden of taxes or the obligation to worship any spirits. It was, in the memory of the Mien, a kind of paradise." },
    { title: "The Three-Year Drought", content: "Then came the catastrophe. For three terrible years, not a single drop of rain fell from the sky. The earth cracked, the rivers dried, and nothing would grow.\n\n'The sky was arid for three years and it did not rain. For three years there was not a single drop of rain,' the storyteller recounts. 'So then we did not have harvest. There were no crops to be produced. Though they farm or plant things, nothing sprouted.'\n\nEverything withered and died together, and the people could not survive. The twelve clans of the Iu Mien faced a terrible choice: remain and perish, or take to the unknown sea in search of a new land." },
    { title: "Building the Ships", content: "The Iu Mien, a mountain people who had never been seafarers, made the desperate decision to cross the ocean. They assembled large ships and prepared for a voyage into the unknown.\n\n'Built ships, came paddling, continued to escape, passed the sea,' the ancient narrative tells us. Each of the thirteen clans built their own boat, and the great convoy set out across the waters.\n\nIt was during this perilous crossing that one boat - belonging to the Ziang clan - separated from the group and was lost, reducing the Mien from thirteen clans to twelve." },
    { title: "The Sea Dragon's Gate", content: "As the fleet of boats crossed to the far side of the ocean, the people heard a terrifying sound. 'As they went on, they only heard that Sea Dragon's Gate was making noise.'\n\nThe roar of the Sea Dragon's Gate - koiv luangh muonh - filled the travelers with dread. Some said it was thunder. Others insisted it was not thunder but truly the noise of the Sea Dragon's Gate.\n\n'As they were repeatedly listening to that noise, it turned out that it was really the noise of the Sea Dragon's Gate, they say.' Being terrified, the people petitioned the spirits, making vows and pledges. When they accidentally petitioned spirits of the middle rank, those spirits agreed to carry the Iu Mien safely to shore." },
    { title: "Arrival in a New Land", content: "After the harrowing crossing, the surviving twelve clans reached the coast of southern China. They landed in the region of Guizhou province and Yunnan province.\n\n'They ended up landing on Guizhou province. And also arrived at Yunnan province,' the story records.\n\nFrom there, the Iu Mien began their long journey through the mountains of southern China, eventually spreading through Vietnam, Laos, and Thailand over the following centuries. But they never forgot the sea crossing. The story of Piu-Yiuh Jiex Koiv - the Sea Crossing Odyssey - became one of the two foundational narratives of the Mien people, told and retold by every generation." },
  ]},
  { id: "mountain-crossing-passport", chapters: [
    { title: "The Sacred Document", content: "Of all the treasures of the Iu Mien people, none is more revered than the Jiex Sen Borngv - the Mountain Crossing Passport. This document, written in classical Chinese on scrolls up to 4.6 meters long, is the foundational charter of the Mien people.\n\nIts full title is Ping Huang Quan Die Guo Shan Bang - 'The Perpetual Redaction of the Imperial Decree of Emperor Ping Huang for Protection When Travelling in the Hills.' Over one hundred copies of this manuscript have been found across China and Thailand, each carefully hand-copied by Mien scribes through the centuries." },
    { title: "The Emperor's Covenant", content: "The Jiex Sen Borngv records the covenant between Emperor Ping Huang and the descendants of Pan Hu. According to the document, the Emperor granted the twelve clans seven extraordinary privileges:\n\nFirst, the right to live freely in the designated mountains across thirteen provinces under heaven.\n\nSecond, exemption from all taxes - the phrase 'juan mian shui' (remit, exempt, tax) appears prominently in the scroll.\n\nThird, freedom from conscripted labor - they would never be forced to serve as laborers for the empire.\n\nFourth, the privilege of free passage - when crossing rivers by ferry, they need not pay money.\n\nFifth, when meeting government officials on the road, they need not kneel down before them.\n\nSixth, the duty and right to worship their ancestor Pan Hu with songs, drums, and celebration.\n\nSeventh, the designation to cultivate and manage mountains forever, making their living as highland farmers." },
    { title: "A Document of Identity", content: "The Jiex Sen Borngv is far more than a historical record. For the Iu Mien, it is proof of their identity, their rights, and their ancient covenant with the powers of the world.\n\nWherever the Mien traveled - from the mountains of southern China through Vietnam, Laos, and Thailand - they carried copies of this document. When challenged by local authorities, they could present the Jiex Sen Borngv as evidence of their right to settle in the highlands.\n\nThe scroll ends with a powerful declaration: Emperor Ping Huang's certificate of passage through mountain sides shall protect you and exempt you from conscripted labor, with the implication that in return, you must 'watch over mountains forever' by farming.\n\nEven today, in Mien communities around the world, the Jiex Sen Borngv is read aloud at major ceremonies, connecting the present generation to an ancient promise that has endured for over a thousand years." },
  ]},
  { id: "three-languages", chapters: [
    { title: "One People, Three Voices", content: "The Iu Mien are unique among the world's peoples in possessing not one but three distinct registers of their language, each serving a different purpose in their cultural life.\n\nAs the Mien proverb says: 'Mienh maaih buo nyungc waac' - 'The Mien have three types of language.' These three voices of the Mien people represent one of the most remarkable linguistic traditions in Southeast Asia." },
    { title: "Mienh Waac - The Everyday Voice", content: "The first register is mienh waac - the vernacular, everyday language spoken in homes, markets, and fields. This is the mother tongue that children learn at their parents' knees, the language of laughter and argument, of cooking instructions and bedtime stories.\n\nMienh waac is a tonal language with six tones in open syllables and two additional tones in checked syllables. It is predominantly monosyllabic - each word is typically one syllable carrying one meaning. Yet through the art of compounding, the Mien create words of beautiful complexity from these simple building blocks." },
    { title: "Nzung-Waac - The Song Language", content: "The second register is nzung-waac - the literary song language. This is the language of ceremonies and traditional singing, borrowing heavily from ancient Chinese poetic forms. The elders say: 'Nzung nyei waac ndo haic' - 'The song language is so profound.'\n\nNzung-waac follows a seven-syllable poetic structure inherited from the Tang Dynasty (618-907 CE), connecting the Mien to over a thousand years of literary tradition. Only those trained in the ceremonial arts can fully command this register, and its mastery is considered one of the highest achievements of Mien intellectual life." },
    { title: "Ziec-Waac - The Sacred Voice", content: "The third and most mysterious register is ziec-waac - the ritual language of sacrifice. This sacred tongue is spoken only by trained sai mienh (ritual practitioners) during ceremonial rites that can last up to three days.\n\n'Mienh nyei gueix-sieqv longc ziec-waac gorngv' - 'Mien ceremonies use ritual language.' In ziec-waac, practitioners chant hundreds of verses to communicate with ancestral spirits, petition the divine, and maintain the spiritual bonds between the living and the departed.\n\nTogether, these three registers create a rich tapestry of expression that allows the Mien to speak to the mundane world, to beauty and art, and to the sacred - all in their own tongue." },
  ]},
  { id: "dragon-worship-decree", chapters: [
    { title: "The Imperial Command", content: "Within the sacred Jiex Sen Borngv, lines 78 through 84 record a pivotal moment in Mien spiritual history. Emperor Ping Huang issues a chiling - an imperial decree - that would shape the religious practices of the Iu Mien for all time to come.\n\nThe decree begins: 'The dragon dog named Hu is made to be King Pan the Ancestor.' With these words, the emperor elevated Pan Hu from a creature of humble origins to a divine ancestor, a ghost god with merit after his death." },
    { title: "The Sacred Duty", content: "The emperor then commanded all twelve clans to gather - men and women alike - to worship and venerate their ancestor. This worship was to be conducted with 'songs, drums, and joy' - ge gu le in Chinese.\n\nBut the decree carried a dire warning: 'In case there is anyone who does not observe this duty, he shall become a monster.' This was no mere suggestion; it was a cosmic law binding the descendants of Pan Hu to honor their progenitor forever.\n\nTo this day, the Iu Mien hold zaangc ong-taaix - ancestor worship ceremonies - three times each year, fulfilling the ancient emperor's command with the same songs, drums, and celebration prescribed over a millennium ago." },
  ]},
  { id: "sai-mienh", chapters: [
    { title: "The Ritual Practitioners", content: "Among the Iu Mien, the sai mienh hold a position of extraordinary respect and responsibility. These ritual practitioners are the keepers of ziec-waac - the sacred ritual language - and serve as intermediaries between the human world and the spirit realm.\n\nAlways male, the sai mienh undergo years of training to master the hundreds of ceremonial verses required for their duties. They learn to read the ancient Chinese texts that accompany Mien rituals, texts written in a distinctive adaptation of Chinese characters that only they can decipher." },
    { title: "Ceremonies That Span Days", content: "The ceremonies conducted by the sai mienh are among the most elaborate in Southeast Asian culture. Major rituals can last up to three days, during which the practitioner chants continuously, calling upon ancestral spirits and petitioning the divine on behalf of the community.\n\nThese ceremonies mark the most important moments of Mien life: births, marriages, deaths, and the three annual ancestor worship festivals. Through their sacred language, the sai mienh maintain the spiritual bonds that connect the living to the departed, ensuring that the covenant between the Mien and their ancestors remains unbroken.\n\nAs the Mien saying goes: 'Daux gaux se gorngv taux hnyouv nyei waac' - 'Praying is speaking from the heart.' The sai mienh are those who speak from the heart of the entire community." },
  ]},
  { id: "ancestor-veneration", chapters: [
    { title: "The Heart of Mien Spirituality", content: "At the center of Iu Mien spiritual life is zaangc ong-taaix - ancestor veneration. Three times each year, Mien families gather to honor their forebears, maintaining a spiritual bond that stretches back through countless generations.\n\nAs the proverb teaches: 'Mienh zaangc ong-taaix weic zuqc oix zuqc jangx jienv' - 'The Mien worship ancestors because we must remember.' This is not mere ritual observance; it is an act of love and obligation, connecting the living to all who came before." },
    { title: "The Ani-Taoist Tradition", content: "Mien spirituality is a unique blend of animism and Taoism, sometimes called 'Ani-Taoism.' The Mien believe strongly in the spirit world, where their ancestors' spirits - zu zong mienv - watch over the living and can be petitioned for guidance and protection.\n\nThis tradition incorporates elements of medieval Chinese Daoism, woven together with indigenous beliefs about nature spirits, the power of mountains and water, and the presence of the divine in everyday life.\n\nDuring ceremonies, the sai mienh uses sacred texts and ritual objects to invite good spirits to stay and protect the family from illness and misfortune. On occasions such as house blessings and merry-making ceremonies, the entire community participates in honoring the spiritual forces that guide their lives." },
  ]},
  { id: "mien-embroidery", chapters: [
    { title: "Stories Woven in Thread", content: "The art of Mien embroidery is far more than decoration - it is a visual language that tells the story of who the Mien people are. The intricate cross-stitch patterns that adorn traditional Mien clothing encode centuries of cultural memory in geometric designs passed from mother to daughter.\n\nEach pattern carries meaning: mountain peaks represent the highland homes of the Mien, interlocking spirals echo the dragon ancestry of Pan Hu, and repeating geometric forms mirror the orderly structure of the twelve-clan system. The colors, too, speak: red for vitality and celebration, indigo for the mountains, and silver thread for the connection to the spirit world." },
    { title: "A Living Tradition", content: "Traditional Mien clothing, adorned with these elaborate embroidered patterns and silver jewelry, is worn with pride at New Year celebrations, weddings, and cultural gatherings.\n\nIn the refugee camps of Thailand and in the diaspora communities of America and France, Mien women continued to embroider, passing the patterns to their daughters even as the world around them changed dramatically. For a people without a traditional written language, embroidery served as a form of visual literacy - a way to record and transmit cultural identity that required no paper or ink.\n\nToday, the sight of traditional Mien embroidery connects scattered communities across the globe, a thread of identity that no displacement can break." },
  ]},
  { id: "great-drought", chapters: [
    { title: "Three Years Without Rain", content: "The Mien ancestors lived peacefully near Nanjing, on fertile plains by the sea. The land was bountiful, the fields abundant, and the people were happy. Then, in the years of Tiger and Rabbit, disaster struck.\n\nFor three terrible years, the sky turned to bronze and not a single drop of rain fell upon the earth. The storytellers recount with vivid despair: 'The sky was arid for three years and it did not rain. For three years there was not a single drop of rain.'\n\nBanana trees burst into spontaneous flame from the heat. There was no food to eat, no rice to cook. 'No matter what you plant, they didn't grow.' The great drought brought the Mien ancestors to the very edge of extinction." },
    { title: "The Decision to Leave", content: "With their crops destroyed, their granaries empty, and their children starving, the twelve clans faced an impossible choice. They could remain on the dying land and perish, or they could take to the sea - an element as foreign to these mountain people as the stars.\n\n'Everything, well, got drought all together and could not survive. As they could not survive, they the twelve clans of the Iu Mien therefore lived there. Iu Mien then after living there, assembled ships, came paddling, continued to escape, passed the sea.'\n\nThis desperate flight from drought became the beginning of the Piu-Yiuh Jiex Koiv - the Sea Crossing Odyssey - one of the two defining narratives of the Mien people." },
  ]},
  { id: "sea-dragons-gate", chapters: [
    { title: "The Terrible Sound", content: "As the fleet of Mien boats crossed the great ocean, the people heard something that filled them with terror. A deep, rumbling sound echoed across the waters, growing louder with each passing moment.\n\n'As they went on, they only heard that Sea Dragon's Gate was making noise.' The koiv luangh muonh - the Sea Dragon's Gate - was a place of legend, where the boundary between the mortal world and the realm of spirits grew thin.\n\nDebate erupted among the travelers. 'Some said that the thunder be noisy. Others said it's not a noise of the Sea Dragon's Gate be noisy.' But as they listened more carefully, the truth became undeniable: 'It turned out that it was really the noise of the Sea Dragon's Gate, they say.'" },
    { title: "The Petition to the Spirits", content: "Gripped by fear, the Mien ancestors did what their descendants would do for centuries to come - they turned to the spirits for help.\n\n'Being terrified, they petitioned the spirits there. When they petitioned the spirits, it accidentally hit the middle rank spirits.' Through this petition, the middle-rank spirits agreed to carry the Iu Mien safely to shore.\n\nUpon arriving safely at the land of Guei Ziou Fouv - the southern coast of China - the grateful Mien began a practice that continues to this day: they sacrificed pigs to the spirits in gratitude for their safe passage. This became the origin of the Mien tradition of spirit offerings and animal sacrifice during major ceremonies.\n\nThe terrifying sound of the Sea Dragon's Gate had led the Mien to establish the spiritual practices that would define their culture for all generations to come." },
  ]},
  { id: "giant-turtle", chapters: [
    { title: "The Boulder That Moved", content: "After the harrowing sea crossing, the exhausted Mien survivors reached the shore. There, they encountered something remarkable - but in their weariness, they did not immediately understand what they had found.\n\n'A gigantic turtle was lying there,' the story tells us. 'But they assumed it to be a rock-boulder.' The enormous creature was so vast and still that the travelers mistook it for stone.\n\nThey went to the 'boulder' and burned fire on its back to cook rice and eat. They kindled fire, and the fire burned hot. But then something extraordinary happened." },
    { title: "The Turtle Reveals Itself", content: "As the fire grew hot upon its shell, the great turtle could no longer remain still. 'This turtle overturned its body there and all people on it fell into the sea.'\n\nThe narrator pauses to explain with a touch of wonder: 'Turtle, do you know? We call it doc - turtle. Thai people call it dauc.'\n\nThe story of the giant turtle became a beloved tale among the Mien - a moment of both danger and comedy in the midst of their greatest ordeal. It serves as a reminder that even in the darkest times, there can be moments of astonishment and even laughter, and that the natural world holds surprises beyond human imagination." },
  ]},
  { id: "highland-farmers", chapters: [
    { title: "Life on the Mountain", content: "For over three thousand years, the Iu Mien have been people of the mountains. As the proverb says: 'Mienh yiem mbong gu'nguaaic buo cin hnyangx' - 'The Mien have lived in the high mountains for three thousand years.'\n\nThis mountain identity shapes everything about Mien life. The Jiex Sen Borngv itself designates that the twelve clans shall 'cultivate and manage mountains' as their way of life. Twenty-six mountains across thirteen provinces were specifically named as the homelands of the Mien people." },
    { title: "Faam Borngh: Swidden Farming", content: "The Mien practiced faam borngh - swidden or slash-and-burn agriculture - a sophisticated system of rotating cultivation perfectly adapted to mountain terrain. Each season, families would clear a patch of forest, burn the vegetation to create nutrient-rich ash, and plant upland rice, corn, and vegetables.\n\nAfter two to three years of cultivation, the land would be left fallow for a decade or more to regenerate, and the family would move to a new plot. This required villages to relocate every eight to ten years, creating a pattern of movement that became woven into the Mien way of life.\n\nFar from being primitive, this system represented a deep understanding of mountain ecology - a way to sustain life on steep, thin-soiled terrain where permanent farming would quickly exhaust the land." },
    { title: "The Mountain Community", content: "Mien villages typically housed communities of up to two hundred people, their houses built of durable hardwood with packed earth floors, situated on the hillsides overlooking the valleys below. Life revolved around the agricultural calendar, with planting and harvest seasons punctuated by ceremonies and celebrations.\n\nWild jungle products - resin, honey, and medicinal herbs - supplemented farming income and were traded with lowland merchants for iron tools, salt, and cloth. The seventy-seven species of medicinal plants used in Mien villages represent a pharmacological knowledge refined over millennia of mountain living.\n\nEven today, whether in the highlands of Chiang Rai or the communities of California, the Mien carry their mountain identity with them - a people whose roots reach deep into the highest places of the earth." },
  ]},
  { id: "siang-nzung", chapters: [
    { title: "The Celebration of Renewal", content: "Siang Nzung - the Mien New Year - falls on the same day as Chinese New Year, in late January or early February, following the lunar calendar. For three days, the Mien community comes alive with celebration, feasting, and the renewal of bonds between family, clan, and community.\n\nThe preparations begin long before the festival itself. Families spend days cooking traditional dishes, cleaning and decorating their homes, and preparing the ceremonial items that will mark the transition from old year to new." },
    { title: "Red Eggs and Red Envelopes", content: "Among the most distinctive traditions of Mien New Year are the red eggs - eggs dyed bright red that symbolize blessing and renewal of the soul. These crimson eggs are exchanged between families and offered to honored guests, each one carrying a prayer for health and prosperity.\n\nChildren eagerly await the red envelopes filled with money, given by elders as tokens of good fortune. But the envelopes carry more than currency - they carry the blessings of the older generation, along with words of wisdom for the year ahead.\n\nCommunity members dress in their finest traditional clothing - intricately embroidered garments adorned with silver jewelry that represents the family's heritage. Traditional dances reenact the ancient practices of mountain life, with men hoeing the land and women seeding the soil, connecting the diaspora to the agricultural rhythms of their ancestors' highland homes." },
  ]},
  { id: "mien-wedding", chapters: [
    { title: "Marriage Between Clans", content: "In the Mien tradition, marriage is never simply the union of two individuals - it is the joining of two clans. The twelve-clan system that has organized Mien society for over a millennium dictates the most fundamental rule of marriage: you may not marry within your own clan.\n\nWhen a young Mien man and woman wish to marry, the first question is always about their fingx - their clan name. Members of the same clan are considered brothers and sisters regardless of blood relation, and marriage between them is strictly forbidden. This rule ensures that every marriage strengthens the bonds between different clans, weaving the community ever more tightly together." },
    { title: "The Ceremony", content: "A traditional Mien wedding is an elaborate affair that can span multiple days. The bride's family receives a bride price, carefully negotiated between the two clans, which represents both the value placed on the bride and the commitment of the groom's family.\n\nThe bride wears an extraordinary outfit of hand-embroidered fabric, the patterns worked by her own hands and those of her mother and grandmother. Silver jewelry adorns her headdress, neck, and wrists - each piece a work of art passed down through generations.\n\nThe sai mienh performs ceremonial rites, blessing the union and calling upon the ancestors of both clans to watch over the new couple. The entire community gathers to feast, celebrate, and witness the moment when two clans become one family.\n\nIn this way, Mien weddings have served for centuries as the living expression of their social structure - a beautiful reminder that no clan stands alone." },
  ]},
  { id: "crossing-to-america", chapters: [
    { title: "The Secret War", content: "In the 1960s, as war engulfed Southeast Asia, the Iu Mien of Laos were drawn into a conflict that would change their destiny forever. The United States, fighting communist forces in the region, sought help from the hill tribes of Laos. Like other highland peoples, the Mien provided intelligence, surveillance, and armed support.\n\nWhen the war ended in 1975 and communist forces were victorious, the Mien who had aided the Americans faced persecution and death. More than seventy percent of the Iu Mien people fled their homelands, crossing into Thailand as refugees." },
    { title: "The Refugee Camps", content: "In the refugee camps of Thailand, the Mien waited for an uncertain future. Families who had lived for generations in mountain villages found themselves in crowded camps, their old way of life destroyed.\n\nYet even in these desperate circumstances, the Mien held fast to their culture. Women continued to embroider traditional patterns. Elders told the old stories - of Pan Hu, of the Sea Crossing, of the Twelve Clans. The sai mienh performed ceremonies to honor the ancestors and petition the spirits for guidance.\n\nWith the assistance of the United Nations, thousands of Mien families were eventually resettled in Western countries. While some went to France and Canada, the majority chose the United States, settling primarily on the West Coast - in California, Oregon, and Washington." },
    { title: "A New Mountain to Cross", content: "The transition to American life represented yet another mountain crossing for the Mien people. Families who had farmed mountain slopes now navigated urban landscapes. Children who might have learned the ceremonial songs instead learned English in American classrooms.\n\nToday, between 50,000 and 70,000 Iu Mien Americans live in the United States, with major communities in Sacramento, Oakland, Portland, and Seattle. They face the challenge that all diaspora peoples face: how to preserve an ancient culture in a modern world.\n\nAs the elders remind the young: 'Naaiv nyei dorn-jueiv oix zuqc hiuv ninh mbuo nyei gorn-ndoqv' - 'The children of this generation must know their heritage.' The story of crossing the mountains to America is the latest chapter in a journey that began when Pan Hu first crossed the sea for his emperor - a journey of courage, loss, and the unbreakable determination to survive." },
  ]},
  { id: "peaceful-plains-nanjing", chapters: [
    { title: "Paradise Before the Storm", content: "Before the great drought, before the sea crossing, before the millennia of mountain wandering, the ancestors of the Iu Mien lived in a place of abundance. The storyteller Zeuz Gueix-Zoih describes this golden age:\n\n'As for living on Nanjing sea shore, the country was very fertile. There were many fields for farming, and the Iu Mien were happy.'\n\nIn this fertile coastal plain, the twelve clans lived without want. They needed not worship spirits nor pay taxes on their crops. It was, in the collective memory of the Mien, a paradise lost." },
    { title: "The Memory That Endures", content: "The Mien have no written record of exactly when or for how many years they lived near Nanjing. As the storyteller admits: 'We don't have any written record. So we can't remember. How many years, we don't know.'\n\nYet the memory of that peaceful time by the sea persists in the oral tradition, passed down through countless generations. It represents a Before - a time of ease and plenty against which all subsequent hardship is measured.\n\nFrom these plains, the great drought drove the Mien to the sea. From the sea, the survivors reached the mountains of southern China. From those mountains, over centuries, they spread through Vietnam, Laos, and Thailand. And from there, war drove them across the greatest ocean of all, to America.\n\nEach migration echoes the first departure from Nanjing - a people always moving, always carrying their stories with them, always searching for a place where the land is fertile and the people can be happy once more." },
  ]},
];

async function translateSingleStory(genAI, story) {
  let chapterText = "";
  story.chapters.forEach((ch, idx) => {
    chapterText += `CHAPTER ${idx}:\nTITLE: ${ch.title}\nCONTENT: ${ch.content}\n\n`;
  });

  const prompt = `You are a professional translator specializing in the Iu Mien language using the IuMiNR (Iu Mien New Romanization) script.

Translate the following story chapters from English into Mien (Iu Mien) language.

Guidelines:
- Use proper IuMiNR spelling and tone markers
- Preserve meaning and cultural context
- Use authentic Mien vocabulary and grammar
- Keep proper nouns as-is or use known Mien equivalents (Pan Hu = Bienh Huh, etc.)
- Maintain storytelling tone

Return a JSON object with a "chapters" array. Each chapter: {"title": "translated title", "content": "translated content"}

${chapterText}`;

  const response = await genAI.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.3,
      maxOutputTokens: 65536,
    },
  });

  return JSON.parse(response.text);
}

async function main() {
  // Use Vertex AI with service account key file
  let genAI = new GoogleGenAI({
    vertexai: true,
    project: "mien-kingdom",
    location: "global",
    googleAuthOptions: {
      keyFile: SERVICE_ACCOUNT_KEY_PATH,
    },
  });
  console.log("Using Vertex AI (paid) with project mien-kingdom\n");
  const allTranslations = {};

  // Try to load partial progress
  const progressPath = path.join(__dirname, ".translate-progress.json");
  if (fs.existsSync(progressPath)) {
    const saved = JSON.parse(fs.readFileSync(progressPath, "utf-8"));
    Object.assign(allTranslations, saved);
    console.log(`Resuming with ${Object.keys(saved).length} already translated.`);
  }

  console.log(`Translating ${STORIES.length} stories one at a time...\n`);

  for (let i = 0; i < STORIES.length; i++) {
    const story = STORIES[i];
    if (allTranslations[story.id]) {
      console.log(`[${i + 1}/${STORIES.length}] ${story.id} - already done, skipping`);
      continue;
    }

    console.log(`[${i + 1}/${STORIES.length}] Translating ${story.id} (${story.chapters.length} chapters)...`);

    let retries = 5;
    while (retries > 0) {
      try {
        const result = await translateSingleStory(genAI, story);
        allTranslations[story.id] = result;
        // Save progress after each story
        fs.writeFileSync(progressPath, JSON.stringify(allTranslations, null, 2));
        console.log(`  Done!`);
        break;
      } catch (err) {
        retries--;
        console.error(`  Error: ${err.message}`);
        if (retries > 0) {
          const waitTime = err.message?.includes("429") ? 65000 : 10000;
          console.log(`  Retrying in ${waitTime/1000}s... (${retries} left)`);
          await new Promise(r => setTimeout(r, waitTime));
        } else {
          console.error(`  FAILED after 5 attempts.`);
        }
      }
    }

    // Rate limit: 5s between calls
    if (i < STORIES.length - 1) {
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log(`\nCompleted: ${Object.keys(allTranslations).length}/${STORIES.length} stories translated.`);

  // Write the static TypeScript file
  const outputPath = path.join(__dirname, "..", "client", "data", "mienTranslations.ts");
  const fileContent = `// Auto-generated Mien translations for all stories
// Generated on ${new Date().toISOString()}
// Do not edit manually - regenerate with: node scripts/translate-stories.mjs

export type StoryTranslations = Record<
  string,
  { chapters: { title: string; content: string }[] }
>;

export const MIEN_TRANSLATIONS: StoryTranslations = ${JSON.stringify(allTranslations, null, 2)};
`;

  fs.writeFileSync(outputPath, fileContent, "utf-8");
  console.log(`Written to ${outputPath}`);

  // Clean up progress file
  if (fs.existsSync(progressPath)) fs.unlinkSync(progressPath);
}

main().catch(console.error);
