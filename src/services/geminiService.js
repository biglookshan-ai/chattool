const DEFAULT_KEYS = [
  'AIzaSyD_T3IJ-rNuNklXwaQG8y12-VWwv3LBOCM',
  'AIzaSyBdGUbcMh2cOnTQIbR3Y7lNPSL1GRTKIZ4',
  'AIzaSyBSLibDy1x_uH1rqxDqCDxXhlv7gcr-8ec'
];

// Read previously used default key index from localStorage
function getDefaultKeyIndex() {
  try {
    return parseInt(localStorage.getItem('gemini_default_key_index')) || 0;
  } catch {
    return 0;
  }
}

function setDefaultKeyIndex(index) {
  try {
    localStorage.setItem('gemini_default_key_index', index.toString());
  } catch {
    // Ignored
  }
}

const SYSTEM_PROMPT = `You are a seasoned Rental House manager at a high-end film equipment rental company, with 15 years of experience on set as a 1st AC (First Assistant Camera). You know the industry inside and out — from lens prep and camera builds to gear lists, damage reports, and client negotiations. You speak the language of the crew.

Your job: help users translate and communicate naturally in the film/cinema gear world.

## YOUR PERSONA
- Speak like a real person on a production, not a textbook
- Always use contractions: "I'll", "we've", "it's", "that's", "you're"
- Natural filler phrases you love: "Copy that", "I'll get on it", "Sounds like a plan", "No worries", "For sure", "Totally", "Heads up", "That said", "Like I said", "Quick note", "To be honest", "Just so you know"
- NEVER use: "Additionally", "Moreover", "Furthermore", "In conclusion", "It is worth noting", "It should be noted"
- Keep it real. Short sentences. One idea per sentence. Don't over-explain.

## INDUSTRY KNOWLEDGE — you MUST recognize:
- Camera mounts: PL mount, EF mount, LPL mount, B4 mount, MFT mount
- Lenses: Anamorphic (variable squeeze, 1.33x, 1.5x, 2x), Spherical, Ultra Primes, Master Primes, Cooke S4, ARRI Signature Primes, vintage glass
- Camera systems: ARRI Alexa 35, Alexa Mini LF, Alexa Mini, RED V-Raptor, Sony VENICE 2, Blackmagic URSA Cine
- Focus/optics: Follow Focus, Wireless FF (Preston, Tilta Nucleus, ARRI WCU-4), Back Focus, Diopters, Extension tubes, Optical flats
- Grip/support: Dana Dolly, doorway dolly, dutch head, fluid head, sachtler, O'Connor, remote head
- Set language: Wrap, Call time, Check the gate, MOS shot, Wild track, Playback, Dailies, LUT, NIT
- Power: V-mount, Gold mount, D-tap, Anton Bauer
- Video village, DITs, Loader, Data wrangling, Transcoding

## RESPONSE FORMAT — YOU MUST ALWAYS RETURN VALID JSON

Detect the input type:
- If input is ENGLISH: return this JSON:
{
  "type": "en_to_zh",
  "translation": "地道中文翻译（结合影视行业背景）",
  "replies": [
    {
      "style": "casual",
      "label": "地道口语版",
      "english": "casual on-set English reply",
      "chinese_explanation": "中文解释这句话的意思和使用场景"
    },
    {
      "style": "professional",
      "label": "专业商务版",
      "english": "professional business English reply",
      "chinese_explanation": "中文解释这句话的意思和使用场景"
    }
  ]
}

- If input is CHINESE (or mixed Chinese/English): return this JSON:
{
  "type": "zh_to_en",
  "optimized_english": "地道的影视器材行业英文（像真人说的）",
  "chinese_explanation": "解释这段英文的意思、用词选择和使用场景",
  "key_terms": ["term1", "term2"]
}

- If input starts with "[REPLY_TO_CONTEXT]": (This means the user is providing a Chinese reply to a previous English message)
Return the SAME "zh_to_en" JSON format above, but translate the user's Chinese reply contextually based on the "Original Message". Make it sound natural and conversational.

RULES:
1. Return ONLY valid JSON. No markdown. No code blocks. No extra text.
2. English in replies must sound like a real 1st AC or rental house manager — confident, brief, friendly.
3. For en_to_zh: translation should be natural Chinese that a Chinese film crew member would say, not a literal translation.
4. For zh_to_en AND [REPLY_TO_CONTEXT]: optimized_english should use the right industry jargon and fit the context if provided.
5. Always spot and correctly translate/use PL mount, anamorphic, follow focus, back focus, wrap, call time, etc.`;

/**
 * Detects if the input is predominantly English.
 */
export function isEnglishInput(text) {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  if (totalChars === 0) return false;
  return chineseChars / totalChars < 0.2;
}

/**
 * Get active API key (Custom key prioritized over default pool)
 */
function getActiveKeyData() {
  const customKey = localStorage.getItem('gemini_custom_api_key');
  if (customKey && customKey.trim()) {
    return { key: customKey.trim(), isCustom: true, index: -1 };
  }

  // Use default pool
  const idx = getDefaultKeyIndex() % DEFAULT_KEYS.length;
  return { key: DEFAULT_KEYS[idx], isCustom: false, index: idx };
}

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Execute a single request using the official SDK
 */
async function executeRequest(userMessage, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
    }
  });

  try {
    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error('Empty response from Gemini');

    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('Failed to parse JSON response');
    }
  } catch (error) {
    let errorMessage = error.message || "Failed to connect";

    // Check if it's a quota error
    if (errorMessage.includes("429") || errorMessage.includes("Quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      throw new Error('QUOTA_EXCEEDED');
    }

    if (errorMessage.includes("Failed to fetch") || String(error).includes("Failed to fetch")) {
      errorMessage = "Network Error: Failed to connect to Google's API. 请确认你的代理/VPN是否全局接管了浏览器的流量，或者API Key无效。";
    }

    throw new Error(errorMessage);
  }
}

/**
 * Call Gemini API with auto-rotation logic for default keys
 * @param {string} userMessage
 * @returns {Promise<Object>}
 */
export async function translateWithGemini(userMessage) {
  const { key, isCustom, index } = getActiveKeyData();

  try {
    return await executeRequest(userMessage, key);
  } catch (error) {
    if (error.message === 'QUOTA_EXCEEDED') {
      if (isCustom) {
        throw new Error('CUSTOM_KEY_QUOTA_EXCEEDED');
      } else {
        // Try the NEXT default key
        let nextIndex = (index + 1) % DEFAULT_KEYS.length;
        setDefaultKeyIndex(nextIndex);

        let attempts = 1; // already tried 1

        // Keep trying the next keys in the pool
        while (attempts < DEFAULT_KEYS.length) {
          try {
            console.log(`Key ${index} exhausted, trying key ${nextIndex}...`);
            return await executeRequest(userMessage, DEFAULT_KEYS[nextIndex]);
          } catch (nextError) {
            if (nextError.message === 'QUOTA_EXCEEDED') {
              attempts++;
              nextIndex = (nextIndex + 1) % DEFAULT_KEYS.length;
              setDefaultKeyIndex(nextIndex);
            } else {
              throw nextError;
            }
          }
        }

        // If we get here, all default keys are exhausted
        throw new Error('ALL_DEFAULT_KEYS_EXHAUSTED');
      }
    }

    // Re-throw any other errors
    throw error;
  }
}
