import React, { useState, useEffect, useTransition } from 'react';
import { SensoryWheel } from './SensoryWheel';
import { SensavourIntro } from './SensavourIntro';
import { SENSORY_CATEGORIES, FOOD_DETAILS, ParticipantRecord } from '../types';
import { MIN_EXPLORE_SECONDS } from '../firebase';
import {
  Play,
  Lock,
  Unlock,
  Clock,
  Sparkles,
  Check,
  Loader2,
  X,
  BookOpen,
  Compass
} from 'lucide-react';

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

  // Default to 'intro' as requested ("TAMBAH PAGE INTRO NI DL")
  const [viewMode, setViewMode] = useState<'intro' | 'explorer'>('intro');

  const [filterRegion, setFilterRegion] = useState<'all' | 'sabah' | 'sarawak'>('all');
  const [selectedFoodKey, setSelectedFoodKey] = useState<string>('Hinava');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const saveTimeoutRef = React.useRef<any>(null);

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
          'Pelayan Firestore memerlukan sekurang-kurangnya 60 saat masa meneroka yang disahkan. Sila tunggu sebentar dan tekan butang semula.'
        );
      } else {
        setErrorMessage('Tidak dapat membuka kunci. Sila semak sambungan internet dan cuba lagi.');
      }
    }
  };

  const remainingSeconds = Math.max(0, MIN_EXPLORE_SECONDS - elapsedSeconds);
  const cappedElapsed = Math.min(elapsedSeconds, MIN_EXPLORE_SECONDS);
  const progressPercent = Math.min(100, Math.round((cappedElapsed / MIN_EXPLORE_SECONDS) * 100));

  const currentFoodDetail = FOOD_DETAILS[selectedFoodKey] || FOOD_DETAILS['Hinava'];

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#CBD7CE] pb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#C8402B] mb-0.5">
            Langkah 2 / Step 2
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#12302B]">
            {viewMode === 'intro' ? 'Pengenalan SENSAVOUR' : 'Modul Teroka SENSAVOUR Borneo'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Intro vs Explorer */}
          <div className="inline-flex p-1 bg-[#EDF1EA] border border-[#CBD7CE] rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('intro')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                viewMode === 'intro'
                  ? 'bg-[#12302B] text-white shadow-sm'
                  : 'text-[#4F6660] hover:text-[#12302B]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Pengenalan</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('explorer')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                viewMode === 'explorer'
                  ? 'bg-[#12302B] text-white shadow-sm'
                  : 'text-[#4F6660] hover:text-[#12302B]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#E3A21A]" />
              <span>Roda Sensori</span>
            </button>
          </div>

          {/* Timer status badge if exploration started */}
          {hasStarted && (
            <div className="bg-white border border-[#CBD7CE] rounded-2xl px-3.5 py-1.5 flex items-center gap-2 text-xs">
              <Clock className="w-4 h-4 text-[#C8402B]" />
              <span className="font-mono font-bold text-[#12302B]">
                {formatMinutesSeconds(cappedElapsed)} / {formatMinutesSeconds(MIN_EXPLORE_SECONDS)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: INTRO PAGE (REQUESTED: "TAMBAH PAGE INTRO NI DL") */}
      {viewMode === 'intro' && (
        <div className="space-y-6">
          <SensavourIntro onContinue={() => setViewMode('explorer')} />
        </div>
      )}

      {/* VIEW 2: INTERACTIVE WHEEL & GASTRONOMY EXPLORER */}
      {viewMode === 'explorer' && (
        <div className="space-y-8">
          {/* Subtitle & Region Filters */}
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <p className="text-sm sm:text-base text-[#4F6660]">
              Terokai visual, bunyi kunyatan, dan struktur tekstur makanan tradisi paling ikonik di Sabah dan Sarawak.
            </p>
          </div>

          {/* Region Filter Buttons */}
          <div className="flex justify-center">
            <div className="bg-[#F4F8F3] border border-[#CBD7CE] p-1.5 rounded-2xl flex items-center gap-2 shadow-sm">
              <button
                type="button"
                onClick={() => setFilterRegion('all')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                  filterRegion === 'all'
                    ? 'bg-[#823315] text-white shadow'
                    : 'bg-transparent text-[#4F6660] hover:bg-[#EDF1EA]'
                }`}
              >
                🌍 Semua Borneo
              </button>
              <button
                type="button"
                onClick={() => setFilterRegion('sarawak')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                  filterRegion === 'sarawak'
                    ? 'bg-[#823315] text-white shadow'
                    : 'bg-transparent text-[#4F6660] hover:bg-[#EDF1EA]'
                }`}
              >
                🍜 Sarawak
              </button>
              <button
                type="button"
                onClick={() => setFilterRegion('sabah')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                  filterRegion === 'sabah'
                    ? 'bg-[#823315] text-white shadow'
                    : 'bg-transparent text-[#4F6660] hover:bg-[#EDF1EA]'
                }`}
              >
                🏔️ Sabah
              </button>
            </div>
          </div>

          {/* Main Two-Column Wheel & Detail Section matching screenshot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Card: Roda Pancaidera Interaktif */}
            <div className="lg:col-span-5 bg-white border border-[#CBD7CE] rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#4F6660] mb-2">
                  RODA PANCAIDERA INTERAKTIF
                </div>
                <SensoryWheel
                  onSelectFood={setSelectedFoodKey}
                  selectedFoodKey={selectedFoodKey}
                  filterRegion={filterRegion}
                />
              </div>
              <div className="text-center text-xs text-[#4F6660] pt-2 border-t border-[#CBD7CE]/50">
                Klik mana-mana segmen warna pada roda di atas untuk memaparkan huraian terperinci.
              </div>
            </div>

            {/* Right Card: Terokai Aroma & Rasa Borneo / Selected Food Details */}
            <div className="lg:col-span-7 bg-white border border-[#CBD7CE] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
              {currentFoodDetail ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C8402B]">
                        {currentFoodDetail.origin}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-[#12302B] mt-1">
                        {currentFoodDetail.name}
                      </h3>
                    </div>
                    {/* Clickable Food Image Thumbnail with Lightbox */}
                    <div
                      onClick={() => setIsModalOpen(true)}
                      className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#CBD7CE] shrink-0 bg-[#EDF1EA] cursor-pointer hover:border-[#C8402B] transition relative group shadow-sm"
                      title="Klik untuk besarkan gambar"
                    >
                      <img
                        src={currentFoodDetail.image}
                        alt={currentFoodDetail.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                        <span>🔍</span> Besarkan
                      </div>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-[#4F6660] leading-relaxed">
                    {currentFoodDetail.description}
                  </p>

                  <div className="p-4 bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#12302B] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C8402B]" />
                      Profil Sensori Pilihan:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-white p-2 rounded-xl border border-[#CBD7CE]">
                        <span className="font-bold text-[#E3A21A] block">Rupa:</span> Segar & Menarik
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-[#CBD7CE]">
                        <span className="font-bold text-[#2E9170] block">Aroma:</span> Harum Rempah
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-[#CBD7CE]">
                        <span className="font-bold text-[#D4452E] block">Rasa:</span> Berlemak & Lazat
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-[#CBD7CE]">
                        <span className="font-bold text-[#4F74B3] block">Tekstur:</span> Kenyal / Lembut
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-[#CBD7CE]">
                        <span className="font-bold text-[#9A5392] block">Bunyi:</span> Rangup (jika ada)
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center space-y-4 my-auto">
                  <div className="inline-flex p-4 rounded-full bg-[#EDF1EA] text-[#12302B]">
                    <Sparkles className="w-8 h-8 text-[#C8402B]" />
                  </div>
                  <h3 className="text-xl font-extrabold font-display text-[#12302B]">
                    Terokai Aroma & Rasa Borneo
                  </h3>
                  <p className="text-sm text-[#4F6660] max-w-md mx-auto">
                    Sila pilih dan klik mana-mana segmen warna pada roda pancaidera di sebelah kiri untuk melihat huraian sensasi lima deria bagi pelbagai hidangan popular Sabah dan Sarawak.
                  </p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[#CBD7CE]/60 flex items-center justify-between text-xs text-[#4F6660]">
                <span>Segmen Dipilih: <strong className="text-[#12302B]">{currentFoodDetail?.name || 'Tiada'}</strong></span>
                <span className="text-[#1F7A57] font-bold">✓ Klik gambar untuk paparan penuh</span>
              </div>
            </div>

          </div>

          {/* 5 Puncak Deria Masakan Tradisional Section */}
          <div className="space-y-4 pt-4">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#12302B]">
                5 Puncak Deria Masakan Tradisional
              </h2>
              <p className="text-xs sm:text-sm text-[#4F6660] mt-1">
                Bagaimana warisan geografi dan ekologi Borneo merangsang reseptor biologi manusia secara keseluruhan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-[#CBD7CE] rounded-2xl p-5 text-center space-y-2 shadow-xs hover:border-[#C8402B] transition">
                <div className="text-2xl">👅</div>
                <h4 className="font-display font-bold text-sm text-[#12302B]">RASA (TASTE)</h4>
                <p className="text-xs text-[#4F6660]">Manis, masam, masin, berlemak & lazat pada lidah.</p>
              </div>
              <div className="bg-white border border-[#CBD7CE] rounded-2xl p-5 text-center space-y-2 shadow-xs hover:border-[#C8402B] transition">
                <div className="text-2xl">👃</div>
                <h4 className="font-display font-bold text-sm text-[#12302B]">BAU (SMELL)</h4>
                <p className="text-xs text-[#4F6660]">Aroma herba hutan, halia liar, serai & asap buluh.</p>
              </div>
              <div className="bg-white border border-[#CBD7CE] rounded-2xl p-5 text-center space-y-2 shadow-xs hover:border-[#C8402B] transition">
                <div className="text-2xl">👁️</div>
                <h4 className="font-display font-bold text-sm text-[#12302B]">PENGLIHATAN</h4>
                <p className="text-xs text-[#4F6660]">Warna semulajadi, kilauan kuah & susunan daun tarap.</p>
              </div>
              <div className="bg-white border border-[#CBD7CE] rounded-2xl p-5 text-center space-y-2 shadow-xs hover:border-[#C8402B] transition">
                <div className="text-2xl">✋</div>
                <h4 className="font-display font-bold text-sm text-[#12302B]">TEKSTUR</h4>
                <p className="text-xs text-[#4F6660]">Kenyal, lembut, berkanji, liat & rapuh di mulut.</p>
              </div>
              <div className="bg-white border border-[#CBD7CE] rounded-2xl p-5 text-center space-y-2 shadow-xs hover:border-[#C8402B] transition sm:col-span-2 lg:col-span-1">
                <div className="text-2xl">👂</div>
                <h4 className="font-display font-bold text-sm text-[#12302B]">BUNYI (SOUND)</h4>
                <p className="text-xs text-[#4F6660]">Bunyi rangup dan krup-krap semasa makanan dikunyah.</p>
              </div>
            </div>
          </div>

          {/* Participant Word Mission & Unlock Section */}
          <div className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CBD7CE] pb-5">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold font-display text-[#12302B]">
                  Misi Pengumpulan Kosa Kata Sensori & Pembukaan Pasca-Ujian
                </h3>
                <p className="text-xs sm:text-sm text-[#4F6660] mt-1">
                  Isikan 5 perkataan sensori daripada penerokaan di atas dan lengkapkan masa meneroka selama 1 minit.
                </p>
              </div>

              {hasStarted ? (
                <div className="bg-white border border-[#CBD7CE] rounded-2xl px-4 py-3 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#C8402B]" />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#4F6660]">Masa Meneroka</div>
                    <div className="font-mono font-bold text-[#12302B] text-sm">
                      {formatMinutesSeconds(cappedElapsed)} / {formatMinutesSeconds(MIN_EXPLORE_SECONDS)}
                      {isTimeMet ? ' (✓ Syarat Masa)' : ''}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={isStarting}
                  className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#C8402B] text-white font-bold text-sm shadow hover:bg-[#b03522] transition shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memulakan…
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Mula Pemasa Meneroka
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 5 Word Mission Inputs */}
            {hasStarted && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {SENSORY_CATEGORIES.map(cat => {
                    const val = words[cat.key] || '';
                    const isFilled = val.trim().length >= 2;
                    return (
                      <div
                        key={cat.key}
                        className="p-4 bg-white rounded-2xl border border-[#CBD7CE] space-y-2 shadow-xs transition"
                        style={{ borderTopColor: cat.color, borderTopWidth: '4px' }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-display font-bold text-xs text-[#12302B] flex items-center gap-1.5">
                            {cat.name}
                            {isFilled && <Check className="w-3.5 h-3.5 text-[#1F7A57]" />}
                          </span>
                          <span className={`text-[10px] font-bold ${isFilled ? 'text-[#1F7A57]' : 'text-[#4F6660]'}`}>
                            {isFilled ? '+10 mata' : '0/10'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#4F6660] leading-snug">{cat.question}</p>
                        <input
                          type="text"
                          maxLength={40}
                          placeholder={`Perkataan ${cat.name.toLowerCase()}...`}
                          value={val}
                          onChange={e => handleWordChange(cat.key, e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-[#F9FBF7] border border-[#CBD7CE] rounded-xl text-[#12302B] focus:outline-none focus:ring-2 focus:ring-[#C8402B]"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Status & Unlock Button */}
                <div className="pt-4 border-t border-[#CBD7CE] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-[#4F6660]">
                    {!isWordsMet
                      ? `Sila lengkapkan ${5 - completedWordsCount} perkataan lagi`
                      : !isTimeMet
                      ? `Sila tunggu ${formatMinutesSeconds(remainingSeconds)} lagi untuk mencukupi 1 minit`
                      : '✓ Syarat buka kunci dipenuhi! Anda boleh meneruskan ke pasca-ujian.'}
                    {saveStatus && <span className="ml-2 font-bold text-[#1F7A57]">{saveStatus}</span>}
                  </div>

                  <button
                    type="button"
                    onClick={handleUnlock}
                    disabled={!canUnlock || isUnlocking}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm shadow transition ${
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
                        Pasca-Ujian Terkunci (1 Minit & 5 Kata)
                      </>
                    )}
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl" role="alert">
                    {errorMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {isModalOpen && currentFoodDetail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={currentFoodDetail.name}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#CBD7CE] bg-[#F9FBF7]">
              <div>
                <span className="text-xs font-bold text-[#C8402B] uppercase tracking-wider">{currentFoodDetail.origin}</span>
                <h3 className="text-xl sm:text-2xl font-extrabold font-display text-[#12302B]">{currentFoodDetail.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#EDF1EA] text-[#4F6660] transition cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 bg-[#12302B] flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img
                src={currentFoodDetail.image}
                alt={currentFoodDetail.name}
                className="max-h-[55vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
            <div className="p-5 sm:p-6 bg-white space-y-3">
              <p className="text-sm sm:text-base text-[#4F6660] leading-relaxed">
                {currentFoodDetail.description}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#12302B] text-white font-bold text-xs sm:text-sm hover:bg-[#1b443e] transition cursor-pointer"
                >
                  Tutup Paparan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
