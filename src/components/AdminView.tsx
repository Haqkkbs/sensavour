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
import {
  db,
  auth,
  PRIMARY_ADMIN_EMAIL,
  ADMIN_EMAIL,
  handleFirestoreError,
  OperationType,
  getCurrentCounter,
  updateCounter,
  deleteParticipantRecord,
  deleteMultipleParticipants,
  fetchAdminEmails,
  addAdminEmail,
  removeAdminEmail
} from '../firebase';
import { ParticipantRecord, FOODS, FOOD_DETAILS, SENSORY_CATEGORIES } from '../types';
import {
  RefreshCw,
  LogOut,
  LogIn,
  Users,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  X,
  Eye,
  FileSpreadsheet,
  Trash2,
  UserPlus,
  AlertTriangle,
  ShieldCheck,
  Plus
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
  const [currentCounter, setCurrentCounter] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<ParticipantRecord | null>(null);

  // Pengurusan email penyelidik tambahan
  const [adminEmails, setAdminEmails] = useState<string[]>([PRIMARY_ADMIN_EMAIL]);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [isSavingAdmin, setIsSavingAdmin] = useState<boolean>(false);

  // Pemadaman data ujian
  const [showDeleteAllModal, setShowDeleteAllModal] = useState<boolean>(false);
  const [resetCounterOnDelete, setResetCounterOnDelete] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user && !user.isAnonymous) {
        fetchParticipants();
        loadAdmins();
      }
    });
    return () => unsubscribe();
  }, []);

  const loadAdmins = async () => {
    try {
      const list = await fetchAdminEmails();
      setAdminEmails(list);
    } catch (e) {
      console.warn('Could not load admin emails:', e);
    }
  };

  const fetchParticipants = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const cnt = await getCurrentCounter();
      setCurrentCounter(cnt);

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
        const userEmail = auth.currentUser?.email || 'tidak dikenali';
        setErrorMessage(
          `Akses ditolak: Akaun "${userEmail}" belum didaftarkan sebagai penyelidik. Sila log masuk dengan "${PRIMARY_ADMIN_EMAIL}" untuk memberi kebenaran kepada akaun ini.`
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
      // Prompt user to select account if switching
      provider.setCustomParameters({ prompt: 'select_account' });
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

  const handleResetCounter = async () => {
    const promptVal = window.prompt(
      'Tetapkan nombor kaunter giliran (contoh: 0 untuk mula dari S001, atau 5 untuk mula dari S006):',
      String(currentCounter)
    );
    if (promptVal !== null) {
      const parsed = parseInt(promptVal, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        try {
          await updateCounter(parsed);
          setCurrentCounter(parsed);
          alert(
            `Kaunter giliran dikemaskini ke ${parsed}. Peserta seterusnya akan menerima kod S${String(
              parsed + 1
            ).padStart(3, '0')}.`
          );
        } catch (e: any) {
          alert(`Gagal mengemaskini kaunter: ${e.message || e}`);
        }
      } else {
        alert('Sila masukkan nombor bulat yang sah (0 atau lebih).');
      }
    }
  };

  // Padam satu rekod peserta
  const handleDeleteSingle = async (item: ParticipantRecord) => {
    if (!item._uid) return;
    const confirmed = window.confirm(
      `Padam rekod peserta ${item.code}?\n\nTindakan ini kekal dan tidak boleh diundur.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteParticipantRecord(item._uid);
      setParticipants(prev => prev.filter(p => p._uid !== item._uid));
      if (selectedRecord?._uid === item._uid) {
        setSelectedRecord(null);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(`Ralat memadam rekod peserta: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Padam SEMUA data ujian peserta
  const handleConfirmDeleteAll = async () => {
    if (participants.length === 0) return;
    setIsDeleting(true);
    try {
      const uids = participants.map(p => p._uid).filter((id): id is string => Boolean(id));
      await deleteMultipleParticipants(uids);

      if (resetCounterOnDelete) {
        await updateCounter(0);
        setCurrentCounter(0);
      }

      setParticipants([]);
      setSelectedRecord(null);
      setShowDeleteAllModal(false);

      alert(
        `Semua (${uids.length}) data ujian peserta telah berjaya dipadam.${
          resetCounterOnDelete ? ' Kaunter giliran telah diset semula ke 0 (peserta seterusnya akan menerima S001).' : ''
        }`
      );
    } catch (err: any) {
      console.error('Clear all error:', err);
      alert(`Ralat memadam data ujian: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Tambah email penyelidik baharu
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newAdminEmail.toLowerCase().trim();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      alert('Sila masukkan alamat email yang sah.');
      return;
    }
    if (adminEmails.includes(clean)) {
      alert('Email ini telah pun berada dalam senarai penyelidik.');
      return;
    }

    setIsSavingAdmin(true);
    try {
      await addAdminEmail(clean, currentUser?.email || PRIMARY_ADMIN_EMAIL);
      setAdminEmails(prev => [...prev, clean]);
      setNewAdminEmail('');
      alert(`Email "${clean}" telah berjaya didaftarkan sebagai penyelidik! Penyelidik ini kini boleh log masuk portal.`);
    } catch (err: any) {
      console.error('Add admin error:', err);
      alert(`Ralat mendaftarkan email penyelidik: ${err.message || err}`);
    } finally {
      setIsSavingAdmin(false);
    }
  };

  // Buang email penyelidik
  const handleRemoveAdmin = async (targetEmail: string) => {
    if (targetEmail.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      alert('Email penyelidik utama tidak boleh dipadam.');
      return;
    }
    const confirmed = window.confirm(`Keluarkan ${targetEmail} daripada senarai penyelidik berdaftar?`);
    if (!confirmed) return;

    try {
      await removeAdminEmail(targetEmail);
      setAdminEmails(prev => prev.filter(e => e.toLowerCase() !== targetEmail.toLowerCase()));
    } catch (err: any) {
      alert(`Ralat memadam email: ${err.message || err}`);
    }
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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F6660] hover:text-[#12302B] mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Aplikasi Peserta
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#12302B]">
            Portal Penyelidik (Admin)
          </h1>
        </div>

        {isGoogleUser && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchParticipants}
              disabled={isLoading || isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#CBD7CE] bg-white text-xs font-bold text-[#12302B] hover:bg-[#EDF1EA] transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Muat Semula
            </button>

            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#12302B] bg-[#12302B]/5 text-xs font-bold text-[#12302B] hover:bg-[#12302B]/10 transition cursor-pointer"
              title="Urus dan tambah akaun email penyelidik lain"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#1F7A57]" />
              Urus Penyelidik ({adminEmails.length})
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteAllModal(true)}
              disabled={participants.length === 0 || isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 transition disabled:opacity-40 cursor-pointer"
              title="Padam semua data peserta ujian dan reset kaunter"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Padam Semua Data Ujian
            </button>

            <button
              type="button"
              onClick={exportCsv}
              disabled={participants.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C8402B] text-white text-xs font-bold shadow hover:bg-[#b03522] transition disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Eksport CSV ({participants.length})
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#CBD7CE] bg-white text-xs font-bold text-[#C8402B] hover:bg-red-50 transition cursor-pointer"
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
            Log masuk dengan akaun Google penyelidik yang diberi kebenaran untuk melihat senarai peserta, jawapan, mengurus akaun penyelidik, dan memuat turun fail CSV.
          </p>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl" role="alert">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleSignInGoogle}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#12302B] text-white font-bold text-sm shadow hover:bg-[#1f4a43] transition cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Log Masuk dengan Google
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User info banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Log masuk sebagai penyelidik: <b>{currentUser.email}</b>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSignInGoogle}
                className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                Tukar Akaun Google
              </button>
              <span className="font-semibold text-emerald-700">Firestore Rules: Aktif</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
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

            <div className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-xl p-4 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-xs text-[#4F6660] font-bold">
                <span>Running No.</span>
                <span className="text-[10px] bg-[#1F7A57]/15 text-[#1F7A57] font-mono px-1.5 py-0.5 rounded font-bold">
                  S{String(currentCounter).padStart(3, '0')}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-xl sm:text-2xl font-extrabold font-display text-[#12302B]">
                  S{String(currentCounter + 1).padStart(3, '0')}
                </div>
                <button
                  type="button"
                  onClick={handleResetCounter}
                  className="text-[11px] text-[#C8402B] hover:underline font-bold cursor-pointer"
                >
                  Ubah
                </button>
              </div>
              <div className="text-[10px] text-[#4F6660]">
                (Seterusnya: S{String(currentCounter + 1).padStart(3, '0')})
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl space-y-2" role="alert">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Ralat Akses Firestore</span>
              </div>
              <p>{errorMessage}</p>
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={handleSignInGoogle}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700"
                >
                  Tukar ke Akaun Google Lain
                </button>
              </div>
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
                        {isLoading ? 'Memuatkan senarai peserta…' : 'Tiada rekod peserta dalam Firestore. Semua data ujian telah dikosongkan.'}
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
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedRecord(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#CBD7CE] bg-white text-xs font-semibold text-[#12302B] hover:bg-[#EDF1EA] transition cursor-pointer"
                                title="Lihat butiran jawapan"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#4F6660]" />
                                Lihat
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSingle(item)}
                                disabled={isDeleting}
                                className="inline-flex items-center p-1 rounded border border-red-200 bg-white text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Padam rekod peserta ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

      {/* Modal Pengurusan Penyelidik (Admin Emails) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#CBD7CE] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#CBD7CE] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1F7A57]" />
                <h3 className="text-lg font-bold font-display text-[#12302B]">
                  Pengurusan Akaun Penyelidik
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#4F6660]">
              Penyelidik yang didaftarkan di sini boleh log masuk portal menggunakan akaun Google mereka untuk melihat semua jawapan dan memuat turun data CSV.
            </p>

            {/* Form tambah email baru */}
            <form onSubmit={handleAddAdmin} className="space-y-2">
              <label className="block text-xs font-bold text-[#12302B]">
                Tambah Email Penyelidik Baharu:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  placeholder="contoh: rakan.penyelidik@gmail.com"
                  className="flex-1 px-3 py-2 text-xs border border-[#CBD7CE] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1F7A57]"
                  required
                />
                <button
                  type="submit"
                  disabled={isSavingAdmin || !newAdminEmail.trim()}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#1F7A57] text-white text-xs font-bold hover:bg-[#165a40] transition disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isSavingAdmin ? 'Menyimpan…' : 'Daftar'}
                </button>
              </div>
            </form>

            {/* Senarai email berdaftar */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#12302B]">
                Senarai Penyelidik Dibenarkan ({adminEmails.length}):
              </label>
              <div className="border border-[#CBD7CE] rounded-xl divide-y divide-[#CBD7CE]/60 max-h-48 overflow-y-auto">
                {adminEmails.map(email => {
                  const isPrimary = email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
                  return (
                    <div key={email} className="flex items-center justify-between p-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#12302B]">{email}</span>
                        {isPrimary && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            Utama
                          </span>
                        )}
                      </div>
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAdmin(email)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 cursor-pointer"
                          title="Padam akses penyelidik ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="px-4 py-2 rounded-xl bg-[#12302B] text-white text-xs font-bold hover:bg-[#1f4a43] cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Padam Semua Data Ujian */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#CBD7CE] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-[#12302B]">
                Padam Semua Data Ujian?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-[#4F6660] leading-relaxed">
              Adakah anda pasti ingin memadam kesemua <b>{participants.length} rekod peserta</b> daripada Firestore? Tindakan ini <b>kekal</b> dan data tidak boleh dipulihkan selepas dipadam.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <label className="flex items-start gap-2.5 text-xs text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetCounterOnDelete}
                  onChange={e => setResetCounterOnDelete(e.target.checked)}
                  className="mt-0.5 rounded text-[#C8402B] focus:ring-[#C8402B]"
                />
                <span>
                  <b>Set semula kaunter giliran ke 0.</b>
                  <br />
                  <span className="text-amber-800 text-[11px]">
                    Peserta seterusnya yang menyertai kajian akan bermula semula dengan kod <b>S001</b>.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-[#CBD7CE] bg-white text-xs font-bold text-[#12302B] hover:bg-[#EDF1EA] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Memadam…' : 'Ya, Padam Semua'}
              </button>
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
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
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
                  const foodMeta = FOOD_DETAILS[food];
                  return (
                    <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                      <div className="font-bold text-sm text-[#12302B] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {foodMeta && (
                            <img
                              src={foodMeta.image}
                              alt={food}
                              className="w-7 h-7 rounded-md object-cover border border-gray-300"
                              onError={e => {
                                const target = e.currentTarget;
                                if (target.src !== foodMeta.fallbackImage) {
                                  target.src = foodMeta.fallbackImage;
                                }
                              }}
                            />
                          )}
                          <span>{food}</span>
                        </div>
                        <span className="text-[11px] font-normal text-[#4F6660]">{fam || 'Tahap kebiasaan: —'}</span>
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

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleDeleteSingle(selectedRecord)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Padam Rekod Ini
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-[#12302B] text-white text-xs font-bold hover:bg-[#1f4a43] cursor-pointer"
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
