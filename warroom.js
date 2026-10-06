import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(process.cwd(), "applications.json");

// قراءة البيانات
function loadApps() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return []; }
}

// حفظ البيانات
function saveApps(apps) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(apps, null, 2));
}

// 🎨 صفحة غرفة العمليات
app.get("/warroom", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>غرفة العمليات - منصة المنح</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Tajawal', -apple-system, sans-serif; background: #0A0E27; color: #fff; min-height: 100vh; padding: 16px;
    background-image: radial-gradient(circle at 20% 30%, rgba(0,212,255,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(212,175,55,0.08) 0%, transparent 50%); }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 26px; background: linear-gradient(90deg, #00D4FF, #D4AF37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 6px; }
  .subtitle { text-align: center; color: #8892b0; font-size: 13px; margin-bottom: 20px; }
  .nav { display: flex; justify-content: center; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .nav a { color: #00D4FF; text-decoration: none; padding: 6px 14px; border: 1px solid rgba(0,212,255,0.3); border-radius: 20px; font-size: 12px; }
  .add-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px; margin-bottom: 24px; }
  .add-card input { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px 14px; color: #fff; font-family: inherit; margin-bottom: 10px; outline: none; }
  .add-card input:focus { border-color: #00D4FF; }
  .add-card button { width: 100%; background: linear-gradient(90deg, #00D4FF, #0099ff); color: #0A0E27; border: none; border-radius: 10px; padding: 12px; font-weight: bold; cursor: pointer; font-family: inherit; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 24px; }
  .stat { background: rgba(0,212,255,0.06); border: 1px solid rgba(0,212,255,0.15); border-radius: 12px; padding: 12px; text-align: center; }
  .stat .num { font-size: 24px; font-weight: bold; color: #00D4FF; }
  .stat .lbl { font-size: 11px; color: #8892b0; margin-top: 4px; }
  .board { display: grid; grid-template-columns: 1fr; gap: 14px; }
  @media (min-width: 700px) { .board { grid-template-columns: repeat(2, 1fr); } }
  .column { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 14px; min-height: 120px; }
  .column h2 { font-size: 14px; margin-bottom: 12px; color: #ccd6f6; display: flex; justify-content: space-between; align-items: center; }
  .column h2 .count { background: rgba(0,212,255,0.2); color: #00D4FF; border-radius: 10px; padding: 2px 10px; font-size: 12px; }
  .column.draft h2 { color: #8892b0; }
  .column.inprogress h2 { color: #D4AF37; }
  .column.submitted h2 { color: #00D4FF; }
  .column.accepted h2 { color: #4ade80; }
  .column.rejected h2 { color: #ff6b6b; }
  .app-item { background: rgba(0,0,0,0.3); border-radius: 10px; padding: 12px; margin-bottom: 8px; border-right: 3px solid #8892b0; cursor: pointer; transition: transform 0.2s; }
  .app-item:hover { transform: translateX(-3px); }
  .app-item.draft { border-right-color: #8892b0; }
  .app-item.inprogress { border-right-color: #D4AF37; }
  .app-item.submitted { border-right-color: #00D4FF; }
  .app-item.accepted { border-right-color: #4ade80; }
  .app-item.rejected { border-right-color: #ff6b6b; }
  .app-name { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
  .app-meta { font-size: 11px; color: #8892b0; }
  .actions { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
  .actions button { padding: 4px 10px; font-size: 11px; border-radius: 6px; border: none; cursor: pointer; font-family: inherit; }
  .btn-next { background: rgba(0,212,255,0.2); color: #00D4FF; }
  .btn-delete { background: rgba(255,107,107,0.2); color: #ff6b6b; }
  .empty { text-align: center; color: #8892b0; font-size: 13px; padding: 20px; }
</style>
</head>
<body>
  <div class="container">
    <h1>⚙️ غرفة العمليات</h1>
    <p class="subtitle">تتبّع كل طلباتك في مكان واحد</p>
    <div class="nav">
      <a href="/">🏠 المطابقة</a>
      <a href="/mentor">🎓 المدرب</a>
    </div>

    <div class="stats" id="stats"></div>

    <div class="add-card">
      <input type="text" id="grantName" placeholder="اسم المنحة الجديدة...">
      <input type="text" id="grantCountry" placeholder="البلد (اختياري)">
      <input type="text" id="grantDeadline" placeholder="آخر موعد (اختياري) — مثال: 2026-02-01">
      <button onclick="addApp()">➕ أضف طلب جديد</button>
    </div>

    <div class="board" id="board"></div>
  </div>

<script>
const STAGES = [
  { key: 'draft', label: '📝 مسودة', cls: 'draft' },
  { key: 'inprogress', label: '⚙️ قيد التقديم', cls: 'inprogress' },
  { key: 'submitted', label: '📤 تم التقديم', cls: 'submitted' },
  { key: 'accepted', label: '🎉 تم القبول', cls: 'accepted' },
  { key: 'rejected', label: '❌ تم الرفض', cls: 'rejected' }
];

const NEXT_STAGE = {
  draft: 'inprogress',
  inprogress: 'submitted',
  submitted: 'accepted'
};

async function loadApps() {
  const res = await fetch('/api/applications');
  const apps = await res.json();
  render(apps);
}

function render(apps) {
  // Stats
  const stats = document.getElementById('stats');
  const counts = { draft: 0, inprogress: 0, submitted: 0, accepted: 0, rejected: 0 };
  apps.forEach(a => { if (counts[a.stage] !== undefined) counts[a.stage]++; });
  stats.innerHTML = '';
  [['draft','مسودة'], ['inprogress','قيد التقديم'], ['submitted','مقدم'], ['accepted','مقبول']].forEach(([k,l]) => {
    stats.innerHTML += '<div class="stat"><div class="num">' + counts[k] + '</div><div class="lbl">' + l + '</div></div>';
  });

  // Board
  const board = document.getElementById('board');
  board.innerHTML = '';
  STAGES.forEach(stage => {
    const items = apps.filter(a => a.stage === stage.key);
    let html = '<div class="column ' + stage.cls + '">';
    html += '<h2>' + stage.label + ' <span class="count">' + items.length + '</span></h2>';
    if (items.length === 0) {
      html += '<div class="empty">لا يوجد طلبات</div>';
    } else {
      items.forEach(a => {
        html += '<div class="app-item ' + a.stage + '">';
        html += '<div class="app-name">' + escapeHtml(a.name) + '</div>';
        html += '<div class="app-meta">' + escapeHtml(a.country || '-') + (a.deadline ? ' | 📅 ' + a.deadline : '') + '</div>';
        html += '<div class="actions">';
        if (NEXT_STAGE[a.stage]) {
          html += '<button class="btn-next" onclick="nextStage(' + a.id + ',\\'' + NEXT_STAGE[a.stage] + '\\')">← ' + STAGES.find(s => s.key === NEXT_STAGE[a.stage]).label + '</button>';
        }
        html += '<button class="btn-delete" onclick="delApp(' + a.id + ')">🗑</button>';
        html += '</div></div>';
      });
    }
    html += '</div>';
    board.innerHTML += html;
  });
}

function escapeHtml(s) { return String(s).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }

async function addApp() {
  const name = document.getElementById('grantName').value.trim();
  if (!name) { alert('اكتب اسم المنحة'); return; }
  const body = {
    name,
    country: document.getElementById('grantCountry').value.trim(),
    deadline: document.getElementById('grantDeadline').value.trim(),
    stage: 'draft'
  };
  await fetch('/api/applications', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  document.getElementById('grantName').value = '';
  document.getElementById('grantCountry').value = '';
  document.getElementById('grantDeadline').value = '';
  loadApps();
}

async function nextStage(id, stage) {
  await fetch('/api/applications/' + id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ stage }) });
  loadApps();
}

async function delApp(id) {
  if (!confirm('متأكد من الحذف؟')) return;
  await fetch('/api/applications/' + id, { method: 'DELETE' });
  loadApps();
}

loadApps();
</script>
</body>
</html>`);
});

// 📥 API - كل الطلبات
app.get("/api/applications", (req, res) => {
  res.json(loadApps());
});

// ➕ إضافة طلب
app.post("/api/applications", (req, res) => {
  const apps = loadApps();
  const newApp = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  apps.push(newApp);
  saveApps(apps);
  console.log("➕ طلب جديد:", newApp.name);
  res.json(newApp);
});

// ✏️ تعديل طلب
app.patch("/api/applications/:id", (req, res) => {
  const apps = loadApps();
  const id = parseInt(req.params.id);
  const idx = apps.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  apps[idx] = { ...apps[idx], ...req.body };
  saveApps(apps);
  console.log("✏️ تعديل:", apps[idx].name, "→", apps[idx].stage);
  res.json(apps[idx]);
});

// 🗑 حذف طلب
app.delete("/api/applications/:id", (req, res) => {
  const apps = loadApps();
  const id = parseInt(req.params.id);
  const filtered = apps.filter(a => a.id !== id);
  saveApps(filtered);
  console.log("🗑 حذف طلب #" + id);
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log("");
  console.log("═══════════════════════════════════════════");
  console.log("⚙️  غرفة العمليات شغالة!");
  console.log("═══════════════════════════════════════════");
  console.log("");
  console.log("📱 http://localhost:3001/warroom");
  console.log("");
  console.log("⛔ للإيقاف: CTRL+C");
  console.log("═══════════════════════════════════════════");
  console.log("");
});
