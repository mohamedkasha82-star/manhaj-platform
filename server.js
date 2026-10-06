import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const MODEL = "nvidia/nemotron-3-super-120b-a12b";

const MATCHING_PROMPT = `أنت "مستشار المنح الذكي" - خبير عربي في المنح الدراسية العالمية.

مهمتك: تحليل ملف الطالب واقتراح أفضل 3 منح فقط، مع تفسير مختصر وواضح.

قواعد صارمة:
1. اكتب بالعربية الفصحى المبسطة
2. اقترح 3 منح فقط
3. كل منحة: 2 أسباب فقط، كل سبب أقل من 15 كلمة
4. نقطة ضعف واحدة فقط لكل منحة
5. الخطوة التالية: جملة واحدة قصيرة
6. quickWins: 2 عناصر فقط
7. missingInfo: 2 عناصر فقط

أرجع JSON فقط:
{
  "profileStrength": 78,
  "matches": [
    {
      "grantName": "اسم المنحة",
      "country": "البلد",
      "fundingType": "كاملة",
      "matchScore": 85,
      "reasons": ["سبب 1", "سبب 2"],
      "weaknesses": ["نقطة ضعف 1"],
      "nextStep": "خطوة قصيرة"
    }
  ],
  "quickWins": ["إجراء 1", "إجراء 2"],
  "missingInfo": ["معلومة 1", "معلومة 2"]
}`;

const MENTOR_PROMPT = `أنت "المدرب الذكي" - خبير في كتابة مقالات المنح الدراسية (SOP / Motivation Letter).

مهمتك: تقييم مقال الطالب بصراحة ووضوح، وإعطاؤه خطة تحسين عملية.

قواعد صارمة:
1. اكتب بالعربية الفصحى المبسطة
2. كن صريحاً لكن محفزاً (مش تجريح)
3. أعطِ تقييماً من 0-100 بناءً على: القوة، الوضوح، الأصالة، الصلة بالمنحة
4. اقترح 3 تحسينات محددة (مش عامة)
5. حدد جملة واحدة قوية في المقال، وجملة واحدة ضعيفة (بالنص الفعلي)
6. أرجع JSON فقط

الشكل المطلوب:
{
  "score": 72,
  "breakdown": {
    "clarity": 75,
    "authenticity": 68,
    "relevance": 80,
    "impact": 70
  },
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "improvements": ["تحسين 1", "تحسين 2", "تحسين 3"],
  "bestSentence": "النص الفعلي للجملة الأقوى",
  "weakestSentence": "النص الفعلي للجملة الأضعف",
  "rewriteSuggestion": "إعادة صياغة مقترحة للجملة الأضعف",
  "verdict": "تقييم عام في جملة واحدة"
}`;

// 🏠 الصفحة الرئيسية - محرك المطابقة
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>منصة المنح - المحرك الذكي</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Tajawal', -apple-system, sans-serif; background: #0A0E27; color: #fff; min-height: 100vh; padding: 20px;
    background-image: radial-gradient(circle at 20% 50%, rgba(0,212,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212,175,55,0.1) 0%, transparent 50%); }
  .container { max-width: 700px; margin: 0 auto; }
  h1 { font-size: 32px; background: linear-gradient(90deg, #00D4FF, #D4AF37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; text-align: center; }
  .subtitle { text-align: center; color: #8892b0; margin-bottom: 24px; font-size: 14px; }
  .nav { text-align: center; margin-bottom: 24px; }
  .nav a { color: #00D4FF; text-decoration: none; padding: 8px 16px; border: 1px solid rgba(0,212,255,0.3); border-radius: 20px; font-size: 14px; }
  .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; backdrop-filter: blur(20px); margin-bottom: 20px; }
  label { display: block; margin-bottom: 8px; color: #8892b0; font-size: 13px; }
  input, textarea { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px 16px; color: #fff; font-size: 15px; font-family: inherit; margin-bottom: 16px; outline: none; }
  input:focus, textarea:focus { border-color: #00D4FF; }
  button { width: 100%; background: linear-gradient(90deg, #00D4FF, #0099ff); color: #0A0E27; border: none; border-radius: 10px; padding: 14px; font-size: 16px; font-weight: bold; cursor: pointer; font-family: inherit; }
  button:disabled { opacity: 0.5; }
  #result { margin-top: 20px; }
  .match-card { background: rgba(0,212,255,0.05); border: 1px solid rgba(0,212,255,0.2); border-radius: 12px; padding: 18px; margin-bottom: 14px; }
  .match-title { font-size: 18px; font-weight: bold; color: #00D4FF; margin-bottom: 6px; }
  .match-meta { color: #8892b0; font-size: 13px; margin-bottom: 12px; }
  .reason { padding: 6px 0; color: #ccd6f6; font-size: 14px; }
  .weakness { color: #ff6b6b; font-size: 13px; margin-top: 8px; padding: 8px; background: rgba(255,107,107,0.1); border-radius: 6px; }
  .next-step { color: #D4AF37; font-size: 13px; margin-top: 8px; font-weight: bold; }
  .strength { text-align: center; font-size: 48px; font-weight: bold; background: linear-gradient(90deg, #00D4FF, #D4AF37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 10px 0; }
  .spinner { display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(0,212,255,0.2); border-top-color: #00D4FF; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="container">
    <h1>💎 منصة المنح</h1>
    <p class="subtitle">محرك المطابقة الذكي</p>
    <div class="nav"><a href="/mentor">🎓 المدرب الذكي للمقالات ←</a></div>
    <div class="card">
      <label>اسم الطالب</label>
      <input type="text" id="name" placeholder="مثال: أحمد محمود">
      <label>التخصص المطلوب</label>
      <input type="text" id="field" placeholder="مثال: الذكاء الاصطناعي">
      <label>التقدير</label>
      <input type="text" id="gpa" placeholder="مثال: 3.5 من 4.0">
      <label>مستوى اللغة</label>
      <input type="text" id="english" placeholder="مثال: IELTS 7.0">
      <label>البلدان المفضلة (مفصولة بفاصلة)</label>
      <input type="text" id="countries" placeholder="مثال: ألمانيا، كندا، هولندا">
      <label>نبذة عن خبراتك وإنجازاتك</label>
      <textarea id="experience" rows="4" placeholder="مثال: تدريب صيفي في ML، مشروع تخرج CNN، هاكاثون..."></textarea>
      <button id="submitBtn" onclick="findGrants()">✨ ابحث عن منح مطابقة</button>
    </div>
    <div id="result"></div>
  </div>
<script>
async function findGrants() {
  const btn = document.getElementById('submitBtn');
  const result = document.getElementById('result');
  const profile = {
    name: document.getElementById('name').value || "طالب",
    targetField: document.getElementById('field').value,
    gpa: document.getElementById('gpa').value,
    english: document.getElementById('english').value,
    preferredCountries: document.getElementById('countries').value.split(/[،,]/).map(s => s.trim()).filter(Boolean),
    experience: document.getElementById('experience').value,
    targetDegree: "ماجستير"
  };
  btn.disabled = true;
  result.innerHTML = '<div class="card" style="text-align:center;padding:40px;"><div class="spinner"></div><p style="margin-top:20px;color:#00D4FF;">🧠 جاري تحليل ملفك...</p></div>';
  try {
    const res = await fetch('/api/match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    let html = '<div class="card"><p style="text-align:center;color:#8892b0;">قوة ملفك</p><div class="strength">' + (data.profileStrength || '؟') + '/100</div></div>';
    (data.matches || []).forEach((m) => {
      html += '<div class="match-card">';
      html += '<div class="match-title">🎯 ' + (m.grantName || 'منحة') + '</div>';
      html += '<div class="match-meta">🌍 ' + (m.country || '-') + ' | 💰 ' + (m.fundingType || '-') + ' | ⭐ ' + (m.matchScore || '-') + '/100</div>';
      (m.reasons || []).forEach(r => { html += '<div class="reason">✅ ' + r + '</div>'; });
      if (m.weaknesses && m.weaknesses.length) html += '<div class="weakness">⚠️ ' + m.weaknesses.join(' | ') + '</div>';
      if (m.nextStep) html += '<div class="next-step">➡️ ' + m.nextStep + '</div>';
      html += '</div>';
    });
    if (data.quickWins && data.quickWins.length) {
      html += '<div class="card"><h3 style="color:#D4AF37;margin-bottom:12px;">⚡ تحسينات سريعة</h3>';
      data.quickWins.forEach(w => { html += '<div class="reason">• ' + w + '</div>'; });
      html += '</div>';
    }
    result.innerHTML = html;
  } catch (err) {
    result.innerHTML = '<div class="card" style="border-color:#ff6b6b;"><p style="color:#ff6b6b;">❌ خطأ: ' + err.message + '</p></div>';
  } finally { btn.disabled = false; }
}
</script>
</body>
</html>`);
});

// 🎓 صفحة المدرب الذكي
app.get("/mentor", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>المدرب الذكي - منصة المنح</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Tajawal', -apple-system, sans-serif; background: #0A0E27; color: #fff; min-height: 100vh; padding: 20px;
    background-image: radial-gradient(circle at 20% 50%, rgba(0,212,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212,175,55,0.1) 0%, transparent 50%); }
  .container { max-width: 700px; margin: 0 auto; }
  h1 { font-size: 28px; background: linear-gradient(90deg, #00D4FF, #D4AF37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; text-align: center; }
  .subtitle { text-align: center; color: #8892b0; margin-bottom: 24px; font-size: 14px; }
  .nav { text-align: center; margin-bottom: 24px; }
  .nav a { color: #00D4FF; text-decoration: none; padding: 8px 16px; border: 1px solid rgba(0,212,255,0.3); border-radius: 20px; font-size: 14px; }
  .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; backdrop-filter: blur(20px); margin-bottom: 20px; }
  label { display: block; margin-bottom: 8px; color: #8892b0; font-size: 13px; }
  input, textarea { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px 16px; color: #fff; font-size: 15px; font-family: inherit; margin-bottom: 16px; outline: none; }
  input:focus, textarea:focus { border-color: #00D4FF; }
  button { width: 100%; background: linear-gradient(90deg, #00D4FF, #0099ff); color: #0A0E27; border: none; border-radius: 10px; padding: 14px; font-size: 16px; font-weight: bold; cursor: pointer; font-family: inherit; }
  button:disabled { opacity: 0.5; }
  .score-circle { text-align: center; font-size: 72px; font-weight: bold; background: linear-gradient(90deg, #00D4FF, #D4AF37); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 10px 0; }
  .breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }
  .breakdown-item { background: rgba(0,212,255,0.08); padding: 10px; border-radius: 8px; text-align: center; }
  .breakdown-item .label { font-size: 12px; color: #8892b0; }
  .breakdown-item .value { font-size: 20px; font-weight: bold; color: #00D4FF; }
  .improvement { padding: 8px 0; color: #ccd6f6; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .sentence-box { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; margin: 8px 0; font-size: 14px; border-right: 3px solid #D4AF37; }
  .sentence-box.weak { border-right-color: #ff6b6b; }
  .spinner { display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(0,212,255,0.2); border-top-color: #00D4FF; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="container">
    <h1>🎓 المدرب الذكي</h1>
    <p class="subtitle">تقييم مقالات المنح وتحسينات محددة</p>
    <div class="nav"><a href="/">← العودة لمحرك المطابقة</a></div>
    <div class="card">
      <label>المنحة المستهدفة (اختياري)</label>
      <input type="text" id="grant" placeholder="مثال: DAAD">
      <label>التخصص (اختياري)</label>
      <input type="text" id="field" placeholder="مثال: الذكاء الاصطناعي">
      <label>الصق مقالك هنا (SOP / Motivation Letter)</label>
      <textarea id="essay" rows="10" placeholder="اكتب أو الصق مقالك هنا..."></textarea>
      <button id="submitBtn" onclick="reviewEssay()">🎯 قيّم مقالي</button>
    </div>
    <div id="result"></div>
  </div>
<script>
async function reviewEssay() {
  const btn = document.getElementById('submitBtn');
  const result = document.getElementById('result');
  const essay = document.getElementById('essay').value;
  if (essay.length < 100) { alert('المقال قصير جداً، اكتب 100 حرف على الأقل'); return; }
  btn.disabled = true;
  result.innerHTML = '<div class="card" style="text-align:center;padding:40px;"><div class="spinner"></div><p style="margin-top:20px;color:#00D4FF;">🧠 المدرب بيراجع مقالك...</p></div>';
  try {
    const res = await fetch('/api/mentor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ essay, targetGrant: document.getElementById('grant').value, targetField: document.getElementById('field').value }) });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    let html = '<div class="card"><p style="text-align:center;color:#8892b0;">درجة مقالك</p><div class="score-circle">' + data.score + '/100</div>';
    if (data.breakdown) {
      html += '<div class="breakdown">';
      html += '<div class="breakdown-item"><div class="label">الوضوح</div><div class="value">' + (data.breakdown.clarity||'-') + '</div></div>';
      html += '<div class="breakdown-item"><div class="label">الأصالة</div><div class="value">' + (data.breakdown.authenticity||'-') + '</div></div>';
      html += '<div class="breakdown-item"><div class="label">الصلة</div><div class="value">' + (data.breakdown.relevance||'-') + '</div></div>';
      html += '<div class="breakdown-item"><div class="label">التأثير</div><div class="value">' + (data.breakdown.impact||'-') + '</div></div>';
      html += '</div></div>';
    }
    if (data.strengths && data.strengths.length) {
      html += '<div class="card"><h3 style="color:#4ade80;margin-bottom:12px;">✅ نقاط القوة</h3>';
      data.strengths.forEach(s => { html += '<div class="improvement">• ' + s + '</div>'; });
      html += '</div>';
    }
    if (data.improvements && data.improvements.length) {
      html += '<div class="card"><h3 style="color:#D4AF37;margin-bottom:12px;">⚡ التحسينات المقترحة</h3>';
      data.improvements.forEach(s => { html += '<div class="improvement">• ' + s + '</div>'; });
      html += '</div>';
    }
    if (data.bestSentence || data.weakestSentence) {
      html += '<div class="card"><h3 style="color:#00D4FF;margin-bottom:12px;">🔍 تحليل الجمل</h3>';
      if (data.bestSentence) html += '<p style="font-size:12px;color:#4ade80;margin-bottom:4px;">أقوى جملة:</p><div class="sentence-box">' + data.bestSentence + '</div>';
      if (data.weakestSentence) html += '<p style="font-size:12px;color:#ff6b6b;margin:12px 0 4px;">أضعف جملة:</p><div class="sentence-box weak">' + data.weakestSentence + '</div>';
      if (data.rewriteSuggestion) html += '<p style="font-size:12px;color:#D4AF37;margin:12px 0 4px;">اقتراح لإعادة الصياغة:</p><div class="sentence-box">' + data.rewriteSuggestion + '</div>';
      html += '</div>';
    }
    if (data.verdict) {
      html += '<div class="card" style="border-color:rgba(0,212,255,0.3);"><h3 style="color:#00D4FF;margin-bottom:8px;">📌 التقييم العام</h3><p style="color:#ccd6f6;line-height:1.7;">' + data.verdict + '</p></div>';
    }
    result.innerHTML = html;
  } catch (err) {
    result.innerHTML = '<div class="card" style="border-color:#ff6b6b;"><p style="color:#ff6b6b;">❌ خطأ: ' + err.message + '</p></div>';
  } finally { btn.disabled = false; }
}
</script>
</body>
</html>`);
});

// 🔌 API المطابقة
app.post("/api/match", async (req, res) => {
  try {
    const profile = req.body;
    console.log("📥 طلب مطابقة:", profile.name || "طالب");
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: MATCHING_PROMPT },
        { role: "user", content: `حلل ملف الطالب:\n\n${JSON.stringify(profile, null, 2)}` }
      ],
      temperature: 0.3,
      max_tokens: 6000,
      response_format: { type: "json_object" },
    });
    const result = JSON.parse(response.choices[0].message.content);
    console.log("✅ مطابقة نجحت");
    res.json(result);
  } catch (err) {
    console.error("❌ خطأ:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔌 API المدرب
app.post("/api/mentor", async (req, res) => {
  try {
    const { essay, targetGrant, targetField } = req.body;
    console.log("📝 طلب تقييم مقال، طول المقال:", essay.length);
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: MENTOR_PROMPT },
        { role: "user", content: `المنحة: ${targetGrant || "غير محددة"}\nالتخصص: ${targetField || "غير محدد"}\n\nالمقال:\n\n${essay}` }
      ],
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });
    const result = JSON.parse(response.choices[0].message.content);
    console.log("✅ تقييم مقال نجح، الدرجة:", result.score);
    res.json(result);
  } catch (err) {
    console.error("❌ خطأ:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("");
  console.log("═══════════════════════════════════════════");
  console.log("🚀 منصة المنح شغالة!");
  console.log("═══════════════════════════════════════════");
  console.log("");
  console.log("🏠 المطابقة:  http://localhost:3000");
  console.log("🎓 المدرب:    http://localhost:3000/mentor");
  console.log("");
  console.log("⛔ للإيقاف: CTRL+C");
  console.log("═══════════════════════════════════════════");
  console.log("");
});
