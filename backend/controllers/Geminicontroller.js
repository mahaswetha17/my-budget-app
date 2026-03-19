const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Latest Llama model on Groq
const MODEL = 'llama-3.3-70b-versatile';

async function parseNaturalLanguageTransaction(input) {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a financial assistant. Always respond with valid JSON only. No markdown, no backticks, no explanation.'
        },
        {
          role: 'user',
          content: `Parse this input and extract transaction details: "${input}"
Return ONLY a valid JSON array with this structure:
[{ "type": "income" or "expense", "amount": number, "category": one of ["Groceries","Medical","Utilities","Transport","Entertainment","Education","Clothing","Salary","Pension","Business","Rent Received","Other Income","Other"], "description": "short description max 5 words", "smartTip": "one saving tip if expense is high, otherwise null" }]
Rules: spent/paid/bought = expense. received/earned/got/from = income. Return [] if no amount found.`
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });
    const text = completion.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    console.log('Llama parse response:', text);
    return { success: true, transactions: JSON.parse(text) };
  } catch (error) {
    console.error('Llama parse error:', error.message);
    return { success: false, error: 'Could not understand the input. Please try again.' };
  }
}

async function generateMonthlyReport(data) {
  try {
    const { userName, month, year, totalIncome, totalExpense, savings, topCategories, currency } = data;
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a warm, friendly financial advisor who speaks simply and kindly like a helpful family member.'
        },
        {
          role: 'user',
          content: `Write a friendly monthly financial report for ${userName}.
Month: ${month} ${year}
Income: ${currency}${totalIncome}
Spent: ${currency}${totalExpense}
Savings: ${currency}${savings}
Top spending: ${topCategories.map(c => `${c.category}: ${currency}${c.total}`).join(', ')}
Write 3 short paragraphs under 150 words total. Warm greeting, spending summary, 2 saving tips.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    console.log('Llama report generated successfully');
    return { success: true, report: completion.choices[0].message.content };
  } catch (error) {
    console.error('Llama report error:', error.message);
    return { success: false, error: 'Could not generate report at this time.' };
  }
}

async function askFinanceQuestion(question, userContext) {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful friendly financial assistant. Give short, simple, warm advice in 2-3 sentences. No jargon.'
        },
        {
          role: 'user',
          content: `My monthly income is ${userContext.currency}${userContext.monthlyIncome} and I spend ${userContext.currency}${userContext.monthlyExpense}. Question: ${question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });
    console.log('Llama answer generated successfully');
    return { success: true, answer: completion.choices[0].message.content };
  } catch (error) {
    console.error('Llama question error:', error.message);
    return { success: false, error: 'Could not answer right now. Please try again.' };
  }
}

module.exports = { parseNaturalLanguageTransaction, generateMonthlyReport, askFinanceQuestion };