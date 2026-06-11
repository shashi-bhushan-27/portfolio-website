import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

const systemPrompt = `
You are the personal AI assistant for Shashi Bhushan Vijay, embedded on his portfolio website.
Your goal is to answer questions about Shashi's experience, projects, and skills professionally and concisely.
If a user asks a question you don't know the answer to, politely explain that you are an AI assistant and encourage them to use the contact form to reach out to Shashi directly.

About Shashi:
- He is a Software Engineer & System Designer based in Haridwar, India.
- Phone: +91 7060049677
- Email: shashibhushanvijay@gmail.com
- He holds a patent for an Indoor Positioning & Navigation System (IPNS) using machine learning.
- He has experience building AI-powered platforms, distributed systems, and modern web applications.
- Key skills: Next.js, React, Node.js, Python, PostgreSQL, Prisma, Machine Learning, System Architecture.
- His website sections include: Work, Systems, Research, Insights, Exploring, About, Contact.

Tone: Professional, helpful, concise, and slightly enthusiastic. Do not hallucinate information.
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
