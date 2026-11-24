"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  memo,
  useCallback,
  type KeyboardEvent,
  type ComponentProps,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  AudioLines,
  ArrowUp,
  CircleStop,
  Loader2,
  Mic,
  Video,
  VideoOff,
  Camera,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  GraduationCap,
  BookOpen,
  UserCheck,
  Terminal,
  Play,
} from "lucide-react";
import { executeJavaCode, type JavaCodeRunResult } from "@/lib/javaBackendClient";

export interface ClassroomContextData {
  _id?: string;
  name?: string;
  subject?: string;
  code?: string;
  professorName?: string;
  professorEmail?: string;
  students?: string[];
}

export interface TabsDemoProps {
  role?: "student" | "professor";
  userName?: string;
  userEmail?: string;
  activeClassroom?: ClassroomContextData | null;
  classrooms?: ClassroomContextData[];
}

// Minimal local chat-message primitives
function MessageGroup({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}

function Message({
  align = "start",
  className,
  ...props
}: ComponentProps<"div"> & { align?: "start" | "end" }) {
  return (
    <div
      className={cn(
        "flex w-full",
        align === "end" ? "justify-end" : "justify-start",
        className,
      )}
      {...props}
    />
  );
}

function MessageContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("max-w-[90%]", className)} {...props} />;
}

function Bubble({
  variant = "default",
  className,
  ...props
}: ComponentProps<"div"> & {
  variant?: "default" | "muted" | "ghost";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        variant === "muted" && "bg-muted text-foreground",
        variant === "ghost" && "bg-transparent",
        variant === "default" && "bg-primary text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

function BubbleContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={className} {...props} />;
}

function Marker({ className, ...props }: ComponentProps<"div">) {
  return <div className={className} {...props} />;
}

function MarkerContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={className} {...props} />;
}

const WAVE_BARS = [
  12, 8, 4, 20, 8, 20, 8, 8, 12, 8, 24, 8, 20, 28, 20, 32, 24, 8, 12, 8, 8, 20,
  8, 20, 8, 8, 12, 20, 12, 20, 28, 8, 28, 12, 20, 20, 12, 8, 4, 20, 8, 20, 8, 8,
  12, 12, 8, 4, 20, 8, 20, 8, 8, 12, 8, 24, 8, 28, 32, 24, 8, 12, 8, 8, 20, 8,
  20, 8, 12, 20, 12, 20, 28, 8, 28, 12, 20, 20, 12, 4, 20, 8, 20, 8, 8, 12,
];

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const wordVariants: any = {
  hidden: { opacity: 0, y: 2 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.12,
      ease: "easeOut",
    },
  },
};

const waveBarVariants: any = {
  recording: (index: number) => ({
    scaleY: [0.35, 1, 0.35],
    transition: {
      duration: 0.9,
      repeat: Infinity,
      ease: "easeInOut",
      delay: (index % 12) * 0.04,
    },
  }),
  speaking: (index: number) => ({
    scaleY: [0.4, 0.85, 0.4],
    transition: {
      duration: 0.7,
      repeat: Infinity,
      ease: "easeInOut",
      delay: (index % 8) * 0.05,
    },
  }),
  idle: {
    scaleY: 0.25,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

type ChatStatus = "idle" | "thinking" | "answered";

interface ChatInputProps {
  onSend: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
}

const ChatInput = memo(({ onSend, disabled, placeholder }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <InputGroup className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 h-auto shadow-xs">
      <InputGroupInput
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Ask your question..."}
        className="w-full bg-transparent border-0 h-auto p-0 shadow-none outline-none focus-visible:ring-0 text-xs text-white placeholder:text-[#8a8a8f] disabled:opacity-60 focus-visible:border-0"
      />
      <Button
        type="button"
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        size="icon-xs"
        className="rounded-full size-6 p-0 bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer disabled:opacity-40"
        aria-label="Send message"
      >
        {disabled ? (
          <Loader2 className="size-3 animate-spin text-white" />
        ) : (
          <ArrowUp className="size-3.5 text-white" />
        )}
      </Button>
    </InputGroup>
  );
});

ChatInput.displayName = "ChatInput";

/* ──────────────────────────────────────────────────────────────────────────────
   1. CHAT PANEL
   ────────────────────────────────────────────────────────────────────────────── */
function ChatPanel({
  role,
  userName,
  userEmail,
  activeClassroom,
  classrooms,
}: TabsDemoProps) {
  const [sentQuestion, setSentQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatStatus>("idle");

  const isProf = role === "professor";

  const handleSend = async (question: string) => {
    if (status === "thinking") return;

    setSentQuestion(question);
    setStatus("thinking");
    setAnswer(null);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: question,
          mode: "chat",
          role: isProf ? "professor" : "student",
          userName,
          userEmail,
          activeClassroom,
          classrooms,
        }),
      });
      const data = await res.json();
      setAnswer(
        data.text ||
          (isProf
            ? "I am ready to help you manage classrooms, check student performance, or draft materials."
            : "I am ready to help you with your coursework!"),
      );
    } catch {
      setAnswer("I could not process your request right now. Please try again in a moment.");
    } finally {
      setStatus("answered");
    }
  };

  const studentPresets = [
    "Explain concept simply",
    "Practice doubt / problem",
    "Formula summary",
    "Exam study guide",
  ];

  const profPresets = [
    "Summarize class progress",
    "Show enrolled students",
    "Generate 3 quiz questions",
    "Draft announcement",
  ];

  const presets = isProf ? profPresets : studentPresets;
  const answerWords = (answer || "").split(" ");

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex w-full flex-col gap-4 p-4"
    >
      <MessageGroup className="flex min-h-32 w-full flex-col justify-start gap-3 max-h-[260px] overflow-y-auto pr-1">
        {!sentQuestion && status === "idle" && (
          <div className="flex flex-col items-center justify-center py-5 text-center gap-2 text-[#8a8a8f]">
            <div className="size-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              {isProf ? <GraduationCap className="size-4" /> : <Sparkles className="size-4 animate-pulse" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                {isProf ? "Professor Teaching Copilot" : "Student Study Companion"}
              </p>
              <p className="text-[11px] text-[#8a8a8f]">
                {isProf
                  ? activeClassroom?.name
                    ? `Managing: ${activeClassroom.name} (${activeClassroom.subject})`
                    : "Ask about classroom details, student stats, or teaching materials"
                  : activeClassroom?.name
                  ? `Class: ${activeClassroom.name} · Ask any doubt or concept`
                  : "Ask anything about your courses, homework, or revisions"}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center mt-2">
              {presets.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {sentQuestion && (
            <motion.div
              key={sentQuestion}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex w-full"
            >
              <Message align="end">
                <MessageContent>
                  <Bubble variant="muted" className="rounded-2xl bg-indigo-600/30 border border-indigo-500/30">
                    <BubbleContent className="text-xs text-white px-3 py-1.5 rounded-2xl">
                      {sentQuestion}
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full">
          <AnimatePresence mode="wait">
            {status === "thinking" && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-1.5"
              >
                <Marker className="flex items-center gap-2">
                  <Loader2 className="size-3 animate-spin text-indigo-400" />
                  <MarkerContent>
                    <span className="text-xs text-white/60 font-medium">
                      Thinking...
                    </span>
                  </MarkerContent>
                </Marker>
              </motion.div>
            )}

            {status === "answered" && answer && (
              <motion.div
                key="answer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <Message align="start">
                  <MessageContent>
                    <Bubble variant="ghost" className="max-w-full">
                      <BubbleContent className="text-xs leading-relaxed text-white/90 bg-white/[0.03] border border-white/10 p-3 rounded-2xl whitespace-pre-line">
                        <motion.span
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                          className="inline"
                        >
                          {answerWords.map((word, index) => (
                            <Fragment key={index}>
                              <motion.span
                                variants={wordVariants}
                                className="inline-block"
                              >
                                {word}
                              </motion.span>{" "}
                            </Fragment>
                          ))}
                        </motion.span>
                      </BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MessageGroup>

      <ChatInput
        onSend={handleSend}
        disabled={status === "thinking"}
        placeholder={
          isProf
            ? "Ask classroom details or request teaching materials..."
            : "Ask any doubt, concept, or homework guidance..."
        }
      />
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   2. VOICE PANEL (Speech-to-Text & Text-to-Speech)
   ────────────────────────────────────────────────────────────────────────────── */
function VoicePanel({
  role,
  userName,
  userEmail,
  activeClassroom,
  classrooms,
}: TabsDemoProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "answered">("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const isProf = role === "professor";
  const recognitionRef = useRef<any>(null);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*_#`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice =
      voices.find((v) => v.lang.startsWith("en") && !v.name.includes("Google")) ||
      voices[0];
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    return () => {
      stopSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, [stopSpeech]);

  const handleVoiceQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setStatus("thinking");
    setAiResponse(null);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: queryText,
          mode: "voice",
          role: isProf ? "professor" : "student",
          userName,
          userEmail,
          activeClassroom,
          classrooms,
        }),
      });
      const data = await res.json();
      const responseText =
        data.text ||
        (isProf
          ? "Here are the classroom details you requested."
          : "Here is your study guidance.");
      setAiResponse(responseText);
      setStatus("answered");
      speakText(responseText);
    } catch {
      const errText = "I could not process the voice request. Please try again.";
      setAiResponse(errText);
      setStatus("answered");
      speakText(errText);
    }
  };

  const startListening = () => {
    setVoiceError(null);
    stopSpeech();

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.",
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
        setStatus("listening");
        setTranscript("");
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setVoiceError(
            "Microphone access was denied. Please allow microphone permission in your browser.",
          );
        }
        setIsRecording(false);
        setStatus("idle");
      };

      recognition.onend = () => {
        setIsRecording(false);
        setTranscript((latest) => {
          if (latest.trim()) {
            handleVoiceQuery(latest.trim());
          } else {
            setStatus("idle");
          }
          return latest;
        });
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      setVoiceError("Could not access microphone.");
      setIsRecording(false);
      setStatus("idle");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    setIsRecording(false);
  };

  const isWaveActive = isRecording || isSpeaking;

  return (
    <motion.div
      key="voice"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full p-4 flex flex-col items-center gap-4"
    >
      {/* Wave Visualizer */}
      <div className="flex h-14 w-full items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 px-4 relative overflow-hidden">
        <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
          {WAVE_BARS.slice(0, 36).map((height, index) => (
            <motion.span
              key={index}
              custom={index}
              variants={waveBarVariants}
              animate={
                isRecording ? "recording" : isSpeaking ? "speaking" : "idle"
              }
              className={cn(
                "w-1 shrink-0 rounded-full transition-colors duration-300",
                isRecording
                  ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                  : isSpeaking
                  ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]"
                  : "bg-white/20",
              )}
              style={{
                height: Math.min(height, 36),
                originY: 0.5,
              }}
            />
          ))}
        </div>

        {/* Status Indicator */}
        <div className="absolute top-1.5 right-2 flex items-center gap-1.5">
          <span
            className={cn(
              "size-1.5 rounded-full",
              isWaveActive ? "bg-emerald-400 animate-ping" : "bg-white/30",
            )}
          />
          <span className="text-[10px] text-white/50 font-medium">
            {isRecording ? "Listening" : isSpeaking ? "Speaking" : "Ready"}
          </span>
        </div>
      </div>

      {/* Live Transcript / Response Card */}
      <div className="w-full min-h-[90px] max-h-[140px] overflow-y-auto rounded-2xl bg-white/[0.02] border border-white/10 p-3 flex flex-col justify-center">
        {status === "listening" && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">
              Live Speech
            </span>
            <p className="text-xs text-white italic">
              {transcript || "Speak now, I am listening..."}
            </p>
          </div>
        )}

        {status === "thinking" && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="size-4 animate-spin text-indigo-400" />
            <span className="text-xs text-white/70 font-medium">
              AI Voice is processing...
            </span>
          </div>
        )}

        {status === "answered" && aiResponse && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                {isProf ? "Professor Copilot Voice" : "Study Guide Voice"}
              </span>
              <button
                onClick={() => (isSpeaking ? stopSpeech() : speakText(aiResponse))}
                className="p-1 text-white/60 hover:text-white transition-colors cursor-pointer"
                title={isSpeaking ? "Mute" : "Play Aloud"}
              >
                {isSpeaking ? (
                  <VolumeX className="size-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="size-3.5" />
                )}
              </button>
            </div>
            <p className="text-xs text-white/90 leading-relaxed">{aiResponse}</p>
          </div>
        )}

        {status === "idle" && !voiceError && (
          <p className="text-xs text-center text-white/50">
            {isProf
              ? 'Press Start and speak: e.g. "Summarize class progress" or "List enrolled students"'
              : 'Press Start and speak: e.g. "Explain binary trees" or "Help with my question"'}
          </p>
        )}

        {voiceError && (
          <p className="text-xs text-rose-400 text-center">{voiceError}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={isRecording ? stopListening : startListening}
          size="sm"
          className={cn(
            "rounded-full h-8 px-4 text-xs gap-1.5 flex items-center justify-center transition-all cursor-pointer font-medium shadow-md",
            isRecording
              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20",
          )}
          aria-label={isRecording ? "Stop voice input" : "Start voice input"}
        >
          {isRecording ? (
            <>
              <CircleStop className="size-3.5 text-white animate-pulse" />
              <span>Stop Listening</span>
            </>
          ) : (
            <>
              <Mic className="size-3.5 text-white" />
              <span>{status === "answered" ? "Ask Again" : "Start Voice"}</span>
            </>
          )}
        </Button>

        {aiResponse && (
          <Button
            type="button"
            variant="outline"
            onClick={() => speakText(aiResponse)}
            size="sm"
            className="rounded-full h-8 px-3 text-xs gap-1.5 border-white/10 bg-white/5 text-white hover:bg-white/10 cursor-pointer"
            aria-label="Replay voice response"
          >
            <RotateCcw className="size-3 text-white/70" />
            <span>Replay</span>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   3. VIDEO PANEL (Live Camera Feed & Vision AI)
   ────────────────────────────────────────────────────────────────────────────── */
function VideoPanel({
  role,
  userName,
  userEmail,
  activeClassroom,
  classrooms,
}: TabsDemoProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const isProf = role === "professor";
  const defaultPrompt = isProf
    ? "Review and summarize the diagram, notes, or whiteboard content in this frame"
    : "Explain the educational concept or problem visible in this camera frame";

  const [selectedPrompt, setSelectedPrompt] = useState(defaultPrompt);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraLoading(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setCameraError(
          "Camera permission was denied. Please allow camera access in your browser settings.",
        );
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        setCameraError("No camera device was detected on your device.");
      } else {
        setCameraError(
          "Could not connect to camera: " + (err.message || "Unknown error"),
        );
      }
      setIsCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const captureAndAnalyze = async (promptToUse?: string) => {
    const activePrompt = promptToUse || selectedPrompt;
    if (!videoRef.current || !isCameraActive) {
      setCameraError("Please start the camera first to capture and analyze.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setCameraError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas context.");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePrompt,
          mode: "vision",
          role: isProf ? "professor" : "student",
          userName,
          userEmail,
          activeClassroom,
          classrooms,
          image: dataUrl,
          mimeType: "image/jpeg",
        }),
      });

      const data = await res.json();
      setAnalysisResult(data.text || "Visual frame analyzed successfully.");
    } catch (err: any) {
      console.error("Vision analysis error:", err);
      setAnalysisResult(
        "Could not complete visual analysis. Please ensure good lighting and try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const studentVisionPresets = [
    {
      label: "Explain Diagram",
      prompt:
        "Identify and explain the diagram or chart shown in this camera frame.",
    },
    {
      label: "Check Notes",
      prompt:
        "Summarize the handwritten or printed notes in this frame and list key takeaways.",
    },
    {
      label: "Solve Equation",
      prompt:
        "Extract and step-by-step solve the equation or problem visible on camera.",
    },
  ];

  const profVisionPresets = [
    {
      label: "Review Whiteboard",
      prompt:
        "Extract key concepts, formulas, and notes written on this whiteboard/slide.",
    },
    {
      label: "Verify Solution",
      prompt:
        "Check this student work or solution for correctness and highlight any errors.",
    },
    {
      label: "Generate Quiz Question",
      prompt:
        "Create 2 multiple-choice quiz questions based on the content visible on this camera frame.",
    },
  ];

  const visionPresets = isProf ? profVisionPresets : studentVisionPresets;

  return (
    <motion.div
      key="video"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full p-4 flex flex-col items-center gap-3"
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Viewport */}
      <div className="relative w-full h-44 rounded-2xl bg-black/80 border border-white/10 overflow-hidden flex items-center justify-center group shadow-inner">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isCameraActive ? "opacity-100" : "opacity-0",
          )}
        />

        {isAnalyzing && (
          <motion.div
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.8)] z-20 pointer-events-none"
          />
        )}

        {/* Status Badge */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
          <span
            className={cn(
              "size-2 rounded-full",
              isCameraActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-500",
            )}
          />
          <span className="text-[10px] text-white/80 font-medium">
            {isCameraActive ? "LIVE AI VISION" : "CAMERA OFF"}
          </span>
        </div>

        {/* Camera Inactive State */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center gap-2 z-10">
            {cameraLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-6 text-indigo-400 animate-spin" />
                <span className="text-xs text-white/70">Connecting camera...</span>
              </div>
            ) : (
              <>
                <div className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <VideoOff className="size-5 text-white/40" />
                </div>
                <p className="text-xs text-white/60">
                  {isProf
                    ? "Scan whiteboard, lecture slides, or student papers for instant analysis."
                    : "Scan handwritten notes, textbook diagrams, or formulas."}
                </p>
                <Button
                  onClick={startCamera}
                  size="sm"
                  className="rounded-full h-7 px-3.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md"
                >
                  <Video className="size-3.5 mr-1" />
                  Enable Camera
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {cameraError && (
        <p className="text-[11px] text-rose-400 text-center px-2">{cameraError}</p>
      )}

      {/* Quick Analysis Presets & Controls */}
      {isCameraActive && (
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center gap-1.5 justify-between">
            <Button
              type="button"
              onClick={() => captureAndAnalyze()}
              disabled={isAnalyzing}
              size="sm"
              className="flex-1 rounded-full h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin text-white" />
                  Analyzing Frame...
                </>
              ) : (
                <>
                  <Camera className="size-3.5 mr-1.5 text-white" />
                  Analyze Live Frame
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={stopCamera}
              size="sm"
              className="rounded-full h-8 px-3 text-xs border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <VideoOff className="size-3.5" />
            </Button>
          </div>

          <div
            className="flex gap-1.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {visionPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setSelectedPrompt(preset.prompt);
                  captureAndAnalyze(preset.prompt);
                }}
                disabled={isAnalyzing}
                className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Result Card */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-h-[120px] overflow-y-auto rounded-2xl bg-white/[0.03] border border-white/10 p-3 flex flex-col gap-1 text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="size-3" /> AI Vision Analysis
            </span>
          </div>
          <p className="text-xs text-white/90 leading-relaxed whitespace-pre-line">
            {analysisResult}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   4. JAVA CODE EXECUTION SANDBOX PANEL
   ────────────────────────────────────────────────────────────────────────────── */
function JavaPanel() {
  const [code, setCode] = useState(
`public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello from Learn X Java Sandbox!");
        
        // Calculate Fibonacci numbers
        int n = 8;
        int a = 0, b = 1;
        System.out.print("Fibonacci (" + n + " terms): ");
        for (int i = 0; i < n; i++) {
            System.out.print(a + " ");
            int sum = a + b;
            a = b;
            b = sum;
        }
        System.out.println();
    }
}`
  );
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<JavaCodeRunResult | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await executeJavaCode(code);
      setResult(res);
    } catch (e: any) {
      setResult({
        success: false,
        stdout: "",
        stderr: e.message || "Failed to execute Java code",
        exitCode: -1,
        executionTimeMs: 0,
        error: e.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const samplePresets = [
    {
      label: "Fibonacci",
      code: `public class Main {\n    public static void main(String[] args) {\n        int n = 10, a = 0, b = 1;\n        System.out.print("Fibonacci: ");\n        for (int i = 0; i < n; i++) {\n            System.out.print(a + " ");\n            int next = a + b;\n            a = b;\n            b = next;\n        }\n        System.out.println();\n    }\n}`,
    },
    {
      label: "Binary Search",
      code: `public class Main {\n    public static int binarySearch(int[] arr, int target) {\n        int low = 0, high = arr.length - 1;\n        while (low <= high) {\n            int mid = low + (high - low) / 2;\n            if (arr[mid] == target) return mid;\n            if (arr[mid] < target) low = mid + 1;\n            else high = mid - 1;\n        }\n        return -1;\n    }\n    public static void main(String[] args) {\n        int[] numbers = {2, 5, 8, 12, 16, 23, 38, 56, 72};\n        int target = 23;\n        int index = binarySearch(numbers, target);\n        System.out.println("Target " + target + " found at index: " + index);\n    }\n}`,
    },
    {
      label: "Recursion Factorial",
      code: `public class Main {\n    public static long factorial(int n) {\n        if (n <= 1) return 1;\n        return n * factorial(n - 1);\n    }\n    public static void main(String[] args) {\n        int num = 6;\n        System.out.println(num + "! = " + factorial(num));\n    }\n}`,
    },
  ];

  return (
    <motion.div
      key="java"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium">
          <Terminal className="size-3.5 text-amber-400" />
          <span>Java Sandbox Runner</span>
        </div>
        <div className="flex gap-1">
          {samplePresets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setCode(p.code);
                setResult(null);
              }}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative rounded-xl border border-white/10 bg-[#0d0d12] overflow-hidden">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full h-36 font-mono text-[11px] leading-relaxed p-3 bg-transparent text-amber-200/90 outline-none resize-none placeholder-white/30"
          placeholder="// Write Java code here..."
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          onClick={handleRun}
          disabled={isRunning || !code.trim()}
          size="sm"
          className="rounded-full h-7 px-3.5 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="size-3 mr-1 animate-spin text-white" />
              Running in Java...
            </>
          ) : (
            <>
              <Play className="size-3 mr-1 text-white fill-white" />
              Run Java Code
            </>
          )}
        </Button>
        {result && (
          <span className="text-[10px] text-white/50 font-mono">
            {result.executionTimeMs}ms · exit {result.exitCode}
          </span>
        )}
      </div>

      {result && (
        <div className="rounded-xl border border-white/10 bg-black/60 p-2.5 max-h-24 overflow-y-auto font-mono text-[11px]">
          {result.stdout && (
            <pre className="text-emerald-400 whitespace-pre-wrap">{result.stdout}</pre>
          )}
          {result.stderr && (
            <pre className="text-rose-400 whitespace-pre-wrap mt-1">{result.stderr}</pre>
          )}
          {!result.stdout && !result.stderr && (
            <span className="text-white/40 italic">Program finished with no output.</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   MAIN TABS COMPONENT
   ────────────────────────────────────────────────────────────────────────────── */
const TABS_CONFIG = [
  { value: "chat", label: "Chat", icon: MessageCircle },
  { value: "voice", label: "Voice", icon: AudioLines },
  { value: "video", label: "Video", icon: Video },
  { value: "java", label: "Java", icon: Terminal },
];

export function TabsDemo(props: TabsDemoProps) {
  const [tab, setTab] = useState("chat");
  const [detectedRole, setDetectedRole] = useState<"student" | "professor">(
    props.role || "student",
  );
  const [detectedUserEmail, setDetectedUserEmail] = useState<string>(
    props.userEmail || "",
  );
  const [detectedUserName, setDetectedUserName] = useState<string>(
    props.userName || "",
  );

  // Auto-detect role and user from localStorage if not passed
  useEffect(() => {
    if (props.role) {
      setDetectedRole(props.role);
    } else if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("userRole");
      if (storedRole === "professor" || storedRole === "student") {
        setDetectedRole(storedRole);
      }
    }

    if (props.userEmail) {
      setDetectedUserEmail(props.userEmail);
    } else if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem("userEmail") || "";
      setDetectedUserEmail(storedEmail);
    }

    if (props.userName) {
      setDetectedUserName(props.userName);
    } else if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("userName") || "";
      setDetectedUserName(storedName);
    }
  }, [props.role, props.userEmail, props.userName]);

  const mergedProps: TabsDemoProps = {
    ...props,
    role: detectedRole,
    userEmail: detectedUserEmail,
    userName: detectedUserName,
  };

  const isProf = detectedRole === "professor";

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {/* Role & Context Header Badge */}
      <div className="w-full flex items-center justify-between px-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-white/80 font-medium">
          {isProf ? (
            <GraduationCap className="size-3.5 text-purple-400" />
          ) : (
            <BookOpen className="size-3.5 text-indigo-400" />
          )}
          <span className="text-white/90 font-semibold">
            {isProf ? "Professor Copilot" : "Student Study Guide"}
          </span>
        </div>

        {props.activeClassroom?.name ? (
          <span className="truncate max-w-[140px] text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/60">
            {props.activeClassroom.name}
          </span>
        ) : isProf && props.classrooms?.length ? (
          <span className="text-[10px] text-white/50">
            {props.classrooms.length} class{props.classrooms.length > 1 ? "es" : ""}
          </span>
        ) : null}
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="w-full max-w-92 flex flex-col items-center gap-3"
      >
        <TabsList className="h-auto! gap-1 rounded-full bg-white/[0.06] border border-white/10 p-1 flex w-full items-center justify-between">
          {TABS_CONFIG.map(({ value: itemValue, label, icon: Icon }) => {
            const isActive = tab === itemValue;
            return (
              <TabsTrigger
                key={itemValue}
                value={itemValue}
                className={cn(
                  "rounded-full border-none py-1.5 text-xs font-medium text-white/60 dark:data-active:bg-indigo-600 data-active:bg-indigo-600 data-active:text-white cursor-pointer transition-all duration-300 flex items-center justify-center flex-1",
                  isActive ? "px-3 text-white" : "px-2",
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span
                      initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                      animate={{ width: "auto", opacity: 1, marginLeft: 5 }}
                      exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden whitespace-nowrap text-xs font-semibold inline-block"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="relative w-full overflow-hidden">
          <TabsContent
            value={tab}
            className="border border-white/10 bg-[#121217]/95 rounded-2xl shadow-xl outline-none p-0 mt-0"
          >
            <AnimatePresence mode="wait" initial={false}>
              {tab === "chat" && <ChatPanel key="chat" {...mergedProps} />}
              {tab === "voice" && <VoicePanel key="voice" {...mergedProps} />}
              {tab === "video" && <VideoPanel key="video" {...mergedProps} />}
              {tab === "java" && <JavaPanel key="java" />}
            </AnimatePresence>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default TabsDemo;
