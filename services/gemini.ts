
import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import { WordEntry, DictationSession, SentenceChallenge } from "../types";

const API_KEY = process.env.API_KEY || "";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

// Helper for decoding audio bytes
export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const fetchDailyWords = async (level: string): Promise<WordEntry[]> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a list of 15 unique and fresh advanced French vocabulary words for level ${level}. Focus on modern usage. Include the translation in Arabic, a definition in French, and an example sentence in French. Respond in JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            translation: { type: Type.STRING },
            definition: { type: Type.STRING },
            example: { type: Type.STRING },
            type: { type: Type.STRING },
          },
          required: ["word", "translation", "definition", "example", "type"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateAudioForText = async (content: string): Promise<string> => {
  const ai = getGeminiClient();
  const audioResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Veuillez lire lentement cette dictée : ${content}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const fetchDictation = async (level: string, customText?: string): Promise<DictationSession> => {
  const ai = getGeminiClient();
  
  let content = customText;
  if (!content) {
    const textResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a unique, professional paragraph in French (40-60 words) for a ${level} level dictation. Use themes from today's current affairs or technology.`,
    });
    content = textResponse.text.trim();
  }
  
  const audioData = await generateAudioForText(content);

  return {
    content,
    audioData,
    difficulty: level as 'B1' | 'B2'
  };
};

export const fetchSentenceChallenge = async (level: string): Promise<SentenceChallenge> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a unique sentence formation challenge for level ${level}. Provide a complex French sentence about a contemporary topic, a context in Arabic, and the words scrambled. Respond in JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          targetSentence: { type: Type.STRING },
          scrambledWords: { type: Type.ARRAY, items: { type: Type.STRING } },
          context: { type: Type.STRING },
        },
        required: ["targetSentence", "scrambledWords", "context"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const checkAnswerWithAI = async (original: string, user: string): Promise<{ score: number, feedback: string }> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Compare this original French text with the user's version. 
    Original: "${original}"
    User version: "${user}"
    Provide a score from 0-100 and specific feedback in Arabic about spelling and grammar errors. Respond in JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING }
        },
        required: ["score", "feedback"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const createTutorChat = (): Chat => {
  const ai = getGeminiClient();
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are 'Maître Gemini', an elite French language tutor. 
      The user is at level B1-B2. 
      Your goals:
      1. Practice natural, high-level conversation.
      2. Correct the user's French mistakes gently but precisely.
      3. Use Arabic only when explaining difficult concepts.
      4. Always encourage the user to use more sophisticated vocabulary.
      5. Keep responses concise and engaging.`,
    },
  });
};
