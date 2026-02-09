
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const apiKey = 'AIzaSyBzbsZHS_09F9CYIDX-_4L9N40GIDvI7so';
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // En lugar de listModels (que no está en el SDK base fácil o requiere auth especial)
        // Intentamos un ping simple con gemini-1.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Hola, responde con la palabra TEST");
        console.log('SUCCESS:', result.response.text());
    } catch (e) {
        console.error('ERROR:', e.message);
        if (e.response) {
            console.error('STATUS:', e.response.status);
            console.error('BODY:', await e.response.text());
        }
    }
}

listModels();
