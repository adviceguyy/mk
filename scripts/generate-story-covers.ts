import fs from "fs";
import path from "path";

const XAI_API_KEY = process.env.XAI_API || "";
const API_URL = "https://api.x.ai/v1/images/generations";

interface ImageRequest {
  id: string;
  prompt: string;
  filename: string;
}

// Story cover prompts
const STORY_COVERS: ImageRequest[] = [
  {
    id: "pan-hu-dragon-dog",
    prompt: "Traditional East Asian painting of a majestic dragon-dog creature with colorful fur standing before a Chinese emperor in an ancient palace, Mien folk art style with red and gold colors, mountains in background",
    filename: "pan-hu-dragon-dog.png",
  },
  {
    id: "twelve-clans",
    prompt: "Traditional painting of twelve family groups standing in a semi-circle on a misty mountain, each clan holding a different colored banner, ancient Chinese calligraphy scroll in center, Mien folk art style",
    filename: "twelve-clans.png",
  },
  {
    id: "lost-thirteenth-clan",
    prompt: "Dramatic stormy ocean scene with a wooden boat sinking in dark turbulent waters, people reaching for each other, lightning illuminating the sky, traditional East Asian art style, dark blue and grey tones",
    filename: "lost-thirteenth-clan.png",
  },
  {
    id: "sea-crossing-odyssey",
    prompt: "Fleet of traditional wooden boats crossing a dramatic ocean under stormy skies, with people in traditional Mien clothing aboard, a mystical dragon spirit visible in the clouds, ancient East Asian painting style",
    filename: "sea-crossing-odyssey.png",
  },
  {
    id: "mountain-crossing-passport",
    prompt: "Ancient Chinese scroll with golden calligraphy being held open by hands, mountain landscape in background with misty peaks, imperial red seal stamp visible, traditional ink painting style",
    filename: "mountain-crossing-passport.png",
  },
  {
    id: "three-languages",
    prompt: "Three ancient books floating in mystical light, one with everyday scenes, one with musical notes and ceremonial imagery, one with sacred ritual symbols, misty mountain temple background, traditional Asian art",
    filename: "three-languages.png",
  },
  {
    id: "dragon-worship-decree",
    prompt: "Chinese emperor in golden robes on throne issuing decree from ornate scroll, dragon spirit hovering above, twelve figures kneeling below, ancient imperial palace setting, red and gold traditional art",
    filename: "dragon-worship-decree.png",
  },
  {
    id: "sai-mienh",
    prompt: "Elderly Mien ritual priest in traditional ceremonial robes performing sacred ceremony by candlelight, ancient Chinese texts and ritual objects on altar, incense smoke swirling, mystical atmosphere, traditional art",
    filename: "sai-mienh.png",
  },
  {
    id: "ancestor-veneration",
    prompt: "Traditional Mien ancestor worship altar with candles and incense, family gathered in traditional clothing bowing respectfully, ancestral portraits on wall, warm golden light, Southeast Asian interior, folk art style",
    filename: "ancestor-veneration.png",
  },
  {
    id: "mien-embroidery",
    prompt: "Close-up of intricate traditional Mien cross-stitch embroidery with geometric patterns in red, blue, and white on black fabric, Mien woman's hands sewing, traditional silver jewelry visible, warm lighting",
    filename: "mien-embroidery.png",
  },
  {
    id: "great-drought",
    prompt: "Desolate cracked dry landscape under harsh sun, withered crops and dried riverbed, desperate families looking at empty sky, traditional East Asian watercolor style with earth tones and harsh yellows",
    filename: "great-drought.png",
  },
  {
    id: "sea-dragons-gate",
    prompt: "Massive mystical ocean gate made of coral and dragon bones in dark turbulent sea, boats approaching fearfully, dragon silhouette visible through the gate, bioluminescent water, dramatic lightning, fantasy Asian art",
    filename: "sea-dragons-gate.png",
  },
  {
    id: "giant-turtle",
    prompt: "Enormous ancient sea turtle on a rocky shore being mistaken for a boulder by people in traditional clothing, campfire burning on turtle's shell, ocean and boats in background, mystical atmosphere, folk art style",
    filename: "giant-turtle.png",
  },
  {
    id: "highland-farmers",
    prompt: "Mien village nestled on misty mountain hillside, terraced fields of rice and corn, traditional wooden houses with thatched roofs, family working the land together, lush green tropical mountains, watercolor style",
    filename: "highland-farmers.png",
  },
  {
    id: "siang-nzung",
    prompt: "Joyful Mien New Year celebration with families in colorful traditional clothing, red eggs and red envelopes, traditional food feast, drumming and dancing, village decorated with red lanterns, festive folk art style",
    filename: "siang-nzung.png",
  },
  {
    id: "mien-wedding",
    prompt: "Traditional Mien wedding ceremony with bride and groom in elaborate embroidered red and black clothing and silver headdresses, elders blessing them, ceremonial feast table, mountain village setting, folk art",
    filename: "mien-wedding.png",
  },
  {
    id: "crossing-to-america",
    prompt: "Mien refugee family arriving in America, airplane in background, family in traditional clothing holding children looking at modern city skyline, blending of two worlds, emotional and hopeful, contemporary folk art",
    filename: "crossing-to-america.png",
  },
  {
    id: "peaceful-plains-nanjing",
    prompt: "Peaceful fertile agricultural plains near ancient Chinese city by the sea, happy Mien families farming rice paddies, traditional buildings and boats in harbor, golden sunset, pastoral traditional Chinese landscape painting",
    filename: "peaceful-plains-nanjing.png",
  },
];

// Literature screen background images
const LITERATURE_BACKGROUNDS: ImageRequest[] = [
  {
    id: "lit-grammar-book",
    prompt: "Elegant background image for a Mien grammar book, ancient Southeast Asian manuscript pages with Mien script and Chinese characters, warm parchment tones, subtle gold accents, scholarly and dignified, soft focus bokeh edges",
    filename: "lit-grammar-book.png",
  },
  {
    id: "lit-dictionary",
    prompt: "Elegant background image for a Mien-English dictionary, overlapping pages with bilingual text, warm amber and cream tones, traditional Mien geometric embroidery pattern border, scholarly feel, soft bokeh edges",
    filename: "lit-dictionary.png",
  },
  {
    id: "lit-stories",
    prompt: "Elegant background image for traditional Mien stories collection, ancient scroll with dragon and mountain imagery, warm golden light, misty mountains and traditional village silhouette, folk art motifs, soft bokeh edges",
    filename: "lit-stories.png",
  },
];

const OUTPUT_DIR = path.join(process.cwd(), "assets", "images", "stories");
const LIT_OUTPUT_DIR = path.join(process.cwd(), "assets", "images", "literature");

async function generateImage(req: ImageRequest, outputDir: string): Promise<boolean> {
  const outputPath = path.join(outputDir, req.filename);
  if (fs.existsSync(outputPath)) {
    console.log(`  SKIP ${req.filename} (already exists)`);
    return true;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-2-image",
        prompt: req.prompt,
        n: 1,
        response_format: "b64_json",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`  FAIL ${req.filename}: ${response.status} ${err.slice(0, 200)}`);
      return false;
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
      console.error(`  FAIL ${req.filename}: No image data in response`);
      return false;
    }

    fs.writeFileSync(outputPath, Buffer.from(b64, "base64"));
    console.log(`  OK   ${req.filename}`);
    return true;
  } catch (err: any) {
    console.error(`  FAIL ${req.filename}: ${err.message}`);
    return false;
  }
}

async function main() {
  if (!XAI_API_KEY) {
    console.error("XAI_API key not found in environment");
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(LIT_OUTPUT_DIR, { recursive: true });

  console.log(`\nGenerating ${STORY_COVERS.length} story covers...`);
  let success = 0;
  let fail = 0;

  for (const req of STORY_COVERS) {
    const ok = await generateImage(req, OUTPUT_DIR);
    ok ? success++ : fail++;
  }

  console.log(`\nGenerating ${LITERATURE_BACKGROUNDS.length} literature backgrounds...`);
  for (const req of LITERATURE_BACKGROUNDS) {
    const ok = await generateImage(req, LIT_OUTPUT_DIR);
    ok ? success++ : fail++;
  }

  console.log(`\nDone: ${success} succeeded, ${fail} failed`);
}

main();
