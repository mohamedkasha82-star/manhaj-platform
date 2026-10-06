import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

async function test() {
  console.log("⏳ جاري اختبار الاتصال بـ NVIDIA...\n");

  try {
    const response = await client.chat.completions.create({
      model: "nvidia/nemotron-3-super-120b-a12b",
      messages: [
        { role: "system", content: "أنت مساعد عربي محترف. جاوب باختصار." },
        { role: "user", content: "اكتب لي جملة واحدة تحمس طالب يقدم على منحة." }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    console.log("✅ نجح الاتصال!");
    console.log("📝 الرد:", response.choices[0].message.content);
    console.log("📊 عدد التوكنز:", response.usage.total_tokens);
  } catch (err) {
    console.error("❌ خطأ:", err.message);
  }
}

test();
