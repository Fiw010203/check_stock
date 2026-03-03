"use client";

import { useEffect, useRef, useState } from "react";

type ApiResult = {
  transcript?: string;
  answer?: string;
  matches?: Array<any>;
  error?: string;
};

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("พร้อมพูด");
  const [result, setResult] = useState<ApiResult>({});
  const [typedAnswer, setTypedAnswer] = useState("");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("เบราว์เซอร์ไม่รองรับ (ใช้ Chrome)");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "th-TH";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setStatus("🎧 กำลังฟัง...");
    };

    rec.onend = () => {
      setIsListening(false);
      setStatus("⏹️ หยุดฟัง");
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      setStatus("❌ Error");
      setResult({ error: e?.error || "speech error" });
    };

    rec.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setStatus("🤖 AI กำลังคิด...");
      setResult({ transcript });

      const resp = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      const data: ApiResult = await resp.json();
      setResult(data);
      setStatus("✅ เสร็จสิ้น");

      if (data.answer) typeEffect(data.answer);
    };

    recognitionRef.current = rec;
  }, []);

  function typeEffect(text: string) {
    setTypedAnswer("");
    let i = 0;
    const interval = setInterval(() => {
      setTypedAnswer((prev) => prev + text[i]);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 20);
  }

  function start() {
    setResult({});
    setTypedAnswer("");
    recognitionRef.current?.start();
  }

  function stop() {
    recognitionRef.current?.stop();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Check Stock AI Voice
          </h1>
          <p className="text-slate-400 mt-3">
            ระบบเช็คสต็อกด้วยเสียง พร้อมคำแนะนำอัจฉริยะ
          </p>
        </header>

        {/* Voice Button */}
        <div className="flex justify-center mb-10">
          {!isListening ? (
            <button
              onClick={start}
              className="px-10 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 font-semibold text-lg shadow-lg hover:scale-105 transition"
            >
              🎤 เริ่มพูด
            </button>
          ) : (
            <button
              onClick={stop}
              className="px-10 py-4 rounded-full bg-red-600 font-semibold text-lg shadow-lg hover:scale-105 transition"
            >
              🔴 กำลังฟัง...
            </button>
          )}
        </div>

        <div className="text-center mb-8 text-sm text-slate-400">
          {status}
        </div>

        {/* Layout */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* LEFT - User */}
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <h2 className="font-semibold mb-4 text-blue-400 text-lg">
              🗣️ คุณพูดว่า
            </h2>
            <p className="text-slate-200 min-h-[80px]">
              {result.transcript || "—"}
            </p>
          </div>

          {/* RIGHT - AI */}
          <div className="bg-purple-500/10 border border-purple-400/30 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <h2 className="font-semibold mb-4 text-purple-400 text-lg">
              🤖 คำตอบจาก AI
            </h2>

            <p className="whitespace-pre-line text-slate-100 min-h-[80px]">
              {typedAnswer || "—"}
            </p>

            {result.error && (
              <p className="text-red-400 mt-3">{result.error}</p>
            )}

            {/* Products */}
            {result.matches && result.matches.length > 0 && (
              <div className="mt-6 grid gap-4">
                {result.matches.map((p, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-slate-700 rounded-xl p-4 hover:border-purple-500 transition"
                  >
                    <div className="font-bold text-lg text-white">
                      {p.name}
                    </div>

                    <div className="text-sm mt-1 text-slate-400">
                      💰 {p.price} บาท
                    </div>

                    <div
                      className={`text-sm mt-1 font-medium ${
                        p.stock <= 5
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      📦 คงเหลือ {p.stock}
                    </div>

                    {p.stock <= 5 && (
                      <div className="mt-2 text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded-md inline-block">
                        ⚠ ใกล้หมด
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}