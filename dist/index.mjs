// lib/components/FaceRegister.jsx
import { useState, useEffect as useEffect2, useRef as useRef2, useCallback } from "react";
import { motion } from "framer-motion";
import { FaceLivenessDetectorCore } from "@aws-amplify/ui-react-liveness";
import "@aws-amplify/ui-react/styles.css";

// lib/components/internal/SiriWave.jsx
import { useEffect, useRef } from "react";
import { jsx } from "react/jsx-runtime";
var STATES = {
  idle: {
    speed: 0.03,
    amplitude: 0.3,
    waves: [
      { color: "#3b82f6", alpha: 0.5, frequency: 3, offset: 0 },
      { color: "#60a5fa", alpha: 0.25, frequency: 5, offset: 1 }
    ]
  },
  scanning: {
    speed: 0.09,
    amplitude: 0.65,
    waves: [
      { color: "#6366f1", alpha: 0.7, frequency: 3, offset: 0 },
      { color: "#8b5cf6", alpha: 0.5, frequency: 4, offset: 0.8 },
      { color: "#06b6d4", alpha: 0.4, frequency: 6, offset: 1.6 },
      { color: "#3b82f6", alpha: 0.3, frequency: 2, offset: 2.4 }
    ]
  },
  success: {
    speed: 0.04,
    amplitude: 0.2,
    waves: [
      { color: "#22c55e", alpha: 0.6, frequency: 3, offset: 0 },
      { color: "#4ade80", alpha: 0.3, frequency: 5, offset: 1 }
    ]
  },
  error: {
    speed: 0.04,
    amplitude: 0.2,
    waves: [
      { color: "#ef4444", alpha: 0.6, frequency: 3, offset: 0 },
      { color: "#f87171", alpha: 0.3, frequency: 5, offset: 1 }
    ]
  }
};
function SiriWave({ state = "idle", theme = "dark" }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const phaseRef = useRef(0);
  const currentAmplitudeRef = useRef(STATES.idle.amplitude);
  const currentSpeedRef = useRef(STATES.idle.speed);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);
    const config = STATES[state] || STATES.idle;
    const lerp = (a, b, t) => a + (b - a) * t;
    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      currentAmplitudeRef.current = lerp(currentAmplitudeRef.current, config.amplitude, 0.05);
      currentSpeedRef.current = lerp(currentSpeedRef.current, config.speed, 0.05);
      phaseRef.current += currentSpeedRef.current;
      config.waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, H / 2);
        for (let x = 0; x <= W; x += 1) {
          const normalX = x / W * Math.PI * 2;
          const y = H / 2 + Math.sin(normalX * wave.frequency + phaseRef.current + wave.offset) * (H / 2) * currentAmplitudeRef.current * // Envelope: fade the wave at edges so it "breathes" from centre
          Math.sin(x / W * Math.PI);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = hexToRgba(wave.color, wave.alpha);
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [state]);
  const bgColor = theme === "dark" ? "transparent" : "transparent";
  return /* @__PURE__ */ jsx(
    "canvas",
    {
      ref: canvasRef,
      style: {
        width: "100%",
        height: "80px",
        display: "block",
        background: bgColor
      }
    }
  );
}
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// lib/components/FaceRegister.jsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var FRIENDLY_ERRORS = {
  NO_FACE_DETECTED: "No face detected. Please ensure your face is clearly visible.",
  NO_REFERENCE_IMAGE: "Could not capture your face. Please try again in better lighting.",
  LIVENESS_FAILED: "Liveness check failed. Please try again.",
  SESSION_EXPIRED: "Session expired. Please try again.",
  SESSION_CREATE_ERROR: "Could not start liveness session. Check your connection and try again.",
  MISSING_ROLE_ARN: "Server configuration error. Please contact support.",
  AWS_ERROR: "Something went wrong. Please try again."
};
function FaceRegister({
  collectionId,
  onSuccess,
  onError,
  sessionApiEndpoint = "/api/face-liveness-session",
  resultApiEndpoint = "/api/face-liveness-result",
  faceModelUrl,
  binaryPath,
  theme = "dark",
  className = ""
}) {
  const [phase, setPhase] = useState("init");
  const [sessionData, setSessionData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [waveState, setWaveState] = useState("idle");
  const clockOffsetRef = useRef2(0);
  const isDark = theme === "dark";
  const handleError = useCallback((error) => {
    setPhase("error");
    setWaveState("error");
    setErrorMessage(error.message);
    onError?.(error);
  }, [onError]);
  const startSession = useCallback(async () => {
    setPhase("init");
    setErrorMessage("");
    setWaveState("scanning");
    try {
      const before = Date.now();
      const res = await fetch(sessionApiEndpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw { code: data.code, message: data.message };
      const rtt = Date.now() - before;
      clockOffsetRef.current = rtt > 5 * 60 * 1e3 ? rtt : 0;
      setSessionData(data);
      setPhase("liveness");
    } catch (err) {
      const code = err.code || "SESSION_CREATE_ERROR";
      handleError({ code, message: FRIENDLY_ERRORS[code] || err.message });
    }
  }, [sessionApiEndpoint, handleError]);
  const startSessionRef = useRef2(startSession);
  useEffect2(() => {
    startSessionRef.current = startSession;
  });
  useEffect2(() => {
    const t = setTimeout(() => {
      startSessionRef.current();
    }, 0);
    return () => clearTimeout(t);
  }, []);
  async function handleAnalysisComplete() {
    setPhase("processing");
    setWaveState("scanning");
    try {
      const res = await fetch(resultApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionData.sessionId, collectionId, mode: "register" })
      });
      const data = await res.json();
      if (!res.ok) throw { code: data.code, message: data.message };
      setPhase("success");
      setWaveState("success");
      onSuccess?.(data);
    } catch (err) {
      const code = err.code || "AWS_ERROR";
      handleError({ code, message: FRIENDLY_ERRORS[code] || err.message });
    }
  }
  function handleLivenessError(err) {
    if (err?.state === "CONNECTION_TIMEOUT" || err?.state === "SERVER_ERROR") {
      handleError({ code: "SESSION_EXPIRED", message: FRIENDLY_ERRORS["SESSION_EXPIRED"] });
      return;
    }
    handleError({ code: err?.state || "LIVENESS_FAILED", message: FRIENDLY_ERRORS["LIVENESS_FAILED"] });
  }
  const credentialProvider = async () => ({
    accessKeyId: sessionData.credentials.accessKeyId,
    secretAccessKey: sessionData.credentials.secretAccessKey,
    sessionToken: sessionData.credentials.sessionToken
  });
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className,
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 24px",
        borderRadius: "24px",
        background: isDark ? "linear-gradient(145deg, #0d0d0d, #111827)" : "linear-gradient(145deg, #f9fafb, #ffffff)",
        border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
        boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.6)" : "0 25px 60px rgba(0,0,0,0.08)",
        maxWidth: "400px",
        width: "100%",
        boxSizing: "border-box",
        fontFamily: "monospace"
      },
      children: [
        /* @__PURE__ */ jsx2("p", { style: { margin: "0 0 8px 0", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: isDark ? "#6b7280" : "#9ca3af" }, children: "Face Registration" }),
        /* @__PURE__ */ jsx2("div", { style: { width: "100%", marginBottom: "16px" }, children: /* @__PURE__ */ jsx2(SiriWave, { state: waveState, theme }) }),
        phase === "init" && /* @__PURE__ */ jsxs("div", { style: { padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }, children: [
          /* @__PURE__ */ jsx2(Spinner, {}),
          /* @__PURE__ */ jsx2("p", { style: { margin: 0, fontSize: "12px", color: isDark ? "#6b7280" : "#9ca3af", letterSpacing: "0.08em" }, children: "Starting session..." })
        ] }),
        phase === "liveness" && sessionData && /* @__PURE__ */ jsx2("div", { style: { width: "100%", borderRadius: "16px", overflow: "hidden" }, children: /* @__PURE__ */ jsx2(
          FaceLivenessDetectorCore,
          {
            sessionId: sessionData.sessionId,
            region: sessionData.region,
            onAnalysisComplete: handleAnalysisComplete,
            onError: handleLivenessError,
            config: {
              credentialProvider,
              systemClockOffset: 0,
              faceModelUrl,
              binaryPath
            }
          }
        ) }),
        phase === "processing" && /* @__PURE__ */ jsx2(StatusCard, { icon: /* @__PURE__ */ jsx2(Spinner, {}), message: "Registering your face...", isDark }),
        phase === "success" && /* @__PURE__ */ jsx2(StatusCard, { icon: /* @__PURE__ */ jsx2("span", { style: { fontSize: "48px" }, children: "\u2713" }), iconColor: "#22c55e", message: "Face registered successfully.", isDark }),
        phase === "error" && /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px 0" }, children: [
          /* @__PURE__ */ jsx2("span", { style: { fontSize: "48px" }, children: "\u2717" }),
          /* @__PURE__ */ jsx2("p", { style: { margin: 0, fontSize: "12px", color: "#f87171", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }, children: errorMessage }),
          /* @__PURE__ */ jsx2(
            motion.button,
            {
              whileHover: { scale: 1.04 },
              whileTap: { scale: 0.97 },
              onClick: () => startSession(),
              style: { padding: "10px 28px", borderRadius: "999px", border: "2px solid #ef4444", background: "transparent", color: "#f87171", fontSize: "11px", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" },
              children: "Try Again"
            }
          )
        ] })
      ]
    }
  );
}
function StatusCard({ icon, iconColor = "inherit", message, isDark }) {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "40px 0" }, children: [
    /* @__PURE__ */ jsx2(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: "spring", stiffness: 260, damping: 20 }, style: { color: iconColor }, children: icon }),
    /* @__PURE__ */ jsx2("p", { style: { margin: 0, fontSize: "12px", color: isDark ? "#9ca3af" : "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" }, children: message })
  ] });
}
function Spinner() {
  return /* @__PURE__ */ jsx2(
    motion.div,
    {
      animate: { rotate: 360 },
      transition: { duration: 1, repeat: Infinity, ease: "linear" },
      style: { width: "32px", height: "32px", borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#6366f1", borderRightColor: "#6366f1" }
    }
  );
}

// lib/components/FaceLogin.jsx
import { useState as useState2, useEffect as useEffect3, useRef as useRef3, useCallback as useCallback2 } from "react";
import { motion as motion2 } from "framer-motion";
import { FaceLivenessDetectorCore as FaceLivenessDetectorCore2 } from "@aws-amplify/ui-react-liveness";
import "@aws-amplify/ui-react/styles.css";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var FRIENDLY_ERRORS2 = {
  NO_MATCH: "Face not recognised. Please try again or re-register.",
  NO_FACE_DETECTED: "No face detected. Please ensure your face is clearly visible.",
  NO_REFERENCE_IMAGE: "Could not capture your face. Please try again in better lighting.",
  LIVENESS_FAILED: "Liveness check failed. Please try again.",
  SESSION_EXPIRED: "Session expired. Please try again.",
  SESSION_CREATE_ERROR: "Could not start liveness session. Check your connection and try again.",
  MISSING_ROLE_ARN: "Server configuration error. Please contact support.",
  AWS_ERROR: "Something went wrong. Please try again."
};
function FaceLogin({
  collectionId,
  onSuccess,
  onError,
  sessionApiEndpoint = "/api/face-liveness-session",
  resultApiEndpoint = "/api/face-liveness-result",
  faceModelUrl,
  binaryPath,
  theme = "dark",
  className = ""
}) {
  const [phase, setPhase] = useState2("init");
  const [sessionData, setSessionData] = useState2(null);
  const [errorMessage, setErrorMessage] = useState2("");
  const [waveState, setWaveState] = useState2("idle");
  const [clockOffset, setClockOffset] = useState2(0);
  const isDark = theme === "dark";
  const handleError = useCallback2((error) => {
    setPhase("error");
    setWaveState("error");
    setErrorMessage(error.message);
    onError?.(error);
  }, [onError]);
  const startSession = useCallback2(async () => {
    setPhase("init");
    setErrorMessage("");
    setWaveState("scanning");
    try {
      const before = Date.now();
      const res = await fetch(sessionApiEndpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw { code: data.code, message: data.message };
      const rtt = Date.now() - before;
      setClockOffset(rtt > 5 * 60 * 1e3 ? rtt : 0);
      setSessionData(data);
      setPhase("liveness");
    } catch (err) {
      const code = err.code || "SESSION_CREATE_ERROR";
      handleError({ code, message: FRIENDLY_ERRORS2[code] || err.message });
    }
  }, [sessionApiEndpoint, handleError]);
  const startSessionRef = useRef3(startSession);
  useEffect3(() => {
    startSessionRef.current = startSession;
  });
  useEffect3(() => {
    const t = setTimeout(() => {
      startSessionRef.current();
    }, 0);
    return () => clearTimeout(t);
  }, []);
  async function handleAnalysisComplete() {
    setPhase("processing");
    setWaveState("scanning");
    try {
      const res = await fetch(resultApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionData.sessionId, collectionId, mode: "login" })
      });
      const data = await res.json();
      if (!res.ok) throw { code: data.code, message: data.message };
      setPhase("success");
      setWaveState("success");
      onSuccess?.(data);
    } catch (err) {
      const code = err.code || "AWS_ERROR";
      handleError({ code, message: FRIENDLY_ERRORS2[code] || err.message });
    }
  }
  function handleLivenessError(err) {
    if (err?.state === "CONNECTION_TIMEOUT" || err?.state === "SERVER_ERROR") {
      handleError({ code: "SESSION_EXPIRED", message: FRIENDLY_ERRORS2["SESSION_EXPIRED"] });
      return;
    }
    handleError({ code: err?.state || "LIVENESS_FAILED", message: FRIENDLY_ERRORS2["LIVENESS_FAILED"] });
  }
  const credentialProvider = async () => ({
    accessKeyId: sessionData.credentials.accessKeyId,
    secretAccessKey: sessionData.credentials.secretAccessKey,
    sessionToken: sessionData.credentials.sessionToken
  });
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      className,
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 24px",
        borderRadius: "24px",
        background: isDark ? "linear-gradient(145deg, #0d0d0d, #111827)" : "linear-gradient(145deg, #f9fafb, #ffffff)",
        border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
        boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.6)" : "0 25px 60px rgba(0,0,0,0.08)",
        maxWidth: "400px",
        width: "100%",
        boxSizing: "border-box",
        fontFamily: "monospace"
      },
      children: [
        /* @__PURE__ */ jsx3("p", { style: { margin: "0 0 8px 0", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: isDark ? "#6b7280" : "#9ca3af" }, children: "Face Login" }),
        /* @__PURE__ */ jsx3("div", { style: { width: "100%", marginBottom: "16px" }, children: /* @__PURE__ */ jsx3(SiriWave, { state: waveState, theme }) }),
        phase === "init" && /* @__PURE__ */ jsxs2("div", { style: { padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }, children: [
          /* @__PURE__ */ jsx3(Spinner2, {}),
          /* @__PURE__ */ jsx3("p", { style: { margin: 0, fontSize: "12px", color: isDark ? "#6b7280" : "#9ca3af", letterSpacing: "0.08em" }, children: "Starting session..." })
        ] }),
        phase === "liveness" && sessionData && /* @__PURE__ */ jsx3("div", { style: { width: "100%", borderRadius: "16px", overflow: "hidden" }, children: /* @__PURE__ */ jsx3(
          FaceLivenessDetectorCore2,
          {
            sessionId: sessionData.sessionId,
            region: sessionData.region,
            onAnalysisComplete: handleAnalysisComplete,
            onError: handleLivenessError,
            config: {
              credentialProvider,
              systemClockOffset: clockOffset,
              faceModelUrl,
              binaryPath
            }
          }
        ) }),
        phase === "processing" && /* @__PURE__ */ jsx3(StatusCard2, { icon: /* @__PURE__ */ jsx3(Spinner2, {}), message: "Verifying your identity...", isDark }),
        phase === "success" && /* @__PURE__ */ jsx3(StatusCard2, { icon: /* @__PURE__ */ jsx3("span", { style: { fontSize: "48px" }, children: "\u2713" }), iconColor: "#22c55e", message: "Identity verified.", isDark }),
        phase === "error" && /* @__PURE__ */ jsxs2("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px 0" }, children: [
          /* @__PURE__ */ jsx3("span", { style: { fontSize: "48px" }, children: "\u2717" }),
          /* @__PURE__ */ jsx3("p", { style: { margin: 0, fontSize: "12px", color: "#f87171", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }, children: errorMessage }),
          /* @__PURE__ */ jsx3(
            motion2.button,
            {
              whileHover: { scale: 1.04 },
              whileTap: { scale: 0.97 },
              onClick: () => startSession(),
              style: { padding: "10px 28px", borderRadius: "999px", border: "2px solid #ef4444", background: "transparent", color: "#f87171", fontSize: "11px", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" },
              children: "Try Again"
            }
          )
        ] })
      ]
    }
  );
}
function StatusCard2({ icon, iconColor = "inherit", message, isDark }) {
  return /* @__PURE__ */ jsxs2("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "40px 0" }, children: [
    /* @__PURE__ */ jsx3(motion2.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: "spring", stiffness: 260, damping: 20 }, style: { color: iconColor }, children: icon }),
    /* @__PURE__ */ jsx3("p", { style: { margin: 0, fontSize: "12px", color: isDark ? "#9ca3af" : "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" }, children: message })
  ] });
}
function Spinner2() {
  return /* @__PURE__ */ jsx3(
    motion2.div,
    {
      animate: { rotate: 360 },
      transition: { duration: 1, repeat: Infinity, ease: "linear" },
      style: { width: "32px", height: "32px", borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#6366f1", borderRightColor: "#6366f1" }
    }
  );
}
export {
  FaceLogin,
  FaceRegister
};
//# sourceMappingURL=index.mjs.map