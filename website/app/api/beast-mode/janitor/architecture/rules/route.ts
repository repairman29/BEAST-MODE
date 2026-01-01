import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClientOrNull } from '@/lib/supabase';

/**
 * GET /api/beast-mode/janitor/architecture/rules
 * Get all architecture rules
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClientOrNull();

    if (!supabase) {
      // Fallback to default rules if database not available
      return NextResponse.json({
        rules: [
          {
            id: 'block-secrets',
            name: 'Block Secrets in Code',
            description: 'Prevents hardcoded API keys, passwords, and other secrets',
            enabled: true,
            severity: 'error',
            category: 'security',
            examples: ['const apiKey = "sk-1234567890";', 'const password = "mypassword123";']
          },
          {
            id: 'prevent-db-in-frontend',
            name: 'Prevent Database Logic in Frontend',
            description: 'Blocks database queries and logic in frontend code',
            enabled: true,
            severity: 'error',
            category: 'architecture',
            examples: ['db.query("SELECT * FROM users");', 'database.connect();']
          },
          {
            id: 'enforce-separation',
            name: 'Enforce Separation of Concerns',
            description: 'Ensures proper separation between UI, business logic, and data layers',
            enabled: true,
            severity: 'warning',
            category: 'architecture',
            examples: ['Business logic in component files', 'UI rendering in utility functions']
          },
          {
            id: 'block-eval',
            name: 'Block eval() Usage',
            description: 'Prevents use of eval() which is a security risk',
            enabled: true,
            severity: 'error',
            category: 'security',
            examples: ['eval(userInput);', 'Function(userInput)();']
          },
          {
            id: 'auto-fix-patterns',
            name: 'Auto-Fix Common Patterns',
            description: 'Automatically fixes common code patterns',
            enabled: true,
            severity: 'info',
            category: 'quality',
            examples: ['console.log() → logger.debug()', 'var → const/let']
          }
        ]
      });
    }

    const { data: rules, error } = await supabase
      .from('architecture_rules')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Failed to fetch rules:', error);
      return NextResponse.json(
        { error: 'Failed to get architecture rules', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rules: rules?.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        enabled: rule.enabled,
        severity: rule.severity,
        category: rule.category,
        examples: rule.examples || []
      })) || []
    });
  } catch (error: any) {
    console.error('Failed to get architecture rules:', error);
    return NextResponse.json(
      { error: 'Failed to get architecture rules', details: error.message },
      { status: 500 }
    );
  }
}
