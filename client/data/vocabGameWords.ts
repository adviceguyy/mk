export interface VocabWord {
  id: string;
  mien: string;
  english: string;
  svgKey: string;
  category: string;
}

export const VOCAB_WORDS: VocabWord[] = [
  // Nature (~10 words)
  { id: "1", mien: "hnoi", english: "sun", svgKey: "sun", category: "nature" },
  { id: "2", mien: "hlaax", english: "moon", svgKey: "moon", category: "nature" },
  { id: "3", mien: "hleix", english: "star", svgKey: "star", category: "nature" },
  { id: "4", mien: "ndiangx", english: "tree", svgKey: "tree", category: "nature" },
  { id: "5", mien: "wuom", english: "water", svgKey: "water", category: "nature" },
  { id: "6", mien: "mbong", english: "mountain", svgKey: "mountain", category: "nature" },
  { id: "7", mien: "douz", english: "fire", svgKey: "fire", category: "nature" },
  { id: "8", mien: "mbiungc", english: "rain", svgKey: "rain", category: "nature" },
  { id: "9", mien: "mbuox", english: "cloud", svgKey: "cloud", category: "nature" },
  { id: "10", mien: "biangh", english: "flower", svgKey: "flower", category: "nature" },

  // Animals (~10 words)
  { id: "11", mien: "mbiauz", english: "fish", svgKey: "fish", category: "animals" },
  { id: "12", mien: "norqc", english: "bird", svgKey: "bird", category: "animals" },
  { id: "13", mien: "gaiv", english: "chicken", svgKey: "chicken", category: "animals" },
  { id: "14", mien: "dungz", english: "pig", svgKey: "pig", category: "animals" },
  { id: "15", mien: "juv", english: "dog", svgKey: "dog", category: "animals" },
  { id: "16", mien: "maeux", english: "cat", svgKey: "cat", category: "animals" },
  { id: "17", mien: "maaz", english: "horse", svgKey: "horse", category: "animals" },
  { id: "18", mien: "ngongh", english: "cow", svgKey: "cow", category: "animals" },
  { id: "19", mien: "naang", english: "snake", svgKey: "snake", category: "animals" },
  { id: "20", mien: "biangh-ndaangc", english: "butterfly", svgKey: "butterfly", category: "animals" },

  // Household (~10 words)
  { id: "21", mien: "biauv", english: "house", svgKey: "house", category: "household" },
  { id: "22", mien: "gaengh", english: "door", svgKey: "door", category: "household" },
  { id: "23", mien: "zoux", english: "table", svgKey: "table", category: "household" },
  { id: "24", mien: "deix", english: "chair", svgKey: "chair", category: "household" },
  { id: "25", mien: "coux", english: "bed", svgKey: "bed", category: "household" },
  { id: "26", mien: "buo", english: "pot", svgKey: "pot", category: "household" },
  { id: "27", mien: "norm", english: "bowl", svgKey: "bowl", category: "household" },
  { id: "28", mien: "faanc", english: "spoon", svgKey: "spoon", category: "household" },
  { id: "29", mien: "nzuih", english: "knife", svgKey: "knife", category: "household" },
  { id: "30", mien: "faanx", english: "broom", svgKey: "broom", category: "household" },

  // Food (~10 words)
  { id: "31", mien: "mbueic", english: "rice", svgKey: "rice", category: "food" },
  { id: "32", mien: "ndaang", english: "egg", svgKey: "egg", category: "food" },
  { id: "33", mien: "orv", english: "meat", svgKey: "meat", category: "food" },
  { id: "34", mien: "nzaaux", english: "salt", svgKey: "salt", category: "food" },
  { id: "35", mien: "dorngh", english: "sugar", svgKey: "sugar", category: "food" },
  { id: "36", mien: "diuv", english: "banana", svgKey: "banana", category: "food" },
  { id: "37", mien: "maanh", english: "mango", svgKey: "mango", category: "food" },
  { id: "38", mien: "doic", english: "corn", svgKey: "corn", category: "food" },
  { id: "39", mien: "fuqv", english: "taro", svgKey: "taro", category: "food" },
  { id: "40", mien: "gingv", english: "ginger", svgKey: "ginger", category: "food" },

  // Body (~10 words)
  { id: "41", mien: "m'zing", english: "eye", svgKey: "eye", category: "body" },
  { id: "42", mien: "m'normh", english: "ear", svgKey: "ear", category: "body" },
  { id: "43", mien: "buoz", english: "hand", svgKey: "hand", category: "body" },
  { id: "44", mien: "zaux", english: "foot", svgKey: "foot", category: "body" },
  { id: "45", mien: "m'nqorngv", english: "head", svgKey: "head", category: "body" },
  { id: "46", mien: "nzuih-bieqv", english: "mouth", svgKey: "mouth", category: "body" },
  { id: "47", mien: "mbiouz", english: "nose", svgKey: "nose", category: "body" },
  { id: "48", mien: "mba", english: "hair", svgKey: "hair", category: "body" },
  { id: "49", mien: "nyaah", english: "tooth", svgKey: "tooth", category: "body" },
  { id: "50", mien: "hnyouv", english: "heart", svgKey: "heart", category: "body" },

  // Clothing (~10 words)
  { id: "51", mien: "lui-ndaangx", english: "shirt", svgKey: "shirt", category: "clothing" },
  { id: "52", mien: "cou-ndaangx", english: "pants", svgKey: "pants", category: "clothing" },
  { id: "53", mien: "heh", english: "shoe", svgKey: "shoe", category: "clothing" },
  { id: "54", mien: "muoc", english: "hat", svgKey: "hat", category: "clothing" },
  { id: "55", mien: "buoz-taux", english: "glove", svgKey: "glove", category: "clothing" },
  { id: "56", mien: "ndorpc", english: "belt", svgKey: "belt", category: "clothing" },
  { id: "57", mien: "nzung", english: "dress", svgKey: "dress", category: "clothing" },
  { id: "58", mien: "meih-ndaangx", english: "sock", svgKey: "sock", category: "clothing" },
  { id: "59", mien: "buoz-nzaaux", english: "ring", svgKey: "ring", category: "clothing" },
  { id: "60", mien: "nquaah", english: "scarf", svgKey: "scarf", category: "clothing" },

  // Weather (~10 words)
  { id: "61", mien: "nziaaux", english: "wind", svgKey: "wind", category: "weather" },
  { id: "62", mien: "duih-borgv", english: "snow", svgKey: "snow", category: "weather" },
  { id: "63", mien: "mbormx", english: "thunder", svgKey: "thunder", category: "weather" },
  { id: "64", mien: "njang", english: "lightning", svgKey: "lightning", category: "weather" },
  { id: "65", mien: "mbiuv", english: "fog", svgKey: "fog", category: "weather" },
  { id: "66", mien: "duqv-ndaangc", english: "rainbow", svgKey: "rainbow", category: "weather" },
  { id: "67", mien: "borgv-jaangh", english: "ice", svgKey: "ice", category: "weather" },
  { id: "68", mien: "borngz-nziaaux", english: "storm", svgKey: "storm", category: "weather" },
  { id: "69", mien: "lungh-ndorm", english: "sunrise", svgKey: "sunrise", category: "weather" },
  { id: "70", mien: "lungh-muotv", english: "sunset", svgKey: "sunset", category: "weather" },

  // Tools & Objects (~10 words)
  { id: "71", mien: "zaangv", english: "hammer", svgKey: "hammer", category: "tools" },
  { id: "72", mien: "daav", english: "axe", svgKey: "axe", category: "tools" },
  { id: "73", mien: "cingx", english: "bell", svgKey: "bell", category: "tools" },
  { id: "74", mien: "nzuih-nzioux", english: "scissors", svgKey: "scissors", category: "tools" },
  { id: "75", mien: "hmz", english: "needle", svgKey: "needle", category: "tools" },
  { id: "76", mien: "ndoqv", english: "basket", svgKey: "basket", category: "tools" },
  { id: "77", mien: "dingx", english: "candle", svgKey: "candle", category: "tools" },
  { id: "78", mien: "zaang-nzuih", english: "key", svgKey: "key", category: "tools" },
  { id: "79", mien: "gorn-nzuih", english: "pen", svgKey: "pen", category: "tools" },
  { id: "80", mien: "sou", english: "book", svgKey: "book", category: "tools" },

  // Plants & Garden (~10 words)
  { id: "81", mien: "mbaac", english: "leaf", svgKey: "leaf", category: "plants" },
  { id: "82", mien: "biouv", english: "seed", svgKey: "seed", category: "plants" },
  { id: "83", mien: "ndiangx-zoux", english: "bamboo", svgKey: "bamboo", category: "plants" },
  { id: "84", mien: "cuotv", english: "grass", svgKey: "grass", category: "plants" },
  { id: "85", mien: "biouv-ndiangx", english: "fruit", svgKey: "fruit", category: "plants" },
  { id: "86", mien: "mbaac-zeiv", english: "mushroom", svgKey: "mushroom", category: "plants" },
  { id: "87", mien: "ndiangx-nzuih", english: "branch", svgKey: "branch", category: "plants" },
  { id: "88", mien: "hmouv", english: "root", svgKey: "root", category: "plants" },
  { id: "89", mien: "mbaac-biangh", english: "petal", svgKey: "petal", category: "plants" },
  { id: "90", mien: "ndiangx-juv", english: "vine", svgKey: "vine", category: "plants" },

  // Sky & Space (~10 words)
  { id: "91", mien: "lungh", english: "sky", svgKey: "sky", category: "sky" },
  { id: "92", mien: "ndaamh-zaqc", english: "earth", svgKey: "earth", category: "sky" },
  { id: "93", mien: "borqc", english: "rock", svgKey: "rock", category: "sky" },
  { id: "94", mien: "zaangh", english: "river", svgKey: "river", category: "sky" },
  { id: "95", mien: "koiv", english: "lake", svgKey: "lake", category: "sky" },
  { id: "96", mien: "haih-zaangh", english: "ocean", svgKey: "ocean", category: "sky" },
  { id: "97", mien: "ziangx", english: "bridge", svgKey: "bridge", category: "sky" },
  { id: "98", mien: "jauv", english: "road", svgKey: "road", category: "sky" },
  { id: "99", mien: "nqaang", english: "cave", svgKey: "cave", category: "sky" },
  { id: "100", mien: "ndaamh-haih", english: "island", svgKey: "island", category: "sky" },
];
