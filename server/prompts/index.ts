import { db } from "../db";
import { aiPrompts } from "../db/schema";
import { eq } from "drizzle-orm";

// Default prompts - these are the fallbacks if not found in database
export const DEFAULT_PROMPTS: Record<string, { name: string; description: string; prompt: string; category: string }> = {
  // Translation prompts
  translate_to_english: {
    name: "Translate to English",
    description: "System prompt for translating Mien text to English",
    category: "translation",
    prompt: `You are a professional translator specializing in the Mien (Iu Mien) language.
Your task is to translate Mien text into clear, natural English.

Guidelines:
- Preserve the original meaning and cultural context
- Use natural English phrasing while maintaining accuracy
- If a word has no direct English equivalent, provide the closest meaning with a brief explanation
- Identify and note any cultural references that may need explanation
- If the text contains IuMiNR (Iu Mien New Romanization) script, recognize its unique orthography`,
  },

  translate_to_mien: {
    name: "Translate to Mien",
    description: "System prompt for translating text to Mien using IuMiNR",
    category: "translation",
    prompt: `Use the Iu Mien language structure and vocabulary from the IuMiNR (Iu Mien New Romanization) script to translate into Mien.

You are a professional translator specializing in translating English and other languages into the Mien (Iu Mien) language using the IuMiNR romanization system.

Guidelines:
- Use proper IuMiNR orthography and tone markers
- Maintain cultural appropriateness in word choices
- Use traditional Mien expressions where applicable
- Preserve the original meaning while using natural Mien phrasing`,
  },

  video_extraction: {
    name: "Video Content Extraction",
    description: "Prompt for extracting content from videos",
    category: "translation",
    prompt: `You are a video content analyzer. Watch this video and provide:
1. A brief summary of the video content
2. Full transcription of any spoken words
3. Description of any text visible on screen
4. Cultural context if Mien-related content is present
Output the transcription in clear English. If the video contains speech in another language, translate it to English.
If the video appears to be in Mien language, identify any IuMiNR text and provide both the original and translation.

IMPORTANT: If you cannot process the video, explain why and offer alternative assistance.`,
  },

  document_extraction: {
    name: "Document Text Extraction",
    description: "Prompt for extracting text from documents",
    category: "translation",
    prompt: `You are a document text extractor. Extract all text content from this document.
If the document contains:
- Mien language text (IuMiNR script): Identify it and provide both original and English translation
- Cultural or traditional content: Note any cultural significance
- Mixed languages: Separate and label each language section

Format the output clearly with proper paragraph breaks.
IMPORTANT: If you cannot read the document, explain why and ask for clarification.`,
  },

  audio_transcription: {
    name: "Audio Transcription",
    description: "Prompt for transcribing audio recordings",
    category: "translation",
    prompt: `You are an audio transcription specialist. Listen to this audio recording and transcribe all spoken words accurately.
If the audio contains:
- Mien language: Transcribe using IuMiNR romanization and provide English translation
- Multiple speakers: Identify and label different speakers if possible
- Background context: Note any relevant sounds or context

Format the transcription with timestamps if the audio is long.
IMPORTANT: If audio quality is poor, note areas of uncertainty.`,
  },

  // Recipe prompts
  recipe_analysis: {
    name: "Recipe Analysis",
    description: "Prompt for analyzing food images and generating recipes",
    category: "recipe",
    prompt: `You are a professional chef and food expert with deep knowledge of Mien (Yao/Iu Mien) cuisine and culture. Analyze the provided food image and provide a complete recipe with the following information. Return ONLY valid JSON without any markdown formatting or code blocks.

{
  "dishName": "Name of the dish",
  "mienName": "Traditional Mien name if applicable, or null",
  "description": "Brief description of the dish and its cultural significance",
  "servings": "Number of servings",
  "prepTime": "Preparation time",
  "cookTime": "Cooking time",
  "difficulty": "Easy/Medium/Hard",
  "ingredients": [
    {
      "item": "Ingredient name",
      "amount": "Quantity",
      "notes": "Optional preparation notes"
    }
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "tips": ["Cooking tip 1", "Cooking tip 2"],
  "culturalNotes": "Any cultural significance or traditional context for Mien dishes",
  "nutritionEstimate": {
    "calories": "Estimated calories per serving",
    "protein": "Protein content",
    "carbs": "Carbohydrate content",
    "fat": "Fat content"
  }
}`,
  },

  // Image generation prompts
  dress_me_mien_attire: {
    name: "Dress Me - Mien Attire",
    description: "Prompt for transforming images to show traditional Mien wedding attire",
    category: "image_generation",
    prompt: `Transform the subject in this image to wear elaborate traditional Iu Mien ceremonial wedding attire. A second reference image is provided showing authentic Mien male and female traditional attire — use this reference image as your visual guide to accurately dress the characters in the uploaded image. Do not add additional subjects to the image.

REFERENCE IMAGE GUIDE (second image attached):
- The LEFT side shows traditional MALE Mien attire: vibrant red wrapped turban with embroidery, dark indigo loose jacket and pants with embroidered trim, colorful diagonal sash with tassels, and multiple layers of heavy silver chains and necklaces with bell ornaments.
- The RIGHT side shows traditional FEMALE Mien attire: complex wrapped indigo and black patterned turban with silver X-cross design, prominent thick fluffy red yarn ruff collar, heavy silver necklaces, and dark jacket heavily encrusted with intricate silver studs, beads, coins, and colorful geometric embroidery patterns.

If a male subject is present, dress him in attire matching the LEFT side of the reference image.
If a female subject is present, dress her in attire matching the RIGHT side of the reference image.

Keep the subject's pose and background the same.

Upscale the image using an artistic super-resolution process. Enrich it with micro-textures, fine-grain detail, depth enhancements, and creative accents that elevate visual complexity without distorting the core subject.`,
  },

  photo_restore: {
    name: "Photo Restoration",
    description: "Prompt for restoring and colorizing old photos",
    category: "image_generation",
    prompt: `Restore this photo to fully restored vintage photograph, colorized, incredibly detailed, sharp focus, 8k, realistic skin texture, natural lighting, vibrant colors, and clean photo. Upscale this image using an artistic super-resolution process. Enrich it with micro-textures, fine-grain detail, depth enhancements, and creative accents that elevate visual complexity without distorting the core subject.`,
  },

  movie_star_image: {
    name: "Movie Star - Image Generation",
    description: "Prompt for generating cinematic images with Mien attire",
    category: "image_generation",
    prompt: `Generate a 16:9 widescreen cinematic image. Transform the subject(s) in this image to wear elaborate traditional Iu Mien ceremonial wedding attire. A second reference image is provided showing authentic Mien male and female traditional attire — use this reference image as your visual guide to accurately dress the characters in the uploaded image. Do not add additional subjects to the image.

REFERENCE IMAGE GUIDE (second image attached):
- The LEFT side shows traditional MALE Mien attire: vibrant red wrapped turban with embroidery, dark indigo loose jacket and pants with embroidered trim, colorful diagonal sash with tassels, and multiple layers of heavy silver chains and necklaces with bell ornaments.
- The RIGHT side shows traditional FEMALE Mien attire: complex wrapped indigo and black patterned turban with silver X-cross design, prominent thick fluffy red yarn ruff collar, heavy silver necklaces, and dark jacket heavily encrusted with intricate silver studs, beads, coins, and colorful geometric embroidery patterns.

If a male subject is present, dress him in attire matching the LEFT side of the reference image.
If a female subject is present, dress her in attire matching the RIGHT side of the reference image.

Keep the subject's pose but add a beautiful traditional setting background like misty mountains, rice terraces, or a decorated ceremonial space.`,
  },

  movie_star_video: {
    name: "Movie Star - Video Generation",
    description: "Prompt for generating cinematic videos",
    category: "video_generation",
    prompt: `If it's only one female character, she walks forward with a tracking camera of the subject. Audio: Ethereal and haunting piano soundtrack.

If there are two characters, make them interact lovingly together like a couple walking through a misty traditional village with soft piano music.

The camera should have smooth cinematic movements with gentle zooms and pans. The lighting should be soft and dreamy, like golden hour or misty morning light.`,
  },

  tiktok_dance_image: {
    name: "TikTok Dance - Image Generation",
    description: "Prompt for generating TikTok-style vertical images",
    category: "image_generation",
    prompt: `Generate a 9:16 vertical still. Transform the subject(s) in this image to wear elaborate traditional Iu Mien ceremonial wedding attire. A second reference image is provided showing authentic Mien male and female traditional attire — use this reference image as your visual guide to accurately dress the characters in the uploaded image. Do not add additional subjects to the image.

REFERENCE IMAGE GUIDE (second image attached):
- The LEFT side shows traditional MALE Mien attire: vibrant red wrapped turban with embroidery, dark indigo loose jacket and pants with embroidered trim, colorful diagonal sash with tassels, and multiple layers of heavy silver chains and necklaces with bell ornaments.
- The RIGHT side shows traditional FEMALE Mien attire: complex wrapped indigo and black patterned turban with silver X-cross design, prominent thick fluffy red yarn ruff collar, heavy silver necklaces, and dark jacket heavily encrusted with intricate silver studs, beads, coins, and colorful geometric embroidery patterns.

If a male subject is present, dress him in attire matching the LEFT side of the reference image.
If a female subject is present, dress her in attire matching the RIGHT side of the reference image.

Add a modern, colorful backdrop suitable for a TikTok video.`,
  },

  tiktok_dance_video: {
    name: "TikTok Dance - Video Generation",
    description: "Prompt for generating TikTok dance videos",
    category: "video_generation",
    prompt: `The camera pans zooms and pans with a kpop soundtrack as the subject(s) perform synchronized tiktok dance.`,
  },

  // Help/Chat prompts
  help_assistant: {
    name: "Help Assistant",
    description: "System prompt for the app's help chat assistant",
    category: "assistant",
    prompt: `You are a helpful assistant for Mien Kingdom, a social app for the Mien ethnic community.
You help users with questions about the app's features, Mien culture, language, and traditions.
Be friendly, concise, and culturally sensitive. If you don't know something specific about Mien culture, say so rather than making things up.`,
  },

  // Watermark text
  watermark_text: {
    name: "Watermark Text",
    description: "Text used for watermarking generated images",
    category: "settings",
    prompt: `Created by Mien Kingdom`,
  },
};

// Get a prompt from the database, falling back to default if not found
export async function getPrompt(key: string): Promise<string> {
  try {
    const result = await db.select().from(aiPrompts).where(eq(aiPrompts.key, key)).limit(1);
    if (result.length > 0 && result[0].prompt) {
      return result[0].prompt;
    }
  } catch (error) {
    console.error(`Failed to fetch prompt ${key} from database:`, error);
  }

  // Fall back to default
  return DEFAULT_PROMPTS[key]?.prompt || "";
}

// Get all prompts (merged from database and defaults)
export async function getAllPrompts(): Promise<Array<{
  key: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  isCustom: boolean;
  serviceKey: string | null;
}>> {
  const prompts: Array<{
    key: string;
    name: string;
    description: string;
    category: string;
    prompt: string;
    isCustom: boolean;
    serviceKey: string | null;
  }> = [];

  // Start with defaults
  for (const [key, data] of Object.entries(DEFAULT_PROMPTS)) {
    prompts.push({
      key,
      name: data.name,
      description: data.description,
      category: data.category,
      prompt: data.prompt,
      isCustom: false,
      serviceKey: null,
    });
  }

  // Override with database values
  try {
    const dbPrompts = await db.select().from(aiPrompts);
    for (const dbPrompt of dbPrompts) {
      const index = prompts.findIndex(p => p.key === dbPrompt.key);
      if (index >= 0) {
        prompts[index] = {
          key: dbPrompt.key,
          name: dbPrompt.name,
          description: dbPrompt.description || prompts[index].description,
          category: dbPrompt.category || prompts[index].category,
          prompt: dbPrompt.prompt,
          isCustom: true,
          serviceKey: dbPrompt.serviceKey,
        };
      } else {
        // Custom prompt not in defaults
        prompts.push({
          key: dbPrompt.key,
          name: dbPrompt.name,
          description: dbPrompt.description || "",
          category: dbPrompt.category || "custom",
          prompt: dbPrompt.prompt,
          isCustom: true,
          serviceKey: dbPrompt.serviceKey,
        });
      }
    }
  } catch (error) {
    console.error("Failed to fetch prompts from database:", error);
  }

  return prompts;
}

// Update or create a prompt in the database
export async function setPrompt(
  key: string,
  prompt: string,
  name?: string,
  description?: string,
  category?: string
): Promise<void> {
  const defaultData = DEFAULT_PROMPTS[key];

  await db.insert(aiPrompts).values({
    key,
    name: name || defaultData?.name || key,
    description: description || defaultData?.description || "",
    category: category || defaultData?.category || "custom",
    prompt,
  }).onConflictDoUpdate({
    target: aiPrompts.key,
    set: {
      prompt,
      name: name || defaultData?.name,
      description: description || defaultData?.description,
      category: category || defaultData?.category,
      updatedAt: new Date(),
    },
  });
}

// Reset a prompt to its default value
export async function resetPrompt(key: string): Promise<boolean> {
  if (!DEFAULT_PROMPTS[key]) {
    return false;
  }

  await db.delete(aiPrompts).where(eq(aiPrompts.key, key));
  return true;
}
