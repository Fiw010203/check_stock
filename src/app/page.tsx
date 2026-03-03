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

  // 🎧 Speech Setup
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

      if (data.answer) {
        typeEffect(data.answer);
      }
    };

    recognitionRef.current = rec;
  }, []);

  // ✨ Typing Effect
  function typeEffect(text: string) {
    setTypedAnswer("");
    let i = 0;
    const interval = setInterval(() => {
      setTypedAnswer((prev) => prev + text[i]);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 25);
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
    <main className="min-h-screen bg-black text-white overflow-hidden relative">

      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900 animate-pulse opacity-40"></div>

      <div className="relative z-10 p-6 max-w-4xl mx-auto">

        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent animate-pulse">
            🚀 Check stock AI Voice
          </h1>
          <p className="text-gray-400 mt-3">
            พูดว่า “สินค้าใกล้หมด” หรือ "สต็อกสินค้า" เพื่อเช็คสต็อกและรับคำแนะนำจาก AI
          </p>
        </header>

        {/* Voice Button */}
        <div className="flex justify-center mb-10">
          {!isListening ? (
            <button
              onClick={start}
              className="relative px-10 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 font-bold text-lg shadow-2xl hover:scale-110 transition transform"
            >
              🎤 เริ่มพูด
              <span className="absolute inset-0 rounded-full bg-white opacity-20 blur-xl animate-ping"></span>
            </button>
          ) : (
            <button
              onClick={stop}
              className="px-10 py-4 rounded-full bg-red-600 font-bold text-lg shadow-2xl animate-pulse hover:scale-110 transition"
            >
              🔴 กำลังฟัง...
            </button>
          )}
        </div>

        {/* Status */}
        <div className="text-center mb-6 text-sm text-cyan-300 animate-bounce">
          {status}
        </div>

        {/* Transcript */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 shadow-lg mb-6 border border-white/20">
          <h2 className="font-semibold mb-2 text-cyan-400">
            🗣️ คุณพูดว่า
          </h2>
          <p className="text-gray-200">
            {result.transcript || "—"}
          </p>
        </div>

        {/* Answer */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white/20">
          <h2 className="font-semibold mb-2 text-purple-400">
            🤖 คำตอบจาก AI
          </h2>

          <p className="whitespace-pre-line text-gray-100 min-h-[50px]">
            {typedAnswer || "—"}
          </p>

          {result.error && (
            <p className="text-red-400 mt-3">{result.error}</p>
          )}

          {/* Product Cards */}
          {result.matches && result.matches.length > 0 && (
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {result.matches.map((p, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-purple-500/30 hover:scale-105 hover:shadow-purple-500/40 hover:shadow-lg transition transform"
                >
                  <div className="font-bold text-lg text-cyan-300">
                    {p.name}
                  </div>

                  <div className="text-sm mt-1">
                    💰 {p.price} บาท
                  </div>

                  <div
                    className={`text-xs mt-1 ${
                      p.stock <= 5
                        ? "text-red-400 animate-pulse"
                        : "text-green-400"
                    }`}
                  >
                    📦 คงเหลือ {p.stock}
                  </div>

                  {p.stock <= 5 && (
                    <div className="mt-2 text-xs bg-red-600 px-2 py-1 rounded-full inline-block animate-bounce">
                      ⚠ ใกล้หมด
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
