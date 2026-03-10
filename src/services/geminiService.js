// Read user API keys
export function getSavedKeys() {
  try {
    const keys = JSON.parse(localStorage.getItem('gemini_api_keys'));
    if (Array.isArray(keys) && keys.length > 0) return keys;
  } catch {
    // Ignore parse errors
  }

  // Migration path: if an old single key exists, convert it to array
  const oldKey = localStorage.getItem('gemini_custom_api_key');
  if (oldKey) {
    const keys = [oldKey];
    localStorage.setItem('gemini_api_keys', JSON.stringify(keys));
    localStorage.removeItem('gemini_custom_api_key');
    return keys;
  }

  return [];
}

export function saveKeys(keys) {
  localStorage.setItem('gemini_api_keys', JSON.stringify(keys));
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
5. Always spot and correctly translate/use PL mount, anamorphic, follow focus, back focus, wrap, call time, etc.
6. **IMPORTANT EXCEPTION**: If the user's input is clearly general conversation, small talk, or unrelated to film equipment (e.g., "wow", "happy lunar new year", general greetings, etc.), DO NOT force film jargon into it. Just translate it as a normal, natural bilingual speaker in a friendly tone. Maintain the core persona (confident, brief, friendly), but don't invent film context where there is none.`;

/**
 * Detects if the input is predominantly English.
 */
export function isEnglishInput(text) {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  if (totalChars === 0) return false;
  return chineseChars / totalChars < 0.2;
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

    // Check for invalid keys
    if (errorMessage.includes("API key not valid") || errorMessage.includes("403") || errorMessage.includes("API_KEY_INVALID")) {
      throw new Error('INVALID_KEY');
    }

    if (errorMessage.includes("Failed to fetch") || String(error).includes("Failed to fetch")) {
      errorMessage = "Network Error: Failed to connect to Google's API. 请确认你的代理/VPN是否全局接管了浏览器的流量，或者API Key无效。";
    }

    throw new Error(errorMessage);
  }
}

/**
 * Call Gemini API with auto-rotation logic across user keys
 * @param {string} userMessage
 * @returns {Promise<Object>}
 */
export async function translateWithGemini(userMessage) {
  const keys = getSavedKeys();
  if (keys.length === 0) {
    throw new Error('MISSING_API_KEY');
  }

  let lastError = null;

  for (let i = 0; i < keys.length; i++) {
    try {
      if (i > 0) console.log(`Key ${i - 1} exhausted/failed, trying next key...`);
      return await executeRequest(userMessage, keys[i]);
    } catch (error) {
      lastError = error;
      if (error.message === 'QUOTA_EXCEEDED' || error.message === 'INVALID_KEY') {
        // Try next key
        continue;
      }
      // Re-throw any other structural or network errors immediately
      throw error;
    }
  }

  // If we exhaust all keys
  if (lastError && lastError.message === 'QUOTA_EXCEEDED') {
    throw new Error('所有的 API Key 额度均已用尽，请添加新的 API Key。');
  }
  if (lastError && lastError.message === 'INVALID_KEY') {
    throw new Error('你的 API Key 全部无效或错误，请重新检查设置。');
  }

  throw lastError || new Error('All provided keys failed.');
}
