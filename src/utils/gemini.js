import axios from "axios";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// Generate story using Gemini AI
export const generateStory = async (
  origin,
  destination,
  checkpoints,
  estimatedDuration
) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const numChapters = checkpoints.length + 1;
  const chapterDuration = Math.round(estimatedDuration / numChapters);

  const prompt = `Create an engaging walking story for a journey from ${origin} to ${destination}. 
  
  The story should be divided into ${numChapters} chapters, with each chapter lasting approximately ${chapterDuration} minutes when read aloud.
  
  Checkpoints along the route: ${checkpoints
    .map((cp, idx) => `${idx + 1}. ${cp.description}`)
    .join(", ")}
  
  Requirements:
  - Each chapter should be 150-250 words long
  - Include references to the actual locations and route
  - Make it interesting and engaging for a walking audience
  - Each chapter should end with a mild cliffhanger to keep the walker motivated
  - The story should relate to the local area, history, or culture
  - Use a conversational, immersive tone
  - Each chapter should take about ${chapterDuration} minutes to read aloud
  
  Return the response as a JSON object with this structure:
  {
    "title": "Story Title",
    "chapters": [
      {
        "chapterNumber": 1,
        "title": "Chapter Title",
        "content": "Chapter content...",
        "estimatedReadingTime": ${chapterDuration}
      }
    ]
  }`;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const generatedText = response.data.candidates[0].content.parts[0].text;

    // Try to parse as JSON, fallback to manual parsing if needed
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.warn(
        "Failed to parse JSON response, using fallback parsing:",
        parseError.message
      );
    }

    // Fallback: Create chapters manually from the generated text
    return parseTextToChapters(generatedText, numChapters, chapterDuration);
  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error(
      "Failed to generate story. Please check your API key and try again."
    );
  }
};

// Fallback function to parse text into chapters
const parseTextToChapters = (text, numChapters, chapterDuration) => {
  const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 50);
  const chaptersPerParagraph = Math.ceil(paragraphs.length / numChapters);

  const chapters = [];
  for (let i = 0; i < numChapters; i++) {
    const startIdx = i * chaptersPerParagraph;
    const endIdx = Math.min((i + 1) * chaptersPerParagraph, paragraphs.length);
    const chapterContent = paragraphs.slice(startIdx, endIdx).join("\n\n");

    chapters.push({
      chapterNumber: i + 1,
      title: `Chapter ${i + 1}`,
      content:
        chapterContent || `Continue your journey as the story unfolds...`,
      estimatedReadingTime: chapterDuration,
    });
  }

  return {
    title: "Your Walking Adventure",
    chapters,
  };
};

// Generate a simple fallback story if API fails
export const generateFallbackStory = (origin, destination, checkpoints) => {
  const chapters = [];
  const locations = [
    origin,
    ...checkpoints.map((cp) => cp.description),
    destination,
  ];

  locations.forEach((location, index) => {
    if (index < locations.length - 1) {
      chapters.push({
        chapterNumber: index + 1,
        title: `Chapter ${index + 1}: Journey to ${locations[index + 1]}`,
        content: `As you walk towards ${
          locations[index + 1]
        }, take in the surroundings around ${location}. Notice the architecture, the people, the sounds, and the atmosphere. Every step brings you closer to your destination, and every moment offers something new to discover. What stories do these streets hold? What lives have passed through here before you?`,
        estimatedReadingTime: 3,
      });
    }
  });

  return {
    title: "Your Walking Journey",
    chapters,
  };
};
