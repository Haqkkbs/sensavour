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
  handleFirestoreError,
  OperationType,
  getCurrentCounter,
  updateCounter,
  deleteParticipantRecord,
  deleteMultipleParticipants,
  fetchAdminEmails,
  addAdminEmail,
  removeAdminEmail,
  submitAdminRequest,
  fetchAdminRequests,
  approveAdminRequest,
  rejectAdminRequest,
  AdminRequestRecord
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
  BarChart3,
  PieChart,
  TrendingUp,
  Award,
  FileText,
  UserCheck,
  Bell,
  Clock,
  Check
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

  // Tab navigation: Participants table vs Automated Analytics
  const [adminTab, setAdminTab] = useState<'participants' | 'analytics'>('participants');

  // Pengurusan email penyelidik & permohonan automatik
  const [adminEmails, setAdminEmails] = useState<string[]>([PRIMARY_ADMIN_EMAIL]);
  const [pendingRequests, setPendingRequests] = useState<AdminRequestRecord[]>([]);
  const [isPendingApproval, setIsPendingApproval] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [isSavingAdmin, setIsSavingAdmin] = useState<boolean>(false);

  // Pemadaman data ujian
  const [showDeleteAllModal, setShowDeleteAllModal] = useState<boolean>(false);
  const [resetCounterOnDelete, setResetCounterOnDelete] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      setCurrentUser(user);
      if (user && !user.isAnonymous) {
        checkUserStatusAndLoad(user);
      } else {
        setIsPendingApproval(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const checkUserStatusAndLoad = async (user: User) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const list = await fetchAdminEmails();
      setAdminEmails(list);

      const userEmail = (user.email || '').toLowerCase().trim();
      const isApproved = list.map(e => e.toLowerCase().trim()).includes(userEmail);

      if (!isApproved) {
        // Automatically submit request so it immediately appears in admin's portal
        await submitAdminRequest(userEmail, user.displayName || '', user.photoURL || '');
        setIsPendingApproval(true);
        setIsLoading(false);
      } else {
        setIsPendingApproval(false);
        await Promise.all([
          fetchParticipants(),
          loadPendingRequests()
        ]);
      }
    } catch (err: any) {
      console.warn('Status check warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const reqs = await fetchAdminRequests();
      setPendingRequests(reqs);
    } catch (e) {
      console.warn('Could not load admin requests:', e);
    }
  };

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
          `Akses ditolak: Akaun "${userEmail}" belum diluluskan sebagai penyelidik. Sila minta Penyelidik Utama ("${PRIMARY_ADMIN_EMAIL}") untuk menekan butang 'Luluskan' bagi akaun ini.`
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
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      if (cred.user) {
        await checkUserStatusAndLoad(cred.user);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Log masuk Google gagal: ${err.message || 'Sila cuba lagi'}`);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setParticipants([]);
    setIsPendingApproval(false);
  };

  const handleApproveRequest = async (targetEmail: string) => {
    try {
      await approveAdminRequest(targetEmail, currentUser?.email || PRIMARY_ADMIN_EMAIL);
      setAdminEmails(prev => [...prev, targetEmail.toLowerCase().trim()]);
      setPendingRequests(prev => prev.filter(r => r.email.toLowerCase().trim() !== targetEmail.toLowerCase().trim()));
      alert(`Akaun "${targetEmail}" telah berjaya diluluskan sebagai penyelidik!`);
    } catch (e: any) {
      console.error('Approve error:', e);
      alert(`Ralat meluluskan: ${e.message || e}`);
    }
  };

  const handleRejectRequest = async (targetEmail: string) => {
    const conf = window.confirm(`Padam permohonan akses penyelidik daripada ${targetEmail}?`);
    if (!conf) return;
    try {
      await rejectAdminRequest(targetEmail);
      setPendingRequests(prev => prev.filter(r => r.email.toLowerCase().trim() !== targetEmail.toLowerCase().trim()));
    } catch (e: any) {
      alert(`Ralat memadam permohonan: ${e.message || e}`);
    }
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
      alert(`Email "${clean}" telah berjaya didaftarkan sebagai penyelidik!`);
    } catch (err: any) {
      console.error('Add admin error:', err);
      alert(`Ralat mendaftarkan email penyelidik: ${err.message || err}`);
    } finally {
      setIsSavingAdmin(false);
    }
  };

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
  const completionRate = totalCount > 0 ? Math.round((postDoneCount / totalCount) * 100) : 0;

  // Automated Analytics computations
  const ageDistribution: Record<string, number> = {};
  const programmeDistribution: Record<string, number> = {};
  const priorLearningDistribution: Record<string, number> = {};
  const collectedWordsFrequency: Record<string, string[]> = { rupa: [], aroma: [], rasa: [], tekstur: [], bunyi: [] };
  const reflectionsSummary: Record<string, string[]> = { q31: [], q32: [], q33: [], q34: [] };

  participants.forEach(p => {
    const prof = p.profile || {};
    if (prof.q3) ageDistribution[prof.q3] = (ageDistribution[prof.q3] || 0) + 1;
    if (prof.q5) programmeDistribution[prof.q5] = (programmeDistribution[prof.q5] || 0) + 1;
    if (prof.q7) priorLearningDistribution[prof.q7] = (priorLearningDistribution[prof.q7] || 0) + 1;

    if (p.words) {
      SENSORY_CATEGORIES.forEach(c => {
        const w = (p.words?.[c.key] || '').trim().toLowerCase();
        if (w.length >= 2) {
          collectedWordsFrequency[c.key].push(w);
        }
      });
    }

    if (p.reflection) {
      ['q31', 'q32', 'q33', 'q34'].forEach(qKey => {
        const ans = (p.reflection?.[qKey] || '').trim();
        if (ans) reflectionsSummary[qKey].push(ans);
      });
    }
  });

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
            Portal Penyelidik (Admin) & Analisis Otomatis
          </h1>
        </div>

        {isGoogleUser && !isPendingApproval && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                fetchParticipants();
                loadPendingRequests();
                loadAdmins();
              }}
              disabled={isLoading || isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#CBD7CE] bg-white text-xs font-bold text-[#12302B] hover:bg-[#EDF1EA] transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Muat Semula
            </button>

            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#12302B] bg-[#12302B]/5 text-xs font-bold text-[#12302B] hover:bg-[#12302B]/10 transition cursor-pointer relative"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#1F7A57]" />
              <span>Urus Penyelidik ({adminEmails.length})</span>
              {pendingRequests.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse absolute -top-1 -right-1" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteAllModal(true)}
              disabled={participants.length === 0 || isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 transition disabled:opacity-40 cursor-pointer"
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

      {/* STATE 1: PENDING APPROVAL SCREEN (when unauthorized Google account signs in) */}
      {isPendingApproval && currentUser ? (
        <div className="max-w-lg mx-auto bg-[#F9FBF7] border border-[#CBD7CE] rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-md">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
              Menunggu Kelulusan / Pending
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#12302B]">
              Permohonan Akses Telah Dihantar
            </h2>
            <p className="text-xs sm:text-sm text-[#4F6660] leading-relaxed">
              Akaun Google anda <strong className="text-[#12302B] font-mono">{currentUser.email}</strong> telah berjaya direkodkan secara automatik ke dalam senarai permohonan portal penyelidik ini.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#CBD7CE] text-left text-xs space-y-2 text-[#4F6660]">
            <div className="font-bold text-[#12302B] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#C8402B]" />
              Langkah Seterusnya:
            </div>
            <p>
              Email anda telah pun muncul di portal Penyelidik Utama (<b>{PRIMARY_ADMIN_EMAIL}</b>). Beliau hanya perlu menekan butang <b>"Luluskan Sebagai Penyelidik"</b> untuk mengaktifkan akses anda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => checkUserStatusAndLoad(currentUser)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#12302B] text-white text-xs font-bold hover:bg-[#1f4a43] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Semak Semula Kelulusan
            </button>
            <button
              type="button"
              onClick={handleSignInGoogle}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#CBD7CE] bg-white text-xs font-bold text-[#4F6660] hover:bg-[#EDF1EA] transition cursor-pointer"
            >
              Tukar Akaun Google
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
            >
              Log Keluar
            </button>
          </div>
        </div>
      ) : !isGoogleUser ? (
        /* STATE 2: NOT SIGNED IN */
        <div className="max-w-md mx-auto bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="p-3 bg-[#EDF1EA] text-[#12302B] rounded-full inline-flex">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-display text-[#12302B]">
            Akses Penyelidikan
          </h2>
          <p className="text-xs sm:text-sm text-[#4F6660]">
            Log masuk dengan mana-mana akaun Google. Sekiranya akaun anda belum disahkan, permohonan akan dihantar secara automatik kepada penyelidik utama untuk diluluskan dengan satu klik.
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
        /* STATE 3: FULL ADMIN DASHBOARD */
        <div className="space-y-6">
          {/* User info banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Penyelidik Disahkan: <b>{currentUser.email}</b>
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
              <span className="font-semibold text-emerald-700">Akses: Pentadbir Diluluskan</span>
            </div>
          </div>

          {/* Pending Researcher Requests Alert Banner */}
          {pendingRequests.length > 0 && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-display font-extrabold text-sm sm:text-base text-amber-950">
                  <Bell className="w-5 h-5 text-amber-600 animate-bounce" />
                  <span>Permohonan Akses Penyelidik Baharu ({pendingRequests.length})</span>
                </div>
                <span className="text-xs text-amber-800 font-semibold">
                  Klik satu butang sahaja untuk luluskan:
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingRequests.map(req => (
                  <div
                    key={req.email}
                    className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-[#12302B] truncate">
                        {req.displayName || req.email.split('@')[0]}
                      </div>
                      <div className="font-mono text-[11px] text-[#4F6660] truncate">{req.email}</div>
                      <div className="text-[10px] text-gray-400">
                        {req.requestedAt ? new Date(req.requestedAt).toLocaleString('ms-MY', { dateStyle: 'short', timeStyle: 'short' }) : 'Baru sahaja'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApproveRequest(req.email)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1F7A57] text-white text-xs font-bold hover:bg-[#186044] transition shadow-xs cursor-pointer"
                        title="Luluskan email ini menjadi penyelidik"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Luluskan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectRequest(req.email)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Tolak permohonan"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Admin Tab Navigation: Participants vs Automated Analytics */}
          <div className="flex items-center gap-2 border-b border-[#CBD7CE] pb-3">
            <button
              type="button"
              onClick={() => setAdminTab('participants')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
                adminTab === 'participants'
                  ? 'bg-[#12302B] text-white shadow-sm'
                  : 'bg-white border border-[#CBD7CE] text-[#4F6660] hover:bg-[#EDF1EA]'
              }`}
            >
              <Users className="w-4 h-4" />
              Senarai Data Peserta ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('analytics')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
                adminTab === 'analytics'
                  ? 'bg-[#12302B] text-white shadow-sm'
                  : 'bg-white border border-[#CBD7CE] text-[#4F6660] hover:bg-[#EDF1EA]'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#E3A21A]" />
              Analisis Data Otomatis (Insights) 📊
            </button>
          </div>

          {/* TAB 1: PARTICIPANTS TABLE */}
          {adminTab === 'participants' && (
            <div className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display font-bold text-base text-[#12302B]">
                  Rekod Jawapan Peserta Keseluruhan
                </h3>
                <span className="text-xs text-[#4F6660]">
                  Klik pada butang <b>"Lihat"</b> untuk menyemak butiran jawapan lengkap peserta.
                </span>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-[#4F6660] space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#12302B]" />
                  <p className="text-xs">Memuatkan data peserta daripada Firestore...</p>
                </div>
              ) : participants.length === 0 ? (
                <div className="py-16 text-center text-[#4F6660] space-y-2">
                  <Users className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-sm font-semibold">Tiada data peserta dijumpai.</p>
                  <p className="text-xs">Data peserta yang menyertai kajian akan dipaparkan di sini secara langsung.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#EDF1EA] text-[#12302B] border-b border-[#CBD7CE]">
                        <th className="p-3 font-bold">Kod</th>
                        <th className="p-3 font-bold">Tarikh Mula</th>
                        <th className="p-3 font-bold">Status Fasa</th>
                        <th className="p-3 font-bold">Umur / Program</th>
                        <th className="p-3 font-bold">Masa Teroka</th>
                        <th className="p-3 font-bold text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CBD7CE]/60">
                      {participants.map(p => {
                        const badge = stageBadge(p);
                        const exploreMins = calculateMinutes(p.exploreStartedAt, p.unlockedAt);
                        const prof = p.profile || {};
                        return (
                          <tr key={p._uid || p.code} className="hover:bg-white/80 transition">
                            <td className="p-3 font-mono font-bold text-[#12302B]">{p.code}</td>
                            <td className="p-3 text-[#4F6660]">{formatIso(p.createdAt)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="p-3 text-[#4F6660]">
                              <div>{prof.q3 || '—'}</div>
                              <div className="text-[10px] truncate max-w-[180px]">{prof.q5 || '—'}</div>
                            </td>
                            <td className="p-3 font-mono text-[#4F6660]">{exploreMins} min</td>
                            <td className="p-3 text-center space-x-2">
                              <button
                                type="button"
                                onClick={() => setSelectedRecord(p)}
                                className="px-2.5 py-1 bg-[#12302B] text-white rounded-lg font-bold text-[11px] hover:bg-[#1f4a43] transition cursor-pointer"
                              >
                                Lihat Jawapan
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSingle(p)}
                                className="px-2 py-1 bg-red-100 text-red-700 rounded-lg font-bold text-[11px] hover:bg-red-200 transition cursor-pointer"
                                title="Padam rekod ini"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUTOMATED ANALYTICS & INSIGHTS DASHBOARD */}
          {adminTab === 'analytics' && (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="bg-gradient-to-r from-[#12302B] to-[#1F7A57] text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider text-emerald-200">
                  <BarChart3 className="w-3.5 h-3.5 text-[#E3A21A]" />
                  Rumusan Analisis Automatik (Automated Insights)
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold font-display">
                  Laporan Ringkasan Kajian Kosa Kata Sensori SENSAVOUR
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-3xl leading-relaxed">
                  Analisis di bawah dijana secara automatik daripada pangkalan data Firestore. Sebanyak <b>{totalCount} peserta</b> telah berdaftar, dengan kadar penyelesaian penuh pasca-ujian sebanyak <b>{completionRate}%</b>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-xs border border-white/10 space-y-1">
                    <div className="text-xs text-emerald-200 uppercase font-bold">Kadar Penyiapan Kajian</div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-display">{completionRate}%</div>
                    <div className="text-[11px] text-emerald-100">{postDoneCount} daripada {totalCount} siap sepenuhnya</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-xs border border-white/10 space-y-1">
                    <div className="text-xs text-emerald-200 uppercase font-bold">Purata Masa Meneroka</div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-display">
                      {participants.length > 0 ? (
                        (participants.reduce((acc, p) => {
                          const mins = parseFloat(calculateMinutes(p.exploreStartedAt, p.unlockedAt));
                          return acc + (isNaN(mins) ? 0 : mins);
                        }, 0) / (totalCount || 1)).toFixed(1)
                      ) : '0.0'} min
                    </div>
                    <div className="text-[11px] text-emerald-100">Tempoh purata roda deria</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-xs border border-white/10 space-y-1">
                    <div className="text-xs text-emerald-200 uppercase font-bold">Kosa Kata Terkumpul</div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-display">
                      {Object.values(collectedWordsFrequency).reduce((acc, arr) => acc + arr.length, 0)} kata
                    </div>
                    <div className="text-[11px] text-emerald-100">Direkod merentasi 5 kategori</div>
                  </div>
                </div>
              </div>

              {/* Demographics & Background Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Age & Programme */}
                <div className="bg-white border border-[#CBD7CE] rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="font-display font-extrabold text-base text-[#12302B] flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-[#C8402B]" />
                    Taburan Program Pengajian Peserta
                  </h4>
                  {Object.keys(programmeDistribution).length === 0 ? (
                    <p className="text-xs text-[#4F6660] italic">Belum ada data demografi program.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(programmeDistribution).map(([prog, count]) => {
                        const pct = Math.round((count / totalCount) * 100);
                        return (
                          <div key={prog} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-[#12302B]">
                              <span className="truncate max-w-[280px]" title={prog}>{prog}</span>
                              <span>{count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-[#EDF1EA] h-2.5 rounded-full overflow-hidden">
                              <div className="bg-[#1F7A57] h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Prior Sensory Learning (Q7) */}
                <div className="bg-white border border-[#CBD7CE] rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="font-display font-extrabold text-base text-[#12302B] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#1F7A57]" />
                    Pengalaman Pembelajaran Sensori Terdahulu (Q7)
                  </h4>
                  {Object.keys(priorLearningDistribution).length === 0 ? (
                    <p className="text-xs text-[#4F6660] italic">Belum ada data pengalaman sensori.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(priorLearningDistribution).map(([exp, count]) => {
                        const pct = Math.round((count / totalCount) * 100);
                        return (
                          <div key={exp} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-[#12302B]">
                              <span className="truncate max-w-[280px]" title={exp}>{exp}</span>
                              <span>{count} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-[#EDF1EA] h-2.5 rounded-full overflow-hidden">
                              <div className="bg-[#C8402B] h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Collected Sensory Vocabulary Frequency Analysis */}
              <div className="bg-white border border-[#CBD7CE] rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="font-display font-extrabold text-base text-[#12302B] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#E3A21A]" />
                  Analisis Kosa Kata Sensori Terkumpul (Rupa, Aroma, Rasa, Tekstur, Bunyi)
                </h4>
                <p className="text-xs text-[#4F6660]">
                  Senarai perkataan unik yang paling kerap dikumpul oleh peserta semasa meneroka Roda Sensori SENSAVOUR:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  {SENSORY_CATEGORIES.map(cat => {
                    const wordsList = collectedWordsFrequency[cat.key] || [];
                    const counts: Record<string, number> = {};
                    wordsList.forEach(w => { counts[w] = (counts[w] || 0) + 1; });
                    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

                    return (
                      <div key={cat.key} className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl p-4 space-y-2">
                        <div className="font-display font-bold text-xs text-[#12302B] pb-1 border-b border-[#CBD7CE]" style={{ color: cat.color }}>
                          {cat.name} ({wordsList.length} kata)
                        </div>
                        {sorted.length === 0 ? (
                          <div className="text-[11px] text-[#4F6660] italic">Tiada data kata</div>
                        ) : (
                          <ul className="space-y-1 text-xs">
                            {sorted.map(([word, freq]) => (
                              <li key={word} className="flex justify-between items-center bg-white px-2 py-1 rounded border border-[#CBD7CE]/60">
                                <span className="font-medium text-[#12302B] capitalize">{word}</span>
                                <span className="font-mono text-[10px] text-[#1F7A57] font-bold">({freq})</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Qualitative Reflection Synthesis */}
              <div className="bg-white border border-[#CBD7CE] rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="font-display font-extrabold text-base text-[#12302B] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#12302B]" />
                  Rumusan Refleksi Kualitatif Peserta (Q31 - Q34)
                </h4>
                <p className="text-xs text-[#4F6660]">
                  Sampel jawapan refleksi daripada peserta yang telah menyelesaikan kajian:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl space-y-2">
                    <div className="font-bold text-[#12302B]">Q31: Pengaruh SENSAVOUR terhadap Huraian</div>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {reflectionsSummary.q31.length === 0 ? (
                        <p className="text-[#4F6660] italic">Belum ada jawapan refleksi.</p>
                      ) : (
                        reflectionsSummary.q31.map((ans, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-xl border border-[#CBD7CE]/80 text-[#4F6660] italic">
                            "{ans}"
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl space-y-2">
                    <div className="font-bold text-[#12302B]">Q32: Kosa Kata Baru Dipelajari</div>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {reflectionsSummary.q32.length === 0 ? (
                        <p className="text-[#4F6660] italic">Belum ada jawapan refleksi.</p>
                      ) : (
                        reflectionsSummary.q32.map((ans, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-xl border border-[#CBD7CE]/80 text-[#4F6660] italic">
                            "{ans}"
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Modal for Managing Researchers and Pending Requests */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#CBD7CE] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#CBD7CE] pb-3">
              <h3 className="text-lg font-bold font-display text-[#12302B] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#1F7A57]" />
                Pengurusan Akaun Penyelidik
              </h3>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Section 1: Pending Access Requests with 1-Click Approve */}
            {pendingRequests.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-3">
                <div className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-600" />
                  Permohonan Akses Baharu (Klik untuk Luluskan):
                </div>
                <div className="space-y-2">
                  {pendingRequests.map(req => (
                    <div key={req.email} className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-[#12302B] truncate">{req.displayName || req.email.split('@')[0]}</div>
                        <div className="font-mono text-[11px] text-[#4F6660] truncate">{req.email}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApproveRequest(req.email)}
                          className="px-2.5 py-1 bg-[#1F7A57] text-white rounded-lg text-xs font-bold hover:bg-[#186044] transition cursor-pointer"
                        >
                          Luluskan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRequest(req.email)}
                          className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                          title="Tolak"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: Active Approved Admins */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#12302B]">
                Senarai Penyelidik Berdaftar Semasa:
              </label>
              <ul className="space-y-1.5 max-h-40 overflow-y-auto text-xs font-mono">
                {adminEmails.map(email => (
                  <li key={email} className="flex items-center justify-between p-2 bg-[#EDF1EA] rounded-xl">
                    <span className="truncate mr-2">{email} {email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() ? '(Utama)' : ''}</span>
                    {email.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase() && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(email)}
                        className="text-red-600 hover:text-red-800 font-sans font-bold text-[11px] cursor-pointer shrink-0"
                      >
                        Buang
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 3: Manual Add Email (Optional) */}
            <form onSubmit={handleAddAdmin} className="space-y-3 pt-3 border-t border-[#CBD7CE]">
              <label className="block text-xs font-bold text-[#12302B]">
                Tambah Email Secara Manual (Jika belum log masuk):
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="penyelidik@gmail.com"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-[#CBD7CE] rounded-xl text-xs focus:ring-2 focus:ring-[#C8402B] outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isSavingAdmin}
                  className="px-4 py-2 bg-[#1F7A57] text-white rounded-xl text-xs font-bold hover:bg-[#186044] transition cursor-pointer"
                >
                  {isSavingAdmin ? 'Menyimpan…' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#CBD7CE] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold font-display text-[#12302B]">
                Padam Semua Data Ujian?
              </h3>
            </div>
            <p className="text-xs text-[#4F6660] leading-relaxed">
              Anda akan memadam <b>{participants.length} rekod peserta</b> daripada pangkalan data Firestore. Tindakan ini tidak boleh diundur.
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-red-900">
                <input
                  type="checkbox"
                  checked={resetCounterOnDelete}
                  onChange={e => setResetCounterOnDelete(e.target.checked)}
                  className="rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                Tetap semula kaunter giliran ke 0 (Peserta seterusnya akan bermula dengan S001)
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
