import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Loader2,
  ArrowRight,
  ShieldCheck,
  Compass,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  LogIn,
  CheckCircle2
} from 'lucide-react';

interface WelcomeViewProps {
  onStartMission: (code: string) => Promise<void>;
  onOpenAdmin: () => void;
  isAnonymousDisabled?: boolean;
  onRetryAnonymous?: () => Promise<void>;
  onSignInGoogle?: () => Promise<void>;
  currentUser?: User | null;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onStartMission,
  onOpenAdmin,
  isAnonymousDisabled = false,
  onRetryAnonymous,
  onSignInGoogle,
  currentUser
}) => {
  const [code, setCode] = useState<string>('');
  const [consent, setConsent] = useState<'yes' | 'no' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRetryingAuth, setIsRetryingAuth] = useState<boolean>(false);
  const [hasDeclined, setHasDeclined] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!/^S\d{3}$/.test(cleanCode)) {
      setErrorMessage('Sila masukkan kod peserta yang sah dalam format S001 (contoh: S001).');
      return;
    }

    if (!consent) {
      setErrorMessage('Sila pilih sama ada anda bersetuju atau tidak untuk menyertai kajian.');
      return;
    }

    if (consent === 'no') {
      setHasDeclined(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      await onStartMission(cleanCode);
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      setErrorMessage(
        err.message || 'Tak dapat menyimpan rekod permulaan. Sila semak internet dan cuba lagi.'
      );
    }
  };

  const handleRetry = async () => {
    if (!onRetryAnonymous) return;
    setIsRetryingAuth(true);
    setErrorMessage('');
    try {
      await onRetryAnonymous();
    } finally {
      setIsRetryingAuth(false);
    }
  };

  if (hasDeclined) {
    return (
      <div className="max-w-xl mx-auto w-full bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-4">
        <h2 className="text-2xl font-bold font-display text-[#12302B]">Terima Kasih</h2>
        <p className="text-sm text-[#4F6660]">
          Tiada data anda disimpan. Anda boleh menutup halaman ini sekarang. / No data was saved. You may close this page.
        </p>
        <button
          type="button"
          onClick={() => {
            setHasDeclined(false);
            setConsent(null);
          }}
          className="text-xs text-[#1F7A57] underline font-bold mt-2 cursor-pointer"
        >
          Kembali ke borang persetujuan
        </button>
      </div>
    );
  }

  const isUserAuthenticated = Boolean(currentUser);

  return (
    <div className="max-w-xl mx-auto w-full bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#12302B]/10 text-[#12302B] rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          <Compass className="w-3.5 h-3.5" />
          Kajian Kosa Kata Sensori · Hospitaliti
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-[#12302B] leading-tight">
          Huraikan rasa Borneo dengan kata yang tepat
        </h1>
        <p className="text-sm text-[#4F6660] mt-3 leading-relaxed">
          Tiga langkah mudah: pra-ujian, teroka SENSAVOUR, dan pasca-ujian berkunci. Penuhkan roda deria anda dan kumpul mata! Anda boleh menjawab dalam Bahasa Melayu atau Bahasa Inggeris.
        </p>
      </div>

      {/* Notice if Firebase Anonymous Authentication provider is pending activation in console */}
      {isAnonymousDisabled && !isUserAuthenticated && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 text-xs sm:text-sm text-amber-900">
          <div className="flex items-start gap-2.5 font-bold text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span>Tetapan Penyelidik: Aktifkan Anonymous Sign-In</span>
              <p className="font-normal text-xs text-amber-800 mt-1">
                Penyedia pengesahan <i>Anonymous</i> belum diaktifkan dalam Firebase Console untuk membolehkan peserta menyertai tanpa akaun.
              </p>
            </div>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-xs space-y-1.5 text-amber-900">
            <p className="font-semibold">Langkah ringkas (hanya 1 minit):</p>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>
                Buka tab Firebase Console:{' '}
                <a
                  href="https://console.firebase.google.com/project/promising-quest-307pf/authentication/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-amber-950 underline hover:text-black"
                >
                  Authentication &gt; Sign-in method
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Klik <b>Anonymous</b>, tekan suis <b>Enable</b>, dan tekan <b>Save</b>.</li>
              <li>Kembali ke sini dan tekan <b>Semak Semula</b>.</li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetryingAuth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetryingAuth ? 'animate-spin' : ''}`} />
              Semak Semula Sambungan
            </button>

            {onSignInGoogle && (
              <button
                type="button"
                onClick={onSignInGoogle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-700 text-amber-900 font-bold text-xs bg-white hover:bg-amber-100/50 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                Atau Terus Log Masuk dengan Google
              </button>
            )}
          </div>
        </div>
      )}

      {/* Authenticated badge */}
      {isUserAuthenticated && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Sesi disahkan: {currentUser?.isAnonymous ? 'Peserta (Tanpa Akaun)' : currentUser?.email || 'Pengguna Berdaftar'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Code Input */}
        <div>
          <label htmlFor="participant-code" className="block text-xs font-bold uppercase tracking-wider text-[#12302B] mb-1.5">
            Kod Peserta / Participant Code:
          </label>
          <input
            id="participant-code"
            type="text"
            maxLength={4}
            placeholder="S001"
            value={code}
            onChange={e => {
              setCode(e.target.value.toUpperCase());
              setErrorMessage('');
            }}
            className="w-44 px-3.5 py-2.5 bg-white border border-[#CBD7CE] rounded-xl font-mono font-bold text-lg text-[#12302B] tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-[#C8402B]"
          />
          <p className="text-xs text-[#4F6660] mt-1.5">
            Gunakan kod yang diberikan oleh penyelidik (contoh: S001). Jangan masukkan nama atau nombor kad pengenalan/matrik.
          </p>
        </div>

        {/* Consent Section */}
        <div className="p-4 bg-[#EDF1EA]/60 border border-[#CBD7CE] rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#12302B]">
            <ShieldCheck className="w-4 h-4 text-[#1F7A57]" />
            Persetujuan Penyelidikan / Research Consent
          </div>
          <p className="text-xs text-[#4F6660] leading-relaxed">
            Saya telah membaca maklumat kajian, memahami tujuannya dan bersetuju untuk menyertai kajian ini secara sukarela. / I have read the study information, understand its purpose and voluntarily agree to participate.
          </p>

          <div className="space-y-2 pt-1">
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition ${
                consent === 'yes'
                  ? 'border-[#12302B] bg-white font-semibold shadow-xs'
                  : 'border-[#CBD7CE] bg-[#EDF1EA]/40 hover:bg-white'
              }`}
            >
              <input
                type="radio"
                name="consent"
                value="yes"
                checked={consent === 'yes'}
                onChange={() => {
                  setConsent('yes');
                  setErrorMessage('');
                }}
                className="mt-0.5 text-[#C8402B] accent-[#C8402B]"
              />
              <span className="text-[#12302B]">
                <b>Ya</b>, saya bersetuju untuk menyertai kajian ini. / <i>Yes, I agree to participate.</i>
              </span>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition ${
                consent === 'no'
                  ? 'border-[#12302B] bg-white font-semibold shadow-xs'
                  : 'border-[#CBD7CE] bg-[#EDF1EA]/40 hover:bg-white'
              }`}
            >
              <input
                type="radio"
                name="consent"
                value="no"
                checked={consent === 'no'}
                onChange={() => {
                  setConsent('no');
                  setErrorMessage('');
                }}
                className="mt-0.5 text-[#C8402B] accent-[#C8402B]"
              />
              <span className="text-[#12302B]">
                <b>Tidak</b>, saya tidak bersetuju. / <i>No, I do not agree.</i>
              </span>
            </label>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl" role="alert">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#C8402B] text-white font-bold text-sm shadow hover:bg-[#b03522] transition disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyediakan Sesi…
            </>
          ) : (
            <>
              Mula Misi
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Discreet Link to Admin Portal for Researcher */}
      <div className="pt-4 border-t border-[#CBD7CE]/70 text-center">
        <button
          type="button"
          onClick={onOpenAdmin}
          className="text-xs text-[#4F6660] hover:text-[#12302B] transition font-medium underline cursor-pointer"
        >
          Portal Penyelidik / Researcher Admin
        </button>
      </div>
    </div>
  );
};
