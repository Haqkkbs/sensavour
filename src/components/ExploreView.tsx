import React, { useState, useEffect, useRef, useTransition } from 'react';
import { SensoryWheel } from './SensoryWheel';
import { SENSORY_CATEGORIES, ParticipantRecord } from '../types';
import { SENSAVOUR_URL, MIN_EXPLORE_SECONDS } from '../firebase';
import { ExternalLink, Play, Lock, Unlock, Clock, Sparkles, Check, Loader2 } from 'lucide-react';

interface ExploreViewProps {
  participant: ParticipantRecord;
  onStartExploration: () => Promise<void>;
  onSaveWords: (words: Record<string, string>) => Promise<void>;
  onUnlockPostTest: () => Promise<void>;
  calculatePoints: (words: Record<string, string>) => number;
}

function formatMinutesSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  participant,
  onStartExploration,
  onSaveWords,
  onUnlockPostTest,
  calculatePoints
}) => {
  const [, startTransition] = useTransition();
  const [words, setWords] = useState<Record<string, string>>(() => participant.words || {});
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const saveTimeoutRef = useRef<any>(null);

  const hasStarted = Boolean(participant.exploreStartedAt);

  // Sync words when participant updates
  useEffect(() => {
    if (participant.words) {
      setWords(prev => ({ ...prev, ...participant.words }));
    }
  }, [participant.words]);

  // Compute elapsed time from server timestamp
  useEffect(() => {
    if (!hasStarted) {
      setElapsedSeconds(0);
      return;
    }

    const startMillis = participant.exploreStartedAt?.toMillis
      ? participant.exploreStartedAt.toMillis()
      : typeof participant.exploreStartedAt === 'number'
      ? participant.exploreStartedAt
      : Date.now();

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startMillis) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, participant.exploreStartedAt]);

  const completedWordsCount = SENSORY_CATEGORIES.filter(
    cat => (words[cat.key] || '').trim().length >= 2
  ).length;

  const currentPoints = calculatePoints(words);
  const isTimeMet = elapsedSeconds >= MIN_EXPLORE_SECONDS;
  const isWordsMet = completedWordsCount >= 5;
  const canUnlock = isTimeMet && isWordsMet;

  // Handle word input change with debounced Firestore saving
  const handleWordChange = (key: string, val: string) => {
    const updated = { ...words, [key]: val };
    setWords(updated);
    setActiveHighlight(key);

    if (val.trim().length >= 2) {
      setTimeout(() => {
        startTransition(() => {
          setActiveHighlight(null);
        });
      }, 500);
    }

    // Debounce save to Firestore
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setSaveStatus('Menyimpan…');
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSaveWords(updated);
        setSaveStatus('✓ Disimpan');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        console.error('Word save error:', err);
        setSaveStatus('Gagal simpan (cuba lagi)');
      }
    }, 700);
  };

  const handleStart = async () => {
    setIsStarting(true);
    setErrorMessage('');
    try {
      await onStartExploration();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Tak dapat memulakan pemasa. Sila semak sambungan.');
      setIsStarting(false);
    }
  };

  const handleUnlock = async () => {
    if (!canUnlock) return;
    setIsUnlocking(true);
    setErrorMessage('');
    try {
      await onUnlockPostTest();
    } catch (err: any) {
      console.error(err);
      setIsUnlocking(false);
      if (err?.code === 'permission-denied' || String(err).includes('permission-denied')) {
        setErrorMessage(
          'Pelayan Firestore memerlukan sekurang-kurangnya 60 saat masa meneroka yang disahkan. Sila tunggu 5 saat lagi dan tekan butang semula.'
        );
      } else {
        setErrorMessage('Tidak dapat membuka kunci. Sila semak sambungan internet dan cuba lagi.');
      }
    }
  };

  const remainingSeconds = Math.max(0, MIN_EXPLORE_SECONDS - elapsedSeconds);
  const cappedElapsed = Math.min(elapsedSeconds, MIN_EXPLORE_SECONDS);
  const progressPercent = Math.min(100, Math.round((cappedElapsed / MIN_EXPLORE_SECONDS) * 100));

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#C8402B] mb-1">
          Langkah 2 / Step 2
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-[#12302B]">
          Teroka SENSAVOUR
        </h1>
        <p className="text-sm sm:text-base text-[#4F6660] mt-1">
          Gunakan roda sensori di sebelah untuk mengumpul 5 kosa kata baharu bagi membuka kunci pasca-ujian.
        </p>
      </div>

      {/* Main Grid: Frame + Interactive Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SENSAVOUR Web App Embed (7 Cols) */}
        <div className="lg:col-span-7 bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="relative w-full h-[60vh] sm:h-[680px] bg-white">
            <iframe
              src={SENSAVOUR_URL}
              title="Aplikasi SENSAVOUR"
              className="w-full h-full border-0"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
          <div className="p-3.5 bg-[#EDF1EA]/80 border-t border-[#CBD7CE] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[#4F6660]">
            <span>Sekiranya paparan di atas tersekat atau sempit pada telefon:</span>
            <a
              href={SENSAVOUR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#12302B] bg-white font-bold text-xs text-[#12302B] hover:bg-[#EDF1EA] transition"
            >
              Buka di Tab Baharu
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Sensory Side Panel & Word Missions (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* SVG Sensory Wheel Card */}
          <div className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl p-5 shadow-sm text-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#4F6660] mb-2 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#C8402B]" />
              Roda Deria Anda
            </h3>
            <SensoryWheel
              words={words}
              points={currentPoints}
              highlightCategory={activeHighlight}
            />
            <div className="mt-2 text-xs text-[#4F6660]">
              Penuhkan 5 bahagian ({completedWordsCount}/5) & teroka sekurang-kurangnya 1 minit.
            </div>
          </div>

          {/* Timer & Start Box */}
          {!hasStarted ? (
            <div className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#C8402B] mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-[#12302B] text-base">Bersedia Meneroka?</h4>
                  <p className="text-xs sm:text-sm text-[#4F6660] mt-1">
                    Pemasa 1 minit akan bermula sebaik sahaja anda menekan butang di bawah.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleStart}
                disabled={isStarting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#C8402B] text-white font-bold text-sm shadow hover:bg-[#b03522] transition disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memulakan…
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Mula Meneroka SENSAVOUR
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl p-5 shadow-sm space-y-4">
              {/* Timer Bar */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-[#12302B] mb-1.5 font-mono">
                  <span className="flex items-center gap-1.5 text-[#4F6660]">
                    <Clock className="w-4 h-4 text-[#C8402B]" />
                    Masa Meneroka
                  </span>
                  <span>
                    {formatMinutesSeconds(cappedElapsed)} / {formatMinutesSeconds(MIN_EXPLORE_SECONDS)}
                  </span>
                </div>
                <div className="w-full bg-[#DDE6DE] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1F7A57] h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Word Missions */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#4F6660]">
                    5 Misi Perkataan Sensori:
                  </div>
                  <span className="text-[11px] text-[#1F7A57] font-semibold">1 minit & 5 kata</span>
                </div>

                {/* Malaysian Sensory Vocabulary Note */}
                <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">💡 Tip Kosa Kata Malaysia:</span> Sekiranya anda menjumpai perkataan seperti <span className="font-bold text-[#C8402B]">"gurih"</span> dalam laman SENSAVOUR, gunakan perkataan Bahasa Melayu Malaysia yang setara seperti <span className="font-bold">"berlemak"</span>, <span className="font-bold">"lazat"</span>, <span className="font-bold">"enak"</span> atau <span className="font-bold">"masin-lemak"</span>.
                </div>

                {SENSORY_CATEGORIES.map(cat => {
                  const val = words[cat.key] || '';
                  const isFilled = val.trim().length >= 2;
                  return (
                    <div
                      key={cat.key}
                      className="p-3 bg-[#EDF1EA]/60 rounded-xl border border-[#CBD7CE]/80 space-y-1.5"
                      style={{ borderLeftColor: cat.color, borderLeftWidth: '4px' }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-display font-bold text-sm text-[#12302B] flex items-center gap-1.5">
                          {cat.name}
                          {isFilled && <Check className="w-4 h-4 text-[#1F7A57]" />}
                        </span>
                        <span className={`text-[11px] font-bold ${isFilled ? 'text-[#1F7A57]' : 'text-[#4F6660]'}`}>
                          {isFilled ? '+10 mata' : '0/10'}
                        </span>
                      </div>
                      <p className="text-xs text-[#4F6660]">{cat.question}</p>
                      <input
                        type="text"
                        maxLength={40}
                        placeholder="Cth: kosa kata yang anda temui..."
                        value={val}
                        onChange={e => handleWordChange(cat.key, e.target.value)}
                        className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-[#CBD7CE] rounded-lg text-[#12302B] focus:outline-none focus:ring-2 focus:ring-[#C8402B]"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Status and Unlock button */}
              <div className="pt-2 border-t border-[#CBD7CE]/70 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#4F6660]">
                    {!isWordsMet
                      ? `Perlu ${5 - completedWordsCount} perkataan lagi`
                      : !isTimeMet
                      ? `Sila tunggu ${formatMinutesSeconds(remainingSeconds)} lagi`
                      : '✓ Syarat buka kunci dipenuhi!'}
                  </span>
                  {saveStatus && (
                    <span className="font-medium text-[#1F7A57] text-[11px]">
                      {saveStatus}
                    </span>
                  )}
                </div>

                {errorMessage && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg" role="alert">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={!canUnlock || isUnlocking}
                  className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm shadow transition ${
                    canUnlock
                      ? 'bg-[#1F7A57] text-white hover:bg-[#186044] cursor-pointer'
                      : 'bg-[#CBD7CE] text-[#4F6660] cursor-not-allowed opacity-75'
                  }`}
                >
                  {isUnlocking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Membuka kunci…
                    </>
                  ) : canUnlock ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      Buka Kunci Pasca-Ujian
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Pasca-Ujian Terkunci (1 minit & 5 kata)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
