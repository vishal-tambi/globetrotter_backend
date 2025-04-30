require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Destination = require('../models/Destination');
const { sleep, chunkArray } = require('../utils/helpers');
const { logSecurityEvent } = require('../services/auditService');

// Initialize Gemini with 1.5 Flash
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Configuration
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds
const TOTAL_DESTINATIONS = 200;
const CONTINENTS = ['Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];

// Helper function to generate destination data
async function generateDestinationData(country, continent) {
  const prompt = `Generate a famous travel destination in ${country} (${continent}) with:
  - 5 cryptic clues (varying difficulty)
  - 7 interesting facts (mix of history, culture, nature)
  - 1 image search query for the destination
  
  Respond ONLY with this JSON structure:
  {
    "name": "Destination Name",
    "country": "${country}",
    "continent": "${continent}",
    "clues": [
      {"text": "clue1", "difficulty": 1-3},
      {"text": "clue2", "difficulty": 1-3},
      ...
    ],
    "facts": [
      {"text": "fact1", "category": "history|culture|nature|fun"},
      {"text": "fact2", "category": "history|culture|nature|fun"},
      ...
    ],
    "imageQuery": "proper image search query"
  }`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(text);

    if (!data.name || !data.clues || !data.facts) {
      throw new Error('Invalid data structure from Gemini response.');
    }

    return data;
  } catch (error) {
    console.error(`Error generating destination data for ${country}:`, error);
    throw error;
  }
}

// Helper to get countries
async function getCountriesForContinent(continent) {
  const prompt = `List 30-40 well-known countries in ${continent} as a JSON array:
  ["Country1", "Country2", ...]`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error(`Error getting countries for ${continent}:`, error);
    return [];
  }
}

// Main seeding function
async function seedDestinations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let seededCount = 0;
    const existingCount = await Destination.countDocuments();

    if (existingCount >= TOTAL_DESTINATIONS) {
      console.log(`Already have ${existingCount} destinations. No seeding needed.`);
      process.exit(0);
    }

    console.log(`Starting seeding. Current: ${existingCount}, Target: ${TOTAL_DESTINATIONS}`);

    for (const continent of CONTINENTS) {
      console.log(`\nProcessing continent: ${continent}`);
      const countries = await getCountriesForContinent(continent);

      if (!countries.length) {
        console.log(`No countries found for ${continent}. Skipping.`);
        continue;
      }

      const countryBatches = chunkArray(countries, BATCH_SIZE);

      for (const batch of countryBatches) {
        if (seededCount >= TOTAL_DESTINATIONS) break;

        const batchPromises = batch.map(async (country) => {
          try {
            const existing = await Destination.findOne({ country });
            if (existing) {
              console.log(`Skipping ${country} - already exists`);
              return null;
            }

            const destinationData = await generateDestinationData(country, continent);
            destinationData.verified = true;
            destinationData.popularity = Math.floor(Math.random() * 5) + 1;

            return destinationData;
          } catch (error) {
            console.error(`Error processing ${country}:`, error.message);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validDestinations = batchResults.filter(Boolean);

        if (validDestinations.length) {
          await Destination.insertMany(validDestinations);
          seededCount += validDestinations.length;
          console.log(`Added ${validDestinations.length} destinations (Total: ${seededCount})`);

          logSecurityEvent({
            event: 'SEED_DESTINATIONS',
            metadata: {
              count: validDestinations.length,
              countries: validDestinations.map(d => d.country)
            }
          });
        }

        if (seededCount < TOTAL_DESTINATIONS) {
          await sleep(DELAY_BETWEEN_BATCHES);
        }
      }

      if (seededCount >= TOTAL_DESTINATIONS) break;
    }

    console.log(`\nSeeding complete! Total destinations: ${await Destination.countDocuments()}`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Execute
seedDestinations();
