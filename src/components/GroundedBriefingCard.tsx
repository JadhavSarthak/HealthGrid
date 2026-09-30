import React, { useState } from 'react';
import { Volume2, Copy, Check, Sparkles, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { SupportedLanguage } from '../services/geminiService';

interface Props {
  briefingText: string;
  isGenerating: boolean;
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onInitiateAction?: () => void;
}

export default function GroundedBriefingCard({
  briefingText,
  isGenerating,
  selectedLanguage,
  onSelectLanguage,
  onInitiateAction
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(briefingText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAudio = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(briefingText);
        if (selectedLanguage === 'hi') utterance.lang = 'hi-IN';
        else if (selectedLanguage === 'mr') utterance.lang = 'mr-IN';
        else if (selectedLanguage === 'gu') utterance.lang = 'gu-IN';
        else utterance.lang = 'en-IN';

        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const LANGUAGES: { code: SupportedLanguage; label: string; script: string }[] = [
    { code: 'en', label: 'English', script: 'Official' },
    { code: 'hi', label: 'हिंदी', script: 'Hindi' },
    { code: 'mr', label: 'मराठी', script: 'Marathi' },
    { code: 'gu', label: 'ગુજરાતી', script: 'Gujarati' },
    { code: 'or', label: 'ଓଡ଼ିଆ', script: 'Odia' }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>OPERATIONAL BRIEFING</span>
            <span>·</span>
            <span>VERTEX AI & GEMINI 2.5 FLASH</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            Evidence-Grounded Officer Decision Brief
          </h3>
        </div>

        {/* Clean language selector tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => onSelectLanguage(l.code)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedLanguage === l.code
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Briefing text container */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs leading-relaxed text-slate-800 font-mono relative">
        {isGenerating ? (
          <div className="flex items-center gap-2 text-emerald-700 py-3">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="font-sans">Generating factual grounded briefing via Gemini 2.5 Flash...</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{briefingText}</p>
        )}

        {/* Footer info & tools */}
        <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-sans">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Strict Invariant: All numbers directly verified against OR-Tools output</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAudio}
              className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                isPlayingAudio
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Listen to briefing via text-to-speech"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>{isPlayingAudio ? 'Stop Audio' : 'Listen'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
