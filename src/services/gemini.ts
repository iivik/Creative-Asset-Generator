import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const apiKey = (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
};

export interface ImageConcept {
  id: string;
  title: string;
  description: string;
  prompt: string;
  style: string;
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
}

export async function generateConcepts(postText: string): Promise<ImageConcept[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following LinkedIn post and generate EXACTLY 5 distinct image concepts that would make great visual assets to accompany this post. 
    
    You MUST generate exactly one concept for each of the following 5 styles. DO NOT DEVIATE. The goal is to create assets that are highly "shareworthy" - they must feel like insider secrets, rare frameworks, or information too good to pass up.
    
    1. "Rich Infographic": A highly detailed, dense infographic poster. It must NOT be a simple presentation slide. It should look like a complex visual map, sketchnote, or multi-panel data visualization with rich iconography, flowcharts, and high information density ON ALL PANELS. It must feel like a premium, highly valuable cheat sheet. Aspect ratio: "3:4" or "16:9".
    
    2. "Secret Napkin Sketch": A macro close-up of ONLY a white paper napkin against a pure white background. NO TABLE, NO CUP, NO COFFEE STAINS, NO BACKGROUND ELEMENTS. Drawn on the napkin with a blue ballpoint pen is a rough, brilliant diagram showing a profound insight or a "million-dollar" system architecture. Aspect ratio: "1:1" or "4:3".
    
    3. "Raw Handwritten Note": A flat, direct top-down scan of a single plain white piece of paper. The paper fills the entire image. NO DESK, NO PENS, NO HANDS, NO DRAMATIC SHADOWS. Written on the paper is messy, realistic, human handwriting in blue ink. It must NOT look like a computer font. Instead of just a short quote, it should contain a highly valuable "secret" framework, a striking logical equation, or a profound diagram with text. It must feel like a leaked page from a brilliant strategist's private notebook. Aspect ratio: "3:4".
    
    4. "Structured Sketchnote": A realistic photograph of a physical whiteboard. The whiteboard has a visible frame and a marker tray at the bottom. Drawn on the glossy white surface is a clear grid of panels explaining a step-by-step framework using thick dry-erase markers (blue, black, red). It must look exactly like a real, unedited smartphone photo taken of a whiteboard after a brilliant strategy meeting, complete with subtle glare. Aspect ratio: "4:3" or "16:9".
    
    5. "Consulting Firm Framework": A clean, highly professional strategy framework graphic typical of top-tier management consulting firms like McKinsey, Gartner, or BCG. It should feature a structured layout like a 2x2 matrix, a chevron process flow, or a minimalist data chart. The color palette must be strictly corporate (navy blues, slate grays, crisp white backgrounds). It must look like a polished slide from a high-stakes board deck or an industry report. NO abstract 3D art, NO glowing lights, NO metaphors. Pure, structured business logic. Aspect ratio: "16:9".
    
    For the 'prompt' field, write an extremely detailed prompt optimized for a state-of-the-art AI image generator. Be highly specific about the visual style, layout, lighting, and exact text that should appear in the image. CRITICAL: Keep any text to be rendered extremely short to avoid spelling mistakes, and explicitly command the image generator to spell it correctly.
    
    Post:
    ${postText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING, description: "Catchy title for the concept" },
            description: { type: Type.STRING, description: "Brief description of what the image will look like and why it works for the post" },
            prompt: { type: Type.STRING, description: "Detailed prompt for an image generation AI to create this image. Make it highly descriptive, specifying the visual style, colors, lighting, and composition." },
            style: { type: Type.STRING, description: "MUST BE EXACTLY ONE OF: 'Rich Infographic', 'Secret Napkin Sketch', 'Raw Handwritten Note', 'Structured Sketchnote', 'Consulting Firm Framework'" },
            aspectRatio: { type: Type.STRING, description: "The aspect ratio for the image: '1:1', '3:4', '4:3', '9:16', or '16:9'" }
          },
          required: ["id", "title", "description", "prompt", "style", "aspectRatio"]
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from model");
  return JSON.parse(text);
}

export async function generateImage(prompt: string, style: string, aspectRatio: string = "1:1"): Promise<string> {
  const ai = getAI();
  
  let finalPrompt = prompt;
  const styleLower = style.toLowerCase();
  
  // Hard overrides to guarantee the user gets exactly what they want, regardless of what the concept generator output.
  if (styleLower.includes('infographic')) {
     finalPrompt = `A highly detailed, dense infographic poster, professional data visualization, multiple sections, flowcharts, rich iconography, complex layout, high information density on ALL panels, vintage or textured paper background. NO simple corporate slides. It must look like a premium, highly valuable cheat sheet. CRITICAL: Ensure all text is spelled perfectly with no typos. EXACTLY AS DESCRIBED: ${prompt}`;
  } else if (styleLower.includes('napkin')) {
     finalPrompt = `A pure white background. In the center, a slightly crumpled, authentic white paper napkin. The napkin fills 90% of the frame. ABSOLUTELY NO TABLE, NO CUP, NO COFFEE STAINS, NO BACKGROUND ELEMENTS. Drawn on the napkin with a blue ballpoint pen is a highly detailed but rough system architecture diagram. It must look like a credible, real-world sketch from an engineer, not a polished graphic. CRITICAL: Ensure all text is spelled perfectly with no typos. EXACTLY AS DESCRIBED: ${prompt}`;
  } else if (styleLower.includes('handwritten') || styleLower.includes('note')) {
     finalPrompt = `A flat scan of a plain white A4 sheet of paper. The paper fills the entire frame. ABSOLUTELY NO DESK, NO PENS, NO HANDS, NO SHADOWS, NO DRAMATIC LIGHTING. Written on the paper in messy, authentic, cursive human handwriting with blue ink is a highly valuable, secret strategic framework, equation, or profound diagram. The ink shows slight bleeding and physical indentation. It must look like a leaked page from a genius's notebook, NOT a computer font. CRITICAL: Ensure all text is spelled perfectly with no typos. EXACTLY AS DESCRIBED: ${prompt}`;
  } else if (styleLower.includes('sketchnote')) {
     finalPrompt = `A highly realistic photograph of a physical whiteboard mounted on a wall. The whiteboard has a visible silver aluminum frame and a marker tray at the bottom with dry-erase markers resting on it. There is a subtle, realistic glare on the glossy white surface. Drawn on the board is a highly structured educational sketchnote divided into a clear grid. The drawing uses thick dry-erase marker lines in blue, black, and red. It features simple doodles, icons, arrows, and text. It looks exactly like an unedited smartphone photo taken after a brilliant strategy meeting. CRITICAL: Ensure all text is spelled perfectly with no typos. EXACTLY AS DESCRIBED: ${prompt}`;
  } else if (styleLower.includes('consulting') || styleLower.includes('framework') || styleLower.includes('mckinsey') || styleLower.includes('gartner')) {
     finalPrompt = `A highly professional, clean management consulting framework graphic. Style of McKinsey, Gartner, or BCG reports. Minimalist corporate design, crisp white background, navy blue and slate gray color palette. Structured layout, such as a 2x2 matrix, chevron process flow, or professional chart. Flat vector style, highly legible, data-driven, and analytical. ABSOLUTELY NO 3D renders, NO glowing lights, NO abstract metaphors, NO stock photography. It must look like a polished slide from a high-stakes board deck. CRITICAL: Ensure any text is spelled perfectly with no typos. EXACTLY AS DESCRIBED: ${prompt}`;
  } else if (styleLower === 'custom') {
     finalPrompt = prompt;
  }
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: [
        {
          text: finalPrompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: "1K"
      }
    }
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated");
}
