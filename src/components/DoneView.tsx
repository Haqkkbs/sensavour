import React from 'react';
import { ParticipantRecord, SENSORY_CATEGORIES } from '../types';
import { Award, CheckCircle, Sparkles, BookOpen } from 'lucide-react';

interface DoneViewProps {
  participant: ParticipantRecord;
  onNewSession?: () => void;
}

export const DoneView: React.FC<DoneViewProps> = ({ participant, onNewSession }) => {
  const words = participant.words || {};

  return (
    <div className="max-w-xl mx-auto w-full bg-[#F9FBF7] border-2 border-[#1F7A57] rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-6">
      <div className="inline-flex p-4 bg-[#EDF1EA] text-[#1F7A57] rounded-full ring-8 ring-[#1F7A57]/10">
        <Award className="w-12 h-12" />
      </div>

      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1F7A57]/10 text-[#1F7A57] rounded-full text-xs font-extrabold uppercase tracking-widest mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Misi Selesai · 100 Mata
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-[#12302B]">
          Pakar Deria Borneo
        </h1>
        <p className="text-sm sm:text-base text-[#4F6660] mt-2">
          Terima kasih <span className="font-bold text-[#12302B]">{participant.code}</span> kerana menyertai kajian ini secara sukarela. Semua jawapan pra-ujian, perkataan sensori teroka, dan pasca-ujian anda telah selamat disimpan dalam Firestore.
        </p>
      </div>

      {/* Mini Dictionary Card */}
      <div className="bg-[#EDF1EA]/80 border border-[#CBD7CE] rounded-2xl p-5 text-left space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#12302B] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#C8402B]" />
          Kamus Deria Peribadi Anda:
        </h3>
        <div className="divide-y divide-[#CBD7CE]/70">
          {SENSORY_CATEGORIES.map(cat => (
            <div key={cat.key} className="py-2.5 flex items-center justify-between text-sm">
              <span className="font-bold text-[#4F6660] flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </span>
              <span className="font-mono font-bold text-[#12302B] bg-white px-2.5 py-1 rounded-md border border-[#CBD7CE]">
                {words[cat.key] || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2">
        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
        <span>Data anda telah disahkan dan direkodkan. Anda boleh menutup tab atau pelayar ini sekarang.</span>
      </div>

      {onNewSession && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onNewSession}
            className="text-xs text-[#4F6660] hover:text-[#12302B] underline"
          >
            Mulakan sesi peserta baharu (Penyelidik sahaja)
          </button>
        </div>
      )}
    </div>
  );
};
