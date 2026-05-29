import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const res = await model.generateContent('Hi');
    console.log('SUCCESS:', res.response.text());
  } catch(e: any) {
    console.error('ERROR:', e.message);
  }
}
run();
