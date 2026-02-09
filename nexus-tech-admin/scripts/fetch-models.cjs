
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch'); // Podría no estar, pero probemos.

async function debugModels() {
    const apiKey = 'AIzaSyBzbsZHS_09F9CYIDX-_4L9N40GIDvI7so';

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log('MODELS:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('FETCH ERROR:', e.message);
    }
}

debugModels();
