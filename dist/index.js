"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/index.js
var index_exports = {};
__export(index_exports, {
  FaceLogin: () => FaceLogin,
  FaceRegister: () => FaceRegister
});
module.exports = __toCommonJS(index_exports);

// lib/components/FaceRegister.jsx
var import_react2 = require("react");
var import_framer_motion = require("framer-motion");
var import_ui_react_liveness = require("@aws-amplify/ui-react-liveness");
var import_styles = require("@aws-amplify/ui-react/styles.css");

// lib/components/internal/SiriWave.jsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
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
  const canvasRef = (0, import_react.useRef)(null);
  const animRef = (0, import_react.useRef)(null);
  const phaseRef = (0, import_react.useRef)(0);
  const currentAmplitudeRef = (0, import_react.useRef)(STATES.idle.amplitude);
  const currentSpeedRef = (0, import_react.useRef)(STATES.idle.speed);
  (0, import_react.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
var import_jsx_runtime2 = require("react/jsx-runtime");
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
  theme = "dark",
  className = ""
}) {
  const [phase, setPhase] = (0, import_react2.useState)("init");
  const [sessionData, setSessionData] = (0, import_react2.useState)(null);
  const [errorMessage, setErrorMessage] = (0, import_react2.useState)("");
  const [waveState, setWaveState] = (0, import_react2.useState)("idle");
  const clockOffsetRef = (0, import_react2.useRef)(0);
  const sessionStarted = (0, import_react2.useRef)(false);
  const isDark = theme === "dark";
  const handleError = (0, import_react2.useCallback)((error) => {
    setPhase("error");
    setWaveState("error");
    setErrorMessage(error.message);
    onError?.(error);
  }, [onError]);
  const startSession = (0, import_react2.useCallback)(async () => {
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
  (0, import_react2.useEffect)(() => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    const t = setTimeout(() => {
      startSession();
    }, 0);
    return () => clearTimeout(t);
  }, [startSession]);
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { margin: "0 0 8px 0", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: isDark ? "#6b7280" : "#9ca3af" }, children: "Face Registration" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { width: "100%", marginBottom: "16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SiriWave, { state: waveState, theme }) }),
        phase === "init" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { margin: 0, fontSize: "12px", color: isDark ? "#6b7280" : "#9ca3af", letterSpacing: "0.08em" }, children: "Starting session..." })
        ] }),
        phase === "liveness" && sessionData && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { width: "100%", borderRadius: "16px", overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          import_ui_react_liveness.FaceLivenessDetectorCore,
          {
            sessionId: sessionData.sessionId,
            region: sessionData.region,
            onAnalysisComplete: handleAnalysisComplete,
            onError: handleLivenessError,
            config: {
              credentialProvider,
              systemClockOffset: 0
            }
          }
        ) }),
        phase === "processing" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(StatusCard, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Spinner, {}), message: "Registering your face...", isDark }),
        phase === "success" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(StatusCard, { icon: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: "48px" }, children: "\u2713" }), iconColor: "#22c55e", message: "Face registered successfully.", isDark }),
        phase === "error" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px 0" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: "48px" }, children: "\u2717" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { margin: 0, fontSize: "12px", color: "#f87171", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }, children: errorMessage }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            import_framer_motion.motion.button,
            {
              whileHover: { scale: 1.04 },
              whileTap: { scale: 0.97 },
              onClick: () => {
                sessionStarted.current = false;
                startSession();
              },
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "40px 0" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_framer_motion.motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: "spring", stiffness: 260, damping: 20 }, style: { color: iconColor }, children: icon }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { margin: 0, fontSize: "12px", color: isDark ? "#9ca3af" : "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" }, children: message })
  ] });
}
function Spinner() {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    import_framer_motion.motion.div,
    {
      animate: { rotate: 360 },
      transition: { duration: 1, repeat: Infinity, ease: "linear" },
      style: { width: "32px", height: "32px", borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#6366f1", borderRightColor: "#6366f1" }
    }
  );
}

// lib/components/FaceLogin.jsx
var import_react3 = require("react");
var import_framer_motion2 = require("framer-motion");
var import_ui_react_liveness2 = require("@aws-amplify/ui-react-liveness");
var import_styles2 = require("@aws-amplify/ui-react/styles.css");
var import_jsx_runtime3 = require("react/jsx-runtime");
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
  theme = "dark",
  className = ""
}) {
  const [phase, setPhase] = (0, import_react3.useState)("init");
  const [sessionData, setSessionData] = (0, import_react3.useState)(null);
  const [errorMessage, setErrorMessage] = (0, import_react3.useState)("");
  const [waveState, setWaveState] = (0, import_react3.useState)("idle");
  const [clockOffset, setClockOffset] = (0, import_react3.useState)(0);
  const isDark = theme === "dark";
  const sessionStarted = (0, import_react3.useRef)(false);
  const handleError = (0, import_react3.useCallback)((error) => {
    setPhase("error");
    setWaveState("error");
    setErrorMessage(error.message);
    onError?.(error);
  }, [onError]);
  const startSession = (0, import_react3.useCallback)(async () => {
    sessionStarted.current = true;
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
  (0, import_react3.useEffect)(() => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    const t = setTimeout(() => {
      startSession();
    }, 0);
    return () => clearTimeout(t);
  }, [startSession]);
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
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { margin: "0 0 8px 0", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: isDark ? "#6b7280" : "#9ca3af" }, children: "Face Login" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { width: "100%", marginBottom: "16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SiriWave, { state: waveState, theme }) }),
        phase === "init" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Spinner2, {}),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { margin: 0, fontSize: "12px", color: isDark ? "#6b7280" : "#9ca3af", letterSpacing: "0.08em" }, children: "Starting session..." })
        ] }),
        phase === "liveness" && sessionData && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { width: "100%", borderRadius: "16px", overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          import_ui_react_liveness2.FaceLivenessDetectorCore,
          {
            sessionId: sessionData.sessionId,
            region: sessionData.region,
            onAnalysisComplete: handleAnalysisComplete,
            onError: handleLivenessError,
            config: {
              credentialProvider,
              systemClockOffset: clockOffset
            }
          }
        ) }),
        phase === "processing" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(StatusCard2, { icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Spinner2, {}), message: "Verifying your identity...", isDark }),
        phase === "success" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(StatusCard2, { icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: "48px" }, children: "\u2713" }), iconColor: "#22c55e", message: "Identity verified.", isDark }),
        phase === "error" && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px 0" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: "48px" }, children: "\u2717" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { margin: 0, fontSize: "12px", color: "#f87171", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }, children: errorMessage }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_framer_motion2.motion.button,
            {
              whileHover: { scale: 1.04 },
              whileTap: { scale: 0.97 },
              onClick: () => {
                sessionStarted.current = false;
                startSession();
              },
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
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "40px 0" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_framer_motion2.motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: "spring", stiffness: 260, damping: 20 }, style: { color: iconColor }, children: icon }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { margin: 0, fontSize: "12px", color: isDark ? "#9ca3af" : "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" }, children: message })
  ] });
}
function Spinner2() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    import_framer_motion2.motion.div,
    {
      animate: { rotate: 360 },
      transition: { duration: 1, repeat: Infinity, ease: "linear" },
      style: { width: "32px", height: "32px", borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#6366f1", borderRightColor: "#6366f1" }
    }
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FaceLogin,
  FaceRegister
});
//# sourceMappingURL=index.js.map