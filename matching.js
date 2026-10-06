import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

const MODEL = "nvidia/nemotron-3-super-120b-a12b";

const studentProfile = {
  name: "أحمد محمود",
  age: 23,
  country: "مصر",
  education: "بكالوريوس هندسة حاسبات - جامعة القاهرة",
  gpa: "3.5 من 4.0",
  graduationYear: 2025,
  targetDegree: "ماجستير",
  targetField: "الذكاء الاصطناعي",
  languages: [
    { lang: "العربية", level: "اللغة الأم" },
    { lang: "الإنجليزية", level: "IELTS 7.0" }
  ],
  experience: [
    "تدريب صيفي في شركة ناشئة في مجال ML (3 شهور)",
    "مشروع تخرج في تصنيف صور طبية بالـ CNN",
    "متطوع في نادي البرمجة بالجامعة"
  ],
  achievements: [
    "المركز الثاني في هاكاثون الجامعة 2024",
    "شهادة Deep Learning Specialization من Coursera"
  ],
  budget: "يحتاج منحة كاملة (Full Funded)",
  preferredCountries: ["ألمانيا", "كندا", "هولندا"]
};

const SYSTEM_PROMPT = `أنت "مستشار المنح الذكي" - خبير عربي في المنح الدراسية العالمية.

مهمتك: تحليل ملف الطالب واقتراح أفضل 3 منح فقط، مع تفسير مختصر وواضح.

قواعد صارمة (مهم جداً للاختصار):
1. اكتب بالعربية الفصحى المبسطة
2. اقترح 3 منح فقط (مش أكتر)
3. كل منحة: 2 أسباب فقط (مش 3)، وكل سبب أقل من 15 كلمة
4. نقطة ضعف واحدة فقط لكل منحة
5. الخطوة التالية: جملة واحدة قصيرة
6. quickWins: 2 عناصر فقط
7. missingInfo: 2 عناصر فقط

أرجع JSON فقط (بدون أي نص إضافي)، كل الحقول إلزامية:
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

function safeArray(val) {
  return Array.isArray(val) ? val : [];
}

async function findMatchingGrants(profile) {
  console.log("🧠 جاري تحليل ملف الطالب...\n");
  console.log("👤 الطالب:", profile.name);
  console.log("🎓 التخصص:", profile.targetField);
  console.log("🌍 البلدان المفضلة:", safeArray(profile.preferredCountries).join("، "));
  console.log("\n⏳ بنحلل...\n");

  const startTime = Date.now();

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `حلل ملف الطالب ده:\n\n${JSON.stringify(profile, null, 2)}` }
    ],
    temperature: 0.3,
    max_tokens: 6000,
    response_format: { type: "json_object" },
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const rawContent = response.choices[0].message.content;

  let result;
  try {
    result = JSON.parse(rawContent);
  } catch (parseErr) {
    console.error("⚠️ فشل تحليل JSON، بنحاول نصلحه...");
    // محاولة استخراج JSON صالح
    const cleaned = rawContent
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");
    try {
      result = JSON.parse(cleaned);
    } catch (e2) {
      console.error("❌ الرد الخام:");
      console.error(rawContent);
      throw new Error("الرد مش JSON صالح، شوف الرد الخام فوق");
    }
  }

  console.log("✅ التحليل خلص في", elapsed, "ثانية\n");
  console.log("═".repeat(50));
  console.log("📊 قوة الملف:", (result.profileStrength ?? "N/A") + "/100");
  console.log("═".repeat(50));

  const matches = safeArray(result.matches);
  matches.forEach((m, i) => {
    console.log(`\n🎯 المنحة #${i + 1}: ${m.grantName ?? "غير محددة"}`);
    console.log(`   🌍 ${m.country ?? "-"} | 💰 ${m.fundingType ?? "-"} | ⭐ ${m.matchScore ?? "-"}/100`);
    console.log(`   ✅ الأسباب:`);
    safeArray(m.reasons).forEach(r => console.log(`      • ${r}`));
    console.log(`   ⚠️  نقاط ضعف: ${safeArray(m.weaknesses).join(" | ") || "لا توجد"}`);
    console.log(`   ➡️  الخطوة التالية: ${m.nextStep ?? "-"}`);
  });

  const quickWins = safeArray(result.quickWins);
  if (quickWins.length) {
    console.log("\n" + "═".repeat(50));
    console.log("⚡ تحسينات سريعة:");
    quickWins.forEach(w => console.log(`   • ${w}`));
  }

  const missingInfo = safeArray(result.missingInfo);
  if (missingInfo.length) {
    console.log("\n❓ معلومات ناقصة:");
    missingInfo.forEach(m => console.log(`   • ${m}`));
  }

  console.log("\n📊 التوكنز المستخدمة:", response.usage?.total_tokens ?? "N/A");
}

findMatchingGrants(studentProfile).catch(err => {
  console.error("❌ خطأ:", err.message);
});
