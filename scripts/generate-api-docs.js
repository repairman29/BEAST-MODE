#!/usr/bin/env node

/**
 * Generate OpenAPI/Swagger Documentation
 * 
 * Scans API routes and generates OpenAPI 3.0 specification
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const API_DIR = path.join(__dirname, '../website/app/api');
const OUTPUT_FILE = path.join(__dirname, '../docs/API_DOCUMENTATION.md');
const OPENAPI_FILE = path.join(__dirname, '../docs/openapi.json');

// Common response schemas
const schemas = {
  Error: {
    type: 'object',
    properties: {
      error: { type: 'string' },
      details: { type: 'string' }
    }
  },
  Success: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' }
    }
  }
};

// Extract route info from file
function extractRouteInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(API_DIR, filePath);
  const routePath = '/' + relativePath
    .replace(/\/route\.ts$/, '')
    .replace(/\/route\.js$/, '')
    .replace(/\\/g, '/');

  const methods = [];
  if (content.includes('export async function GET')) methods.push('GET');
  if (content.includes('export async function POST')) methods.push('POST');
  if (content.includes('export async function PUT')) methods.push('PUT');
  if (content.includes('export async function DELETE')) methods.push('DELETE');
  if (content.includes('export async function PATCH')) methods.push('PATCH');

  // Extract JSDoc comments
  const jsdocMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
  let description = '';
  if (jsdocMatch) {
    description = jsdocMatch[1]
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .filter(line => line && !line.startsWith('@'))
      .join(' ');
  }

  return {
    path: routePath,
    methods,
    description: description || 'API endpoint',
    file: relativePath
  };
}

// Generate OpenAPI spec
function generateOpenAPISpec(routes) {
  const paths = {};
  
  routes.forEach(route => {
    if (!paths[route.path]) {
      paths[route.path] = {};
    }

    route.methods.forEach(method => {
      paths[route.path][method.toLowerCase()] = {
        summary: route.description,
        description: route.description,
        tags: [route.path.split('/')[2] || 'api'],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          '400': {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '500': {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      };

      // Add request body for POST/PUT/PATCH
      if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
        paths[route.path][method.toLowerCase()].requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        };
      }
    });
  });

  return {
    openapi: '3.0.0',
    info: {
      title: 'BEAST MODE API',
      version: '1.0.0',
      description: 'BEAST MODE - AI-Powered Code Quality Platform API Documentation'
    },
    servers: [
      {
        url: 'https://beast-mode-website.vercel.app',
        description: 'Production'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development'
      }
    ],
    paths,
    components: {
      schemas
    }
  };
}

// Generate Markdown documentation
function generateMarkdownDocs(routes) {
  let md = `# BEAST MODE API Documentation

**Last Updated:** ${new Date().toISOString().split('T')[0]}  
**Base URL:** \`https://beast-mode-website.vercel.app\`

---

## 📋 Table of Contents

`;

  // Group routes by category
  const categories = {};
  routes.forEach(route => {
    const category = route.path.split('/')[2] || 'api';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(route);
  });

  // Generate TOC
  Object.keys(categories).sort().forEach(category => {
    md += `- [${category.toUpperCase()}](#${category})\n`;
  });

  md += `\n---\n\n`;

  // Generate documentation for each category
  Object.keys(categories).sort().forEach(category => {
    md += `## ${category.toUpperCase()}\n\n`;
    
    categories[category].forEach(route => {
      route.methods.forEach(method => {
        md += `### \`${method} ${route.path}\`\n\n`;
        md += `${route.description}\n\n`;
        md += `**File:** \`${route.file}\`\n\n`;
        
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          md += `**Request Body:**\n\`\`\`json\n{\n  // Request body schema\n}\n\`\`\`\n\n`;
        }
        
        md += `**Response:**\n\`\`\`json\n{\n  // Response schema\n}\n\`\`\`\n\n`;
        md += `---\n\n`;
      });
    });
  });

  md += `## Authentication

Most endpoints require authentication. Include your authentication token in the request:

\`\`\`
Authorization: Bearer <your-token>
\`\`\`

---

## Error Responses

All endpoints may return the following error responses:

- \`400 Bad Request\` - Invalid request parameters
- \`401 Unauthorized\` - Missing or invalid authentication
- \`404 Not Found\` - Resource not found
- \`500 Internal Server Error\` - Server error

Error response format:
\`\`\`json
{
  "error": "Error message",
  "details": "Additional error details"
}
\`\`\`

---

## Rate Limiting

API requests are rate-limited. Current limits:
- 100 requests per minute per IP
- 1000 requests per hour per user

---

## Support

For API support, please contact: support@beastmode.dev

`;

  return md;
}

// Main function
function main() {
  console.log('📚 Generating API Documentation...\n');

  // Find all route files
  const routeFiles = glob.sync('**/route.ts', { cwd: API_DIR, absolute: true })
    .concat(glob.sync('**/route.js', { cwd: API_DIR, absolute: true }));

  console.log(`Found ${routeFiles.length} API routes\n`);

  // Extract route information
  const routes = routeFiles.map(extractRouteInfo).filter(r => r.methods.length > 0);

  // Generate OpenAPI spec
  const openAPISpec = generateOpenAPISpec(routes);
  fs.writeFileSync(OPENAPI_FILE, JSON.stringify(openAPISpec, null, 2));
  console.log(`✅ OpenAPI spec written to: ${OPENAPI_FILE}`);

  // Generate Markdown docs
  const markdown = generateMarkdownDocs(routes);
  fs.writeFileSync(OUTPUT_FILE, markdown);
  console.log(`✅ Markdown docs written to: ${OUTPUT_FILE}`);

  console.log(`\n📊 Summary:`);
  console.log(`   - Total routes: ${routes.length}`);
  console.log(`   - Total endpoints: ${routes.reduce((sum, r) => sum + r.methods.length, 0)}`);
  console.log(`\n✅ API documentation generated successfully!\n`);
}

main();
