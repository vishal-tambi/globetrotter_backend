const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateTravelClues(destination) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `Generate 3 cryptic clues and 3 fun facts about ${destination}. 
  Format the response as JSON with this structure:
  {
    "clues": ["clue1", "clue2", "clue3"],
    "facts": ["fact1", "fact2", "fact3"]
  }`;
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response (Gemini sometimes adds markdown backticks)
    const cleanText = text.replace(/```json|```/g, '');
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Error generating clues:', error);
    throw new Error('Failed to generate clues');
  }
}

async function validateDestination(destination) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `Is "${destination}" a well-known travel destination that most people would recognize? 
  Respond with only "true" or "false".`;
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim().toLowerCase() === 'true';
  } catch (error) {
    console.error('Error validating destination:', error);
    return false;
  }
}

module.exports = {
  generateTravelClues,
  validateDestination
};