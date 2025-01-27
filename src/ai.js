const { OpenAI } = require('openai');

async function getAISuggestions(variables, apiKey, language) {
    if (!apiKey) {
        throw new Error('API key is missing. Please set it using the "Alias AI: Set API Key" command.');
    }

    const openai = new OpenAI({ apiKey });
    console.log('Sending variables to AI:', variables); // Logs variables being sent to the AI
    console.log('Programming Language:', language); // Logs the language context

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Replace with the appropriate model name
            messages: [
                { 
                    role: 'system', 
                    content: `You are an assistant that suggests better variable, function, and class names for ${language} code. Ensure your suggestions follow the conventions of ${language}. Please have multiple suggestions for each variable. Always format your response as a list of suggestions. 
                              Each suggestion should begin with a '-' and the variable + suggested name should be wrapped in backticks (\`), like this:
                              - \`variable1:suggestion1\`
                              - \`variable2:suggestion2\`.
                              Avoid adding any extra text or formatting.` 
                },
                { 
                    role: 'user', 
                    content: `Here are some ${language} variables with their assigned values: 
            ${variables.map(v => `${v.name}: ${v.assignedValue}`).join(', ')}.
            Please provide better names for each variable following the above format.` 
                },
            ],
        });

        console.log('AI Response:', completion); // Logs the full AI response
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error communicating with AI:', error); // Logs errors during the API request
        throw new Error('AI request failed');
    }
}


module.exports = { getAISuggestions };

