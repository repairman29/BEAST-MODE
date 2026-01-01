import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GitHub Token Management API
 * 
 * Stores and retrieves encrypted GitHub tokens for users
 */

// Simple encryption (in production, use a proper key management service)
// ENCRYPTION_KEY should be 64 hex characters (32 bytes) or we'll generate one
let ENCRYPTION_KEY: Buffer;
if (process.env.GITHUB_TOKEN_ENCRYPTION_KEY) {
  // If provided, it should be a hex string (64 chars = 32 bytes)
  const keyHex = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (keyHex.length === 64) {
    ENCRYPTION_KEY = Buffer.from(keyHex, 'hex');
  } else {
    // If not 64 chars, treat as raw string and pad/truncate to 32 bytes
    ENCRYPTION_KEY = Buffer.from(keyHex.padEnd(32, '0').slice(0, 32), 'utf8');
  }
} else {
  // Generate a random 32-byte key
  ENCRYPTION_KEY = crypto.randomBytes(32);
  console.warn('⚠️ [GitHub Token] No GITHUB_TOKEN_ENCRYPTION_KEY set, using random key (tokens will be lost on restart)');
}

const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error: any) {
    console.error('❌ [GitHub Token] Encryption error:', error);
    throw error;
  }
}

function decrypt(text: string): string {
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error: any) {
    console.error('❌ [GitHub Token] Decryption error:', error);
    throw error;
  }
}

// In-memory store (in production, use database)
// Use global to persist across hot reloads in development
const globalForTokenStore = globalThis as unknown as {
  tokenStore: Map<string, {
    encryptedToken: string;
    githubUsername: string;
    githubUserId: number;
    connectedAt: string;
  }>;
};

if (!globalForTokenStore.tokenStore) {
  globalForTokenStore.tokenStore = new Map();
  console.log('🔄 [GitHub Token] Initialized new token store');
}

const tokenStore = globalForTokenStore.tokenStore;

/**
 * POST /api/github/token - Store GitHub token for user
 */
export async function POST(request: NextRequest) {
  console.log('🟡 [GitHub Token] POST request received');
  try {
    const body = await request.json();
    const { userId, githubToken, githubUsername, githubUserId } = body;

    console.log('   User ID:', userId);
    console.log('   Token present:', !!githubToken);
    console.log('   Username:', githubUsername);
    console.log('   GitHub User ID:', githubUserId);

    if (!userId || !githubToken) {
      console.error('❌ [GitHub Token] Missing userId or githubToken');
      return NextResponse.json(
        { error: 'userId and githubToken are required' },
        { status: 400 }
      );
    }

    // Encrypt token before storing
    console.log('   Encrypting token...');
    const encryptedToken = encrypt(githubToken);

    tokenStore.set(userId, {
      encryptedToken,
      githubUsername: githubUsername || 'unknown',
      githubUserId: githubUserId || 0,
      connectedAt: new Date().toISOString(),
    });

    console.log('✅ [GitHub Token] Token stored successfully');
    console.log('   Token store size:', tokenStore.size);
    console.log('   Stored for userId:', userId);

    return NextResponse.json({
      success: true,
      message: 'GitHub token stored successfully',
    });
  } catch (error: any) {
    console.error('❌ [GitHub Token] Error storing token:', error);
    console.error('   Stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to store GitHub token' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/github/token - Get GitHub token for user
 */
export async function GET(request: NextRequest) {
  console.log('🟡 [GitHub Token] GET request received');
  try {
    // Get user ID from token/session (optional - allow checking without auth)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('beastModeToken')?.value;
    
    console.log('   Auth token present:', !!token);
    console.log('   Token store size:', tokenStore.size);
    console.log('   Token store keys:', Array.from(tokenStore.keys()));
    
    // Try to find stored token - check all possible user IDs
    let found = false;
    let storedData = null;
    
    // First, try to get userId from cookie (set during OAuth)
    const oauthUserId = request.cookies.get('github_oauth_user_id')?.value;
    console.log('   OAuth user ID from cookie:', oauthUserId);
    if (oauthUserId) {
      storedData = tokenStore.get(oauthUserId);
      if (storedData) {
        found = true;
        console.log('✅ [GitHub Token] Found token for OAuth user ID:', oauthUserId);
      } else {
        console.log('   No token found for OAuth user ID:', oauthUserId);
      }
    }
    
    // If not found, try token-based user ID
    if (!found && token) {
      const userId = `user-${token.slice(0, 8)}`;
      console.log('   Trying token-based user ID:', userId);
      storedData = tokenStore.get(userId);
      if (storedData) {
        found = true;
        console.log('✅ [GitHub Token] Found token for user ID:', userId);
      } else {
        console.log('   No token found for user ID:', userId);
      }
    }
    
    // If still not found, check all session-based IDs (get the most recent)
    if (!found) {
      console.log('   Checking all session-based IDs...');
      let mostRecent: { key: string; data: any; time: number } | null = null;
      for (const [key, value] of tokenStore.entries()) {
        if (key.startsWith('session-') || key.startsWith('user-')) {
          const time = new Date(value.connectedAt).getTime();
          if (!mostRecent || time > mostRecent.time) {
            mostRecent = { key, data: value, time };
          }
        }
      }
      if (mostRecent) {
        storedData = mostRecent.data;
        found = true;
        console.log('✅ [GitHub Token] Found most recent token for:', mostRecent.key);
      } else {
        console.log('   No recent tokens found');
      }
    }

    if (!found || !storedData) {
      console.log('❌ [GitHub Token] No GitHub token found');
      console.log('   Token store size:', tokenStore.size);
      // Return 200 with connected: false - this is fine
      return NextResponse.json({
        connected: false,
        githubUsername: null,
      });
    }

    console.log('✅ [GitHub Token] Returning connected status for:', storedData.githubUsername);
    return NextResponse.json({
      connected: true,
      githubUsername: storedData.githubUsername,
      githubUserId: storedData.githubUserId,
      connectedAt: storedData.connectedAt,
      // Don't return the actual token in GET - use it server-side only
    });
  } catch (error: any) {
    console.error('❌ [GitHub Token] Error retrieving token:', error);
    console.error('   Stack:', error.stack);
    return NextResponse.json(
      { connected: false, error: 'Failed to retrieve GitHub token' },
      { status: 200 } // Return 200 so UI can handle gracefully
    );
  }
}

// getDecryptedToken moved to lib/github-token.ts to avoid Next.js route export restrictions

/**
 * DELETE /api/github/token - Disconnect GitHub account
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get user ID from token/session
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('beastModeToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // TODO: Get user ID from token
    const userId = 'user-id-from-token'; // Replace with actual user ID

    tokenStore.delete(userId);

    return NextResponse.json({
      success: true,
      message: 'GitHub account disconnected',
    });
  } catch (error: any) {
    console.error('Error disconnecting GitHub:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect GitHub account' },
      { status: 500 }
    );
  }
}

