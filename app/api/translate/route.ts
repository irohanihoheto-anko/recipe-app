import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '../../lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const systemPrompt = 'You are a translator. Translate the given recipe name from English to Japanese. Only return the translated text, nothing else.';
    const translatedText = await generateText(text, systemPrompt);

    return NextResponse.json({ translatedText: translatedText.trim() });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
}
