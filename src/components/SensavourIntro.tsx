import React, { useState } from 'react';
import { BookOpen, Sparkles, ArrowRight, Globe, Compass, CheckCircle2 } from 'lucide-react';

interface SensavourIntroProps {
  onContinue?: () => void;
  showContinueButton?: boolean;
}

export const SensavourIntro: React.FC<SensavourIntroProps> = ({
  onContinue,
  showContinueButton = true
}) => {
  const [langTab, setLangTab] = useState<'both' | 'bm' | 'en'>('both');

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#12302B] via-[#1a443d] to-[#1F7A57] text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#E3A21A]/10 pointer-events-none" />

        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-emerald-200">
            <Compass className="w-3.5 h-3.5 text-[#E3A21A]" />
            SENSAVOUR Borneo Gastronomy
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight">
            INTRODUCTION TO SENSAVOUR
          </h1>
          <h2 className="text-lg sm:text-2xl font-bold text-emerald-100 font-display">
            PENGENALAN SENSAVOUR
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed pt-1">
            Kamus Digital Kosa Kata Sensori Makanan Tradisional Sabah, Sarawak & Brunei Darussalam.
          </p>
        </div>

        {/* Language Filter Pills */}
        <div className="relative z-10 flex items-center gap-2 mt-6 pt-4 border-t border-white/15">
          <span className="text-xs text-emerald-200 font-medium flex items-center gap-1.5 mr-1">
            <Globe className="w-3.5 h-3.5" /> Bahasa:
          </span>
          <button
            type="button"
            onClick={() => setLangTab('both')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              langTab === 'both'
                ? 'bg-white text-[#12302B] shadow-sm'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            Kedua-dua / Both
          </button>
          <button
            type="button"
            onClick={() => setLangTab('bm')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              langTab === 'bm'
                ? 'bg-white text-[#12302B] shadow-sm'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            Bahasa Melayu
          </button>
          <button
            type="button"
            onClick={() => setLangTab('en')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              langTab === 'en'
                ? 'bg-white text-[#12302B] shadow-sm'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Main Bilingual Content Grid */}
      <div className={`grid gap-6 ${langTab === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* BAHASA MELAYU SECTION */}
        {(langTab === 'both' || langTab === 'bm') && (
          <div className="bg-white border border-[#CBD7CE] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#CBD7CE]/70 pb-3">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#C8402B]">
                  Bahasa Melayu
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDF1EA] text-[#12302B] text-[11px] font-bold">
                  Kamus Sensori
                </span>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-[#12302B] leading-relaxed">
                <p>
                  <strong className="text-[#12302B] font-extrabold">SENSAVOUR</strong> ialah kamus digital kosa kata sensori yang dibangunkan untuk membantu pelajar hospitaliti mempelajari dan memperluas kosa kata bagi menghuraikan makanan. SENSAVOUR menyediakan istilah sensori, penerangan dan roda sensori untuk membantu pelajar menerangkan ciri makanan, termasuk rupa, aroma, rasa, tekstur dan bunyi.
                </p>

                <p className="text-[#4F6660]">
                  Dengan mengetengahkan makanan tradisional terpilih dari Sabah, Sarawak dan Brunei Darussalam, SENSAVOUR menggabungkan pembelajaran kosa kata sensori dengan penerokaan warisan makanan serantau. Inovasi ini bertujuan membantu pelajar beralih daripada huraian umum kepada penerangan ciri makanan yang lebih khusus, bermakna dan sesuai.
                </p>
              </div>
            </div>

            {/* Slogan Card */}
            <div className="p-4 bg-gradient-to-r from-[#F4F8F3] to-[#EDF1EA] border-l-4 border-[#1F7A57] rounded-r-2xl space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#1F7A57]">
                Moto / Slogan
              </div>
              <div className="text-base sm:text-lg font-extrabold font-display text-[#12302B] italic">
                “Terokai Deria. Temui Kata.”
              </div>
            </div>
          </div>
        )}

        {/* ENGLISH SECTION */}
        {(langTab === 'both' || langTab === 'en') && (
          <div className="bg-white border border-[#CBD7CE] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#CBD7CE]/70 pb-3">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#1F7A57]">
                  English
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDF1EA] text-[#12302B] text-[11px] font-bold">
                  Sensory Dictionary
                </span>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-[#12302B] leading-relaxed">
                <p>
                  <strong className="text-[#12302B] font-extrabold">SENSAVOUR</strong> is a digital sensory vocabulary dictionary designed to help hospitality students develop and expand their vocabulary for describing food. It provides sensory terms, explanations and a sensory wheel to support the description of food characteristics, including appearance, aroma, taste, texture and sound.
                </p>

                <p className="text-[#4F6660]">
                  Featuring selected traditional foods from Sabah, Sarawak and Brunei Darussalam, SENSAVOUR combines sensory vocabulary learning with the exploration of regional food heritage. It aims to help students move beyond general descriptions and express food characteristics in a more specific, meaningful and appropriate way.
                </p>
              </div>
            </div>

            {/* Slogan Card */}
            <div className="p-4 bg-gradient-to-r from-[#F9FBF7] to-[#EDF1EA] border-l-4 border-[#C8402B] rounded-r-2xl space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#C8402B]">
                Motto / Slogan
              </div>
              <div className="text-base sm:text-lg font-extrabold font-display text-[#12302B] italic">
                “Explore the Senses. Find the Words.”
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Feature Highlights Card */}
      <div className="bg-[#F9FBF7] border border-[#CBD7CE] rounded-3xl p-6 shadow-sm">
        <h3 className="font-display font-extrabold text-sm sm:text-base text-[#12302B] mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C8402B]" />
          Ciri Utama / Key Features
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-[#4F6660]">
          <div className="bg-white p-4 rounded-2xl border border-[#CBD7CE] space-y-1.5">
            <div className="font-bold text-[#12302B] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1F7A57]" /> Roda Sensori Interaktif
            </div>
            <p>Visualisasi 5 deria (Rupa, Aroma, Rasa, Tekstur, Bunyi) merangkumi hidangan Sabah, Sarawak & Brunei.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#CBD7CE] space-y-1.5">
            <div className="font-bold text-[#12302B] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1F7A57]" /> Kosa Kata Khusus
            </div>
            <p>Membantu pelajar beralih daripada perkataan umum kepada istilah kulinari yang tepat dan profesional.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#CBD7CE] space-y-1.5">
            <div className="font-bold text-[#12302B] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1F7A57]" /> Warisan Borneo
            </div>
            <p>Memelihara dan menghargai kepelbagaian makanan tradisi etnik Kadazan-Dusun, Iban, Melayu Brunei & Sarawak.</p>
          </div>
        </div>
      </div>

      {/* Action Button to Start Exploring */}
      {showContinueButton && onContinue && (
        <div className="text-center pt-2 pb-4">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-2 py-4 px-8 rounded-2xl bg-[#C8402B] text-white font-bold text-base shadow-lg hover:bg-[#b03522] transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Terokai Roda Pancaidera SENSAVOUR Sekarang</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
