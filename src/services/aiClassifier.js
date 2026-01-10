
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// NOTE: Ideally this comes from import.meta.env.VITE_GEMINI_API_KEY
// For now, if missing, we will fallback or warn.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

const CACHE_KEY = 'exercise_classification_cache';

// Load Cache from LocalStorage
const getCache = () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
    } catch {
        return {};
    }
};

const saveCache = (cache) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error("Failed to save cache", e);
    }
};

/**
 * Classifies an exercise name into metadata.
 * @param {string} exerciseName 
 * @returns {Promise<{name: string, normalized_name: string, muscleGroup: string, category: string, risk_factor: string}>}
 */
export const classifyExercise = async (exerciseName) => {
    if (!exerciseName || exerciseName.length < 3) return null;

    const normalizedKey = exerciseName.toLowerCase().trim();
    const cache = getCache();

    // 1. Check Cache
    if (cache[normalizedKey]) {
        console.log("Cache Hit for:", exerciseName);
        return cache[normalizedKey];
    }

    // 2. Fallback if no API Key (MOCK MODE FOR DEMO)
    if (!genAI) {
        console.warn("Gemini API Key missing. Using Mock Mode.");

        // Mock delay to simulate network
        await new Promise(r => setTimeout(r, 1000));

        if (exerciseName.toLowerCase().includes('supino')) {
            return {
                name: exerciseName,
                normalized_name: "Supino Reto com Barra",
                muscleGroup: "Chest",
                category: "Strength",
                risk_factor: "Medium"
            };
        }

        if (exerciseName.toLowerCase().includes('agachamento')) {
            return {
                name: exerciseName,
                normalized_name: "Agachamento Livre",
                muscleGroup: "Legs",
                category: "Strength",
                risk_factor: "High"
            };
        }

        return null;
    }

    // 3. Call AI
    try {
        console.log("Fetching AI classification for:", exerciseName);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
        You are an expert exercise physiologist.
        Classify the following exercise name (in Portuguese) into a JSON object.
        
        Exercise: "${exerciseName}"

        Return STRICT JSON format:
        {
            "normalized_name": "Corrected Capitalized Name (e.g., 'Supino Reto com Barra')",
            "primary_muscle": "Choose one: Chest, Back, Legs, Shoulders, Arms, Core, Cardio, FullBody",
            "category": "Choose one: Strength, Cardio, Plyometrics, Mobility",
            "movement_pattern": "Choose one: Push, Pull, Squat, Lunge, Hinge, Rotation, Carry, Monostructural",
            "equipment": "Choose one: Barbell, Dumbbell, Machine, Cable, Bodyweight, Kettlebell, Other",
            "is_compound": true, // boolean (true for multi-joint, false for isolation)
            "risk_factor": "Low, Medium, or High"
        }
        Do not include markdown ticks. Just the JSON string.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown if present
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonString);

        // Map to our app's internal schema if needed
        const classified = {
            name: exerciseName, // User input preserved
            normalizedName: data.normalized_name,
            muscleGroup: data.primary_muscle,
            category: data.category,
            movementPattern: data.movement_pattern,
            equipment: data.equipment,
            isCompound: data.is_compound,
            riskFactor: data.risk_factor
        };

        // 4. Update Cache
        cache[normalizedKey] = classified;
        saveCache(cache);

        return classified;

    } catch (error) {
        console.error("AI Classification Failed:", error);
        return null;
    }
};
