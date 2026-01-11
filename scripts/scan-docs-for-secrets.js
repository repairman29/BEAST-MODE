#!/usr/bin/env node

/**
 * Scan all documentation files for secrets and credentials
 * Extract them and store in appropriate database tables
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DOCS_DIR = path.join(__dirname, '../docs');
const SECRET_PATTERNS = {
  github: {
    clientId: /GITHUB_CLIENT_ID[=:]\s*([^\s\n]+)/gi,
    clientSecret: /GITHUB_CLIENT_SECRET[=:]\s*([^\s\n]+)/gi,
    token: /GITHUB_TOKEN[=:]\s*([^\s\n]+)/gi,
    webhookSecret: /GITHUB.*WEBHOOK.*SECRET[=:]\s*([^\s\n]+)/gi,
  },
  stripe: {
    secretKey: /STRIPE.*SECRET.*KEY[=:]\s*([^\s\n]+)/gi,
    webhookSecret: /STRIPE.*WEBHOOK.*SECRET[=:]\s*([^\s\n]+)/gi,
    publishableKey: /STRIPE.*PUBLISHABLE.*KEY[=:]\s*([^\s\n]+)/gi,
  },
  supabase: {
    url: /SUPABASE.*URL[=:]\s*([^\s\n]+)/gi,
    anonKey: /SUPABASE.*ANON.*KEY[=:]\s*([^\s\n]+)/gi,
    serviceRoleKey: /SUPABASE.*SERVICE.*ROLE.*KEY[=:]\s*([^\s\n]+)/gi,
  },
  jwt: {
    secret: /JWT_SECRET[=:]\s*([^\s\n]+)/gi,
  },
  encryption: {
    key: /ENCRYPTION.*KEY[=:]\s*([^\s\n]+)/gi,
    githubTokenEncryption: /GITHUB_TOKEN_ENCRYPTION_KEY[=:]\s*([^\s\n]+)/gi,
  }
};

async function scanDocsForSecrets() {
  console.log('\n🔍 Scanning documentation for secrets...\n');
  
  const secrets = {
    github: {},
    stripe: {},
    supabase: {},
    jwt: {},
    encryption: {},
    other: {}
  };

  // Scan all markdown files
  const files = [];
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(DOCS_DIR);
  console.log(`📄 Found ${files.length} documentation files\n`);

  // Extract secrets from each file
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);

    // GitHub secrets
    for (const [key, pattern] of Object.entries(SECRET_PATTERNS.github)) {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const value = match[1]?.trim().replace(/['"]/g, '');
        if (value && value.length > 10) {
          if (!secrets.github[key]) secrets.github[key] = [];
          secrets.github[key].push({ value, source: fileName });
        }
      });
    }

    // Stripe secrets
    for (const [key, pattern] of Object.entries(SECRET_PATTERNS.stripe)) {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const value = match[1]?.trim().replace(/['"]/g, '');
        if (value && value.length > 10) {
          if (!secrets.stripe[key]) secrets.stripe[key] = [];
          secrets.stripe[key].push({ value, source: fileName });
        }
      });
    }

    // Supabase secrets
    for (const [key, pattern] of Object.entries(SECRET_PATTERNS.supabase)) {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const value = match[1]?.trim().replace(/['"]/g, '');
        if (value && value.length > 10) {
          if (!secrets.supabase[key]) secrets.supabase[key] = [];
          secrets.supabase[key].push({ value, source: fileName });
        }
      });
    }

    // JWT secrets
    for (const [key, pattern] of Object.entries(SECRET_PATTERNS.jwt)) {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const value = match[1]?.trim().replace(/['"]/g, '');
        if (value && value.length > 10) {
          if (!secrets.jwt[key]) secrets.jwt[key] = [];
          secrets.jwt[key].push({ value, source: fileName });
        }
      });
    }

    // Encryption keys
    for (const [key, pattern] of Object.entries(SECRET_PATTERNS.encryption)) {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const value = match[1]?.trim().replace(/['"]/g, '');
        if (value && value.length > 10) {
          if (!secrets.encryption[key]) secrets.encryption[key] = [];
          secrets.encryption[key].push({ value, source: fileName });
        }
      });
    }
  }

  // Display found secrets
  console.log('📊 Found Secrets:\n');
  let totalSecrets = 0;
  for (const [category, items] of Object.entries(secrets)) {
    const count = Object.values(items).reduce((sum, arr) => sum + (arr?.length || 0), 0);
    if (count > 0) {
      console.log(`   ${category}: ${count} secret(s)`);
      totalSecrets += count;
      for (const [key, values] of Object.entries(items)) {
        if (values && values.length > 0) {
          console.log(`      • ${key}: ${values.length} occurrence(s)`);
          values.forEach(({ source }) => {
            console.log(`        - ${source}`);
          });
        }
      }
    }
  }
  console.log(`\n   Total: ${totalSecrets} secrets found\n`);

  return secrets;
}

async function storeSecretsInDatabase(secrets) {
  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Supabase credentials not found - skipping database storage');
    return;
  }

  console.log('💾 Storing secrets in database...\n');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check if secrets table exists
  const { data: tables, error: tableError } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('secrets', 'user_api_keys', 'api_keys');
    `
  });

  if (tableError) {
    console.log('⚠️  Could not check for secrets table:', tableError.message);
    return;
  }

  console.log('✅ Database connection successful\n');

  // Store GitHub secrets
  if (Object.keys(secrets.github).length > 0) {
    console.log('📦 Storing GitHub secrets...');
    for (const [key, values] of Object.entries(secrets.github)) {
      if (values && values.length > 0) {
        // Use the most recent/first value
        const secretValue = values[0].value;
        const source = values.map(v => v.source).join(', ');
        
        try {
          // Store in secrets table
          const secretKey = `github_${key}`;
          const description = `GitHub ${key} from ${source}`;
          
          const { error } = await supabase
            .from('secrets')
            .upsert({
              key: secretKey,
              value: secretValue,
              description: description,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'key'
            });

          if (error) {
            console.log(`   ⚠️  Could not store ${secretKey}: ${error.message}`);
          } else {
            console.log(`   ✅ Stored ${secretKey}`);
          }
        } catch (err) {
          console.log(`   ⚠️  Error storing github_${key}: ${err.message}`);
        }
      }
    }
  }

  // Store Stripe secrets
  if (Object.keys(secrets.stripe).length > 0) {
    console.log('\n📦 Storing Stripe secrets...');
    for (const [key, values] of Object.entries(secrets.stripe)) {
      if (values && values.length > 0) {
        const secretValue = values[0].value;
        const source = values.map(v => v.source).join(', ');
        
        try {
          const secretKey = `stripe_${key}`;
          const description = `Stripe ${key} from ${source}`;
          
          const { error } = await supabase
            .from('secrets')
            .upsert({
              key: secretKey,
              value: secretValue,
              description: description,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'key'
            });

          if (error) {
            console.log(`   ⚠️  Could not store ${secretKey}: ${error.message}`);
          } else {
            console.log(`   ✅ Stored ${secretKey}`);
          }
        } catch (err) {
          console.log(`   ⚠️  Error storing stripe_${key}: ${err.message}`);
        }
      }
    }
  }

  // Store Supabase secrets
  if (Object.keys(secrets.supabase).length > 0) {
    console.log('\n📦 Storing Supabase secrets...');
    for (const [key, values] of Object.entries(secrets.supabase)) {
      if (values && values.length > 0) {
        const secretValue = values[0].value;
        const source = values.map(v => v.source).join(', ');
        
        try {
          const secretKey = `supabase_${key}`;
          const description = `Supabase ${key} from ${source}`;
          
          const { error } = await supabase
            .from('secrets')
            .upsert({
              key: secretKey,
              value: secretValue,
              description: description,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'key'
            });

          if (error) {
            console.log(`   ⚠️  Could not store ${secretKey}: ${error.message}`);
          } else {
            console.log(`   ✅ Stored ${secretKey}`);
          }
        } catch (err) {
          console.log(`   ⚠️  Error storing supabase_${key}: ${err.message}`);
        }
      }
    }
  }

  // Store JWT secrets
  if (Object.keys(secrets.jwt).length > 0) {
    console.log('\n📦 Storing JWT secrets...');
    for (const [key, values] of Object.entries(secrets.jwt)) {
      if (values && values.length > 0) {
        const secretValue = values[0].value;
        const source = values.map(v => v.source).join(', ');
        
        try {
          const secretKey = `jwt_${key}`;
          const description = `JWT ${key} from ${source}`;
          
          const { error } = await supabase
            .from('secrets')
            .upsert({
              key: secretKey,
              value: secretValue,
              description: description,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'key'
            });

          if (error) {
            console.log(`   ⚠️  Could not store ${secretKey}: ${error.message}`);
          } else {
            console.log(`   ✅ Stored ${secretKey}`);
          }
        } catch (err) {
          console.log(`   ⚠️  Error storing jwt_${key}: ${err.message}`);
        }
      }
    }
  }

  // Store encryption keys
  if (Object.keys(secrets.encryption).length > 0) {
    console.log('\n📦 Storing encryption keys...');
    for (const [key, values] of Object.entries(secrets.encryption)) {
      if (values && values.length > 0) {
        const secretValue = values[0].value;
        const source = values.map(v => v.source).join(', ');
        
        try {
          const secretKey = `encryption_${key}`;
          const description = `Encryption ${key} from ${source}`;
          
          const { error } = await supabase
            .from('secrets')
            .upsert({
              key: secretKey,
              value: secretValue,
              description: description,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'key'
            });

          if (error) {
            console.log(`   ⚠️  Could not store ${secretKey}: ${error.message}`);
          } else {
            console.log(`   ✅ Stored ${secretKey}`);
          }
        } catch (err) {
          console.log(`   ⚠️  Error storing encryption_${key}: ${err.message}`);
        }
      }
    }
  }

  console.log('\n✅ Secret storage complete!\n');
}

async function main() {
  try {
    const secrets = await scanDocsForSecrets();
    await storeSecretsInDatabase(secrets);
    
    console.log('='.repeat(70));
    console.log('\n✅ Documentation scan complete!\n');
    console.log('📋 Next steps:');
    console.log('   1. Review the secrets stored in the database');
    console.log('   2. Ensure all secrets are encrypted in production');
    console.log('   3. Remove secrets from documentation files (replace with placeholders)');
    console.log('   4. Update docs to reference database-stored secrets\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
