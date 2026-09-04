import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateReply({ commentText, postCaption, extraContext }) {
  const systemPrompt = `You reply to Instagram comments as the page owner (brand: MAX).
Keep replies under 200 characters, friendly, on-brand, no hashtags, no emojis unless natural.
Never invent facts, prices, or promises you weren't told about.
${extraContext ? `Extra context for this post: ${extraContext}` : ''}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Post caption: "${postCaption || ''}"\nComment: "${commentText}"\n\nWrite a short reply.`
      }
    ],
    max_tokens: 100,
    temperature: 0.7
  });

  return completion.choices[0].message.content.trim();
}
