/**
 * PGMS 2.0 — API Proxy Server
 * Keeps ALL API keys secret on the server side — none appear in HTML/JS.
 *
 * Endpoints:
 *   POST /api/priority  → proxies complaint data to Gemini, returns { priority, reason }
 *
 * Run:  node server.js
 */

require('dotenv').config();
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const https = require('https');

const PORT           = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* ── VALIDATE KEYS ON STARTUP ── */
if (!GEMINI_API_KEY) {
  console.error('\n❌  GEMINI_API_KEY is missing from your .env file.');
  console.error('    Your .env should contain:');
  console.error('    GEMINI_API_KEY=your_gemini_key_here\n');
  process.exit(1);
}

/* ── MIME TYPES ── */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.woff2':'font/woff2',
};

/* ── COLLECT JSON BODY ── */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20000) reject(new Error('Body too large'));
    });
    req.on('end',   () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

/* ── CALL GEMINI ── */
function callGemini(promptText, maxTokens = 150) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents:         [{ parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: maxTokens },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path:     `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end',  () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/* ── HTTP SERVER ── */
const server = http.createServer(async (req, res) => {

  /* CORS — allow any origin during development */
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = req.url.split('?')[0];

  /* ── POST /api/priority ── */
  if (req.method === 'POST' && url === '/api/priority') {
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

      const geminiRes = await callGemini(prompt);
      const raw       = geminiRes?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const clean     = raw.replace(/```json|```/gi, '').trim();
      const parsed    = JSON.parse(clean);
      const priority  = ['High','Medium','Low'].includes(parsed.priority) ? parsed.priority : 'Medium';

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ priority, reason: parsed.reason || '' }));

    } catch (err) {
      console.error('Priority API error:', err.message);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ priority: 'Medium', reason: 'Auto-assigned (AI unavailable)', fallback: true }));
    }
    return;
  }


  /* ════════════════════════════════════════════════════
     POST /api/assign  — Gemini AI task assignment
  ════════════════════════════════════════════════════ */
  if (req.method === 'POST' && url === '/api/assign') {
    let body2 = {};
    try {
      body2 = await readBody(req);
      const { complaintId, category, categoryName, title, description, priority, district, state } = body2;
      const days = priority === 'High' ? 3 : priority === 'Medium' ? 7 : 14;

      // Truncate description to keep prompt short (avoid token overflow)
      const shortDesc = (description || '').slice(0, 200);

      const prompt = `Assign Indian govt officials to this ${priority} priority ${categoryName} complaint in ${district}, ${state}: "${title}". ${shortDesc}
Return ONLY JSON array (exactly 3 items, no markdown, no extra text):
[{"role":"Department Head","department":"dept name","name":"Sh. Name","responsibility":"task in 10 words","deadline":${days},"contactEmail":"x@gov.in","assignPriority":"Primary"},{"role":"Field Inspector","department":"dept","name":"Sh. Name","responsibility":"task","deadline":${days},"contactEmail":"x@gov.in","assignPriority":"Secondary"},{"role":"Engineer","department":"dept","name":"Sh. Name","responsibility":"task","deadline":${days},"contactEmail":"x@gov.in","assignPriority":"Secondary"}]`;

      const gRes   = await callGemini(prompt, 600);
      const raw    = gRes?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('[ASSIGN] Gemini raw response:', raw.slice(0, 300));
      if (!raw) throw new Error('Empty response from Gemini');
      // Extract JSON array robustly — find first [ to last ]
      const start  = raw.indexOf('[');
      const end    = raw.lastIndexOf(']');
      if (start === -1 || end === -1) throw new Error('No JSON array found in response');
      const clean  = raw.slice(start, end + 1);
      const parsed = JSON.parse(clean);
      if (!Array.isArray(parsed)) throw new Error('not array');

      const now = new Date();
      const assignments = parsed.map((a, i) => ({
        id:             `assign_${Date.now()}_${i}`,
        role:           a.role           || 'Department Head',
        department:     a.department     || 'Concerned Department',
        name:           a.name           || 'Officer In-Charge',
        responsibility: a.responsibility || 'Investigate and resolve',
        deadline:       parseInt(a.deadline) || days,
        deadlineDate:   new Date(now.getTime() + ((parseInt(a.deadline)||days)*86400000)).toISOString(),
        contactEmail:   a.contactEmail   || 'grievance@gov.in',
        assignPriority: a.assignPriority || (i===0?'Primary':'Secondary'),
        status:         'Assigned',
        progress:       0,
        assignedAt:     now.toISOString(),
        assignedBy:     'AI',
        history: [{ action:'Assigned', by:'AI System', at:now.toISOString(), note:'Auto-assigned on complaint submission' }],
      }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ assignments }));

    } catch (err) {
      console.error('Assign API error:', err.message);
      const now  = new Date();
      const days = body2?.priority === 'High' ? 3 : body2?.priority === 'Medium' ? 7 : 14;
      const dl   = new Date(now.getTime() + days*86400000).toISOString();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ assignments: [
        { id:`asgn_${Date.now()}_0`, role:'Department Head', department:'Concerned Department', name:'Officer In-Charge', responsibility:'Review and coordinate resolution', deadline:days, deadlineDate:dl, contactEmail:'grievance@gov.in', assignPriority:'Primary', status:'Assigned', progress:0, assignedAt:now.toISOString(), assignedBy:'System', history:[{action:'Assigned',by:'System',at:now.toISOString(),note:'Fallback assignment'}] },
        { id:`asgn_${Date.now()}_1`, role:'Field Inspector', department:'Field Operations', name:'Field Inspector', responsibility:'Visit site and submit ground report', deadline:days, deadlineDate:dl, contactEmail:'field@gov.in', assignPriority:'Secondary', status:'Assigned', progress:0, assignedAt:now.toISOString(), assignedBy:'System', history:[{action:'Assigned',by:'System',at:now.toISOString(),note:'Fallback assignment'}] },
      ], fallback:true }));
    }
    return;
  }

  /* ── STATIC FILE SERVING ── */
  let filePath = '.' + url;
  if (filePath === './' || filePath === '.') filePath = './citizen.html';

  const ext      = path.extname(filePath);
  const mimeType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${filePath}`);
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('\n✅  PGMS 2.0 server running');
  console.log(`\n    Citizen Portal    →  http://localhost:${PORT}/citizen.html`);
  console.log(`    Admin Dashboard   →  http://localhost:${PORT}/admin.html`);
  console.log(`    Development Map   →  http://localhost:${PORT}/development.html`);
  console.log(`\n    API:`);
  console.log(`    POST /api/priority  →  Gemini AI priority`
  );
  console.log(`    POST /api/assign    →  Gemini AI assignment\n`);
});