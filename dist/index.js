var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/index.js
var index_exports = {};
__export(index_exports, {
  FaceLogin: () => FaceLogin,
  FaceRegister: () => FaceRegister,
  faceLivenessResultHandler: () => faceLivenessResultHandler,
  faceLivenessSessionHandler: () => faceLivenessSessionHandler
});
module.exports = __toCommonJS(index_exports);

// lib/components/FaceRegister.jsx
var import_react2 = require("react");
var import_framer_motion = require("framer-motion");
var import_ui_react_liveness = require("@aws-amplify/ui-react-liveness");

// lib/components/internal/SiriWave.jsx
var import_react = require("react");
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
  return /* @__PURE__ */ React.createElement(
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
    onError == null ? void 0 : onError(error);
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
      onSuccess == null ? void 0 : onSuccess(data);
    } catch (err) {
      const code = err.code || "AWS_ERROR";
      handleError({ code, message: FRIENDLY_ERRORS[code] || err.message });
    }
  }
  function handleLivenessError(err) {
    if ((err == null ? void 0 : err.state) === "CONNECTION_TIMEOUT" || (err == null ? void 0 : err.state) === "SERVER_ERROR") {
      handleError({ code: "SESSION_EXPIRED", message: FRIENDLY_ERRORS["SESSION_EXPIRED"] });
      return;
    }
    handleError({ code: (err == null ? void 0 : err.state) || "LIVENESS_FAILED", message: FRIENDLY_ERRORS["LIVENESS_FAILED"] });
  }
  const credentialProvider = async () => ({
    accessKeyId: sessionData.credentials.accessKeyId,
    secretAccessKey: sessionData.credentials.secretAccessKey,
    sessionToken: sessionData.credentials.sessionToken
  });
  return /* @__PURE__ */ React.createElement(
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
      }
    },
    /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 8px 0", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: isDark ? "#6b7280" : "#9ca3af" } }, "Face Registration"),
    /* @__PURE__ */ React.createElement("div", { style: { width: "100%", marginBottom: "16px" } }, /* @__PURE__ */ React.createElement(SiriWave, { state: waveState, theme })),
    phase === "init" && /* @__PURE__ */ React.createElement("div", { style: { padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" } }, /* @__PURE__ */ React.createElement(Spinner, null), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: "12px", color: isDark ? "#6b7280" : "#9ca3af", letterSpacing: "0.08em" } }, "Starting session...")),
    phase === "liveness" && sessionData && /* @__PURE__ */ React.createElement("div", { style: { width: "100%", borderRadius: "16px", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(
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
    )),
    phase === "processing" && /* @__PURE__ */ React.createElement(StatusCard, { icon: /* @__PURE__ */ React.createElement(Spinner, null), message: "Registering your face...", isDark }),
    phase === "success" && /* @__PURE__ */ React.createElement(StatusCard, { icon: /* @__PURE__ */ React.createElement("span", { style: { fontSize: "48px" } }, "\u2713"), iconColor: "#22c55e", message: "Face registered successfully.", isDark }),
    phase === "error" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px 0" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "48px" } }, "\u2717"), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: "12px", color: "#f87171", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 } }, errorMessage), /* @__PURE__ */ React.createElement(
      import_framer_motion.motion.button,
      {
        whileHover: { scale: 1.04 },
        whileTap: { scale: 0.97 },
        onClick: () => {
          sessionStarted.current = false;
          startSession();
        },
        style: { padding: "10px 28px", borderRadius: "999px", border: "2px solid #ef4444", background: "transparent", color: "#f87171", fontSize: "11px", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }
      },
      "Try Again"
    ))
  );
}
function StatusCard({ icon, iconColor = "inherit", message, isDark }) {
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "40px 0" } }, /* @__PURE__ */ React.createElement(import_framer_motion.motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: "spring", stiffness: 260, damping: 20 }, style: { color: iconColor } }, icon), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: "12px", color: isDark ? "#9ca3af" : "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" } }, message));
}
function Spinner() {
  return /* @__PURE__ */ React.createElement(
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
    onError == null ? void 0 : onError(error);
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
      onSuccess == null ? void 0 : onSuccess(data);
    } catch (err) {
      const code = err.code || "AWS_ERROR";
      handleError({ code, message: FRIENDLY_ERRORS2[code] || err.message });
    }
  }
  function handleLivenessError(err) {
    if ((err == null ? void 0 : err.state) === "CONNECTION_TIMEOUT" || (err == null ? void 0 : err.state) === "SERVER_ERROR") {
      handleError({ code: "SESSION_EXPIRED", message: FRIENDLY_ERRORS2["SESSION_EXPIRED"] });
      return;
    }
    handleError({ code: (err == null ? void 0 : err.state) || "LIVENESS_FAILED", message: FRIENDLY_ERRORS2["LIVENESS_FAILED"] });
  }
  const credentialProvider = async () => ({
    accessKeyId: sessionData.credentials.accessKeyId,
    secretAccessKey: sessionData.credentials.secretAccessKey,
    sessionToken: sessionData.credentials.sessionToken
  });
  return /* @__PURE__ */ React.createElement(
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
      }
    },
    /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 8px 0", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: isDark ? "#6b7280" : "#9ca3af" } }, "Face Login"),
    /* @__PURE__ */ React.createElement("div", { style: { width: "100%", marginBottom: "16px" } }, /* @__PURE__ */ React.createElement(SiriWave, { state: waveState, theme })),
    phase === "init" && /* @__PURE__ */ React.createElement("div", { style: { padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" } }, /* @__PURE__ */ React.createElement(Spinner2, null), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: "12px", color: isDark ? "#6b7280" : "#9ca3af", letterSpacing: "0.08em" } }, "Starting session...")),
    phase === "liveness" && sessionData && /* @__PURE__ */ React.createElement("div", { style: { width: "100%", borderRadius: "16px", overflow: "hidden" } }, /* @__PURE__ */ React.createElement(
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
    )),
    phase === "processing" && /* @__PURE__ */ React.createElement(StatusCard2, { icon: /* @__PURE__ */ React.createElement(Spinner2, null), message: "Verifying your identity...", isDark }),
    phase === "success" && /* @__PURE__ */ React.createElement(StatusCard2, { icon: /* @__PURE__ */ React.createElement("span", { style: { fontSize: "48px" } }, "\u2713"), iconColor: "#22c55e", message: "Identity verified.", isDark }),
    phase === "error" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px 0" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "48px" } }, "\u2717"), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: "12px", color: "#f87171", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 } }, errorMessage), /* @__PURE__ */ React.createElement(
      import_framer_motion2.motion.button,
      {
        whileHover: { scale: 1.04 },
        whileTap: { scale: 0.97 },
        onClick: () => {
          sessionStarted.current = false;
          startSession();
        },
        style: { padding: "10px 28px", borderRadius: "999px", border: "2px solid #ef4444", background: "transparent", color: "#f87171", fontSize: "11px", fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }
      },
      "Try Again"
    ))
  );
}
function StatusCard2({ icon, iconColor = "inherit", message, isDark }) {
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "40px 0" } }, /* @__PURE__ */ React.createElement(import_framer_motion2.motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: "spring", stiffness: 260, damping: 20 }, style: { color: iconColor } }, icon), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: "12px", color: isDark ? "#9ca3af" : "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" } }, message));
}
function Spinner2() {
  return /* @__PURE__ */ React.createElement(
    import_framer_motion2.motion.div,
    {
      animate: { rotate: 360 },
      transition: { duration: 1, repeat: Infinity, ease: "linear" },
      style: { width: "32px", height: "32px", borderRadius: "50%", border: "3px solid transparent", borderTopColor: "#6366f1", borderRightColor: "#6366f1" }
    }
  );
}

// lib/handlers/faceLivenessSessionHandler.js
var import_client_rekognition2 = require("@aws-sdk/client-rekognition");
var import_client_sts = require("@aws-sdk/client-sts");

// lib/lib/rekognitionClient.js
var import_client_rekognition = require("@aws-sdk/client-rekognition");
function getClient() {
  return new import_client_rekognition.RekognitionClient({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.AWS_REGION || "us-east-1"
  });
}
async function ensureCollection(collectionId) {
  const client = getClient();
  try {
    await client.send(new import_client_rekognition.CreateCollectionCommand({ CollectionId: collectionId }));
  } catch (err) {
    if (err.name === "ResourceAlreadyExistsException") return;
    throw err;
  }
}

// lib/handlers/faceLivenessSessionHandler.js
async function faceLivenessSessionHandler(req) {
  try {
    const region = process.env.AWS_REGION || "us-east-1";
    const roleArn = process.env.AWS_LIVENESS_ROLE_ARN;
    if (!roleArn) {
      return jsonResponse(500, {
        code: "MISSING_ROLE_ARN",
        message: "AWS_LIVENESS_ROLE_ARN is not set. See face-auth-kit setup docs."
      });
    }
    const rekognition = getClient();
    const sessionRes = await rekognition.send(
      new import_client_rekognition2.CreateFaceLivenessSessionCommand({
        Settings: {
          // FaceMovementChallenge = just look at camera, no coloured lights
          // FaceMovementAndLightChallenge = coloured light flashes (default, more secure)
          ChallengePreferences: [{ Type: "FaceMovementAndLightChallenge" }]
        }
      })
    );
    const sessionId = sessionRes.SessionId;
    const sts = new import_client_sts.STSClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      region
    });
    const assumeRes = await sts.send(
      new import_client_sts.AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: `face-liveness-${sessionId}`,
        DurationSeconds: 900
      })
    );
    const creds = assumeRes.Credentials;
    return jsonResponse(200, {
      sessionId,
      region,
      credentials: {
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken: creds.SessionToken
      }
    });
  } catch (err) {
    console.error("[face-auth-kit] faceLivenessSessionHandler error:", err);
    return jsonResponse(500, {
      code: "SESSION_CREATE_ERROR",
      message: "Failed to create liveness session. Please try again."
    });
  }
}
function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// lib/handlers/faceLivenessResultHandler.js
var import_client_rekognition3 = require("@aws-sdk/client-rekognition");
async function faceLivenessResultHandler(req) {
  var _a, _b, _c;
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse2(400, { code: "INVALID_REQUEST", message: "Request body must be JSON." });
  }
  const { sessionId, collectionId, mode } = body;
  if (!sessionId) return jsonResponse2(400, { code: "MISSING_SESSION_ID", message: "No sessionId provided." });
  if (!mode) return jsonResponse2(400, { code: "MISSING_MODE", message: 'mode must be "register" or "login".' });
  try {
    const client = getClient();
    const livenessRes = await client.send(
      new import_client_rekognition3.GetFaceLivenessSessionResultsCommand({ SessionId: sessionId })
    );
    if (livenessRes.Status !== "SUCCEEDED") {
      return jsonResponse2(400, {
        code: "LIVENESS_FAILED",
        message: "Liveness check did not succeed. Please try again."
      });
    }
    const livenessConfidence = livenessRes.Confidence;
    const referenceImageBytes = (_a = livenessRes.ReferenceImage) == null ? void 0 : _a.Bytes;
    if (!referenceImageBytes) {
      return jsonResponse2(400, {
        code: "NO_REFERENCE_IMAGE",
        message: "Could not extract face image from liveness session. Please try again."
      });
    }
    if (mode === "register") {
      if (!collectionId) return jsonResponse2(400, { code: "MISSING_COLLECTION", message: "No collectionId provided." });
      await ensureCollection(collectionId);
      const { IndexFacesCommand } = await import("@aws-sdk/client-rekognition");
      const indexRes = await client.send(new IndexFacesCommand({
        CollectionId: collectionId,
        Image: { Bytes: referenceImageBytes },
        MaxFaces: 1,
        QualityFilter: "MEDIUM",
        DetectionAttributes: ["ALL"]
      }));
      if (!indexRes.FaceRecords || indexRes.FaceRecords.length === 0) {
        return jsonResponse2(400, {
          code: "NO_FACE_DETECTED",
          message: "No face detected in the liveness image. Please try again in better lighting."
        });
      }
      const record = indexRes.FaceRecords[0];
      return jsonResponse2(200, {
        livenessConfidence,
        faceId: record.Face.FaceId,
        confidence: record.Face.Confidence,
        faceDetails: {
          ageRange: ((_b = record.FaceDetail) == null ? void 0 : _b.AgeRange) || null,
          quality: ((_c = record.FaceDetail) == null ? void 0 : _c.Quality) || null
        }
      });
    }
    if (mode === "login") {
      if (!collectionId) return jsonResponse2(400, { code: "MISSING_COLLECTION", message: "No collectionId provided." });
      await ensureCollection(collectionId);
      const searchRes = await client.send(new import_client_rekognition3.SearchFacesByImageCommand({
        CollectionId: collectionId,
        Image: { Bytes: referenceImageBytes },
        MaxFaces: 1,
        FaceMatchThreshold: 0,
        // consumer decides threshold
        QualityFilter: "MEDIUM"
      }));
      if (!searchRes.FaceMatches || searchRes.FaceMatches.length === 0) {
        return jsonResponse2(400, {
          code: "NO_MATCH",
          message: "No matching face found."
        });
      }
      const match = searchRes.FaceMatches[0];
      return jsonResponse2(200, {
        livenessConfidence,
        faceId: match.Face.FaceId,
        similarity: match.Similarity,
        confidence: match.Face.Confidence
      });
    }
    return jsonResponse2(400, { code: "INVALID_MODE", message: 'mode must be "register" or "login".' });
  } catch (err) {
    console.error("[face-auth-kit] faceLivenessResultHandler error:", err);
    if (err.name === "SessionNotFoundException") {
      return jsonResponse2(400, {
        code: "SESSION_EXPIRED",
        message: "Liveness session expired or not found. Please try again."
      });
    }
    if (err.name === "InvalidParameterException") {
      return jsonResponse2(400, {
        code: "NO_FACE_DETECTED",
        message: "No face detected. Please ensure your face is clearly visible."
      });
    }
    return jsonResponse2(500, {
      code: "AWS_ERROR",
      message: "An error occurred. Please try again."
    });
  }
}
function jsonResponse2(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FaceLogin,
  FaceRegister,
  faceLivenessResultHandler,
  faceLivenessSessionHandler
});
//# sourceMappingURL=index.js.map