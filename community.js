import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(process.cwd(), "community.json");

function loadPosts() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return []; }
}

function savePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

app.get("/community", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>المجتمع - منصة المنح</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Tajawal', -apple-system, sans-serif; background: #0A0E27; color: #fff; min-height: 100vh; padding: 16px;
    background-image: radial-gradient(circle at 20% 30%, rgba(0,212,255,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(212,175,55,0.08) 0%, transparent 50%); }
  .container { max-width: 720px; margin: 0 auto; }
  h1 { font-size: 26px; background: linear-gradient(90deg, #00D4FF, #D4AF37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 6px; }
  .subtitle { text-align: center; color: #8892b0; font-size: 13px; margin-bottom: 18px; }
  .nav { display: flex; justify-content: center; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .nav a { color: #00D4FF; text-decoration: none; padding: 6px 14px; border: 1px solid rgba(0,212,255,0.3); border-radius: 20px; font-size: 12px; }
  .tabs { display: flex; gap: 6px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 4px; }
  .tab { flex-shrink: 0; padding: 8px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; color: #8892b0; cursor: pointer; font-family: inherit; font-size: 13px; }
  .tab.active { background: rgba(0,212,255,0.15); border-color: #00D4FF; color: #00D4FF; }
  .add-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; margin-bottom: 18px; }
  .add-card input, .add-card textarea, .add-card select { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; color: #fff; font-family: inherit; margin-bottom: 10px; outline: none; font-size: 14px; }
  .add-card select option { background: #0A0E27; }
  .add-card input:focus, .add-card textarea:focus { border-color: #00D4FF; }
  .add-card button { width: 100%; background: linear-gradient(90deg, #00D4FF, #0099ff); color: #0A0E27; border: none; border-radius: 10px; padding: 12px; font-weight: bold; cursor: pointer; font-family: inherit; }
  .post { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; margin-bottom: 12px; }
  .post:hover { border-color: rgba(0,212,255,0.3); }
  .post-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; gap: 8px; }
  .post-title { font-size: 16px; font-weight: bold; color: #fff; }
  .post-badge { font-size: 11px; padding: 3px 10px; border-radius: 12px; white-space: nowrap; }
  .badge-success { background: rgba(74,222,128,0.15); color: #4ade80; }
  .badge-question { background: rgba(0,212,255,0.15); color: #00D4FF; }
  .badge-tip { background: rgba(212,175,55,0.15); color: #D4AF37; }
  .post-body { color: #ccd6f6; font-size: 14px; line-height: 1.7; margin-bottom: 10px; white-space: pre-wrap; }
  .post-meta { color: #8892b0; font-size: 12px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
  .post-actions { display: flex; gap: 8px; margin-top: 10px; }
  .post-actions button { padding: 6px 12px; border-radius: 8px; border: none; cursor: pointer; font-family: inherit; font-size: 12px; }
  .btn-like { background: rgba(0,212,255,0.15); color: #00D4FF; }
  .btn-like.liked { background: #00D4FF; color: #0A0E27; }
  .btn-reply { background: rgba(212,175,55,0.15); color: #D4AF37; }
  .btn-delete { background: rgba(255,107,107,0.15); color: #ff6b6b; }
  .replies { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
  .reply { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; margin-bottom: 8px; font-size: 13px; }
  .reply-author { color: #00D4FF; font-weight: bold; font-size: 12px; margin-bottom: 4px; }
  .reply-body { color: #ccd6f6; line-height: 1.6; }
  .reply-form { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
  .reply-form input { flex: 1; min-width: 120px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 12px; color: #fff; font-family: inherit; font-size: 13px; outline: none; }
  .reply-form button { background: #00D4FF; color: #0A0E27; border: none; border-radius: 8px; padding: 8px 14px; font-weight: bold; cursor: pointer; font-family: inherit; font-size: 12px; }
  .empty { text-align: center; color: #8892b0; padding: 40px; font-size: 14px; }
</style>
</head>
<body>
  <div class="container">
    <h1>🌍 المجتمع</h1>
    <p class="subtitle">قصص نجاح، أسئلة، ونصايح — من الطلبة للطلبة</p>
    <div class="nav">
      <a href="/">🏠 المطابقة</a>
      <a href="/mentor">🎓 المدرب</a>
      <a href="/warroom">⚙️ العمليات</a>
    </div>

    <div class="tabs" id="tabs"></div>

    <div class="add-card">
      <input type="text" id="author" placeholder="اسمك...">
      <input type="text" id="title" placeholder="عنوان البوست...">
      <select id="category">
        <option value="question">❓ سؤال</option>
        <option value="success">📖 قصة نجاح</option>
        <option value="tip">💡 نصيحة</option>
      </select>
      <textarea id="body" rows="4" placeholder="اكتب التفاصيل هنا..."></textarea>
      <button onclick="addPost()">🚀 انشر</button>
    </div>

    <div id="feed"></div>
  </div>

<script>
var currentFilter = 'all';
var likedIds = JSON.parse(localStorage.getItem('likedPosts') || '[]');

var CATEGORIES = {
  all: { label: '🌟 الكل', badge: '', text: '' },
  success: { label: '📖 قصص نجاح', badge: 'badge-success', text: 'قصة نجاح' },
  question: { label: '❓ أسئلة', badge: 'badge-question', text: 'سؤال' },
  tip: { label: '💡 نصايح', badge: 'badge-tip', text: 'نصيحة' }
};

function renderTabs() {
  var tabs = document.getElementById('tabs');
  tabs.innerHTML = '';
  Object.keys(CATEGORIES).forEach(function(key) {
    var cat = CATEGORIES[key];
    var btn = document.createElement('button');
    btn.className = 'tab' + (currentFilter === key ? ' active' : '');
    btn.textContent = cat.label;
    btn.onclick = function() { currentFilter = key; renderTabs(); loadPosts(); };
    tabs.appendChild(btn);
  });
}

function escapeHtml(s) {
  return String(s || '').replace(/[<>&"']/g, function(c) {
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c];
  });
}

async function loadPosts() {
  var res = await fetch('/api/posts');
  var posts = await res.json();
  var filtered = currentFilter === 'all' ? posts : posts.filter(function(p) { return p.category === currentFilter; });

  var feed = document.getElementById('feed');
  if (filtered.length === 0) {
    feed.innerHTML = '<div class="empty">لا يوجد بوستات هنا بعد. كن أول من ينشر! 🌟</div>';
    return;
  }

  feed.innerHTML = '';
  filtered.sort(function(a,b) { return new Date(b.createdAt) - new Date(a.createdAt); }).forEach(function(p) {
    var cat = CATEGORIES[p.category] || CATEGORIES.question;
    var liked = likedIds.indexOf(p.id) !== -1;

    var html = '';
    html += '<div class="post">';
    html += '<div class="post-header">';
    html += '<div class="post-title">' + escapeHtml(p.title) + '</div>';
    html += '<div class="post-badge ' + cat.badge + '">' + cat.text + '</div>';
    html += '</div>';
    html += '<div class="post-body">' + escapeHtml(p.body) + '</div>';
    html += '<div class="post-meta">';
    html += '<span>👤 ' + escapeHtml(p.author) + '</span>';
    html += '<span>🕐 ' + new Date(p.createdAt).toLocaleDateString('ar-EG') + '</span>';
    html += '</div>';
    html += '<div class="post-actions">';
    html += '<button class="btn-like ' + (liked ? 'liked' : '') + '" onclick="likePost(' + p.id + ')">👍 ' + (p.likes || 0) + '</button>';
    html += '<button class="btn-reply" onclick="toggleReply(' + p.id + ')">💬 رد (' + ((p.replies || []).length) + ')</button>';
    html += '<button class="btn-delete" onclick="delPost(' + p.id + ')">🗑</button>';
    html += '</div>';

    var repliesHtml = '';
    (p.replies || []).forEach(function(r) {
      repliesHtml += '<div class="reply"><div class="reply-author">' + escapeHtml(r.author) + '</div><div class="reply-body">' + escapeHtml(r.body) + '</div></div>';
    });
    repliesHtml += '<div class="reply-form">';
    repliesHtml += '<input type="text" id="reply-name-' + p.id + '" placeholder="اسمك...">';
    repliesHtml += '<input type="text" id="reply-body-' + p.id + '" placeholder="ردك...">';
    repliesHtml += '<button onclick="addReply(' + p.id + ')">إرسال</button>';
    repliesHtml += '</div>';

    html += '<div class="replies" id="replies-' + p.id + '" style="display:none;">' + repliesHtml + '</div>';
    html += '</div>';

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    feed.appendChild(wrapper.firstChild);
  });
}

async function addPost() {
  var author = document.getElementById('author').value.trim() || 'مجهول';
  var title = document.getElementById('title').value.trim();
  var body = document.getElementById('body').value.trim();
  var category = document.getElementById('category').value;
  if (!title || !body) { alert('اكتب عنوان ونص البوست'); return; }
  await fetch('/api/posts', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ author: author, title: title, body: body, category: category }) });
  document.getElementById('title').value = '';
  document.getElementById('body').value = '';
  loadPosts();
}

function toggleReply(id) {
  var el = document.getElementById('replies-' + id);
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function addReply(id) {
  var author = document.getElementById('reply-name-' + id).value.trim() || 'مجهول';
  var body = document.getElementById('reply-body-' + id).value.trim();
  if (!body) return;
  await fetch('/api/posts/' + id + '/reply', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ author: author, body: body }) });
  loadPosts();
}

async function likePost(id) {
  if (likedIds.indexOf(id) !== -1) { alert('إنت عملت إعجاب بالفعل'); return; }
  await fetch('/api/posts/' + id + '/like', { method: 'POST' });
  likedIds.push(id);
  localStorage.setItem('likedPosts', JSON.stringify(likedIds));
  loadPosts();
}

async function delPost(id) {
  if (!confirm('متأكد من حذف البوست؟')) return;
  await fetch('/api/posts/' + id, { method: 'DELETE' });
  loadPosts();
}

renderTabs();
loadPosts();
</script>
</body>
</html>`);
});

app.get("/api/posts", (req, res) => res.json(loadPosts()));

app.post("/api/posts", (req, res) => {
  const posts = loadPosts();
  const newPost = {
    id: Date.now(),
    author: req.body.author || 'مجهول',
    title: req.body.title,
    body: req.body.body,
    category: req.body.category || 'question',
    likes: 0,
    replies: [],
    createdAt: new Date().toISOString()
  };
  posts.push(newPost);
  savePosts(posts);
  console.log("📝 بوست جديد:", newPost.title);
  res.json(newPost);
});

app.post("/api/posts/:id/like", (req, res) => {
  const posts = loadPosts();
  const id = parseInt(req.params.id);
  const p = posts.find(x => x.id === id);
  if (!p) return res.status(404).json({ error: "not found" });
  p.likes = (p.likes || 0) + 1;
  savePosts(posts);
  res.json({ likes: p.likes });
});

app.post("/api/posts/:id/reply", (req, res) => {
  const posts = loadPosts();
  const id = parseInt(req.params.id);
  const p = posts.find(x => x.id === id);
  if (!p) return res.status(404).json({ error: "not found" });
  p.replies = p.replies || [];
  p.replies.push({ author: req.body.author || 'مجهول', body: req.body.body, createdAt: new Date().toISOString() });
  savePosts(posts);
  console.log("💬 رد جديد على:", p.title);
  res.json(p);
});

app.delete("/api/posts/:id", (req, res) => {
  const posts = loadPosts();
  const id = parseInt(req.params.id);
  savePosts(posts.filter(p => p.id !== id));
  console.log("🗑 حذف بوست #" + id);
  res.json({ success: true });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log("");
  console.log("═══════════════════════════════════════════");
  console.log("🌍 المجتمع شغال!");
  console.log("═══════════════════════════════════════════");
  console.log("");
  console.log("📱 http://localhost:3002/community");
  console.log("");
  console.log("⛔ للإيقاف: CTRL+C");
  console.log("═══════════════════════════════════════════");
  console.log("");
});
