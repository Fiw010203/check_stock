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

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("เบราว์เซอร์นี้ไม่รองรับ Web Speech API (แนะนำ Chrome)");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "th-TH";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setStatus("🎧 กำลังฟัง... พูดคำถามได้เลย");
    };

    rec.onend = () => {
      setIsListening(false);
      setStatus("⏹️ หยุดฟังแล้ว");
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      setStatus("❌ เกิดข้อผิดพลาด");
      setResult({ error: e?.error || "speech error" });
    };

    rec.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setStatus("🤖 กำลังประมวลผล...");
      setResult({ transcript });

      const resp = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      const data: ApiResult = await resp.json();
      setResult(data);
      setStatus(data.error ? "❌ มีปัญหา" : "✅ เสร็จสิ้น");
    };

    recognitionRef.current = rec;
  }, []);

  function start() {
    setResult({});
    recognitionRef.current?.start();
  }

  function stop() {
    recognitionRef.current?.stop();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight">
            🖥️ IT Shop Voice Assistant
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            พูดถามสินค้าที่ต้องการ เช่น “เมาส์ แรม จอ”
          </p>
        </header>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {!isListening ? (
            <button
              onClick={start}
              className="px-6 py-3 rounded-full bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition"
            >
              🎙️ เริ่มพูด
            </button>
          ) : (
            <button
              onClick={stop}
              className="px-6 py-3 rounded-full bg-red-600 text-white font-medium shadow hover:bg-red-700 transition animate-pulse"
            >
              ⏹️ หยุดฟัง
            </button>
          )}

          <span className="px-4 py-2 rounded-full bg-white shadow text-sm">
            {status}
          </span>
        </div>

        {/* Transcript */}
        <section className="mb-4 bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2">🗣️ ข้อความที่พูด</h2>
          <p className="text-sm text-slate-700">
            {result.transcript || "—"}
          </p>
        </section>

        {/* Answer */}
        <section className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-2">🤖 คำตอบจากระบบ</h2>
          <p className="text-sm whitespace-pre-line text-slate-800">
            {result.answer || "—"}
          </p>

          {result.error && (
            <p className="text-sm text-red-600 mt-2">{result.error}</p>
          )}

          {/* Product Cards */}
          {result.matches && result.matches.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {result.matches.map((p, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-3 hover:shadow transition"
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-slate-600">
                    ราคา {p.price} บาท
                  </div>
                  <div className="text-xs text-slate-500">
                    คงเหลือ {p.stock}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
