"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Save, FolderOpen, FilePlus, X, Clock } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Frequency = "O" | "F" | "C" | "N" | "";

interface PhotoEntry {
  id: string;
  file: File | null;
  preview: string;
  level: string;
  description: string;
  weight: string;
}

interface PushPullEntry {
  id: string;
  file: File | null;
  preview: string;
  level: string;
  pushPull: string;
  forceLbs: string;
}

interface FormData {
  name: string;
  date: string;
  timeStart: string;
  phone: string;
  jobTitle: string;
  jobDescription: string;
  drive: string;
  liftFloorToKnuckles: string;
  liftFloorToWaist: string;
  liftFloorToShoulders: string;
  liftFloorToCrown: string;
  carryLbs1: string;
  carryFeet1: string;
  carryLbs2: string;
  carryFeet2: string;
  pushLbs1: string;
  pullLbs1: string;
  pushLbs2: string;
  pullLbs2: string;
  stairClimbSteps1: string;
  stairClimbSteps2: string;
  stairCarryLbs: string;
  ladderStepsAFrame: string;
  verticalLadderRungs: string;
  stepLadderSteps: string;
  airborneContaminants: string;
}

interface SavedEvaluation {
  id: string;
  savedAt: string;
  formData: FormData;
  physicalFreq: Record<string, Frequency>;
  envFreq: Record<string, Frequency>;
  specialComments: Record<string, string>;
  photoEntries: Omit<PhotoEntry, "file">[];
  pushPullEntries: Omit<PushPullEntry, "file">[];
}

const STORAGE_KEY = "ergodocs_pdv_evaluations";
const AUTOSAVE_KEY = "ergodocs_pdv_autosave";

function getSavedEvaluations(): SavedEvaluation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEvaluationToStorage(evaluation: SavedEvaluation) {
  const existing = getSavedEvaluations();
  const idx = existing.findIndex((e) => e.id === evaluation.id);
  if (idx >= 0) {
    existing[idx] = evaluation;
  } else {
    existing.unshift(evaluation);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

function deleteEvaluationFromStorage(id: string) {
  const existing = getSavedEvaluations().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PHYSICAL_ACTIVITIES = [
  { num: "01", label: "Standing" },
  { num: "02", label: "Walking" },
  { num: "03", label: "Sitting" },
  { num: "04", label: "Stooping" },
  { num: "05", label: "Kneeling" },
  { num: "06", label: "Squatting" },
  { num: "07", label: "Body Twisting" },
  { num: "08", label: "Crawling" },
  { num: "09", label: "Sense of Touch" },
  { num: "10", label: "Manual Dexterity" },
  { num: "11", label: "Speaking Clearly" },
  { num: "12", label: "Seeing Distant" },
  { num: "13", label: "Seeing – Reading" },
  { num: "14", label: "Reaching (High, Low, Level)" },
  { num: "15", label: "Hearing - Speech Range" },
  { num: "16", label: "Depth Perception" },
  { num: "17", label: "Color Vision" },
  { num: "18", label: "Lifting" },
  { num: "19", label: "Carrying" },
  { num: "20", label: "Pushing" },
  { num: "21", label: "Pulling" },
  { num: "22", label: "Climbing Ladders" },
  { num: "23", label: "Climbing Stairs" },
  { num: "24", label: "Balancing" },
];

const ENVIRONMENTAL_REQUIREMENTS = [
  { num: "01", label: "Extreme Cold - Below 30°F (Seasonal)" },
  { num: "02", label: "Extreme Heat - Above 100°F (Seasonal)" },
  { num: "03", label: "Dryness" },
  { num: "04", label: "Wetness" },
  { num: "05", label: "Humidity - Above 90% (Seasonal)" },
  { num: "06", label: "Noise - Over 85 Decibels" },
  { num: "07", label: "Respirator - Breathing Apparatus" },
  { num: "08", label: "Confined/Cramped Spaces" },
  { num: "09", label: "Elevated Heights" },
  { num: "10", label: "Working Around/With People" },
  { num: "11", label: "Working Alone" },
];

const SPECIAL_COMMENTS_FIELDS = [
  "Climbing (Stairs/Ladders/Other)",
  "Lifting / Carrying",
  "Pushing / Pulling",
  "Valve Handling",
];

// ─── Helper Components ───────────────────────────────────────────────────────

function SectionHeader({ title, collapsed, onToggle }: { title: string; collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between bg-[#1e40af] text-white px-4 py-3 rounded-lg text-lg font-semibold tracking-wide hover:bg-[#1e3a8a] transition-colors"
    >
      <span>{title}</span>
      {collapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
    </button>
  );
}

function TextInput({ label, value, onChange, placeholder, type = "text", className = "" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-slate-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent bg-white"
      />
    </div>
  );
}

function NumberInput({ label, value, onChange, unit, className = "" }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2.5 text-base w-full focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent bg-white"
        />
        {unit && <span className="text-sm text-slate-500 whitespace-nowrap">{unit}</span>}
      </div>
    </div>
  );
}

function FrequencyGrid({ items, values, onChange }: {
  items: { num: string; label: string }[];
  values: Record<string, Frequency>;
  onChange: (key: string, val: Frequency) => void;
}) {
  const frequencies: Frequency[] = ["O", "F", "C", "N"];
  return (
    <div className="frequency-grid overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="text-left px-3 py-2 font-semibold text-slate-700 w-8">#</th>
            <th className="text-left px-3 py-2 font-semibold text-slate-700">Activity</th>
            {frequencies.map((f) => (
              <th key={f} className="px-3 py-2 font-semibold text-slate-700 text-center w-12">{f}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.num} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              <td className="px-3 py-2 text-slate-500">{item.num}</td>
              <td className="px-3 py-2 text-slate-800">{item.label}</td>
              {frequencies.map((f) => (
                <td key={f} className="px-3 py-2 text-center">
                  <input
                    type="radio"
                    name={`freq-${item.num}-${item.label}`}
                    checked={values[item.num] === f}
                    onChange={() => onChange(item.num, f)}
                    className="accent-[#1e40af]"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 px-3 py-2 bg-slate-50 rounded text-xs text-slate-600">
        <strong>Frequency Key:</strong> O = Occasionally (&lt;33%) · F = Frequently (34-66%) · C = Constantly (&gt;67%) · N = Not significant
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const EMPTY_FORM: FormData = {
  name: "", date: new Date().toISOString().split("T")[0], timeStart: "", phone: "",
  jobTitle: "", jobDescription: "", drive: "",
  liftFloorToKnuckles: "", liftFloorToWaist: "", liftFloorToShoulders: "", liftFloorToCrown: "",
  carryLbs1: "", carryFeet1: "", carryLbs2: "", carryFeet2: "",
  pushLbs1: "", pullLbs1: "", pushLbs2: "", pullLbs2: "",
  stairClimbSteps1: "", stairClimbSteps2: "", stairCarryLbs: "",
  ladderStepsAFrame: "", verticalLadderRungs: "", stepLadderSteps: "",
  airborneContaminants: "",
};

export default function PDVCollectionForm() {
  // Section collapse state
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (section: string) => setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));

  // Saved evaluations management
  const [savedEvals, setSavedEvals] = useState<SavedEvaluation[]>([]);
  const [currentEvalId, setCurrentEvalId] = useState<string | null>(null);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Load saved evaluations on mount
  useEffect(() => {
    setSavedEvals(getSavedEvaluations());
    // Check for autosave
    try {
      const autosave = localStorage.getItem(AUTOSAVE_KEY);
      if (autosave) {
        const data = JSON.parse(autosave);
        if (data.formData?.name || data.formData?.jobTitle) {
          setFormData(data.formData);
          setPhysicalFreq(data.physicalFreq || {});
          setEnvFreq(data.envFreq || {});
          setSpecialComments(data.specialComments || {});
          if (data.photoEntries?.length) setPhotoEntries(data.photoEntries.map((e: Omit<PhotoEntry, "file">) => ({ ...e, file: null })));
          if (data.pushPullEntries?.length) setPushPullEntries(data.pushPullEntries.map((e: Omit<PushPullEntry, "file">) => ({ ...e, file: null })));
          if (data.currentEvalId) setCurrentEvalId(data.currentEvalId);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Form data
  const [formData, setFormData] = useState<FormData>({ ...EMPTY_FORM });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Physical activities frequency
  const [physicalFreq, setPhysicalFreq] = useState<Record<string, Frequency>>({});
  const updatePhysicalFreq = (key: string, val: Frequency) => {
    setPhysicalFreq((prev) => ({ ...prev, [key]: val }));
  };

  // Environmental frequency
  const [envFreq, setEnvFreq] = useState<Record<string, Frequency>>({});
  const updateEnvFreq = (key: string, val: Frequency) => {
    setEnvFreq((prev) => ({ ...prev, [key]: val }));
  };

  // Special comments
  const [specialComments, setSpecialComments] = useState<Record<string, string>>({});
  const updateComment = (key: string, val: string) => {
    setSpecialComments((prev) => ({ ...prev, [key]: val }));
  };

  // Photo entries (Lift/Carry grid)
  const [photoEntries, setPhotoEntries] = useState<PhotoEntry[]>([
    { id: "1", file: null, preview: "", level: "", description: "", weight: "" },
  ]);

  // Push/Pull entries
  const [pushPullEntries, setPushPullEntries] = useState<PushPullEntry[]>([
    { id: "1", file: null, preview: "", level: "", pushPull: "", forceLbs: "" },
  ]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const pushPullInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoId, setActivePhotoId] = useState<string>("");
  const [activePushPullId, setActivePushPullId] = useState<string>("");

  // Auto-save to localStorage every 5 seconds when data changes
  const autoSave = useCallback(() => {
    try {
      const data = {
        formData,
        physicalFreq,
        envFreq,
        specialComments,
        photoEntries: photoEntries.map(({ file, ...rest }) => rest),
        pushPullEntries: pushPullEntries.map(({ file, ...rest }) => rest),
        currentEvalId,
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
    } catch { /* storage full or unavailable */ }
  }, [formData, physicalFreq, envFreq, specialComments, photoEntries, pushPullEntries, currentEvalId]);

  useEffect(() => {
    const timer = setTimeout(autoSave, 2000);
    return () => clearTimeout(timer);
  }, [autoSave]);

  // Save evaluation
  const handleSave = async () => {
    setSaveStatus("saving");

    // Convert photos to base64 for storage
    const photoEntriesForSave = await Promise.all(
      photoEntries.map(async (entry) => {
        let preview = entry.preview;
        if (entry.file && !entry.preview.startsWith("data:")) {
          preview = await fileToBase64(entry.file);
        }
        return { id: entry.id, preview, level: entry.level, description: entry.description, weight: entry.weight };
      })
    );

    const pushPullEntriesForSave = await Promise.all(
      pushPullEntries.map(async (entry) => {
        let preview = entry.preview;
        if (entry.file && !entry.preview.startsWith("data:")) {
          preview = await fileToBase64(entry.file);
        }
        return { id: entry.id, preview, level: entry.level, pushPull: entry.pushPull, forceLbs: entry.forceLbs };
      })
    );

    const id = currentEvalId || `eval_${Date.now()}`;
    const evaluation: SavedEvaluation = {
      id,
      savedAt: new Date().toLocaleString(),
      formData: { ...formData },
      physicalFreq: { ...physicalFreq },
      envFreq: { ...envFreq },
      specialComments: { ...specialComments },
      photoEntries: photoEntriesForSave,
      pushPullEntries: pushPullEntriesForSave,
    };

    saveEvaluationToStorage(evaluation);
    setCurrentEvalId(id);
    setSavedEvals(getSavedEvaluations());
    setLastSaved(evaluation.savedAt);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  // Load evaluation
  const handleLoad = (evaluation: SavedEvaluation) => {
    setFormData(evaluation.formData);
    setPhysicalFreq(evaluation.physicalFreq);
    setEnvFreq(evaluation.envFreq);
    setSpecialComments(evaluation.specialComments);
    setPhotoEntries(evaluation.photoEntries.map((e) => ({ ...e, file: null })));
    setPushPullEntries(evaluation.pushPullEntries.map((e) => ({ ...e, file: null })));
    setCurrentEvalId(evaluation.id);
    setLastSaved(evaluation.savedAt);
    setShowSavedPanel(false);
  };

  // Delete evaluation
  const handleDelete = (id: string) => {
    if (!confirm("Delete this saved evaluation?")) return;
    deleteEvaluationFromStorage(id);
    setSavedEvals(getSavedEvaluations());
    if (currentEvalId === id) {
      setCurrentEvalId(null);
      setLastSaved(null);
    }
  };

  // New evaluation
  const handleNew = () => {
    if (formData.name || formData.jobTitle) {
      if (!confirm("Start a new evaluation? Unsaved changes will be lost.")) return;
    }
    setFormData({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
    setPhysicalFreq({});
    setEnvFreq({});
    setSpecialComments({});
    setPhotoEntries([{ id: "1", file: null, preview: "", level: "", description: "", weight: "" }]);
    setPushPullEntries([{ id: "1", file: null, preview: "", level: "", pushPull: "", forceLbs: "" }]);
    setCurrentEvalId(null);
    setLastSaved(null);
    localStorage.removeItem(AUTOSAVE_KEY);
  };

  // Photo entry handlers
  const addPhotoEntry = () => {
    setPhotoEntries((prev) => [
      ...prev,
      { id: Date.now().toString(), file: null, preview: "", level: "", description: "", weight: "" },
    ]);
  };

  const removePhotoEntry = (id: string) => {
    setPhotoEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updatePhotoEntry = (id: string, field: keyof PhotoEntry, value: string | File | null) => {
    setPhotoEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        if (field === "file" && value instanceof File) {
          const preview = URL.createObjectURL(value);
          return { ...e, file: value, preview };
        }
        return { ...e, [field]: value };
      })
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePhotoId) {
      updatePhotoEntry(activePhotoId, "file", file);
    }
    e.target.value = "";
  };

  // Push/Pull entry handlers
  const addPushPullEntry = () => {
    setPushPullEntries((prev) => [
      ...prev,
      { id: Date.now().toString(), file: null, preview: "", level: "", pushPull: "", forceLbs: "" },
    ]);
  };

  const removePushPullEntry = (id: string) => {
    setPushPullEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updatePushPullEntry = (id: string, field: keyof PushPullEntry, value: string | File | null) => {
    setPushPullEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        if (field === "file" && value instanceof File) {
          const preview = URL.createObjectURL(value);
          return { ...e, file: value, preview };
        }
        return { ...e, [field]: value };
      })
    );
  };

  const handlePushPullUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePushPullId) {
      updatePushPullEntry(activePushPullId, "file", file);
    }
    e.target.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:px-8">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-[#1e40af]">PDV Collection Sheet</h1>
        <p className="text-slate-500 mt-1">Physical Demand Validation — On-Site Data Collection</p>
      </div>

      {/* ── Toolbar: New / Save / Load ─────────────────────────────────── */}
      <div className="mb-6 bg-white rounded-lg border border-slate-200 p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
          >
            <FilePlus className="w-4 h-4" /> New
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              saveStatus === "saved"
                ? "bg-green-100 text-green-700"
                : saveStatus === "saving"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-[#1e40af] text-white hover:bg-[#1e3a8a]"
            }`}
          >
            <Save className="w-4 h-4" />
            {saveStatus === "saved" ? "Saved!" : saveStatus === "saving" ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setShowSavedPanel(!showSavedPanel)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
          >
            <FolderOpen className="w-4 h-4" /> Saved ({savedEvals.length})
          </button>
          {lastSaved && (
            <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
              <Clock className="w-3 h-3" /> Last saved: {lastSaved}
            </span>
          )}
          {currentEvalId && (
            <span className="text-xs text-[#1e40af] font-medium bg-[#dbeafe] px-2 py-1 rounded">
              {formData.name || formData.jobTitle || "Untitled"}
            </span>
          )}
        </div>

        {/* Saved evaluations panel */}
        {showSavedPanel && (
          <div className="mt-3 border-t border-slate-200 pt-3">
            {savedEvals.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No saved evaluations yet. Fill out a form and click Save.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedEvals.map((ev) => {
                  const label = ev.formData.name && ev.formData.jobTitle
                    ? `${ev.formData.name} — ${ev.formData.jobTitle}`
                    : ev.formData.name || ev.formData.jobTitle || "Untitled";
                  const isActive = currentEvalId === ev.id;
                  return (
                    <div
                      key={ev.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isActive ? "bg-[#dbeafe] border-[#3b82f6]" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleLoad(ev)}
                        className="flex-1 text-left"
                      >
                        <div className="font-medium text-sm text-slate-800">{label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {ev.formData.date} · Saved {ev.savedAt}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }}
                        className="ml-2 text-red-400 hover:text-red-600 p-1 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>

        {/* ── Section 1: General Information ────────────────────────────── */}
        <section>
          <SectionHeader title="I. General Information" collapsed={!!collapsed["general"]} onToggle={() => toggle("general")} />
          {!collapsed["general"] && (
            <div className="mt-3 bg-white rounded-lg border border-slate-200 p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput label="Company / Client Name" value={formData.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Tiger Sanitation" />
                <TextInput label="Date" value={formData.date} onChange={(v) => updateField("date", v)} type="date" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput label="Time Start" value={formData.timeStart} onChange={(v) => updateField("timeStart", v)} type="time" />
                <TextInput label="Phone" value={formData.phone} onChange={(v) => updateField("phone", v)} type="tel" placeholder="(555) 555-5555" />
              </div>
              <TextInput label="Job Title" value={formData.jobTitle} onChange={(v) => updateField("jobTitle", v)} placeholder="e.g. Equipment Operator" />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Job Description</label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) => updateField("jobDescription", e.target.value)}
                  rows={3}
                  className="border border-slate-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent bg-white resize-y"
                  placeholder="Brief description of job duties..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Drive</label>
                <div className="flex gap-4">
                  {["Y", "N"].map((opt) => (
                    <label key={opt} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${formData.drive === opt ? "bg-[#dbeafe] border-[#3b82f6] text-[#1e40af] font-semibold" : "bg-white border-slate-300 text-slate-700"}`}>
                      <input type="radio" name="drive" value={opt} checked={formData.drive === opt} onChange={() => updateField("drive", opt)} className="sr-only" />
                      {opt === "Y" ? "Yes" : "No"}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Section 2: Lifting / Carrying / Push-Pull Measurements ───── */}
        <section>
          <SectionHeader title="II. Lifting / Carrying / Push-Pull" collapsed={!!collapsed["lifting"]} onToggle={() => toggle("lifting")} />
          {!collapsed["lifting"] && (
            <div className="mt-3 bg-white rounded-lg border border-slate-200 p-4 md:p-6 space-y-6">
              {/* Lifting */}
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Lifting</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NumberInput label="Floor to Knuckles" value={formData.liftFloorToKnuckles} onChange={(v) => updateField("liftFloorToKnuckles", v)} unit="lbs" />
                  <NumberInput label="Floor to Waist" value={formData.liftFloorToWaist} onChange={(v) => updateField("liftFloorToWaist", v)} unit="lbs" />
                  <NumberInput label="Floor to Shoulders" value={formData.liftFloorToShoulders} onChange={(v) => updateField("liftFloorToShoulders", v)} unit="lbs" />
                  <NumberInput label="Floor to Crown" value={formData.liftFloorToCrown} onChange={(v) => updateField("liftFloorToCrown", v)} unit="lbs" />
                </div>
              </div>

              {/* Carrying */}
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Carrying</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <NumberInput label="Carry (1)" value={formData.carryLbs1} onChange={(v) => updateField("carryLbs1", v)} unit="lbs" />
                  <NumberInput label="Distance (1)" value={formData.carryFeet1} onChange={(v) => updateField("carryFeet1", v)} unit="feet" />
                  <NumberInput label="Carry (2)" value={formData.carryLbs2} onChange={(v) => updateField("carryLbs2", v)} unit="lbs" />
                  <NumberInput label="Distance (2)" value={formData.carryFeet2} onChange={(v) => updateField("carryFeet2", v)} unit="feet" />
                </div>
              </div>

              {/* Push / Pull */}
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Push / Pull</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <NumberInput label="Push (1)" value={formData.pushLbs1} onChange={(v) => updateField("pushLbs1", v)} unit="F-lbs" />
                  <NumberInput label="Pull (1)" value={formData.pullLbs1} onChange={(v) => updateField("pullLbs1", v)} unit="F-lbs" />
                  <NumberInput label="Push (2)" value={formData.pushLbs2} onChange={(v) => updateField("pushLbs2", v)} unit="F-lbs" />
                  <NumberInput label="Pull (2)" value={formData.pullLbs2} onChange={(v) => updateField("pullLbs2", v)} unit="F-lbs" />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Section 3: Stair / Ladder Climbing ───────────────────────── */}
        <section>
          <SectionHeader title="III. Stair / Ladder Climbing" collapsed={!!collapsed["stairs"]} onToggle={() => toggle("stairs")} />
          {!collapsed["stairs"] && (
            <div className="mt-3 bg-white rounded-lg border border-slate-200 p-4 md:p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Stair Climbing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <NumberInput label="Stair Climb" value={formData.stairClimbSteps1} onChange={(v) => updateField("stairClimbSteps1", v)} unit="steps" />
                  <NumberInput label="Stair Climb & Carry" value={formData.stairClimbSteps2} onChange={(v) => updateField("stairClimbSteps2", v)} unit="steps" />
                  <NumberInput label="Carry Weight" value={formData.stairCarryLbs} onChange={(v) => updateField("stairCarryLbs", v)} unit="lbs" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Ladder Climbing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <NumberInput label="A-Frame Ladder" value={formData.ladderStepsAFrame} onChange={(v) => updateField("ladderStepsAFrame", v)} unit="steps" />
                  <NumberInput label="Vertical Ladder" value={formData.verticalLadderRungs} onChange={(v) => updateField("verticalLadderRungs", v)} unit="rungs" />
                  <NumberInput label="Step Ladder" value={formData.stepLadderSteps} onChange={(v) => updateField("stepLadderSteps", v)} unit="steps" />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Section 4: Essential Physical Activities ──────────────────── */}
        <section>
          <SectionHeader title="IV. Essential Physical Activities" collapsed={!!collapsed["physical"]} onToggle={() => toggle("physical")} />
          {!collapsed["physical"] && (
            <div className="mt-3 bg-white rounded-lg border border-slate-200 p-4 md:p-6">
              <FrequencyGrid items={PHYSICAL_ACTIVITIES} values={physicalFreq} onChange={updatePhysicalFreq} />
            </div>
          )}
        </section>

        {/* ── Section 5: Special Comments ───────────────────────────────── */}
        <section>
          <SectionHeader title="V. Special Comments — Essential Physical Activities" collapsed={!!collapsed["comments"]} onToggle={() => toggle("comments")} />
          {!collapsed["comments"] && (
            <div className="mt-3 bg-white rounded-lg border border-slate-200 p-4 md:p-6 space-y-4">
              {SPECIAL_COMMENTS_FIELDS.map((field) => (
                <div key={field} className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-700">{field}</label>
                  <textarea
                    value={specialComments[field] || ""}
                    onChange={(e) => updateComment(field, e.target.value)}
                    rows={2}
                    className="border border-slate-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent bg-white resize-y"
                    placeholder={`Notes about ${field.toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 6: Environmental Requirements ─────────────────────── */}
        <section>
          <SectionHeader title="VI. Essential Environmental Requirements" collapsed={!!collapsed["environmental"]} onToggle={() => toggle("environmental")} />
          {!collapsed["environmental"] && (
            <div className="mt-3 bg-white rounded-lg border border-slate-200 p-4 md:p-6">
              <FrequencyGrid items={ENVIRONMENTAL_REQUIREMENTS} values={envFreq} onChange={updateEnvFreq} />
            </div>
          )}
        </section>

        {/* ── Section 7: Airborne Contaminants ──────────────────────────── */}
        <section>
          <SectionHeader title="VII. Airborne Contaminants & Chemicals" collapsed={!!collapsed["airborne"]} onToggle={() => toggle("airborne")} />
          {!collapsed["airborne"] && (
            <div className="mt-3 bg-white rounded-lg border border-slate-200 p-4 md:p-6">
              <p className="text-sm text-slate-500 mb-2">e.g., Dust, lubricants, diesel/gasoline exhaust fumes, etc.</p>
              <textarea
                value={formData.airborneContaminants}
                onChange={(e) => updateField("airborneContaminants", e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent bg-white resize-y"
                placeholder="List airborne contaminants and chemicals present in the work environment..."
              />
            </div>
          )}
        </section>

        {/* ── Section 8: Photo / Measurement Grid (Lift/Carry) ──────────── */}
        <section>
          <SectionHeader title="VIII. Photo & Measurement Log — Lift / Carry" collapsed={!!collapsed["photos"]} onToggle={() => toggle("photos")} />
          {!collapsed["photos"] && (
            <div className="mt-3 bg-white rounded-lg border border-slate-200 p-4 md:p-6">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <div className="space-y-4">
                {photoEntries.map((entry, idx) => (
                  <div key={entry.id} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center text-slate-400 pt-2">
                      <GripVertical className="w-4 h-4" />
                      <span className="text-sm font-bold ml-1 text-slate-500">{idx + 1}</span>
                    </div>

                    {/* Photo thumbnail / upload button */}
                    <div
                      className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-[#3b82f6] hover:bg-blue-50 transition-colors overflow-hidden"
                      onClick={() => {
                        setActivePhotoId(entry.id);
                        photoInputRef.current?.click();
                      }}
                    >
                      {entry.preview ? (
                        <img src={entry.preview} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-400" />
                      )}
                    </div>

                    {/* Fields */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-600">Level</label>
                        <select
                          value={entry.level}
                          onChange={(e) => updatePhotoEntry(entry.id, "level", e.target.value)}
                          className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        >
                          <option value="">Select...</option>
                          <option value="Floor-Knuckle">Floor → Knuckle</option>
                          <option value="Floor-Waist">Floor → Waist</option>
                          <option value="Floor-Shoulder">Floor → Shoulder</option>
                          <option value="Floor-Crown">Floor → Crown</option>
                          <option value="Carry">Carry</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-600">Description</label>
                        <input
                          type="text"
                          value={entry.description}
                          onChange={(e) => updatePhotoEntry(entry.id, "description", e.target.value)}
                          className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                          placeholder="Item name..."
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-600">Weight</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            inputMode="decimal"
                            value={entry.weight}
                            onChange={(e) => updatePhotoEntry(entry.id, "weight", e.target.value)}
                            className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white w-full focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                          />
                          <span className="text-xs text-slate-500">lbs</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    {photoEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhotoEntry(entry.id)}
                        className="text-red-400 hover:text-red-600 pt-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addPhotoEntry}
                className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-[#dbeafe] text-[#1e40af] rounded-lg font-semibold text-sm hover:bg-[#bfdbfe] transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>
          )}
        </section>

        {/* ── Section 9: Push/Pull Photo Grid ───────────────────────────── */}
        <section>
          <SectionHeader title="IX. Photo & Measurement Log — Push / Pull" collapsed={!!collapsed["pushpull"]} onToggle={() => toggle("pushpull")} />
          {!collapsed["pushpull"] && (
            <div className="mt-3 bg-white rounded-lg border border-slate-200 p-4 md:p-6">
              <input
                ref={pushPullInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePushPullUpload}
              />
              <div className="space-y-4">
                {pushPullEntries.map((entry, idx) => (
                  <div key={entry.id} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center text-slate-400 pt-2">
                      <GripVertical className="w-4 h-4" />
                      <span className="text-sm font-bold ml-1 text-slate-500">{idx + 1}</span>
                    </div>

                    {/* Photo thumbnail / upload button */}
                    <div
                      className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-[#3b82f6] hover:bg-blue-50 transition-colors overflow-hidden"
                      onClick={() => {
                        setActivePushPullId(entry.id);
                        pushPullInputRef.current?.click();
                      }}
                    >
                      {entry.preview ? (
                        <img src={entry.preview} alt={`Push/Pull ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-400" />
                      )}
                    </div>

                    {/* Fields */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-600">Level</label>
                        <select
                          value={entry.level}
                          onChange={(e) => updatePushPullEntry(entry.id, "level", e.target.value)}
                          className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        >
                          <option value="">Select...</option>
                          <option value="Floor">Floor</option>
                          <option value="Knuckle">Knuckle</option>
                          <option value="Waist">Waist</option>
                          <option value="Chest">Chest</option>
                          <option value="Shoulder">Shoulder</option>
                          <option value="Crown">Crown</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-600">Push / Pull</label>
                        <select
                          value={entry.pushPull}
                          onChange={(e) => updatePushPullEntry(entry.id, "pushPull", e.target.value)}
                          className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        >
                          <option value="">Select...</option>
                          <option value="Push">Push</option>
                          <option value="Pull">Pull</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-600">Force</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            inputMode="decimal"
                            value={entry.forceLbs}
                            onChange={(e) => updatePushPullEntry(entry.id, "forceLbs", e.target.value)}
                            className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white w-full focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                          />
                          <span className="text-xs text-slate-500">F-lbs</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    {pushPullEntries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePushPullEntry(entry.id)}
                        className="text-red-400 hover:text-red-600 pt-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addPushPullEntry}
                className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-[#dbeafe] text-[#1e40af] rounded-lg font-semibold text-sm hover:bg-[#bfdbfe] transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>
          )}
        </section>

        {/* ── Frequency Reference ───────────────────────────────────────── */}
        <section className="bg-white rounded-lg border border-slate-200 p-4 md:p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-2">Frequency Reference (by shift length)</h3>
          <div className="overflow-x-auto">
            <table className="text-xs text-slate-600 w-full">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-2 py-1.5 text-left">Freq</th>
                  <th className="px-2 py-1.5 text-center">8-hr day</th>
                  <th className="px-2 py-1.5 text-center">9-hr day</th>
                  <th className="px-2 py-1.5 text-center">10-hr day</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 py-1.5 font-semibold">O (1x – 1/3)</td>
                  <td className="px-2 py-1.5 text-center">1x – 2:40</td>
                  <td className="px-2 py-1.5 text-center">1x – 3:00</td>
                  <td className="px-2 py-1.5 text-center">1x – 3:20</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-2 py-1.5 font-semibold">F (1/3 – 2/3)</td>
                  <td className="px-2 py-1.5 text-center">2:41 – 5:20</td>
                  <td className="px-2 py-1.5 text-center">3:01 – 6:00</td>
                  <td className="px-2 py-1.5 text-center">3:21 – 6:40</td>
                </tr>
                <tr>
                  <td className="px-2 py-1.5 font-semibold">C (&gt; 2/3)</td>
                  <td className="px-2 py-1.5 text-center">&gt; 5:20</td>
                  <td className="px-2 py-1.5 text-center">&gt; 6:00</td>
                  <td className="px-2 py-1.5 text-center">&gt; 6:40</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Save / Actions ──────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <button
            type="button"
            className={`flex-1 py-3 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
              saveStatus === "saved"
                ? "bg-green-600 text-white"
                : saveStatus === "saving"
                ? "bg-yellow-500 text-white"
                : "bg-[#1e40af] text-white hover:bg-[#1e3a8a]"
            }`}
            onClick={handleSave}
          >
            <Save className="w-5 h-5" />
            {saveStatus === "saved" ? "Saved!" : saveStatus === "saving" ? "Saving..." : "Save Evaluation"}
          </button>
          <button
            type="button"
            className="flex-1 bg-white text-[#1e40af] py-3 px-6 rounded-lg font-semibold text-lg border-2 border-[#1e40af] hover:bg-[#dbeafe] transition-colors flex items-center justify-center gap-2"
            onClick={handleNew}
          >
            <FilePlus className="w-5 h-5" /> New Evaluation
          </button>
        </div>
      </form>
    </div>
  );
}
