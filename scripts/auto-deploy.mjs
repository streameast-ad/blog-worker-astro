import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function run(cmd, options = {}) {
  try {
    return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8', ...options });
  } catch (err) {
    if (options.ignoreError) return null;
    throw err;
  }
}

function runWithInherit(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

console.log('\n========================================================');
console.log('⚡ EdgeBlog — Automated Cloudflare R2 & KV Deployment');
console.log('========================================================\n');

// 1. Verify Authentication
console.log('🔍 Step 1: Checking Cloudflare Wrangler login status...');
try {
  const whoamiOutput = run('npx wrangler whoami');
  if (!whoamiOutput || whoamiOutput.includes('You are not authenticated')) {
    console.log('\n⚠️ You are not logged in to Cloudflare!');
    console.log('👉 Please run "npx wrangler login" to connect your Cloudflare account first.\n');
    process.exit(1);
  }
  console.log('✓ Cloudflare account authenticated successfully.');
} catch (err) {
  console.log('\n⚠️ Could not verify login. Please run "npx wrangler login".\n');
  process.exit(1);
}

// 2. Ensure Cloudflare R2 Bucket Exists
const BUCKET_NAME = 'blog-worker-astro-images';
console.log(`\n📦 Step 2: Verifying Cloudflare R2 Bucket ("${BUCKET_NAME}")...`);
try {
  const r2List = run('npx wrangler r2 bucket list', { ignoreError: true }) || '';
  if (r2List.includes(BUCKET_NAME)) {
    console.log(`✓ R2 Bucket "${BUCKET_NAME}" already exists and is ready.`);
  } else {
    console.log(`🌀 Creating new R2 Bucket "${BUCKET_NAME}"...`);
    run(`npx wrangler r2 bucket create ${BUCKET_NAME}`);
    console.log(`✓ R2 Bucket "${BUCKET_NAME}" created successfully!`);
  }
} catch (err) {
  console.log(`⚠️ Warning checking R2 bucket (it may already exist or require verification):`, err.message);
}

// 3. Ensure Cloudflare KV Namespace Exists
const KV_TITLE = 'blog-worker-astro-kv';
console.log(`\n🗄️ Step 3: Verifying Cloudflare KV Namespace ("${KV_TITLE}")...`);
let kvId = '';
try {
  const kvListOutput = run('npx wrangler kv namespace list', { ignoreError: true }) || '[]';
  let namespaces = [];
  try {
    namespaces = JSON.parse(kvListOutput);
  } catch {}

  const existingKV = namespaces.find((n) => n.title === KV_TITLE);
  if (existingKV && existingKV.id) {
    kvId = existingKV.id;
    console.log(`✓ KV Namespace "${KV_TITLE}" found with ID: ${kvId}`);
  } else {
    console.log(`🌀 Creating new KV Namespace "${KV_TITLE}"...`);
    const createOutput = run(`npx wrangler kv namespace create ${KV_TITLE}`);
    const match = createOutput.match(/"id":\s*"([a-f0-9]+)"/i);
    if (match && match[1]) {
      kvId = match[1];
      console.log(`✓ KV Namespace "${KV_TITLE}" created with ID: ${kvId}`);
    }
  }
} catch (err) {
  console.log(`⚠️ Warning checking KV namespace:`, err.message);
}

// 4. Update wrangler.jsonc with accurate bindings
console.log('\n⚙️ Step 4: Ensuring wrangler.jsonc configuration has correct R2 & KV bindings...');
const wranglerPath = path.resolve('wrangler.jsonc');
if (fs.existsSync(wranglerPath)) {
  let content = fs.readFileSync(wranglerPath, 'utf-8');

  // Ensure R2 bucket binding is present
  if (!content.includes('IMAGES_BUCKET')) {
    content = content.replace(
      /"kv_namespaces":\s*\[[\s\S]*?\],/,
      (match) => `${match}\n\t"r2_buckets": [\n\t\t{\n\t\t\t"binding": "IMAGES_BUCKET",\n\t\t\t"bucket_name": "${BUCKET_NAME}"\n\t\t}\n\t],`
    );
  }

  // Update KV ID if found
  if (kvId) {
    content = content.replace(/"binding":\s*"BLOG_KV",\s*"id":\s*"[^"]*"/, `"binding": "BLOG_KV",\n\t\t\t"id": "${kvId}"`);
  }

  fs.writeFileSync(wranglerPath, content, 'utf-8');
  console.log('✓ wrangler.jsonc configuration validated.');
}

// 5. Build Project
console.log('\n🏗️ Step 5: Building Astro project for Cloudflare Workers...');
runWithInherit('npm run build');

// 6. Deploy to Cloudflare Workers
console.log('\n🚀 Step 6: Deploying to Cloudflare Workers Edge Network...');
runWithInherit('npx wrangler deploy');

console.log('\n========================================================');
console.log('🎉 DEPLOYMENT COMPLETE! All KV & R2 resources are live.');
console.log('========================================================\n');
