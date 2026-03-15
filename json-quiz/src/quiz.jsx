import { useState, useRef } from "react";

const LABELS = ["a", "b", "c", "d"];

function validateQuiz(data) {
  if (!data?.quiz) return 'Missing top-level "quiz" key.';
  const { title, questions } = data.quiz;
  if (!title) return 'Missing "title" field.';
  if (!Array.isArray(questions) || questions.length === 0) return '"questions" must be a non-empty array.';
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.question) return `Question ${i + 1}: missing "question" text.`;
    if (!q.answers || typeof q.answers !== "object") return `Question ${i + 1}: missing "answers" object.`;
    for (const k of LABELS) {
      if (!q.answers[k]) return `Question ${i + 1}: missing answer "${k}".`;
    }
    if (!LABELS.includes(q.correct_answer)) return `Question ${i + 1}: "correct_answer" must be a, b, c, or d.`;
  }
  return null;
}

export default function Quiz() {
  const [quizData, setQuizData] = useState(null);
  const [screen, setScreen] = useState("upload");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  function loadFile(file) {
    if (!file) return;
    if (!file.name.endsWith(".json")) { setError("Please upload a .json file."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const err = validateQuiz(parsed);
        if (err) { setError(err); return; }
        parsed.quiz.questions = parsed.quiz.questions.map((q, i) => ({ ...q, id: q.id ?? i + 1 }));
        setQuizData(parsed);
        setError(null);
        setScreen("start");
      } catch {
        setError("Invalid JSON — could not parse the file.");
      }
    };
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    loadFile(e.dataTransfer.files[0]);
  }

  const questions = quizData?.quiz?.questions ?? [];
  const total = questions.length;
  const q = questions[current];
  const progress = (current / total) * 100;

  const score = Object.entries(answers).filter(([id, ans]) => {
    const found = questions.find(q => String(q.id) === id);
    return found && ans === found.correct_answer;
  }).length;

  function handleSelect(key) { if (!revealed) setSelected(key); }

  function handleConfirm() {
    if (!selected) return;
    setAnswers(prev => ({ ...prev, [String(q.id)]: selected }));
    setRevealed(true);
  }

  function handleNext() {
    if (current + 1 < total) { setCurrent(c => c + 1); setSelected(null); setRevealed(false); }
    else setScreen("results");
  }

  function handleRestart() {
    setCurrent(0); setSelected(null); setAnswers({}); setRevealed(false); setScreen("start");
  }

  function handleNewQuiz() {
    setQuizData(null); setCurrent(0); setSelected(null);
    setAnswers({}); setRevealed(false); setError(null); setScreen("upload");
  }

  const incorrect = questions.filter(q => answers[String(q.id)] && answers[String(q.id)] !== q.correct_answer);
  const grade = score === total ? "Perfect!" : score >= total * 0.8 ? "Excellent!" : score >= total * 0.6 ? "Good Job!" : score >= total * 0.4 ? "Keep Practicing!" : "Better Luck Next Time!";
  const gradeColor = score === total ? "#00e5a0" : score >= total * 0.6 ? "#f0c040" : "#ff6b6b";

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: "24px", position: "relative", overflow: "hidden"
    }}>
      <div style={{
        position: "fixed", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
        backgroundSize: "40px 40px", pointerEvents: "none"
      }} />
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(100,60,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      <div style={{ width: "100%", maxWidth: 640, position: "relative", zIndex: 1 }}>

        {/* ── UPLOAD ── */}
        {screen === "upload" && (
          <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
            <h1 style={{ color: "#fff", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 700, letterSpacing: "-1px", margin: "0 0 10px" }}>
              Quiz Loader
            </h1>
            <p style={{ color: "#555", fontSize: 15, marginBottom: 36, fontStyle: "italic" }}>
              Upload a JSON file to start your quiz
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
              style={{
                border: `2px dashed ${dragOver ? "#6c3fff" : "#2a2a40"}`,
                borderRadius: 18, padding: "52px 32px",
                background: dragOver ? "rgba(108,63,255,0.07)" : "#0e0e18",
                cursor: "pointer", transition: "all 0.25s ease", marginBottom: 16
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 14 }}>{dragOver ? "⬇️" : "📂"}</div>
              <p style={{ color: dragOver ? "#a07fff" : "#555", fontSize: 15, margin: 0, transition: "color 0.2s" }}>
                {dragOver ? "Drop to load quiz" : "Drag & drop your JSON file here"}
              </p>
              <p style={{ color: "#2e2e48", fontSize: 13, margin: "10px 0 0" }}>or click to browse</p>
            </div>

            <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }}
              onChange={(e) => loadFile(e.target.files[0])} />

            {error && (
              <div style={{
                background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.3)",
                borderRadius: 10, padding: "12px 16px", marginBottom: 20, animation: "fadeUp 0.3s ease"
              }}>
                <p style={{ color: "#ff8080", fontSize: 13, margin: 0 }}>⚠️ {error}</p>
              </div>
            )}

            <div style={{
              background: "#0e0e18", border: "1px solid #1a1a2e",
              borderRadius: 12, padding: "18px 20px", textAlign: "left", marginTop: 12
            }}>
              <p style={{ color: "#333", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>
                Expected JSON format
              </p>
              <pre style={{ color: "#3a3a60", fontSize: 11, margin: 0, lineHeight: 1.8, fontFamily: "monospace", overflow: "auto" }}>{`{
  "quiz": {
    "title": "My Quiz",
    "description": "Optional subtitle",
    "questions": [{
      "id": 1,
      "question": "Your question here?",
      "answers": {
        "a": "Option A",
        "b": "Option B",
        "c": "Option C",
        "d": "Option D"
      },
      "correct_answer": "a",
      "explanation": "Optional explanation"
    }]
  }
}`}</pre>
            </div>
          </div>
        )}

        {/* ── START ── */}
        {screen === "start" && quizData && (
          <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease" }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🧠</div>
            <h1 style={{ color: "#fff", fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 700, letterSpacing: "-1px", margin: "0 0 12px" }}>
              {quizData.quiz.title}
            </h1>
            {quizData.quiz.description && (
              <p style={{ color: "#888", fontSize: 16, marginBottom: 32, fontStyle: "italic" }}>
                {quizData.quiz.description}
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 48 }}>
              {[["📝", `${total} Questions`], ["⏱", "No Time Limit"], ["🏆", "Instant Results"]].map(([icon, label]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24 }}>{icon}</div>
                  <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setScreen("quiz")} style={btnStyle("#6c3fff", "#fff")}>Start Quiz →</button>
            <button onClick={handleNewQuiz} style={{ ...btnStyle("transparent", "#444"), marginTop: 10, border: "1px solid #1e1e30" }}>
              ↩ Load Different Quiz
            </button>
          </div>
        )}

        {/* ── QUIZ ── */}
        {screen === "quiz" && q && (
          <div style={{ animation: "fadeUp 0.35s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ color: "#555", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
                Question {current + 1} / {total}
              </span>
              <span style={{ background: "rgba(108,63,255,0.15)", color: "#a07fff", padding: "4px 14px", borderRadius: 20, fontSize: 13, border: "1px solid rgba(108,63,255,0.3)" }}>
                {score} pts
              </span>
            </div>

            <div style={{ height: 3, background: "#1a1a2e", borderRadius: 2, marginBottom: 32, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #6c3fff, #a07fff)", width: `${progress}%`, transition: "width 0.4s ease" }} />
            </div>

            <div style={{ background: "#111118", border: "1px solid #1e1e30", borderRadius: 16, padding: "32px 28px", marginBottom: 20, boxShadow: "0 0 40px rgba(0,0,0,0.4)" }}>
              <h2 style={{ color: "#f0f0f5", fontSize: "clamp(17px, 3vw, 22px)", fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                {q.question}
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {LABELS.map(key => {
                if (!q.answers[key]) return null;
                const isCorrect = key === q.correct_answer;
                const isSelected = selected === key;
                let bg = "#111118", border = "#1e1e30", color = "#ccc";
                if (revealed) {
                  if (isCorrect) { bg = "rgba(0,229,160,0.1)"; border = "#00e5a0"; color = "#00e5a0"; }
                  else if (isSelected) { bg = "rgba(255,100,100,0.1)"; border = "#ff6464"; color = "#ff6464"; }
                  else { color = "#444"; }
                } else if (isSelected) {
                  bg = "rgba(108,63,255,0.15)"; border = "#6c3fff"; color = "#c4b5ff";
                }
                return (
                  <button key={key} onClick={() => handleSelect(key)} style={{
                    background: bg, border: `1px solid ${border}`, borderRadius: 12,
                    padding: "14px 20px", display: "flex", alignItems: "center", gap: 14,
                    cursor: revealed ? "default" : "pointer", transition: "all 0.2s ease", textAlign: "left"
                  }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: 8, border: `1px solid ${border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color, flexShrink: 0,
                      fontFamily: "monospace", textTransform: "uppercase"
                    }}>{key}</span>
                    <span style={{ color, fontSize: 15 }}>{q.answers[key]}</span>
                    {revealed && isCorrect && <span style={{ marginLeft: "auto", fontSize: 18 }}>✓</span>}
                    {revealed && isSelected && !isCorrect && <span style={{ marginLeft: "auto", fontSize: 18 }}>✗</span>}
                  </button>
                );
              })}
            </div>

            {revealed && q.explanation && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #222", borderRadius: 12, padding: "16px 20px", marginBottom: 20, animation: "fadeUp 0.3s ease" }}>
                <div style={{ color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Explanation</div>
                <p style={{ color: "#aaa", fontSize: 14, margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>{q.explanation}</p>
              </div>
            )}

            {!revealed
              ? <button onClick={handleConfirm} disabled={!selected} style={btnStyle(selected ? "#6c3fff" : "#1a1a2e", selected ? "#fff" : "#444")}>Confirm Answer</button>
              : <button onClick={handleNext} style={btnStyle("#6c3fff", "#fff")}>{current + 1 < total ? "Next Question →" : "See Results →"}</button>
            }
          </div>
        )}

        {/* ── RESULTS ── */}
        {screen === "results" && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>{score === total ? "🏆" : score >= total * 0.6 ? "🎉" : "📚"}</div>
              <h2 style={{ color: gradeColor, fontSize: 32, margin: "0 0 8px", letterSpacing: "-1px" }}>{grade}</h2>
              <div style={{ color: "#fff", fontSize: 48, fontWeight: 700, margin: "8px 0" }}>
                {score}<span style={{ color: "#444", fontSize: 28 }}>/{total}</span>
              </div>
              <p style={{ color: "#555", fontSize: 14 }}>
                {score === total ? "You answered every question correctly!" : `You got ${score} out of ${total} correct.`}
              </p>
            </div>

            <div style={{ height: 6, background: "#1a1a2e", borderRadius: 3, marginBottom: 40, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${gradeColor}88, ${gradeColor})`, width: `${(score / total) * 100}%`, transition: "width 1s ease" }} />
            </div>

            {incorrect.length > 0 ? (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ color: "#ff6b6b", fontSize: 14, textTransform: "uppercase", letterSpacing: 2, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>✗</span> Review Incorrect Answers ({incorrect.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {incorrect.map(q => (
                    <div key={q.id} style={{ background: "#111118", border: "1px solid #1e1e30", borderRadius: 14, padding: "20px 22px" }}>
                      <p style={{ color: "#e0e0e0", fontWeight: 600, margin: "0 0 14px", fontSize: 15, lineHeight: 1.5 }}>{q.question}</p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: q.explanation ? 14 : 0 }}>
                        <span style={{ background: "rgba(255,100,100,0.1)", border: "1px solid #ff6464", borderRadius: 8, padding: "4px 12px", fontSize: 13, color: "#ff8888" }}>
                          ✗ Your answer: {q.answers[answers[String(q.id)]]}
                        </span>
                        <span style={{ background: "rgba(0,229,160,0.1)", border: "1px solid #00e5a0", borderRadius: 8, padding: "4px 12px", fontSize: 13, color: "#00e5a0" }}>
                          ✓ Correct: {q.answers[q.correct_answer]}
                        </span>
                      </div>
                      {q.explanation && (
                        <p style={{ color: "#777", fontSize: 13, margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>💡 {q.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px", background: "rgba(0,229,160,0.05)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 14, marginBottom: 32 }}>
                <p style={{ color: "#00e5a0", margin: 0, fontSize: 15 }}>🎯 No mistakes — flawless performance!</p>
              </div>
            )}

            <button onClick={handleRestart} style={btnStyle("#6c3fff", "#fff")}>↺ Try Again</button>
            <button onClick={handleNewQuiz} style={{ ...btnStyle("transparent", "#444"), marginTop: 10, border: "1px solid #1e1e30" }}>
              📂 Load New Quiz
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function btnStyle(bg, color) {
  return {
    width: "100%", padding: "15px 24px",
    background: bg, color, border: "none", borderRadius: 12,
    fontSize: 16, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit", letterSpacing: "0.3px",
    transition: "opacity 0.2s ease",
  };
}
