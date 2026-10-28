import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs
} from 'firebase/firestore';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User
} from 'firebase/auth';
import { db, auth, ADMIN_EMAIL, handleFirestoreError, OperationType } from '../firebase';
import { ParticipantRecord, FOODS, SENSORY_CATEGORIES } from '../types';
import {
  Download,
  RefreshCw,
  LogOut,
  LogIn,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  X,
  Eye,
  FileSpreadsheet
} from 'lucide-react';

interface AdminViewProps {
  onBackToApp: () => void;
}

function formatIso(t: any): string {
  if (!t) return '—';
  if (t.toDate && typeof t.toDate === 'function') {
    return t.toDate().toLocaleString('ms-MY', { dateStyle: 'short', timeStyle: 'short' });
  }
  if (typeof t === 'number') {
    return new Date(t).toLocaleString('ms-MY', { dateStyle: 'short', timeStyle: 'short' });
  }
  return String(t);
}

function calculateMinutes(a: any, b: any): string {
  if (!a || !b) return '—';
  const aMs = a.toMillis ? a.toMillis() : typeof a === 'number' ? a : null;
  const bMs = b.toMillis ? b.toMillis() : typeof b === 'number' ? b : null;
  if (!aMs || !bMs) return '—';
  return ((bMs - aMs) / 60000).toFixed(1);
}

function stageBadge(d: ParticipantRecord): { label: string; bg: string; text: string } {
  if (d.postSubmittedAt) return { label: 'Siap', bg: 'bg-emerald-100', text: 'text-emerald-800' };
  if (d.unlockedAt) return { label: 'Pasca-ujian', bg: 'bg-amber-100', text: 'text-amber-800' };
  if (d.preSubmittedAt) return { label: 'Teroka', bg: 'bg-blue-100', text: 'text-blue-800' };
  return { label: 'Pra-ujian', bg: 'bg-gray-100', text: 'text-gray-800' };
}

function escapeCsvCell(v: any): string {
  if (v === undefined || v === null) return '';
  const s = String(v).replace(/\r?\n/g, ' ');
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBackToApp }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<ParticipantRecord | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user && !user.isAnonymous) {
        fetchParticipants();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchParticipants = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const q = query(collection(db, 'participants'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const docs: ParticipantRecord[] = [];
      snap.forEach(s => {
        const data = s.data() as ParticipantRecord;
        data._uid = s.id;
        docs.push(data);
      });
      setParticipants(docs);
    } catch (err: any) {
      console.error('Admin fetch error:', err);
      try {
        handleFirestoreError(err, OperationType.LIST, 'participants');
      } catch (e: any) {
        setErrorMessage(
          `Tiada kebenaran akses atau ralat: ${err.message || err}. Pastikan anda log masuk dengan akaun ${ADMIN_EMAIL}.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInGoogle = async () => {
    setErrorMessage('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Log masuk Google gagal: ${err.message || 'Sila cuba lagi'}`);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setParticipants([]);
  };

  const exportCsv = () => {
    const headers = [
      'uid',
      'participant_code',
      'created_at',
      'stage',
      'pre_submitted_at',
      'explore_started_at',
      'unlocked_at',
      'post_submitted_at',
      'explore_minutes',
      'Q3_age',
      'Q4_gender',
      'Q5_programme',
      'Q6_semester',
      'Q7_prior_learning'
    ];

    FOODS.forEach(f => headers.push(`Q8_familiarity_${f}`));
    FOODS.forEach((f, i) => headers.push(`Q${9 + i}_pre_${f}`));
    SENSORY_CATEGORIES.forEach(c => headers.push(`word_${c.key}`));
    FOODS.forEach((f, i) => headers.push(`Q${21 + i}_post_${f}`));
    ['Q31', 'Q32', 'Q33', 'Q34', 'Q35', 'Q36'].forEach(q => headers.push(`${q}_reflection`));

    const rows: string[] = [headers.map(escapeCsvCell).join(',')];

    participants.forEach(d => {
      const p = d.profile || {};
      const pre = d.pre || {};
      const post = d.post || {};
      const ref = d.reflection || {};
      const words = d.words || {};
      const fam = (p.q8 as Record<string, string>) || {};

      const rowValues = [
        d._uid || '',
        d.code,
        formatIso(d.createdAt),
        stageBadge(d).label,
        formatIso(d.preSubmittedAt),
        formatIso(d.exploreStartedAt),
        formatIso(d.unlockedAt),
        formatIso(d.postSubmittedAt),
        calculateMinutes(d.exploreStartedAt, d.unlockedAt),
        p.q3 || '',
        p.q4 || '',
        p.q5 || '',
        p.q6 || '',
        p.q7 || ''
      ];

      FOODS.forEach(f => rowValues.push(fam[f] || ''));
      FOODS.forEach((_, i) => rowValues.push(pre[`q${9 + i}`] || ''));
      SENSORY_CATEGORIES.forEach(c => rowValues.push(words[c.key] || ''));
      FOODS.forEach((_, i) => rowValues.push(post[`q${21 + i}`] || ''));
      ['q31', 'q32', 'q33', 'q34', 'q35', 'q36'].forEach(q => rowValues.push(ref[q] || ''));

      rows.push(rowValues.map(escapeCsvCell).join(','));
    });

    // UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensavour_responses_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const isGoogleUser = currentUser && !currentUser.isAnonymous;

  // Stats calculation
  const totalCount = participants.length;
  const preDoneCount = participants.filter(p => p.preSubmittedAt).length;
  const unlockedCount = participants.filter(p => p.unlockedAt).length;
  const postDoneCount = participants.filter(p => p.postSubmittedAt).length;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#CBD7CE] pb-4">
        <div>
          <button
            type="button"
            onClick={onBackToApp}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F6660] hover:text-[#12302B] mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Aplikasi Peserta
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#12302B]">
            Portal Penyelidik (Admin)
          </h1>
        </div>

        {isGoogleUser && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchParticipants}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#CBD7CE] bg-white text-xs font-bold text-[#12302B] hover:bg-[#EDF1EA] transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Muat Semula
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={participants.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C8402B] text-white text-xs font-bold shadow hover:bg-[#b03522] transition disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Eksport CSV ({participants.length})
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#CBD7CE] bg-white text-xs font-bold text-[#C8402B] hover:bg-red-50 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Keluar
            </button>
          </div>
        )}
      </div>

      {/* Auth State */}
      {!isGoogleUser ? (
        <div className="max-w-md mx-auto bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="p-3 bg-[#EDF1EA] text-[#12302B] rounded-full inline-flex">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-display text-[#12302B]">
            Akses Penyelidikan
          </h2>
          <p className="text-xs sm:text-sm text-[#4F6660]">
            Log masuk dengan akaun Google penyelidik (<span className="font-mono text-[#12302B]">{ADMIN_EMAIL}</span>) untuk melihat senarai peserta, jawapan terperinci, dan memuat turun fail CSV.
          </p>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl" role="alert">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleSignInGoogle}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#12302B] text-white font-bold text-sm shadow hover:bg-[#1f4a43] transition"
          >
            <LogIn className="w-4 h-4" />
            Log Masuk dengan Google
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User info banner */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <span>
              Log masuk sebagai penyelidik: <b>{currentUser.email}</b>
            </span>
            <span className="font-semibold text-emerald-700">Firestore Rules: Aktif</span>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#4F6660] font-bold">
                <span>Jumlah Peserta</span>
                <Users className="w-4 h-4 text-[#4F6660]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-[#12302B] mt-1">
                {totalCount}
              </div>
            </div>

            <div className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#4F6660] font-bold">
                <span>Pra-Ujian Siap</span>
                <CheckCircle className="w-4 h-4 text-[#1F7A57]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-[#12302B] mt-1">
                {preDoneCount}
              </div>
            </div>

            <div className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#4F6660] font-bold">
                <span>Kunci Dibuka</span>
                <Sparkles className="w-4 h-4 text-[#E3A21A]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-[#12302B] mt-1">
                {unlockedCount}
              </div>
            </div>

            <div className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-[#4F6660] font-bold">
                <span>Pasca-Ujian Siap</span>
                <CheckCircle className="w-4 h-4 text-[#C8402B]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-[#12302B] mt-1">
                {postDoneCount}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl" role="alert">
              {errorMessage}
            </div>
          )}

          {/* Table */}
          <div className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#EDF1EA] text-[#4F6660] text-xs font-bold uppercase tracking-wider border-b border-[#CBD7CE]">
                  <tr>
                    <th className="py-3 px-4">Kod</th>
                    <th className="py-3 px-4">Peringkat</th>
                    <th className="py-3 px-4">Masa Mula</th>
                    <th className="py-3 px-4">Pra Dihantar</th>
                    <th className="py-3 px-4">Masa Meneroka (Min)</th>
                    <th className="py-3 px-4">Pasca Dihantar</th>
                    <th className="py-3 px-4">Kosa Kata</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD7CE]/70">
                  {participants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-sm text-[#4F6660]">
                        {isLoading ? 'Memuatkan senarai peserta…' : 'Belum ada rekod peserta dalam Firestore.'}
                      </td>
                    </tr>
                  ) : (
                    participants.map((item, idx) => {
                      const badge = stageBadge(item);
                      const wordsCount = item.words ? Object.keys(item.words).length : 0;
                      return (
                        <tr key={item._uid || idx} className="hover:bg-[#EDF1EA]/50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-[#12302B]">
                            {item.code}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#4F6660] whitespace-nowrap">
                            {formatIso(item.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-[#4F6660] whitespace-nowrap">
                            {formatIso(item.preSubmittedAt)}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#12302B]">
                            {calculateMinutes(item.exploreStartedAt, item.unlockedAt)} min
                          </td>
                          <td className="py-3 px-4 text-[#4F6660] whitespace-nowrap">
                            {formatIso(item.postSubmittedAt)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-mono font-bold ${wordsCount >= 5 ? 'text-[#1F7A57]' : 'text-[#4F6660]'}`}>
                              {wordsCount} / 5
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#CBD7CE] bg-white text-xs font-semibold text-[#12302B] hover:bg-[#EDF1EA] transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#4F6660]" />
                              Lihat
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal for Selected Participant */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#CBD7CE] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#CBD7CE] pb-3">
              <div>
                <span className="text-xs font-bold text-[#C8402B] uppercase">Butiran Peserta</span>
                <h3 className="text-xl font-bold font-display text-[#12302B]">
                  {selectedRecord.code} ({stageBadge(selectedRecord).label})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Demographics */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#4F6660]">
                1. Profil & Demografi:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#EDF1EA]/60 p-3.5 rounded-xl">
                <div><b>Umur:</b> {selectedRecord.profile?.q3 || '—'}</div>
                <div><b>Jantina:</b> {selectedRecord.profile?.q4 || '—'}</div>
                <div><b>Program:</b> {selectedRecord.profile?.q5 || '—'}</div>
                <div><b>Semester:</b> {selectedRecord.profile?.q6 || '—'}</div>
                <div className="sm:col-span-2"><b>Latihan Sensori Terdahulu:</b> {selectedRecord.profile?.q7 || '—'}</div>
              </div>
            </div>

            {/* Words collected */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#4F6660]">
                2. Kosa Kata Sensori Semasa Meneroka:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {SENSORY_CATEGORIES.map(c => (
                  <div key={c.key} className="p-2.5 bg-[#EDF1EA]/60 rounded-lg border border-[#CBD7CE]">
                    <div className="font-bold text-[#4F6660]">{c.name}:</div>
                    <div className="font-mono font-bold text-[#12302B] mt-0.5 truncate">
                      {selectedRecord.words?.[c.key] || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison of Pre vs Post food descriptions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#4F6660]">
                3. Perbandingan Huraian Makanan (Pra vs Pasca):
              </h4>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-xs">
                {FOODS.map((food, idx) => {
                  const preAns = selectedRecord.pre?.[`q${9 + idx}`];
                  const postAns = selectedRecord.post?.[`q${21 + idx}`];
                  const fam = selectedRecord.profile?.q8?.[food];
                  return (
                    <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                      <div className="font-bold text-sm text-[#12302B] flex justify-between">
                        <span>{food}</span>
                        <span className="text-[11px] font-normal text-[#4F6660]">{fam || 'Keakraban: —'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        <div className="bg-white p-2 rounded border border-gray-200">
                          <span className="font-bold text-blue-700 block mb-1">Pra-Ujian:</span>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{preAns || '—'}</p>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-200">
                          <span className="font-bold text-emerald-700 block mb-1">Pasca-Ujian:</span>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{postAns || '—'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reflection Q31-Q36 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#4F6660]">
                4. Refleksi Penggunaan SENSAVOUR:
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-[#EDF1EA]/60 rounded-lg">
                  <b>Q31 (Pengaruh SENSAVOUR):</b> {selectedRecord.reflection?.q31 || '—'}
                </div>
                <div className="p-2.5 bg-[#EDF1EA]/60 rounded-lg">
                  <b>Q32 (Kosa kata baru dipelajari):</b> {selectedRecord.reflection?.q32 || '—'}
                </div>
                <div className="p-2.5 bg-[#EDF1EA]/60 rounded-lg">
                  <b>Q33 (Bahagian paling membantu):</b> {selectedRecord.reflection?.q33 || '—'}
                </div>
                <div className="p-2.5 bg-[#EDF1EA]/60 rounded-lg">
                  <b>Q34 (Bahagian mengelirukan):</b> {selectedRecord.reflection?.q34 || '—'}
                </div>
                <div className="p-2.5 bg-[#EDF1EA]/60 rounded-lg">
                  <b>Q35 (Cadangan penambahbaikan):</b> {selectedRecord.reflection?.q35 || '—'}
                </div>
                <div className="p-2.5 bg-[#EDF1EA]/60 rounded-lg">
                  <b>Q36 (Lain-lain komen):</b> {selectedRecord.reflection?.q36 || '—'}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-[#12302B] text-white text-xs font-bold hover:bg-[#1f4a43]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
