/**
 * PGMS 2.0 — API Proxy Server
 * Keeps the Gemini API key secret on the server side.
 * Run with:  node server.js
 * Serves static files + proxies /api/priority to Gemini.
 */

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('\n❌  GEMINI_API_KEY is missing from your .env file.');
  console.error('    Create a .env file with:  GEMINI_API_KEY=your_key_here\n');
  process.exit(1);
}

/* ── MIME TYPES ── */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

/* ── COLLECT JSON BODY ── */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 20000) reject(new Error('Body too large')); });
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

/* ── CALL GEMINI ── */
function callGemini(promptText) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 150 }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/* ── HTTP SERVER ── */
const server = http.createServer(async (req, res) => {

  /* CORS headers — allow requests from any local origin during dev */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  /* ── POST /api/priority ── */
  if (req.method === 'POST' && req.url === '/api/priority') {
    try {
      const body = await readBody(req);
      const { category, title, description, stillUnresolved, reportedBefore, timesReported } = body;

      const prompt = `You are a government grievance triage officer in India. Analyse this public complaint and assign a priority level.

COMPLAINT DETAILS:
- Category: ${category}
- Title: ${title}
- Description: ${description}
- Issue still unresolved: ${stillUnresolved}
- Previously reported: ${reportedBefore}
- Number of times previously reported: ${timesReported || 0}

PRIORITY CRITERIA:
- High: Immediate risk to life, health, safety, or fundamental rights. Also escalate to High if the same issue has been reported 3 or more times without resolution. Includes: medical emergencies, lack of drinking water, dangerous infrastructure, active corruption/extortion, police misconduct.
- Medium: Significant inconvenience affecting daily life or livelihoods. Includes: prolonged power cuts, road damage, sanitation issues, delayed services. Escalate to Medium if reported 2 times without resolution.
- Low: Quality-of-life improvements, administrative delays, minor issues with no immediate harm.

Respond with ONLY valid JSON, no markdown, no extra text:
{"priority":"High","reason":"One concise sentence explaining the priority decision."}`;

      const geminiResponse = await callGemini(prompt);
      const raw = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const clean = raw.replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(clean);
      const priority = ['High', 'Medium', 'Low'].includes(parsed.priority) ? parsed.priority : 'Medium';

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ priority, reason: parsed.reason || '' }));

    } catch (err) {
      console.error('Priority API error:', err.message);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      // Graceful fallback — don't break the citizen's submission
      res.end(JSON.stringify({ priority: 'Medium', reason: 'Auto-assigned (AI unavailable)', fallback: true }));
    }
    return;
  }

  /* ── STATIC FILE SERVING ── */
  let filePath = '.' + req.url.split('?')[0];
  if (filePath === './' || filePath === '.') filePath = './index.html';

  const ext = path.extname(filePath);
  const mimeType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: ' + filePath);
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('\n✅  PGMS 2.0 server running');
  console.log(`    Citizen Portal  →  http://localhost:${PORT}/index.html`);
  console.log(`    Admin Dashboard →  http://localhost:${PORT}/admin.html`);
  console.log(`    Priority API    →  POST http://localhost:${PORT}/api/priority\n`);
});