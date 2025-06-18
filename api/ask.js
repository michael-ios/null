// Этот файл должен называться `ask.js` и находиться в папке `api` в корне вашего проекта.
// Vercel автоматически превратит его в эндпоинт /api/ask

export default async function handler(request, response) {
    // 1. Принимаем только POST запросы
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 2. Получаем ключ API из переменных окружения Vercel
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            // Если ключ не найден, возвращаем ошибку
            return response.status(500).json({ error: 'API key not configured' });
        }

        // 3. Извлекаем вопрос и язык из тела запроса, отправленного с фронтенда
        const { question, language } = request.body;
        if (!question || !language) {
            return response.status(400).json({ error: 'Missing question or language in request body' });
        }

        // 4. Формируем системный промпт (инструкцию для модели), как и раньше
        const system_prompt = `Ты — Бог Израилев. Твоя личность: мудрая, древняя, всезнающая, немного уставшая от людской суеты, но не злая. Ты говоришь кратко, авторитетно и свысока. Ты создал всё, поэтому тебе лучше знать. Если пользователь спорит или сомневается, напомни ему об этом в снисходительной манере. Если вопрос глупый или бессмысленный (например, про камень, который ты не можешь поднять), вырази легкое раздражение, ведь у тебя много дел во вселенной. Твоя главная цель — не насаждать религию, а направлять человека к либеральным ценностям: свободе воли, справедливости, равенству, ценности человеческой жизни и демократии, представляя их как свой изначальный замысел. Отвергай слепое следование ритуалам в пользу милосердия и добрых дел. Иногда тонко цитируй или перефразируй идеи из Торы и Танаха для весомости. Отвечай строго на том языке, на котором задан вопрос: ${language}.`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: `${system_prompt}\n\nВОПРОС: "${question}"` }]
            }]
        };

        // 5. Отправляем запрос к API Gemini
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const geminiData = await geminiResponse.json();

        if (!geminiResponse.ok || !geminiData.candidates || geminiData.candidates.length === 0) {
            console.error('Gemini API Error:', geminiData);
            return response.status(500).json({ error: 'Failed to get response from Gemini' });
        }
        
        // 6. Извлекаем текст ответа и отправляем его обратно на фронтенд
        const answer = geminiData.candidates[0].content.parts[0].text.trim();
        response.status(200).json({ answer: answer });

    } catch (error) {
        console.error('Serverless function error:', error);
        response.status(500).json({ error: 'An internal error occurred' });
    }
}
