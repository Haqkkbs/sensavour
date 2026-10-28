import React, { useState, useEffect } from 'react';
import {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  db,
  auth,
  testConnection,
  handleFirestoreError,
  OperationType
} from './firebase';
import {
  ParticipantRecord,
  PRE_QUESTIONS,
  POST_QUESTIONS,
  SENSORY_CATEGORIES
} from './types';

import { WelcomeView } from './components/WelcomeView';
import { QuestionWizard } from './components/QuestionWizard';
import { ExploreView } from './components/ExploreView';
import { DoneView } from './components/DoneView';
import { AdminView } from './components/AdminView';

import { Shield, Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    return window.location.search.includes('admin');
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [participant, setParticipant] = useState<ParticipantRecord | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initError, setInitError] = useState<string>('');
  const [isAnonymousDisabled, setIsAnonymousDisabled] = useState<boolean>(false);

  // Step wizard sub-phase for showing introductory screen before entering questions
  const [showWizardIntro, setShowWizardIntro] = useState<boolean>(true);

  // 1. Initial Authentication & Firestore Document Load
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setAuthUid(user.uid);
        setIsAnonymousDisabled(false);
        try {
          const userDocRef = doc(db, 'participants', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as ParticipantRecord;
            data._uid = snap.id;
            setParticipant(data);
          }
        } catch (err) {
          console.warn('Error fetching participant doc:', err);
        }
        setIsInitializing(false);
      } else {
        // Attempt anonymous sign-in for seamless participant participation
        try {
          const cred = await signInAnonymously(auth);
          setAuthUid(cred.user.uid);
          setIsAnonymousDisabled(false);
        } catch (err: any) {
          console.warn('Anonymous sign-in check:', err);
          if (
            err?.code === 'auth/admin-restricted-operation' ||
            err?.message?.includes('admin-restricted-operation')
          ) {
            // Anonymous auth is not yet enabled in Firebase Console.
            // Do not block app initialization; present helpful guide in WelcomeView.
            setIsAnonymousDisabled(true);
          } else {
            setInitError(err.message || 'Gagal memulakan sesi Firebase.');
          }
        } finally {
          setIsInitializing(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshParticipant = async (uid = authUid) => {
    if (!uid) return;
    try {
      const snap = await getDoc(doc(db, 'participants', uid));
      if (snap.exists()) {
        const data = snap.data() as ParticipantRecord;
        data._uid = snap.id;
        setParticipant(data);
      } else {
        setParticipant(null);
      }
    } catch (err) {
      console.error('Failed to refresh participant record:', err);
    }
  };

  const handleRetryAnonymous = async () => {
    try {
      const cred = await signInAnonymously(auth);
      setAuthUid(cred.user.uid);
      setIsAnonymousDisabled(false);
      await refreshParticipant(cred.user.uid);
    } catch (err: any) {
      console.warn('Retry anonymous sign-in:', err);
      if (
        err?.code === 'auth/admin-restricted-operation' ||
        err?.message?.includes('admin-restricted-operation')
      ) {
        setIsAnonymousDisabled(true);
      } else {
        alert(`Ralat log masuk: ${err.message || err}`);
      }
    }
  };

  const handleGoogleSignInForParticipant = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      setAuthUid(cred.user.uid);
      setIsAnonymousDisabled(false);
      await refreshParticipant(cred.user.uid);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      alert(`Log masuk Google gagal: ${err.message || 'Sila cuba lagi'}`);
    }
  };

  // Determine current stage
  const currentStage = (() => {
    if (!participant) return 'welcome';
    if (!participant.preSubmittedAt) return 'pre';
    if (!participant.unlockedAt) return 'explore';
    if (!participant.postSubmittedAt) return 'post';
    return 'done';
  })();

  // Points calculation helper
  const calculatePoints = (customWords?: Record<string, string>): number => {
    if (!participant) return 0;
    const w = customWords || participant.words || {};
    const wordsCount = SENSORY_CATEGORIES.filter(
      c => (w[c.key] || '').trim().length >= 2
    ).length;

    let pts = 0;
    if (participant.preSubmittedAt) pts += 20;
    pts += wordsCount * 10;
    if (participant.unlockedAt) pts += 10;
    if (participant.postSubmittedAt) pts += 20;

    return Math.min(100, pts);
  };

  // Handler: Start participant session with code & consent
  const handleStartMission = async (code: string) => {
    let targetUid = authUid || auth.currentUser?.uid;
    if (!targetUid) {
      try {
        const cred = await signInAnonymously(auth);
        targetUid = cred.user.uid;
        setAuthUid(targetUid);
      } catch (err: any) {
        if (
          err?.code === 'auth/admin-restricted-operation' ||
          err?.message?.includes('admin-restricted-operation')
        ) {
          setIsAnonymousDisabled(true);
          throw new Error(
            'Sila aktifkan penyedia "Anonymous" di Firebase Console atau gunakan butang Log Masuk Google untuk memulakan.'
          );
        }
        throw err;
      }
    }

    const docPath = `participants/${targetUid}`;
    try {
      await setDoc(doc(db, 'participants', targetUid), {
        code,
        consentAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        stage: 'pre'
      });
      await refreshParticipant(targetUid);
      setShowWizardIntro(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
    }
  };

  // Handler: Submit pre-test survey
  const handleSubmitPre = async (answers: Record<string, any>) => {
    const targetUid = authUid || auth.currentUser?.uid;
    if (!targetUid) return;
    const docPath = `participants/${targetUid}`;

    const profile: Record<string, any> = {
      q3: answers.q3 || '',
      q4: answers.q4 || '',
      q5: answers.q5 || '',
      q6: answers.q6 || '',
      q7: answers.q7 || '',
      q8: answers.q8 || {}
    };

    const pre: Record<string, string> = {};
    for (let i = 9; i <= 18; i++) {
      pre[`q${i}`] = answers[`q${i}`] || '';
    }

    try {
      await updateDoc(doc(db, 'participants', targetUid), {
        profile,
        pre,
        preSubmittedAt: serverTimestamp(),
        stage: 'explore'
      });
      await refreshParticipant(targetUid);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  };

  // Handler: Begin exploration and start 5-min timer
  const handleStartExploration = async () => {
    const targetUid = authUid || auth.currentUser?.uid;
    if (!targetUid) return;
    const docPath = `participants/${targetUid}`;
    try {
      await updateDoc(doc(db, 'participants', targetUid), {
        exploreStartedAt: serverTimestamp(),
        stage: 'explore'
      });
      await refreshParticipant(targetUid);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  };

  // Handler: Auto-save collected sensory words
  const handleSaveWords = async (updatedWords: Record<string, string>) => {
    const targetUid = authUid || auth.currentUser?.uid;
    if (!targetUid) return;
    const docPath = `participants/${targetUid}`;

    const clean: Record<string, string> = {};
    SENSORY_CATEGORIES.forEach(c => {
      const v = (updatedWords[c.key] || '').trim();
      if (v.length >= 2) clean[c.key] = v;
    });

    try {
      await updateDoc(doc(db, 'participants', targetUid), {
        words: clean
      });
      setParticipant(prev => (prev ? { ...prev, words: clean } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  };

  // Handler: Unlock post-test after 5 minutes and 5 words
  const handleUnlockPostTest = async () => {
    const targetUid = authUid || auth.currentUser?.uid;
    if (!targetUid || !participant) return;
    const docPath = `participants/${targetUid}`;

    const clean: Record<string, string> = {};
    SENSORY_CATEGORIES.forEach(c => {
      const v = (participant.words?.[c.key] || '').trim();
      if (v.length >= 2) clean[c.key] = v;
    });

    try {
      await updateDoc(doc(db, 'participants', targetUid), {
        words: clean,
        unlockedAt: serverTimestamp(),
        stage: 'post'
      });
      await refreshParticipant(targetUid);
      setShowWizardIntro(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  };

  // Handler: Submit post-test and reflection
  const handleSubmitPost = async (answers: Record<string, any>) => {
    const targetUid = authUid || auth.currentUser?.uid;
    if (!targetUid) return;
    const docPath = `participants/${targetUid}`;

    const post: Record<string, string> = {};
    for (let i = 21; i <= 30; i++) {
      post[`q${i}`] = answers[`q${i}`] || '';
    }

    const reflection: Record<string, string> = {
      q31: answers.q31 || '',
      q32: answers.q32 || '',
      q33: answers.q33 || '',
      q34: answers.q34 || '',
      q35: answers.q35 || '',
      q36: answers.q36 || ''
    };

    try {
      await updateDoc(doc(db, 'participants', targetUid), {
        post,
        reflection,
        postSubmittedAt: serverTimestamp(),
        stage: 'done'
      });
      await refreshParticipant(targetUid);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  };

  // Handler: Reset participant session for new user (researcher demo)
  const handleNewSession = async () => {
    if (
      window.confirm(
        'Mulakan sesi peserta baharu? Rekod sedia ada kekal tersimpan dalam Firestore.'
      )
    ) {
      try {
        if (!isAnonymousDisabled) {
          const cred = await signInAnonymously(auth);
          setAuthUid(cred.user.uid);
        }
        setParticipant(null);
        setShowWizardIntro(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#EDF1EA] flex flex-col items-center justify-center p-4">
        <div className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl p-6 shadow-sm flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#C8402B]" />
          <span className="text-sm font-semibold text-[#12302B]">
            Menyambung ke Firebase Firestore…
          </span>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-[#EDF1EA] flex flex-col items-center justify-center p-4">
        <div className="max-w-md bg-white border border-red-200 rounded-2xl p-6 shadow-sm space-y-4 text-center">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h2 className="text-xl font-bold text-[#12302B]">Ralat Sambungan Firebase</h2>
          <p className="text-sm text-[#4F6660]">{initError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#C8402B] text-white rounded-xl font-bold text-sm cursor-pointer"
          >
            Cuba Semula
          </button>
        </div>
      </div>
    );
  }

  // Stepper state indicator (0: Pre, 1: Explore, 2: Post, 3: Done)
  const stageStepMap: Record<string, number> = {
    welcome: -1,
    pre: 0,
    explore: 1,
    post: 2,
    done: 3
  };
  const currentStep = stageStepMap[currentStage] ?? -1;

  return (
    <div className="min-h-screen bg-[#EDF1EA] text-[#12302B]">
      {/* Top Application Header */}
      <header className="border-b border-[#CBD7CE] bg-[#EDF1EA]/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-[#12302B]">
              Misi SENSAVOUR
            </span>
            <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1F7A57]/15 text-[#1F7A57]">
              Firebase Firestore
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status indicators when participant has started */}
            {participant && !isAdminView && (
              <>
                {/* 3-Step Pill Bar */}
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/70 border border-[#CBD7CE]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      currentStep > 0
                        ? 'bg-[#1F7A57]'
                        : currentStep === 0
                        ? 'bg-[#C8402B]'
                        : 'bg-[#CBD7CE]'
                    }`}
                  />
                  <span
                    className={`w-2 h-2 rounded-full ${
                      currentStep > 1
                        ? 'bg-[#1F7A57]'
                        : currentStep === 1
                        ? 'bg-[#C8402B]'
                        : 'bg-[#CBD7CE]'
                    }`}
                  />
                  <span
                    className={`w-2 h-2 rounded-full ${
                      currentStep >= 2 ? 'bg-[#1F7A57]' : 'bg-[#CBD7CE]'
                    }`}
                  />
                </div>

                <div className="px-3 py-1 rounded-full bg-white border border-[#CBD7CE] font-mono text-xs font-bold text-[#12302B]">
                  {participant.code}
                </div>

                <div className="px-3 py-1 rounded-full bg-[#12302B] text-white text-xs font-bold font-mono shadow-xs">
                  {calculatePoints()} mata
                </div>
              </>
            )}

            {/* Admin Toggle Button */}
            <button
              type="button"
              onClick={() => setIsAdminView(prev => !prev)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#CBD7CE] bg-white text-xs font-bold text-[#4F6660] hover:text-[#12302B] hover:bg-white/80 transition cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-[#C8402B]" />
              <span className="hidden sm:inline">
                {isAdminView ? 'Aplikasi Peserta' : 'Admin'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {isAdminView ? (
          <AdminView onBackToApp={() => setIsAdminView(false)} />
        ) : currentStage === 'welcome' ? (
          <WelcomeView
            onStartMission={handleStartMission}
            onOpenAdmin={() => setIsAdminView(true)}
            isAnonymousDisabled={isAnonymousDisabled}
            onRetryAnonymous={handleRetryAnonymous}
            onSignInGoogle={handleGoogleSignInForParticipant}
            currentUser={currentUser}
          />
        ) : currentStage === 'pre' ? (
          showWizardIntro ? (
            <div className="max-w-xl mx-auto w-full bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#C8402B]">
                Langkah 1 / Step 1
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#12302B]">
                Pra-Ujian Penilaian Makanan
              </h1>
              <p className="text-sm text-[#4F6660] leading-relaxed">
                Jawab soalan ini <b>sebelum</b> anda membuka atau meneroka SENSAVOUR.
                Jawapan yang dihantar tidak boleh diubah selepas dihantar, jadi jawab
                berdasarkan pengetahuan sedia ada anda sekarang.
              </p>
              <div className="p-3.5 bg-[#EDF1EA]/70 border-l-4 border-[#1F7A57] rounded-r-xl text-xs sm:text-sm text-[#4F6660]">
                Jawab secara bersendirian dan jujur. Jangan gunakan kamus, laman web
                luaran atau alat AI. Huraikan hanya ciri makanan yang anda sendiri
                perhatikan (cth: rupa, aroma, rasa, tekstur, atau bunyi).
              </div>
              <button
                type="button"
                onClick={() => setShowWizardIntro(false)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#C8402B] text-white font-bold text-sm shadow hover:bg-[#b03522] transition cursor-pointer"
              >
                Mula Soalan Pra-Ujian
              </button>
            </div>
          ) : (
            <QuestionWizard
              title="Pra-Ujian"
              kind="pre"
              questions={PRE_QUESTIONS}
              participantUid={authUid || ''}
              onSubmit={handleSubmitPre}
            />
          )
        ) : currentStage === 'explore' ? (
          <ExploreView
            participant={participant!}
            onStartExploration={handleStartExploration}
            onSaveWords={handleSaveWords}
            onUnlockPostTest={handleUnlockPostTest}
            calculatePoints={calculatePoints}
          />
        ) : currentStage === 'post' ? (
          showWizardIntro ? (
            <div className="max-w-xl mx-auto w-full bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#C8402B]">
                Langkah 3 / Step 3
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#12302B]">
                Pasca-Ujian & Refleksi
              </h1>
              <p className="text-sm text-[#4F6660] leading-relaxed">
                Tahniah! Anda telah berjaya meneroka SENSAVOUR dan membuka kunci
                pasca-ujian. Sekarang, huraikan semula makanan yang sama dengan
                mengaplikasikan kosa kata sensori yang telah anda temui.
              </p>
              <div className="p-3.5 bg-[#EDF1EA]/70 border-l-4 border-[#1F7A57] rounded-r-xl text-xs sm:text-sm text-[#4F6660]">
                Selepas menghuraikan 10 makanan, anda akan menjawab soalan refleksi ringkas
                mengenai keberkesanan roda sensori SENSAVOUR.
              </div>
              <button
                type="button"
                onClick={() => setShowWizardIntro(false)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#C8402B] text-white font-bold text-sm shadow hover:bg-[#b03522] transition cursor-pointer"
              >
                Mula Pasca-Ujian
              </button>
            </div>
          ) : (
            <QuestionWizard
              title="Pasca-Ujian & Refleksi"
              kind="post"
              questions={POST_QUESTIONS}
              participantUid={authUid || ''}
              onSubmit={handleSubmitPost}
            />
          )
        ) : (
          <DoneView
            participant={participant!}
            onNewSession={handleNewSession}
          />
        )}
      </main>
    </div>
  );
}
