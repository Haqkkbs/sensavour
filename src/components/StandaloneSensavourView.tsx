import React, { useState } from 'react';
import { SensoryWheel } from './SensoryWheel';
import { SensavourIntro } from './SensavourIntro';
import { FOOD_DETAILS, SENSORY_CATEGORIES } from '../types';
import {
  Sparkles,
  Utensils,
  BookOpen,
  Eye,
  Wind,
  Smile,
  Layers,
  Volume2,
  X,
  Search,
  Copy,
  Check,
  Compass,
  ArrowRight,
  Share2,
  FileText,
  Printer
} from 'lucide-react';

interface StandaloneSensavourViewProps {
  onSwitchToStudyMode: () => void;
}

// Sample rich sensory glossary dictionary
const SENSORY_GLOSSARY: Record<string, { term: string; en: string; category: string; definition: string; example: string }[]> = {
  rupa: [
    { term: 'Lutsinar', en: 'Translucent', category: 'Rupa', definition: 'Permukaan yang membenarkan cahaya menembusi, kelihatan jernih.', example: 'Ambuyat yang baru dikacau dengan air mendidih kelihatan lutsinar dan berkilat.' },
    { term: 'Pekat Berkilau', en: 'Glossy / Rich', category: 'Rupa', definition: 'Warna kuah yang bersinar dan pekat menyelerakan.', example: 'Kuah Sarawak Laksa berwarna merah keemasan dan pekat berkilau santan.' },
    { term: 'Berwarna-warni', en: 'Colorful', category: 'Rupa', definition: 'Pelbagai warna kontras yang harmoni dalam hidangan.', example: 'Kek Lapis Sarawak menampilkan lapisan geometri berwarna-warni yang kemas.' },
    { term: 'Keemasan', en: 'Golden', category: 'Rupa', definition: 'Warna perang keemasan hasil daripada pembakaran atau rempah kunyit.', example: 'Ikan dalam Pinasakan Sada mempunyai rona kuning keemasan kunyit asli.' },
    { term: 'Segar Semulajadi', en: 'Fresh / Vibrant', category: 'Rupa', definition: 'Warna bahan mentah yang masih cerah dan tidak pudar.', example: 'Sayur midin mengekalkan warna hijau segar semulajadi selepas dicelur kilas.' }
  ],
  aroma: [
    { term: 'Harum Semerbak', en: 'Fragrant / Aromatic', category: 'Aroma', definition: 'Bau wangi yang tersebar luas dan memikat selera.', example: 'Aroma Manok Pansuh yang dibakar dalam buluh semerbak dengan bauan serai dan kantan.' },
    { term: 'Wangi Herba Liar', en: 'Wild Herbal', category: 'Aroma', definition: 'Bau tumbuhan herba hutan Borneo yang unik dan tajam.', example: 'Tuhau mempunyai bauan herba halia liar yang tajam menyegarkan deria bau.' },
    { term: 'Beraroma Asap Buluh', en: 'Smoky Bamboo', category: 'Aroma', definition: 'Bauan asap kayu api dan kulit buluh segar yang dipanggang.', example: 'Daging ayam Manok Pansuh menyerap aroma asap buluh asli semasa dipanggang.' },
    { term: 'Masam Segar', en: 'Zesty / Tangy', category: 'Aroma', definition: 'Aroma limau atau buah asam yang membuka selera serta-merta.', example: 'Hinava membebaskan aroma masam segar limau kapas dan parutan biji bambangan.' },
    { term: 'Harum Belacan Bakar', en: 'Toasted Shrimp Paste', category: 'Aroma', definition: 'Bauan pes udang yang digoreng garing bersama rempah ratus.', example: 'Sambal goreng midin membangkitkan aroma harum belacan bakar yang pekat.' }
  ],
  rasa: [
    { term: 'Berlemak', en: 'Rich / Creamy', category: 'Rasa', definition: 'Kelazatan santan asli atau mentega berkualiti di atas lidah.', example: 'Kuah santan Sarawak Laksa terasa berlemak, seimbang dengan kehangatan rempahnya.' },
    { term: 'Masam Menyegarkan', en: 'Pleasantly Sour / Tangy', category: 'Rasa', definition: 'Keasidan semula jadi daripada jus sitrus atau asam gelugur yang enak.', example: 'Rasa masam menyegarkan dalam Hinava menutupi rasa hanyir isi ikan mentah.' },
    { term: 'Pedas Hangat', en: 'Warmly Spicy', category: 'Rasa', definition: 'Kepedasan cili padi dan halia yang memberi kehangatan selesa.', example: 'Hirisan cili padi dalam jeruk bambangan memberi sensasi pedas hangat menyengat.' },
    { term: 'Masin-Gurih Asli', en: 'Savory Umami', category: 'Rasa', definition: 'Keseimbangan rasa garam mineral dan pati ikan semulajadi.', example: 'Pinasakan Sada kaya dengan perisa masin berempah yang meresap ke dalam tulang ikan.' },
    { term: 'Manis Berlemak', en: 'Sweet & Creamy', category: 'Rasa', definition: 'Kemanisan sederhana yang disulami kekayaan mentega.', example: 'Setiap gigitan Kek Lapis Sarawak memberikan kemanisan yang berlemak dan harum.' }
  ],
  tekstur: [
    { term: 'Kenyal Lembut', en: 'Soft & Chewy', category: 'Tekstur', definition: 'Tekstur anjal yang mudah dikunyah atau ditelan licin.', example: 'Ambuyat mempunyai tekstur kanji yang kenyal lembut dan meluncur lancar di tekak.' },
    { term: 'Rangup Segar', en: 'Crisp / Crunchy', category: 'Tekstur', definition: 'Pecah berderai dengan mudah apabila digigit oleh gigi.', example: 'Batang pucuk paku midin amat rangup segar apabila digigit.' },
    { term: 'Lembut Lembap', en: 'Moist & Tender', category: 'Tekstur', definition: 'Kandungan kelembapan yang tinggi, tidak kering semasa dikunyah.', example: 'Kek Lapis Sarawak yang berkualiti bertekstur lembut lembap dan tidak berderai kering.' },
    { term: 'Liat Menyerap Perisa', en: 'Succulent / Tender', category: 'Tekstur', definition: 'Daging yang pejal namun empuk dengan pati perisa.', example: 'Isi ayam kampung dalam Manok Pansuh empuk menyerap jus pati herba di dalam buluh.' },
    { term: 'Halus Berserat', en: 'Fibrous / Textured', category: 'Tekstur', definition: 'Serat tumbuhan semulajadi yang memberi gigitan menarik.', example: 'Tuhau yang dihiris halus mengekalkan tekstur halus berserat yang menyelerakan.' }
  ],
  bunyi: [
    { term: 'Krup-Krap', en: 'Crispy Crunch', category: 'Bunyi', definition: 'Bunyi gigitan pada struktur sayur segar yang belum layu.', example: 'Bunyi krup-krap kedengaran apabila mengunyah batang midin yang baru dimasak.' },
    { term: 'Rapuh Mengelus', en: 'Soft Bite', category: 'Bunyi', definition: 'Gigitan tanpa bunyi keras pada makanan yang lembut.', example: 'Kek lapis Sarawak digigit dengan rapuh mengelus tanpa sebarang bunyi rangup.' },
    { term: 'Licin Menelan', en: 'Smooth Glide', category: 'Bunyi', definition: 'Sensasi makanan kanji yang meluncur tanpa geseran.', example: 'Ambuyat yang dicicah kuah ditelan terus tanpa perlu dikunyah berbunyi.' }
  ]
};

export const StandaloneSensavourView: React.FC<StandaloneSensavourViewProps> = ({
  onSwitchToStudyMode
}) => {
  const [activeTab, setActiveTab] = useState<'wheel' | 'glossary' | 'notepad' | 'intro'>('wheel');
  const [filterRegion, setFilterRegion] = useState<'all' | 'sabah' | 'sarawak'>('all');
  const [selectedFoodKey, setSelectedFoodKey] = useState<string>('Hinava');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Search in glossary
  const [glossarySearch, setGlossarySearch] = useState<string>('');
  const [glossaryCategory, setGlossaryCategory] = useState<string>('all');

  // Interactive Tasting Notepad state
  const [notepadFood, setNotepadFood] = useState<string>('Hinava');
  const [notepadWords, setNotepadWords] = useState<Record<string, string>>({
    rupa: 'Segar keperakan',
    aroma: 'Harum limau kapas',
    rasa: 'Masam menyegarkan & lazat',
    tekstur: 'Lembut kenyal',
    bunyi: 'Rangup biji bambangan'
  });
  const [copiedNote, setCopiedNote] = useState<boolean>(false);

  const currentFoodDetail = FOOD_DETAILS[selectedFoodKey] || FOOD_DETAILS['Hinava'];

  const handleShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'sensavour');
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyNote = () => {
    const text = `KAD NOTA SENSORI SENSAVOUR: ${notepadFood}\n` +
      `-----------------------------------------\n` +
      `👁️ Rupa: ${notepadWords.rupa || '—'}\n` +
      `👃 Aroma: ${notepadWords.aroma || '—'}\n` +
      `👅 Rasa: ${notepadWords.rasa || '—'}\n` +
      `✋ Tekstur: ${notepadWords.tekstur || '—'}\n` +
      `👂 Bunyi: ${notepadWords.bunyi || '—'}\n` +
      `Sumber: SENSAVOUR Borneo Gastronomy Sensory Dictionary`;
    navigator.clipboard.writeText(text);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  // Filtered glossary items
  const allGlossaryItems = Object.entries(SENSORY_GLOSSARY).flatMap(([catKey, items]) =>
    items.map(i => ({ ...i, catKey }))
  );

  const filteredGlossary = allGlossaryItems.filter(item => {
    const matchesCat = glossaryCategory === 'all' || item.catKey === glossaryCategory;
    const matchesQuery = !glossarySearch ||
      item.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      item.en.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      item.definition.toLowerCase().includes(glossarySearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner & Mode Notice */}
      <div className="bg-gradient-to-r from-[#12302B] via-[#1A443D] to-[#1F7A57] text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-emerald-200">
              <Compass className="w-3.5 h-3.5 text-[#E3A21A]" />
              SENSAVOUR Standalone Edition
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E3A21A]/20 text-[#E3A21A] text-[11px] font-bold border border-[#E3A21A]/30">
              Tanpa Soalan Ujian
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">
            SENSAVOUR · Kamus Sensori Makanan Borneo
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Kamus digital kosa kata sensori dan roda pancaidera interaktif untuk menghuraikan rupa, aroma, rasa, tekstur, dan bunyi makanan tradisi Sabah, Sarawak & Brunei Darussalam.
          </p>
        </div>

        {/* Action Buttons: Share Link & Switch to Study Mode */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleShareLink}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm transition cursor-pointer border border-white/20"
            title="Salin pautan terus ke SENSAVOUR Standalone"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Pautan Disalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-emerald-200" />
                <span>Kongsi Pautan Ini</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onSwitchToStudyMode}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#C8402B] hover:bg-[#b03522] text-white font-bold text-xs sm:text-sm transition shadow-md cursor-pointer"
          >
            <span>Buka Mod Misi Kajian</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CBD7CE] pb-3">
        <div className="inline-flex p-1 bg-[#EDF1EA] border border-[#CBD7CE] rounded-2xl shadow-xs flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('wheel')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'wheel'
                ? 'bg-[#12302B] text-white shadow-sm'
                : 'text-[#4F6660] hover:text-[#12302B]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#E3A21A]" />
            <span>Roda Pancaidera & Galeri</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('glossary')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'glossary'
                ? 'bg-[#12302B] text-white shadow-sm'
                : 'text-[#4F6660] hover:text-[#12302B]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Glosari Kosa Kata Sensori</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notepad')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'notepad'
                ? 'bg-[#12302B] text-white shadow-sm'
                : 'text-[#4F6660] hover:text-[#12302B]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Kad Nota Sensori Pelajar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('intro')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'intro'
                ? 'bg-[#12302B] text-white shadow-sm'
                : 'text-[#4F6660] hover:text-[#12302B]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Pengenalan SENSAVOUR</span>
          </button>
        </div>

        <div className="text-xs text-[#4F6660] italic hidden sm:block">
          “Terokai Deria. Temui Kata.”
        </div>
      </div>

      {/* TAB 1: RODA PANCAIDERA & GALERI MAKANAN */}
      {activeTab === 'wheel' && (
        <div className="space-y-8">
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

          {/* Main Two-Column Wheel & Food Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Card: Interactive Wheel */}
            <div className="lg:col-span-5 bg-white border border-[#CBD7CE] rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#4F6660]">
                    RODA PANCAIDERA INTERAKTIF
                  </span>
                  <span className="text-xs text-[#1F7A57] font-bold">10 Segmen Tradisi</span>
                </div>
                <SensoryWheel
                  onSelectFood={setSelectedFoodKey}
                  selectedFoodKey={selectedFoodKey}
                  filterRegion={filterRegion}
                />
              </div>
              <div className="text-center text-xs text-[#4F6660] pt-2 border-t border-[#CBD7CE]/50">
                Klik mana-mana segmen warna pada roda di atas untuk memaparkan profil sensori terperinci.
              </div>
            </div>

            {/* Right Card: Selected Food Detail */}
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

                  {/* 5 Sensory Attributes Card */}
                  <div className="p-4 bg-[#F9FBF7] border border-[#CBD7CE] rounded-2xl space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#12302B] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C8402B]" />
                      Profil 5 Deria Gastronomi:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-[#CBD7CE] space-y-1">
                        <span className="font-bold text-[#E3A21A] flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Rupa
                        </span>
                        <p className="text-[11px] text-[#4F6660]">Segar & berwarna-warni</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#CBD7CE] space-y-1">
                        <span className="font-bold text-[#2E9170] flex items-center gap-1">
                          <Wind className="w-3.5 h-3.5" /> Aroma
                        </span>
                        <p className="text-[11px] text-[#4F6660]">Harum rempah semerbak</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#CBD7CE] space-y-1">
                        <span className="font-bold text-[#D4452E] flex items-center gap-1">
                          <Smile className="w-3.5 h-3.5" /> Rasa
                        </span>
                        <p className="text-[11px] text-[#4F6660]">Berlemak, masam-masin, lazat</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#CBD7CE] space-y-1">
                        <span className="font-bold text-[#4F74B3] flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" /> Tekstur
                        </span>
                        <p className="text-[11px] text-[#4F6660]">Kenyal lembut / empuk</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#CBD7CE] space-y-1 sm:col-span-2">
                        <span className="font-bold text-[#9A5392] flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5" /> Bunyi
                        </span>
                        <p className="text-[11px] text-[#4F6660]">Rangup krup-krap / rapuh mengelus</p>
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
                    Sila pilih mana-mana segmen warna pada roda di sebelah kiri untuk melihat huraian sensasi lima deria bagi hidangan tradisi terpilih.
                  </p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[#CBD7CE]/60 flex items-center justify-between text-xs text-[#4F6660]">
                <span>Hidangan Semasa: <strong className="text-[#12302B]">{currentFoodDetail?.name}</strong></span>
                <span className="text-[#1F7A57] font-bold">✓ Klik gambar untuk besarkan</span>
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
                Bagaimana warisan geografi dan ekologi Borneo merangsang reseptor biologi manusia secara menyeluruh.
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
        </div>
      )}

      {/* TAB 2: GLOSARI KOSA KATA SENSORI */}
      {activeTab === 'glossary' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold font-display text-[#12302B]">
                Glosari Kosa Kata Sensori Kulinari
              </h3>
              <p className="text-xs sm:text-sm text-[#4F6660] mt-1">
                Koleksi istilah sensori profesional (Bahasa Melayu & English) berserta takrifan dan contoh penggunaannya.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-[#4F6660] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari perkataan sensori..."
                value={glossarySearch}
                onChange={e => setGlossarySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#CBD7CE] rounded-xl text-[#12302B] focus:outline-hidden focus:ring-2 focus:ring-[#C8402B]"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGlossaryCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                glossaryCategory === 'all'
                  ? 'bg-[#12302B] text-white shadow-xs'
                  : 'bg-white border border-[#CBD7CE] text-[#4F6660] hover:bg-[#EDF1EA]'
              }`}
            >
              Semua Kategori ({allGlossaryItems.length})
            </button>
            {SENSORY_CATEGORIES.map(c => (
              <button
                key={c.key}
                type="button"
                onClick={() => setGlossaryCategory(c.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  glossaryCategory === c.key
                    ? 'bg-[#12302B] text-white shadow-xs'
                    : 'bg-white border border-[#CBD7CE] text-[#4F6660] hover:bg-[#EDF1EA]'
                }`}
                style={glossaryCategory === c.key ? { backgroundColor: c.color } : {}}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Glossary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGlossary.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#CBD7CE] rounded-2xl p-5 shadow-xs space-y-3 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-display font-extrabold text-base text-[#12302B]">{item.term}</h4>
                    <span className="text-xs font-medium text-[#C8402B] italic">{item.en}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#EDF1EA] text-[#12302B] text-[10px] font-bold uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-[#4F6660] leading-relaxed">
                  {item.definition}
                </p>
                <div className="p-2.5 bg-[#F9FBF7] rounded-xl border border-[#CBD7CE]/70 text-[11px] text-[#12302B]">
                  <span className="font-bold text-[#1F7A57]">Contoh: </span>
                  <em>"{item.example}"</em>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: KAD NOTA SENSORI PELAJAR (NOTEPAD) */}
      {activeTab === 'notepad' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold font-display text-[#12302B]">
              Kad Nota Sensori Pelajar (Tasting Notepad)
            </h3>
            <p className="text-xs sm:text-sm text-[#4F6660] mt-1">
              Gunakan borang interaktif ini untuk mencatat huraian sensori bagi hidangan pilihan anda, kemudian salin atau cetak nota anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Input Form (6 Cols) */}
            <div className="md:col-span-6 bg-white border border-[#CBD7CE] rounded-3xl p-6 shadow-sm space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#12302B]">
                1. Pilih Hidangan:
              </label>
              <select
                value={notepadFood}
                onChange={e => setNotepadFood(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F9FBF7] border border-[#CBD7CE] rounded-xl text-[#12302B] font-bold focus:outline-hidden focus:ring-2 focus:ring-[#C8402B]"
              >
                {Object.keys(FOOD_DETAILS).map(k => (
                  <option key={k} value={k}>{k} ({FOOD_DETAILS[k].origin})</option>
                ))}
              </select>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#12302B]">
                  2. Istilah Sensori Pilihan Anda:
                </label>
                {SENSORY_CATEGORIES.map(cat => (
                  <div key={cat.key} className="space-y-1">
                    <span className="text-xs font-bold text-[#12302B]" style={{ color: cat.color }}>
                      {cat.name}:
                    </span>
                    <input
                      type="text"
                      placeholder={`Cth perkataan ${cat.name.toLowerCase()}...`}
                      value={notepadWords[cat.key] || ''}
                      onChange={e => setNotepadWords(prev => ({ ...prev, [cat.key]: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-[#F9FBF7] border border-[#CBD7CE] rounded-xl text-[#12302B] focus:outline-hidden focus:ring-2 focus:ring-[#C8402B]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Card Preview (6 Cols) */}
            <div className="md:col-span-6 flex flex-col justify-between bg-gradient-to-br from-[#F9FBF7] to-[#EDF1EA] border-2 border-[#12302B]/20 rounded-3xl p-6 shadow-md space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#CBD7CE] pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C8402B]">
                      KAD NOTA SENSORI KULINARI
                    </span>
                    <h4 className="text-xl font-extrabold font-display text-[#12302B] mt-0.5">
                      {notepadFood}
                    </h4>
                  </div>
                  <div className="text-2xl">🍽️</div>
                </div>

                <div className="space-y-2.5 text-xs text-[#12302B]">
                  <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-[#CBD7CE]/70">
                    <span className="font-bold text-[#E3A21A] w-16 shrink-0">👁️ Rupa:</span>
                    <span>{notepadWords.rupa || '—'}</span>
                  </div>
                  <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-[#CBD7CE]/70">
                    <span className="font-bold text-[#2E9170] w-16 shrink-0">👃 Aroma:</span>
                    <span>{notepadWords.aroma || '—'}</span>
                  </div>
                  <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-[#CBD7CE]/70">
                    <span className="font-bold text-[#D4452E] w-16 shrink-0">👅 Rasa:</span>
                    <span>{notepadWords.rasa || '—'}</span>
                  </div>
                  <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-[#CBD7CE]/70">
                    <span className="font-bold text-[#4F74B3] w-16 shrink-0">✋ Tekstur:</span>
                    <span>{notepadWords.tekstur || '—'}</span>
                  </div>
                  <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-[#CBD7CE]/70">
                    <span className="font-bold text-[#9A5392] w-16 shrink-0">👂 Bunyi:</span>
                    <span>{notepadWords.bunyi || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#CBD7CE] flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyNote}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#12302B] text-white font-bold text-xs hover:bg-[#1a443d] transition cursor-pointer"
                >
                  {copiedNote ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Berjaya Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Nota Sensori</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center p-2.5 rounded-xl border border-[#CBD7CE] bg-white text-[#12302B] hover:bg-[#EDF1EA] transition cursor-pointer"
                  title="Cetak Kad Ini"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PENGENALAN SENSAVOUR */}
      {activeTab === 'intro' && (
        <SensavourIntro onContinue={() => setActiveTab('wheel')} showContinueButton={true} />
      )}

      {/* Image Lightbox Modal */}
      {isModalOpen && currentFoodDetail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={currentFoodDetail.name}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
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
