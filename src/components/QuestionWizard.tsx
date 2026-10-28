import React, { useState, useEffect } from 'react';
import { QuestionDef } from '../types';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

interface QuestionWizardProps {
  title: string;
  kind: 'pre' | 'post';
  questions: QuestionDef[];
  participantUid: string;
  onSubmit: (answers: Record<string, any>) => Promise<void>;
  onCancel?: () => void;
}

export const QuestionWizard: React.FC<QuestionWizardProps> = ({
  kind,
  questions,
  participantUid,
  onSubmit
}) => {
  const draftKey = `sensavour_draft_${kind}_${participantUid}`;

  // Initialize draft from localStorage
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Auto-save draft
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(answers));
    } catch (e) {
      console.warn('Failed to save local draft:', e);
    }
  }, [answers, draftKey]);

  const currentQ = questions[currentIndex];
  const total = questions.length;
  const isLast = currentIndex === total - 1;

  function isAnswered(q: QuestionDef): boolean {
    const val = answers[q.id];
    if (q.type === 'grid') {
      if (!val || typeof val !== 'object') return false;
      return (q.rows || []).every(row => val[row] && val[row].trim().length > 0);
    }
    if (q.type === 'para') {
      return (val || '').trim().length >= 2;
    }
    if (q.type === 'radio') {
      if (!val) return false;
      if (val === '__other__') {
        const otherVal = (answers[`${q.id}_other`] || '').trim();
        return otherVal.length >= 2;
      }
      return true;
    }
    return Boolean(val);
  }

  function handleRadioChange(value: string) {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
    setErrorMessage('');
  }

  function handleOtherTextChange(text: string) {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: '__other__',
      [`${currentQ.id}_other`]: text
    }));
    setErrorMessage('');
  }

  function handleGridChange(rowName: string, selectedVal: string) {
    setAnswers(prev => {
      const existingGrid = prev[currentQ.id] || {};
      return {
        ...prev,
        [currentQ.id]: {
          ...existingGrid,
          [rowName]: selectedVal
        }
      };
    });
    setErrorMessage('');
  }

  function handleParaChange(text: string) {
    setAnswers(prev => ({ ...prev, [currentQ.id]: text }));
    setErrorMessage('');
  }

  async function handleNext() {
    if (currentQ.req && !isAnswered(currentQ)) {
      if (currentQ.type === 'grid') {
        setErrorMessage('Sila pilih jawapan bagi setiap makanan di bawah.');
      } else if (currentQ.type === 'para') {
        setErrorMessage('Sila tulis sekurang-kurangnya beberapa perkataan. Jika belum pasti, nyatakan begitu.');
      } else {
        setErrorMessage('Sila pilih satu jawapan untuk meneruskan.');
      }
      return;
    }

    if (!isLast) {
      setCurrentIndex(prev => prev + 1);
      setErrorMessage('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Submit wizard
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      // Process answers to flatten any __other__ values
      const processed: Record<string, any> = {};
      questions.forEach(q => {
        const v = answers[q.id];
        if (q.type === 'radio' && v === '__other__') {
          processed[q.id] = `Other: ${(answers[`${q.id}_other`] || '').trim()}`;
        } else if (typeof v === 'string') {
          processed[q.id] = v.trim();
        } else {
          processed[q.id] = v;
        }
      });

      await onSubmit(processed);
      try {
        localStorage.removeItem(draftKey);
      } catch {}
    } catch (err: any) {
      console.error(err);
      setIsSubmitting(false);
      setErrorMessage(
        'Tak dapat menghantar jawapan ke pelayan. Sila semak sambungan internet dan cuba lagi. Jawapan anda masih tersimpan di peranti ini.'
      );
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setErrorMessage('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const qNumber = currentQ.id.replace('q', 'Q');
  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);

  return (
    <div className="max-w-2xl mx-auto w-full bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl p-6 sm:p-8 shadow-sm">
      {/* Progress bar */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between items-center text-xs font-bold text-[#4F6660]">
          <span className="uppercase tracking-wider">
            {kind === 'pre' ? 'Langkah 1: Pra-Ujian' : 'Langkah 3: Pasca-Ujian & Refleksi'}
          </span>
          <span>
            {currentIndex + 1} / {total} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full bg-[#DDE6DE] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#1F7A57] h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Header */}
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-[#C8402B] mb-1">
          Soalan {qNumber} {!currentQ.req && <span className="text-[#4F6660] font-normal">(Pilihan)</span>}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-[#12302B] leading-snug mb-2">
          {currentQ.bm}
        </h2>
        <p className="text-sm text-[#4F6660] italic leading-relaxed">
          {currentQ.en}
        </p>

        {currentQ.hint && (
          <div className="mt-3 p-3 text-xs sm:text-sm text-[#4F6660] bg-[#EDF1EA]/60 border-l-4 border-[#1F7A57] rounded-r-lg">
            {currentQ.hint}
          </div>
        )}
      </div>

      {/* Question Input Fields */}
      <div className="mb-8">
        {currentQ.type === 'radio' && (
          <div className="space-y-3" role="radiogroup">
            {currentQ.opts?.map((opt, i) => {
              const isSelected = answers[currentQ.id] === opt;
              return (
                <label
                  key={i}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#12302B] bg-[#DDE6DE]/60 font-semibold text-[#12302B] shadow-xs'
                      : 'border-[#CBD7CE] bg-[#EDF1EA]/40 text-[#12302B] hover:bg-[#EDF1EA]'
                  }`}
                >
                  <input
                    type="radio"
                    name={`radio_${currentQ.id}`}
                    value={opt}
                    checked={isSelected}
                    onChange={() => handleRadioChange(opt)}
                    className="mt-1 w-4 h-4 text-[#C8402B] accent-[#C8402B] focus:ring-[#C8402B]"
                  />
                  <span className="text-sm leading-relaxed">{opt}</span>
                </label>
              );
            })}

            {currentQ.other && (
              <label
                className={`flex flex-col gap-2 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  answers[currentQ.id] === '__other__'
                    ? 'border-[#12302B] bg-[#DDE6DE]/60 font-semibold'
                    : 'border-[#CBD7CE] bg-[#EDF1EA]/40 hover:bg-[#EDF1EA]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`radio_${currentQ.id}`}
                    value="__other__"
                    checked={answers[currentQ.id] === '__other__'}
                    onChange={() => handleRadioChange('__other__')}
                    className="w-4 h-4 text-[#C8402B] accent-[#C8402B]"
                  />
                  <span className="text-sm text-[#12302B]">Other / Lain-lain (Nyatakan):</span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Taip program pengajian anda..."
                  value={answers[`${currentQ.id}_other`] || ''}
                  onChange={e => handleOtherTextChange(e.target.value)}
                  onFocus={() => handleRadioChange('__other__')}
                  className="mt-1 w-full px-3 py-2 text-sm bg-white border border-[#CBD7CE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8402B]"
                />
              </label>
            )}
          </div>
        )}

        {currentQ.type === 'grid' && (
          <div className="space-y-4 divide-y divide-[#CBD7CE]/70">
            {currentQ.rows?.map((rowFood, rIdx) => {
              const currentVal = answers[currentQ.id]?.[rowFood] || '';
              return (
                <div key={rIdx} className="pt-3.5 first:pt-0">
                  <div className="font-display font-bold text-base text-[#12302B] mb-1.5 flex items-center justify-between">
                    <span>{rowFood}</span>
                    {currentVal && (
                      <CheckCircle2 className="w-4 h-4 text-[#1F7A57]" />
                    )}
                  </div>
                  <select
                    value={currentVal}
                    onChange={e => handleGridChange(rowFood, e.target.value)}
                    className="w-full text-xs sm:text-sm bg-white border border-[#CBD7CE] rounded-lg p-2.5 text-[#12302B] focus:outline-none focus:ring-2 focus:ring-[#C8402B]"
                  >
                    <option value="">Pilih tahap keakraban / Select familiarity level…</option>
                    {currentQ.opts?.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {currentQ.type === 'para' && (
          <div className="space-y-2">
            <textarea
              rows={5}
              maxLength={1500}
              placeholder="Taip huraian anda di sini (cth: rupa, aroma, rasa, tekstur, atau bunyi)..."
              value={answers[currentQ.id] || ''}
              onChange={e => handleParaChange(e.target.value)}
              className="w-full p-3.5 text-sm sm:text-base bg-white border border-[#CBD7CE] rounded-xl text-[#12302B] focus:outline-none focus:ring-2 focus:ring-[#C8402B] resize-y placeholder:text-gray-400"
            />
            <div className="flex justify-between items-center text-xs text-[#4F6660]">
              <span>Karakter: {(answers[currentQ.id] || '').length} / 1500</span>
              <span>{answers[currentQ.id]?.trim() ? '✓ Disimpan setempat' : ''}</span>
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {errorMessage && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl font-medium" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#CBD7CE]/70">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentIndex === 0 || isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#CBD7CE] font-bold text-sm text-[#12302B] hover:bg-[#EDF1EA] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C8402B] text-white font-bold text-sm shadow hover:bg-[#b03522] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menghantar…
            </>
          ) : isLast ? (
            <>
              Hantar
              <CheckCircle2 className="w-4 h-4" />
            </>
          ) : (
            <>
              Seterusnya
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
