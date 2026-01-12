/**
 * Debug endpoint to test API key retrieval and decryption
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const crypto = require('crypto');
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const debug: any = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasApiKeysEncKey: !!process.env.API_KEYS_ENCRYPTION_KEY,
      hasSupabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      encryptionKeySource: process.env.API_KEYS_ENCRYPTION_KEY ? 'API_KEYS_ENCRYPTION_KEY' : (process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NONE'),
    };
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing Supabase credentials',
        debug,
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to fetch Anthropic key
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('encrypted_key, user_id, provider, is_active')
      .eq('provider', 'anthropic')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    
    debug.queryResult = {
      hasData: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      hasEncryptedKey: !!data?.encrypted_key,
      userId: data?.user_id,
    };
    
    if (data?.encrypted_key) {
      // Try to decrypt
      const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      debug.encryptionKeyLength = encryptionKey?.length || 0;
    debug.encryptionKeyPreview = encryptionKey ? encryptionKey.substring(0, 30) + '...' : 'null';
    debug.vercelKeyPreview = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 30) + '...' : 'null';
    debug.vercelKeyLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0;
      
      try {
        const parts = data.encrypted_key.split(':');
        debug.encryptedKeyParts = parts.length;
        
        if (parts.length === 3 && encryptionKey) {
          const key = crypto.createHash('sha256').update(encryptionKey).digest();
          const iv = Buffer.from(parts[0], 'hex');
          const authTag = Buffer.from(parts[1], 'hex');
          const encrypted = Buffer.from(parts[2], 'hex');
          
          const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
          decipher.setAuthTag(authTag);
          let decrypted = decipher.update(encrypted);
          decrypted = Buffer.concat([decrypted, decipher.final()]);
          const decryptedKey = decrypted.toString('utf8');
          
          debug.decryption = {
            success: true,
            keyLength: decryptedKey.length,
            keyPrefix: decryptedKey.substring(0, 20),
            isValidFormat: decryptedKey.startsWith('sk-ant-'),
          };
        } else {
          debug.decryption = {
            success: false,
            reason: parts.length !== 3 ? 'Invalid format' : 'No encryption key',
          };
        }
      } catch (decryptError: any) {
        debug.decryption = {
          success: false,
          error: decryptError.message,
        };
      }
    }
    
    return NextResponse.json({ debug });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
