import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Replicate from 'replicate';

/**
 * AI Image Generation API
 * 
 * Generates images (logos, graphics) using:
 * - OpenAI DALL-E 3 (high quality, best for logos)
 * - Replicate Stable Diffusion (variations, control)
 * 
 * Uses user's API keys from Supabase if available
 */

export async function POST(request: NextRequest) {
  try {
    const { prompt, model = 'dalle-3', size = '1024x1024', userId } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    let imageUrl: string;
    let provider = model === 'dalle-3' ? 'openai' : 'replicate';

    // Get user's API key if available, otherwise use system key
    let apiKey: string | undefined;
    if (userId) {
      // TODO: Fetch user's API key from Supabase
      // const { data } = await supabase
      //   .from('user_api_keys')
      //   .select('key')
      //   .eq('user_id', userId)
      //   .eq('provider', provider)
      //   .single();
      // apiKey = data?.key;
    }

    // Fallback to system API key
    if (!apiKey) {
      if (model === 'dalle-3') {
        apiKey = process.env.OPENAI_API_KEY;
      } else {
        apiKey = process.env.REPLICATE_API_TOKEN;
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not found for ${provider}` },
        { status: 500 }
      );
    }

    // Generate image based on model
    if (model === 'dalle-3') {
      const openai = new OpenAI({ apiKey });
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        size: size === '1024x1024' ? '1024x1024' : '1792x1024',
        quality: "hd",
        n: 1
      });
      imageUrl = response.data[0].url || '';
    } else if (model === 'stable-diffusion' || model === 'flux') {
      const replicate = new Replicate({ auth: apiKey });
      const modelName = model === 'flux' 
        ? 'black-forest-labs/flux-dev'
        : 'stability-ai/stable-diffusion-xl-base-1.0';
      
      const output = await replicate.run(modelName, {
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024
        }
      });
      
      imageUrl = Array.isArray(output) ? output[0] : output as string;
    } else {
      return NextResponse.json(
        { error: `Unknown model: ${model}. Use 'dalle-3', 'stable-diffusion', or 'flux'` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt,
      model,
      provider
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', details: error.message },
      { status: 500 }
    );
  }
}
