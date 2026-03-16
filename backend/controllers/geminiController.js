const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
 
async function parseNaturalLanguageTransaction(input) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Parse this natural language input and extract transaction details.
Input: "${input}"
Return ONLY a valid JSON array (no markdown) with this structure:
[{ "type": "income" or "expense", "amount": number, "category": one of ["Groceries","Medical","Utilities","Transport","Entertainment","Education","Clothing","Salary","Pension","Business","Rent Received","Other Income","Other"], "description": "short clean description max 5 words", "smartTip": "one practical saving tip if expense is high, otherwise null" }]
Rules: spent/paid/bought = expense. received/earned/got = income. Return [] if no amount found.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();
    return { success: true, transactions: JSON.parse(text) };
  } catch (error) {
    return { success: false, error: 'Could not understand the input. Please try again.' };
  }
}
 
async function generateMonthlyReport(data) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const { userName, month, year, totalIncome, totalExpense, savings, topCategories, currency } = data;
    const prompt = `You are a warm financial advisor helping an older adult understand their finances.
User: ${userName}, Month: ${month} ${year}
Income: ${currency}${totalIncome}, Spent: ${currency}${totalExpense}, Savings: ${currency}${savings}
Top spending: ${topCategories.map(c => `${c.category}: ${currency}${c.total}`).join(', ')}
Write a friendly 3-paragraph report: greet them, summarize the month simply, suggest 2-3 practical saving tips. Under 200 words. Warm like a family member, not a bank.`;
    const result = await model.generateContent(prompt);
    return { success: true, report: result.response.text() };
  } catch (error) {
    return { success: false, error: 'Could not generate report at this time.' };
  }
}
 
async function askFinanceQuestion(question, userContext) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a helpful friendly financial assistant.
User context: Monthly income ${userContext.currency}${userContext.monthlyIncome}, expenses ${userContext.currency}${userContext.monthlyExpense}.
Question: "${question}"
Answer in 2-3 sentences using simple clear language. Be warm and helpful. No jargon.`;
    const result = await model.generateContent(prompt);
    return { success: true, answer: result.response.text() };
  } catch (error) {
    return { success: false, error: 'Could not answer right now. Please try again.' };
  }
}
 
module.exports = { parseNaturalLanguageTransaction, generateMonthlyReport, askFinanceQuestion };