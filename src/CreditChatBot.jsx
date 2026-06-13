import { useState, useEffect, useRef, useCallback } from "react";
// import CreditChatBot from './CreditChatBot';

// export default function App() {
//   return <CreditChatBot />;
// }

// ─── Application Metadata (product-specific, themable) ───────────────────────
const PRODUCTS = {
  personal_loan: {
    label: "Personal Loan",
    icon: "💳",
    color: "#5B4FE8",
    accent: "#00E5C3",
    fields: [
      { id: "name", label: "Full Name", type: "text", placeholder: "e.g. Arjun Menon", validation: { required: true, minLength: 2 } },
      { id: "age", label: "Age", type: "number", placeholder: "e.g. 28", validation: { required: true, min: 21, max: 65 } },
      { id: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. 9876543210", validation: { required: true, pattern: "^[6-9]\\d{9}$" } },
      { id: "employment", label: "Employment Type", type: "select", options: ["Salaried", "Self-Employed", "Student"], validation: { required: true } },
      { id: "company", label: "Company / Organisation", type: "text", placeholder: "e.g. Infosys Ltd.", dependsOn: { field: "employment", values: ["Salaried"] }, validation: { required: true } },
      { id: "monthly_income", label: "Monthly Income (₹)", type: "number", placeholder: "e.g. 75000", validation: { required: true, min: 15000 } },
      { id: "sector", label: "Sector", type: "select", options: ["Private", "Public", "Government"], validation: { required: true } },
      { id: "job_grade", label: "Job Grade / Level", type: "text", placeholder: "e.g. Grade B, Level 3", dependsOn: { field: "sector", values: ["Government"] }, validation: { required: true } },
      { id: "loan_amount", label: "Loan Amount (₹)", type: "number", placeholder: "e.g. 500000", validation: { required: true, min: 50000, max: 5000000 } },
      { id: "tenure", label: "Tenure (months)", type: "select", options: ["12", "24", "36", "48", "60"], validation: { required: true } },
      { id: "purpose", label: "Loan Purpose", type: "select", options: ["Medical", "Education", "Travel", "Home Renovation", "Wedding", "Other"], validation: { required: true } },
    ]
  },
  credit_card: {
    label: "Credit Card",
    icon: "💎",
    color: "#7C3AED",
    accent: "#F59E0B",
    fields: [
      { id: "name", label: "Full Name", type: "text", placeholder: "e.g. Priya Nair", validation: { required: true, minLength: 2 } },
      { id: "age", label: "Age", type: "number", placeholder: "e.g. 30", validation: { required: true, min: 21, max: 65 } },
      { id: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. 9123456789", validation: { required: true, pattern: "^[6-9]\\d{9}$" } },
      { id: "employment", label: "Employment Type", type: "select", options: ["Salaried", "Self-Employed"], validation: { required: true } },
      { id: "monthly_income", label: "Monthly Income (₹)", type: "number", placeholder: "e.g. 80000", validation: { required: true, min: 25000 } },
      { id: "desired_limit", label: "Desired Credit Limit (₹)", type: "select", options: ["50,000", "1,00,000", "2,00,000", "5,00,000"], validation: { required: true } },
      { id: "spending_habits", label: "Primary Spend Category", type: "select", options: ["Travel", "Dining", "Shopping", "Fuel", "General"], validation: { required: true } },
      { id: "existing_cards", label: "Existing Credit Cards", type: "select", options: ["None", "1", "2", "3+"], validation: { required: true } },
    ]
  },
  home_loan: {
    label: "Home Loan",
    icon: "🏠",
    color: "#0EA5E9",
    accent: "#10B981",
    fields: [
      { id: "name", label: "Full Name", type: "text", placeholder: "e.g. Rahul Kumar", validation: { required: true, minLength: 2 } },
      { id: "age", label: "Age", type: "number", placeholder: "e.g. 35", validation: { required: true, min: 21, max: 60 } },
      { id: "phone", label: "Phone Number", type: "tel", placeholder: "e.g. 9988776655", validation: { required: true, pattern: "^[6-9]\\d{9}$" } },
      { id: "employment", label: "Employment Type", type: "select", options: ["Salaried", "Self-Employed"], validation: { required: true } },
      { id: "monthly_income", label: "Monthly Income (₹)", type: "number", placeholder: "e.g. 120000", validation: { required: true, min: 30000 } },
      { id: "property_type", label: "Property Type", type: "select", options: ["Flat / Apartment", "Independent House", "Villa", "Plot + Construction"], validation: { required: true } },
      { id: "property_value", label: "Property Value (₹)", type: "number", placeholder: "e.g. 6500000", validation: { required: true, min: 500000 } },
      { id: "loan_amount", label: "Loan Amount Required (₹)", type: "number", placeholder: "e.g. 5000000", validation: { required: true, min: 300000 } },
      { id: "tenure", label: "Tenure (years)", type: "select", options: ["5", "10", "15", "20", "25", "30"], validation: { required: true } },
    ]
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function validateField(field, value) {
  const v = field.validation;
  if (!v) return null;
  if (v.required && (!value || value.toString().trim() === "")) return `${field.label} is required.`;
  if (value) {
    if (v.minLength && value.length < v.minLength) return `Minimum ${v.minLength} characters required.`;
    if (v.min !== undefined && Number(value) < v.min) return `Minimum value is ${v.min.toLocaleString("en-IN")}.`;
    if (v.max !== undefined && Number(value) > v.max) return `Maximum value is ${v.max.toLocaleString("en-IN")}.`;
    if (v.pattern && !new RegExp(v.pattern).test(value)) return `Invalid format for ${field.label}.`;
  }
  return null;
}

function evaluateCredit(product, answers) {
  const income = Number(answers.monthly_income) || 0;
  const loanAmount = Number(answers.loan_amount) || 0;
  const age = Number(answers.age) || 0;
  if (product === "credit_card") {
    if (income >= 25000 && age >= 21 && age <= 65) return { approved: true, limit: answers.desired_limit, rate: "3.5% p.m.", message: "Congratulations! Your credit card application has been approved." };
    return { approved: false, reason: "Income below minimum threshold or age criteria not met.", alternative: "Consider applying for a lower limit card." };
  }
  const emi = loanAmount / (Number(answers.tenure) || 12);
  const ratio = emi / income;
  if (ratio > 0.5) return { approved: false, reason: "EMI-to-income ratio exceeds 50%. Loan amount is too high relative to your income.", alternative: "Try a lower loan amount or longer tenure." };
  if (income < 15000) return { approved: false, reason: "Monthly income below minimum eligibility.", alternative: "You may be eligible for a smaller personal loan." };
  if (age < 21 || age > 65) return { approved: false, reason: "Age criteria not met (21–65 years).", alternative: null };
  const rate = product === "home_loan" ? "8.5% p.a." : "12% p.a.";
  const emiDisplay = Math.round(emi).toLocaleString("en-IN");
  return { approved: true, amount: loanAmount.toLocaleString("en-IN"), rate, emi: `₹${emiDisplay}/month`, message: "Your application looks great! Preliminary approval granted." };
}

// ─── Components ───────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "14px 18px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "var(--accent)",
          animation: "bounce 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`
        }} />
      ))}
    </div>
  );
}

function BotBubble({ children, accent, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8,
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.4s ease, transform 0.4s ease"
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: `linear-gradient(135deg, ${accent}33, ${accent}88)`,
        border: `2px solid ${accent}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14
      }}>✦</div>
      <div style={{
        background: "var(--surface2)", borderRadius: "4px 18px 18px 18px",
        padding: "12px 16px", maxWidth: "78%", color: "var(--text-primary)",
        fontSize: 14, lineHeight: 1.6, border: "1px solid var(--border)",
        boxShadow: `0 0 20px ${accent}11`
      }}>
        {children}
      </div>
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
      <div style={{
        background: "var(--primary)", borderRadius: "18px 4px 18px 18px",
        padding: "11px 16px", maxWidth: "70%", color: "#fff",
        fontSize: 14, lineHeight: 1.5, fontWeight: 500,
        boxShadow: "0 4px 16px rgba(91,79,232,0.35)"
      }}>
        {text}
      </div>
    </div>
  );
}

function FieldInput({ field, onSubmit, accent }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSubmit = useCallback(() => {
    const err = validateField(field, value);
    if (err) { setError(err); return; }
    setError(null);
    onSubmit(value);
  }, [field, value, onSubmit]);

  const handleKey = (e) => {
    if (e.key === "Enter" && field.type !== "select") handleSubmit();
  };

  const inputBase = {
    width: "100%", background: "var(--surface3)", border: `1.5px solid ${error ? "#FF6B6B" : "var(--border)"}`,
    borderRadius: 12, padding: "12px 16px", color: "var(--text-primary)",
    fontSize: 14, outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ marginTop: 4 }}>
      {field.type === "select" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          {field.options.map(opt => (
            <button key={opt} onClick={() => { setValue(opt); setTimeout(() => onSubmit(opt), 100); }}
              style={{
                padding: "9px 18px", borderRadius: 50,
                border: `1.5px solid ${value === opt ? accent : "var(--border)"}`,
                background: value === opt ? `${accent}22` : "var(--surface3)",
                color: value === opt ? accent : "var(--text-secondary)",
                cursor: "pointer", fontSize: 13, fontWeight: 500,
                transition: "all 0.18s", letterSpacing: 0.3
              }}
            >{opt}</button>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            ref={inputRef}
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={e => { setValue(e.target.value); setError(null); }}
            onKeyDown={handleKey}
            style={inputBase}
            onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accent}22`; }}
            onBlur={e => { e.target.style.borderColor = error ? "#FF6B6B" : "var(--border)"; e.target.style.boxShadow = "none"; }}
          />
          <button onClick={handleSubmit} style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `linear-gradient(135deg, ${accent}, var(--primary))`,
            border: "none", cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18, color: "#fff",
            boxShadow: `0 4px 14px ${accent}44`, transition: "transform 0.15s"
          }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(0.92)"}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          >→</button>
        </div>
      )}
      {error && <div style={{ color: "#FF6B6B", fontSize: 12, marginTop: 6, paddingLeft: 4 }}>⚠ {error}</div>}
    </div>
  );
}

function SummaryCard({ answers, product, accent }) {
  const fields = PRODUCTS[product]?.fields || [];
  return (
    <div style={{
      background: "var(--surface2)", border: `1px solid ${accent}44`,
      borderRadius: 16, padding: 16, marginTop: 4,
      boxShadow: `0 0 30px ${accent}11`
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Application Summary</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
        {fields.filter(f => answers[f.id]).map(f => (
          <div key={f.id}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8 }}>{f.label}</div>
            <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{answers[f.id]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultCard({ result, accent }) {
  return (
    <div style={{
      background: result.approved ? `linear-gradient(135deg, ${accent}18, ${accent}08)` : "linear-gradient(135deg, #FF6B6B18, #FF6B6B08)",
      border: `1.5px solid ${result.approved ? accent : "#FF6B6B"}55`,
      borderRadius: 20, padding: 20, marginTop: 4,
      boxShadow: `0 8px 32px ${result.approved ? accent : "#FF6B6B"}18`
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{result.approved ? "🎉" : "😔"}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: result.approved ? accent : "#FF6B6B", marginBottom: 8 }}>
        {result.approved ? "Application Approved!" : "Not Approved"}
      </div>
      {result.approved ? (
        <div style={{ display: "grid", gap: 6 }}>
          {result.amount && <div style={{ fontSize: 13 }}><span style={{ color: "var(--text-muted)" }}>Amount: </span><strong style={{ color: "var(--text-primary)" }}>₹{result.amount}</strong></div>}
          {result.limit && <div style={{ fontSize: 13 }}><span style={{ color: "var(--text-muted)" }}>Credit Limit: </span><strong style={{ color: "var(--text-primary)" }}>₹{result.limit}</strong></div>}
          <div style={{ fontSize: 13 }}><span style={{ color: "var(--text-muted)" }}>Interest Rate: </span><strong style={{ color: "var(--text-primary)" }}>{result.rate}</strong></div>
          {result.emi && <div style={{ fontSize: 13 }}><span style={{ color: "var(--text-muted)" }}>EMI: </span><strong style={{ color: "var(--text-primary)" }}>{result.emi}</strong></div>}
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>A relationship manager will contact you within 24 hours.</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>{result.reason}</div>
          {result.alternative && <div style={{ fontSize: 12, color: accent, padding: "8px 12px", background: `${accent}15`, borderRadius: 8 }}>💡 {result.alternative}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Phases ───────────────────────────────────────────────────────────────────
// Phase: welcome → product_select → mode_select → collecting → summary_confirm → result

export default function CreditChatBot() {
  const [theme, setTheme] = useState("dark");
  const [product, setProduct] = useState(null);
  const [mode, setMode] = useState(null); // "guided" | "quick"
  const [phase, setPhase] = useState("welcome"); // welcome | product_select | mode_select | collecting | summary_confirm | evaluating | result
  const [messages, setMessages] = useState([]);
  const [fieldIndex, setFieldIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showTyping, setShowTyping] = useState(false);
  const [activeInput, setActiveInput] = useState(null); // field to currently show
  const bottomRef = useRef(null);

  const productConfig = product ? PRODUCTS[product] : null;
  const accent = productConfig?.accent || "#00E5C3";
  const primary = productConfig?.color || "#5B4FE8";

  const isDark = theme === "dark";

  const cssVars = {
    "--bg": isDark ? "#080C1A" : "#F5F7FF",
    "--surface": isDark ? "#0F1629" : "#FFFFFF",
    "--surface2": isDark ? "#151D35" : "#F0F2FF",
    "--surface3": isDark ? "#1C2542" : "#E8ECFF",
    "--border": isDark ? "#1E2D50" : "#D8DEFF",
    "--text-primary": isDark ? "#EEF0FF" : "#0A0F2E",
    "--text-secondary": isDark ? "#8B97C6" : "#4A5280",
    "--text-muted": isDark ? "#4D5A80" : "#8090B0",
    "--primary": primary,
    "--accent": accent,
  };

  const addBot = useCallback((content, delay = 0) => {
    return new Promise(resolve => {
      setShowTyping(true);
      setTimeout(() => {
        setShowTyping(false);
        setMessages(m => [...m, { role: "bot", content, id: Date.now() + Math.random() }]);
        resolve();
      }, delay + 700);
    });
  }, []);

  const addUser = useCallback((text) => {
    setMessages(m => [...m, { role: "user", text, id: Date.now() + Math.random() }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showTyping, activeInput]);

  // Welcome
  useEffect(() => {
    const t = setTimeout(async () => {
      await addBot(<span>👋 Hello! I'm <strong style={{ color: accent }}>FinBot</strong> — your personal credit assistant.<br /><span style={{ color: "var(--text-secondary)", fontSize: 13 }}>No lengthy forms. Just a quick chat to get you the credit you deserve.</span></span>, 200);
      setPhase("product_select");
    }, 400);
    return () => clearTimeout(t);
  }, []);

  // Product select prompt
  useEffect(() => {
    if (phase !== "product_select") return;
    addBot(<span>What would you like to apply for today?</span>, 300).then(() => {
      setActiveInput("product_select");
    });
  }, [phase]);

  // Mode select prompt
  useEffect(() => {
    if (phase !== "mode_select") return;
    addBot(
      <span>Great choice! How would you like to proceed?<br />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Guided: step-by-step with hints &nbsp;·&nbsp; Quick: just the essentials</span>
      </span>, 200
    ).then(() => setActiveInput("mode_select"));
  }, [phase]);

  // Collecting phase — get next visible field
  const getVisibleFields = useCallback(() => {
    if (!product) return [];
    return PRODUCTS[product].fields.filter(f => {
      if (!f.dependsOn) return true;
      const dep = answers[f.dependsOn.field];
      return dep && f.dependsOn.values.includes(dep);
    });
  }, [product, answers]);

  useEffect(() => {
    if (phase !== "collecting") return;
    const fields = getVisibleFields();
    if (fieldIndex >= fields.length) {
      // Done collecting
      setActiveInput(null);
      setPhase("summary_confirm");
      return;
    }
    const field = fields[fieldIndex];
    const hint = mode === "guided" ? getHint(field) : null;
    const msg = (
      <span>
        {hint && <span style={{ display: "block", fontSize: 12, color: accent, marginBottom: 4 }}>💡 {hint}</span>}
        {field.label}{field.validation?.required ? <span style={{ color: "#FF6B6B" }}> *</span> : ""}
      </span>
    );
    addBot(msg, 150).then(() => setActiveInput(field));
  }, [phase, fieldIndex, product, mode]);

  function getHint(field) {
    const hints = {
      name: "Use your name as on your Aadhaar / PAN card.",
      age: "You must be between 21–65 years to be eligible.",
      phone: "We'll send OTP to this number for verification.",
      monthly_income: "Include all sources of income for better eligibility.",
      loan_amount: "You can typically get up to 20× your monthly salary.",
      tenure: "Longer tenure = lower EMI but more interest paid overall.",
    };
    return hints[field.id] || null;
  }

  // Summary confirm
  useEffect(() => {
    if (phase !== "summary_confirm") return;
    addBot(
      <span>Here's a summary of what you've shared. Please review before I submit.</span>, 200
    ).then(() => {
      setMessages(m => [...m, { role: "bot", content: <SummaryCard answers={answers} product={product} accent={accent} />, id: "summary" }]);
      setTimeout(() => {
        addBot(<span>Does everything look correct?</span>, 300).then(() => setActiveInput("confirm"));
      }, 400);
    });
  }, [phase]);

  // Evaluating
  useEffect(() => {
    if (phase !== "evaluating") return;
    setActiveInput(null);
    addBot(<span>⚙️ Running credit evaluation… <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Checking income, debt ratio, eligibility…</span></span>, 300).then(() => {
      const result = evaluateCredit(product, answers);
      setTimeout(() => {
        setMessages(m => [...m, { role: "bot", content: <ResultCard result={result} accent={accent} />, id: "result" }]);
        if (!result.approved) {
          addBot(<span>Would you like to try a different product or adjust your details? Just refresh to start over.</span>, 500);
        } else {
          addBot(<span>🎊 We're excited to have you on board! Our team will reach out shortly to complete KYC.</span>, 400);
        }
        setPhase("result");
      }, 1800);
    });
  }, [phase]);

  const handleProductSelect = (key) => {
    addUser(PRODUCTS[key].label);
    setProduct(key);
    setActiveInput(null);
    setAnswers({});
    setFieldIndex(0);
    setPhase("mode_select");
  };

  const handleModeSelect = (m) => {
    addUser(m === "guided" ? "Guided Mode" : "Quick Mode");
    setMode(m);
    setActiveInput(null);
    setPhase("collecting");
  };

  const handleFieldAnswer = (value) => {
    const fields = getVisibleFields();
    const field = fields[fieldIndex];
    addUser(value);
    setAnswers(prev => ({ ...prev, [field.id]: value }));
    setActiveInput(null);
    setTimeout(() => setFieldIndex(i => i + 1), 200);
  };

  const handleConfirm = (yes) => {
    addUser(yes ? "Yes, looks correct" : "No, let me edit");
    setActiveInput(null);
    if (yes) {
      setPhase("evaluating");
    } else {
      // Go back to start of collection
      setFieldIndex(0);
      setAnswers({});
      addBot(<span>No worries! Let's go through it again.</span>, 300).then(() => {
        setPhase("collecting");
      });
    }
  };

  const renderInput = () => {
    if (!activeInput) return null;

    if (activeInput === "product_select") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {Object.entries(PRODUCTS).map(([key, p]) => (
            <button key={key} onClick={() => handleProductSelect(key)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 18px", borderRadius: 14,
                background: "var(--surface2)", border: "1.5px solid var(--border)",
                color: "var(--text-primary)", cursor: "pointer", textAlign: "left",
                transition: "all 0.2s", fontSize: 14,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = p.accent; e.currentTarget.style.background = `${p.accent}12`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface2)"; }}
            >
              <span style={{ fontSize: 22 }}>{p.icon}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {key === "personal_loan" && "Quick funds for any personal need"
                    || key === "credit_card" && "Flexible spending with rewards"
                    || "Finance your dream home"}
                </div>
              </div>
              <span style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>
      );
    }

    if (activeInput === "mode_select") {
      return (
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          {[
            { key: "guided", label: "Guided", icon: "🧭", desc: "Step-by-step with tips" },
            { key: "quick", label: "Quick", icon: "⚡", desc: "Fast & minimal" }
          ].map(m => (
            <button key={m.key} onClick={() => handleModeSelect(m.key)}
              style={{
                flex: 1, padding: "14px 12px", borderRadius: 14,
                background: "var(--surface2)", border: "1.5px solid var(--border)",
                color: "var(--text-primary)", cursor: "pointer",
                transition: "all 0.2s", textAlign: "center"
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = `${accent}12`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface2)"; }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.desc}</div>
            </button>
          ))}
        </div>
      );
    }

    if (activeInput === "confirm") {
      return (
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button onClick={() => handleConfirm(true)} style={{
            flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${accent}`,
            background: `${accent}18`, color: accent, cursor: "pointer",
            fontWeight: 600, fontSize: 14, transition: "all 0.2s"
          }}
            onMouseEnter={e => e.currentTarget.style.background = `${accent}30`}
            onMouseLeave={e => e.currentTarget.style.background = `${accent}18`}
          >✓ Yes, submit</button>
          <button onClick={() => handleConfirm(false)} style={{
            flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid var(--border)",
            background: "var(--surface2)", color: "var(--text-secondary)", cursor: "pointer",
            fontSize: 14, transition: "all 0.2s"
          }}>✎ Edit details</button>
        </div>
      );
    }

    if (activeInput && typeof activeInput === "object") {
      return <FieldInput field={activeInput} onSubmit={handleFieldAnswer} accent={accent} />;
    }

    return null;
  };

  const progress = product && phase === "collecting" ? Math.round((fieldIndex / getVisibleFields().length) * 100) : 0;

  return (
    <div style={{ ...cssVars, minHeight: "100vh", background: "var(--bg)", fontFamily: "'Inter', 'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      `}</style>

      {/* Header */}
      <div style={{
        width: "100%", maxWidth: 520, display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 12, padding: "0 4px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${primary}, ${accent})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: `0 4px 16px ${accent}44`
          }}>✦</div>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1 }}>FinBot</div>
            <div style={{ fontSize: 11, color: accent, fontWeight: 500 }}>Credit Assistant · Online</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {productConfig && (
            <div style={{ fontSize: 11, padding: "4px 10px", borderRadius: 50, background: `${primary}22`, color: primary, border: `1px solid ${primary}44`, fontWeight: 600 }}>
              {productConfig.icon} {productConfig.label}
            </div>
          )}
          <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 16, color: "var(--text-secondary)" }}>
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {phase === "collecting" && (
        <div style={{ width: "100%", maxWidth: 520, height: 3, background: "var(--surface3)", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${primary}, ${accent})`, borderRadius: 2, transition: "width 0.4s ease" }} />
        </div>
      )}

      {/* Chat window */}
      <div style={{
        width: "100%", maxWidth: 520, height: "calc(100vh - 180px)", maxHeight: 640,
        background: "var(--surface)", borderRadius: 24,
        border: "1px solid var(--border)",
        boxShadow: isDark ? `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${accent}11` : "0 24px 60px rgba(91,79,232,0.12)",
        display: "flex", flexDirection: "column", overflow: "hidden"
      }}>
        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 8px" }}>
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "bot"
                ? <BotBubble accent={accent}>{msg.content}</BotBubble>
                : <UserBubble text={msg.text} />
              }
            </div>
          ))}
          {showTyping && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${accent}22`, border: `2px solid ${accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✦</div>
              <div style={{ background: "var(--surface2)", borderRadius: "4px 18px 18px 18px", border: "1px solid var(--border)" }}>
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        {activeInput && (
          <div style={{
            padding: "12px 16px 16px",
            borderTop: "1px solid var(--border)",
            background: "var(--surface)",
          }}>
            {renderInput()}
          </div>
        )}

        {phase === "result" && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <button onClick={() => window.location.reload()} style={{
              padding: "10px 28px", borderRadius: 50, border: `1.5px solid ${accent}`,
              background: `${accent}18`, color: accent, cursor: "pointer",
              fontSize: 13, fontWeight: 600, transition: "all 0.2s"
            }}>↩ Start New Application</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
        🔒 256-bit encrypted · Your data is secure · Powered by FinBot AI
      </div>
    </div>
  );
}


