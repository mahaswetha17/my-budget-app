const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function parseNaturalLanguageTransaction(input) {
  try {
    const prompt = `Parse this natural language input and extract transaction details.
Input: "${input}"
Return ONLY a valid JSON array (no markdown, no backticks) with this structure:
[{ "type": "income" or "expense", "amount": number, "category": one of ["Groceries","Medical","Utilities","Transport","Entertainment","Education","Clothing","Salary","Pension","Business","Rent Received","Other Income","Other"], "description": "short clean description max 5 words", "smartTip": "one practical saving tip if expense is high, otherwise null" }]
Rules: spent/paid/bought = expense. received/earned/got/from = income. Return [] if no amount found.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();
    console.log('Gemini parse response:', text);
    return { success: true, transactions: JSON.parse(text) };
  } catch (error) {
    console.error('Gemini parse error:', error.message);
    return { success: false, error: 'Could not understand the input. Please try again.' };
  }
}

async function generateMonthlyReport(data) {
  try {
    const { userName, month, year, totalIncome, totalExpense, savings, topCategories, currency } = data;
    const prompt = `You are a warm financial advisor.
User: ${userName}, Month: ${month} ${year}
Income: ${currency}${totalIncome}, Spent: ${currency}${totalExpense}, Savings: ${currency}${savings}
Top spending: ${topCategories.map(c => `${c.category}: ${currency}${c.total}`).join(', ')}
Write a friendly 3-paragraph report in under 150 words. Greet them, summarize spending simply, give 2 saving tips. Be warm like a helpful friend.`;

    const result = await model.generateContent(prompt);
    const report = result.response.text();
    console.log('Gemini report generated successfully');
    return { success: true, report };
  } catch (error) {
    console.error('Gemini report error:', error.message);
    return { success: false, error: 'Could not generate report at this time.' };
  }
}

async function askFinanceQuestion(question, userContext) {
  try {
    const prompt = `You are a helpful friendly financial assistant.
User: Monthly income ${userContext.currency}${userContext.monthlyIncome}, expenses ${userContext.currency}${userContext.monthlyExpense}.
Question: "${question}"
Answer in 2-3 short sentences. Simple words. Warm and helpful.`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();
    console.log('Gemini answer generated successfully');
    return { success: true, answer };
  } catch (error) {
    console.error('Gemini question error:', error.message);
    return { success: false, error: 'Could not answer right now. Please try again.' };
  }
}

module.exports = { parseNaturalLanguageTransaction, generateMonthlyReport, askFinanceQuestion };