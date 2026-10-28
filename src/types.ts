import hinavaImg from './assets/images/hinava_ginapan_dish_1793178537009.jpg';
import pinasakanImg from './assets/images/pinasakan_sada_dish_1793178554556.jpg';
import tuhauImg from './assets/images/tuhau_sambal_sabah_1793178641261.jpg';
import linopotImg from './assets/images/linopot_rice_sabah_1793178661948.jpg';
import ambuyatImg from './assets/images/ambuyat_candas_set_1793178499291.jpg';
import sarawakLaksaImg from './assets/images/sarawak_laksa_bowl_1793178591609.jpg';
import manokPansuhImg from './assets/images/manok_pansuh_dish_1793178570075.jpg';
import midinImg from './assets/images/masakan_midin_belacan_1793178481137.jpg';
import kekLapisImg from './assets/images/kek_lapis_sarawak_1793178618543.jpg';
import tonsomImg from './assets/images/tonsom_nonsom_bambangan_1793178520622.jpg';

export interface FoodItem {
  id: string;
  name: string;
}

export const FOODS: string[] = [
  'Hinava',
  'Pinasakan Sada',
  'Tuhau',
  'Linopot',
  'Ambuyat',
  'Sarawak Laksa',
  'Manok Pansuh',
  'Midin',
  'Kek Lapis Sarawak',
  'Tonsom/Nonsom Bambangan'
];

export interface FoodDetail {
  name: string;
  origin: string;
  description: string;
  image: string;
  fallbackImage: string;
}

export const FOOD_DETAILS: Record<string, FoodDetail> = {
  'Hinava': {
    name: 'Hinava',
    origin: 'Sabah (Kadazan-Dusun)',
    description: 'Hidangan tradisi ikan tenggiri segar yang dimasak tanpa api menggunakan keasidan jus limau kapas, dihiris bersama halia, cili padi, bawang merah dan parutan biji bambangan.',
    image: hinavaImg,
    fallbackImage: hinavaImg
  },
  'Pinasakan Sada': {
    name: 'Pinasakan Sada',
    origin: 'Sabah (Kadazan-Dusun)',
    description: 'Ikan basung atau ikan sungai yang direbus perlahan bersama kunyit hidup, asam takob-akob (asam gelugur), dan garam sehingga airnya kering pekat dan tahan lama.',
    image: pinasakanImg,
    fallbackImage: pinasakanImg
  },
  'Tuhau': {
    name: 'Tuhau',
    origin: 'Sabah (Kadazan-Dusun)',
    description: 'Batang halia liar hutan Borneo (Etlingera) yang dicencang halus dan dijeruk bersama cili padi, jus limau, dan garam sebagai pembuka selera beraroma wangi herba semerbak.',
    image: tuhauImg,
    fallbackImage: tuhauImg
  },
  'Linopot': {
    name: 'Linopot',
    origin: 'Sabah (Kadazan-Dusun)',
    description: 'Nasi bukit wangi yang digaul mesra bersama ubi keledek manis atau keladi ungu, dibungkus kemas dalam daun tarap atau doringin untuk aroma semula jadi.',
    image: linopotImg,
    fallbackImage: linopotImg
  },
  'Ambuyat': {
    name: 'Ambuyat',
    origin: 'Sabah / Sarawak / Brunei',
    description: 'Pekatan kanji sagu rumbia yang kenyal, lembut dan lutsinar, digulung menggunakan sepasang penyepit buluh candas dan dicicah ke dalam sambal belacan atau kuah asam pedas.',
    image: ambuyatImg,
    fallbackImage: ambuyatImg
  },
  'Sarawak Laksa': {
    name: 'Sarawak Laksa',
    origin: 'Sarawak',
    description: 'Bihun dalam kuah pekat beraroma pes sambal belacan khas dan santan, dihidangkan bersama udang manis, carikan ayam, telur dadar halus, tauge celur dan limau kasturi.',
    image: sarawakLaksaImg,
    fallbackImage: sarawakLaksaImg
  },
  'Manok Pansuh': {
    name: 'Manok Pansuh',
    origin: 'Sarawak (Iban)',
    description: 'Ayam kampung yang diperap bersama serai, halia, bunga kantan dan pucuk ubi muda, dimasukkan ke dalam ruas buluh lalu dibakar perlahan di atas bara api.',
    image: manokPansuhImg,
    fallbackImage: manokPansuhImg
  },
  'Midin': {
    name: 'Midin',
    origin: 'Sarawak',
    description: 'Pucuk paku pakis liar hutan Borneo (Stenochlaena palustris) yang rangup dan segar, digoreng kilas bersama sambal belacan atau bawang putih harum.',
    image: midinImg,
    fallbackImage: midinImg
  },
  'Kek Lapis Sarawak': {
    name: 'Kek Lapis Sarawak',
    origin: 'Sarawak',
    description: 'Kek lapis mentega warisan dengan corak geometri berlapis warna-warni yang rumit, bertekstur lembut, lembap dan manis berlemak.',
    image: kekLapisImg,
    fallbackImage: kekLapisImg
  },
  'Tonsom/Nonsom Bambangan': {
    name: 'Tonsom/Nonsom Bambangan',
    origin: 'Sabah (Kadazan-Dusun)',
    description: 'Jeruk buah mangga liar Borneo (Mangifera pajang) yang diperap bersama parutan biji bambangan kering dan garam, menghasilkan aroma masam menyelerakan.',
    image: tonsomImg,
    fallbackImage: tonsomImg
  }
};

export const FAMILIARITY_OPTIONS: string[] = [
  'I have never heard of this food. / Saya tidak pernah mendengar mengenai makanan ini.',
  'I have heard of it but know little about it. / Saya pernah mendengarnya tetapi kurang mengetahuinya.',
  'I know about it but have never tasted it. / Saya tahu tentang makanan ini tetapi belum pernah merasainya.',
  'I have tasted it once or a few times. / Saya pernah merasainya sekali atau beberapa kali.',
  'I am very familiar with it and have tasted it several times. / Saya amat mengenali makanan ini dan pernah merasainya berulang kali.'
];

export const DESC_HINT = 'Huraikan dengan perkataan anda sendiri. Anda boleh menyatakan rupa, aroma, rasa, tekstur atau bunyi, sekiranya dapat dinilai. Sekiranya anda tidak biasa atau tidak dapat menilai sesuatu ciri, nyatakan sedemikian dan elakkan daripada meneka. / Describe in your own words. You may mention appearance, aroma, taste, texture or sound if assessable. If unfamiliar, say so rather than guessing.';

export function hasTastedFood(famAnswer?: string): boolean {
  if (!famAnswer) return false;
  return (
    famAnswer.includes('have tasted it') ||
    famAnswer.includes('tasted it several times') ||
    famAnswer.includes('pernah merasainya')
  );
}

export interface QuestionDef {
  id: string;
  type: 'radio' | 'grid' | 'para';
  req: boolean;
  other?: boolean;
  bm: string;
  en: string;
  hint?: string;
  opts?: string[];
  rows?: string[];
}

export const PRE_QUESTIONS: QuestionDef[] = [
  {
    id: 'q3',
    type: 'radio',
    req: true,
    bm: 'Kumpulan umur',
    en: 'Age group',
    opts: [
      '17 or below / 17 tahun atau ke bawah',
      '18–20 years / 18–20 tahun',
      '21–23 years / 21–23 tahun',
      '24–26 years / 24–26 tahun',
      '27 years or above / 27 tahun atau ke atas',
      'Prefer not to say / Tidak mahu menyatakan'
    ]
  },
  {
    id: 'q4',
    type: 'radio',
    req: false,
    bm: 'Jantina (pilihan)',
    en: 'Gender (optional)',
    opts: [
      'Female / Perempuan',
      'Male / Lelaki',
      'Prefer not to say / Tidak mahu menyatakan'
    ]
  },
  {
    id: 'q5',
    type: 'radio',
    req: true,
    other: true,
    bm: 'Program pengajian',
    en: 'Programme of study',
    opts: [
      'Certificate / Diploma in Culinary Arts / Sijil atau Diploma Seni Kulinari',
      'Certificate / Diploma in Hotel Operations / Sijil atau Diploma Operasi Perhotelan',
      'Other hospitality or tourism programme / Program hospitaliti atau pelancongan lain (cth: Bakeri & Pastri, Pelancongan)',
      'Not currently enrolled in higher education / Tidak melanjutkan pengajian di institusi (Bukan pelajar / Orang awam)'
    ]
  },
  {
    id: 'q6',
    type: 'radio',
    req: true,
    bm: 'Semester atau tahun pengajian',
    en: 'Current semester / year of study',
    opts: [
      'Semester 1 / Semester 1',
      'Semester 2 / Semester 2',
      'Semester 3 / Semester 3',
      'Semester 4 / Semester 4',
      'Semester 5 or above / Semester 5 atau ke atas',
      'Other / Not applicable / Lain-lain / Tidak berkenaan'
    ]
  },
  {
    id: 'q7',
    type: 'radio',
    req: true,
    bm: 'Pernahkah anda mempelajari penilaian sensori atau cara menghuraikan makanan menggunakan istilah sensori?',
    en: 'Have you previously learned about sensory evaluation or how to describe food using sensory terms?',
    opts: [
      'Never / Tidak pernah',
      'A little, informally / Sedikit, secara tidak formal',
      'As part of a course or subject / Sebagai sebahagian daripada kursus atau subjek',
      'Several times through lessons or practice / Beberapa kali melalui pembelajaran atau latihan',
      'Not sure / Tidak pasti'
    ]
  },
  {
    id: 'q8',
    type: 'grid',
    req: true,
    bm: 'Tahap kebiasaan terhadap makanan sebelum kajian',
    en: 'Prior food familiarity',
    hint: 'Sebelum menggunakan SENSAVOUR, pilih satu jawapan bagi setiap makanan. / Before using SENSAVOUR, select one answer for every food.',
    rows: FOODS,
    opts: FAMILIARITY_OPTIONS
  },
  ...FOODS.map((food, idx) => ({
    id: `q${9 + idx}`,
    type: 'para' as const,
    req: true,
    bm: `Huraikan ${food} dengan perkataan anda sendiri.`,
    en: `Describe ${food} in your own words.`,
    hint: DESC_HINT
  }))
];

export const POST_QUESTIONS: QuestionDef[] = [
  ...FOODS.map((food, idx) => ({
    id: `q${21 + idx}`,
    type: 'para' as const,
    req: true,
    bm: `Huraikan ${food} dengan perkataan anda sendiri.`,
    en: `Describe ${food} in your own words.`,
    hint: DESC_HINT
  })),
  {
    id: 'q31',
    type: 'para',
    req: true,
    bm: 'Bagaimanakah, jika ada, penggunaan SENSAVOUR mempengaruhi cara anda menghuraikan makanan tradisional?',
    en: 'How, if at all, did using SENSAVOUR influence the way you described the traditional foods?',
    hint: 'Jelaskan pengalaman anda dan berikan contoh daripada huraian anda. / Explain your experience and give examples from your descriptions.'
  },
  {
    id: 'q32',
    type: 'para',
    req: true,
    bm: 'Apakah perkataan atau frasa sensori yang anda pelajari, temui atau mula gunakan selepas meneroka SENSAVOUR?',
    en: 'Which sensory words or phrases did you learn, discover or begin using after exploring SENSAVOUR?',
    hint: 'Berikan contoh dan jelaskan maksud perkataan tersebut kepada anda. / Give examples and explain what the words mean to you.'
  },
  {
    id: 'q33',
    type: 'para',
    req: true,
    bm: 'Bahagian manakah dalam SENSAVOUR yang paling membantu anda, jika ada? Mengapa?',
    en: 'Which part of SENSAVOUR was most helpful to you, if any? Why?',
    hint: 'Roda sensori, definisi kosa kata, contoh makanan atau maklumat berkaitan makanan. / The sensory wheel, vocabulary definitions, food examples or food-related information.'
  },
  {
    id: 'q34',
    type: 'para',
    req: true,
    bm: 'Adakah mana-mana bahagian SENSAVOUR mengelirukan, sukar difahami atau kurang berguna kepada anda?',
    en: 'Was any part of SENSAVOUR confusing, difficult to understand or not useful to you?',
    hint: 'Jelaskan dengan jujur. Tulis “tiada” jika tiada kesukaran. / Explain honestly. Write “none” if you had no difficulty.'
  },
  {
    id: 'q35',
    type: 'para',
    req: false,
    bm: 'Apakah penambahbaikan yang anda cadangkan untuk SENSAVOUR?',
    en: 'What improvements would you suggest for SENSAVOUR?',
    hint: 'Pilihan. / Optional.'
  },
  {
    id: 'q36',
    type: 'para',
    req: false,
    bm: 'Adakah perkara lain yang ingin anda kongsikan tentang penggunaan SENSAVOUR?',
    en: 'Is there anything else you would like to share about using SENSAVOUR?',
    hint: 'Pilihan. / Optional.'
  }
];

export interface SensoryCategory {
  key: string;
  name: string;
  color: string;
  question: string;
}

export const SENSORY_CATEGORIES: SensoryCategory[] = [
  { key: 'rupa', name: 'Rupa', color: '#E3A21A', question: 'Cari satu perkataan untuk RUPA makanan (warna, kilauan, bentuk).' },
  { key: 'aroma', name: 'Aroma', color: '#2E9170', question: 'Cari satu perkataan untuk AROMA atau bau makanan (cth: harum, wangi, hanyir).' },
  { key: 'rasa', name: 'Rasa', color: '#D4452E', question: 'Cari satu perkataan untuk RASA atau perisa makanan (cth: manis, masam, masin, berlemak, lazat. Elakkan kata Indonesia "gurih", gunakan "berlemak" atau "lazat").' },
  { key: 'tekstur', name: 'Tekstur', color: '#4F74B3', question: 'Cari satu perkataan untuk TEKSTUR di mulut (cth: lembut, kenyal, liat, rapuh).' },
  { key: 'bunyi', name: 'Bunyi', color: '#9A5392', question: 'Cari satu perkataan untuk BUNYI semasa makanan digigit atau dikunyah (cth: rangup, krup-krap).' }
];

export interface ParticipantRecord {
  code: string;
  consentAt?: any;
  createdAt?: any;
  stage?: 'pre' | 'explore' | 'post' | 'done';
  profile?: {
    q3?: string;
    q4?: string;
    q5?: string;
    q6?: string;
    q7?: string;
    q8?: Record<string, string>;
    [key: string]: any;
  };
  pre?: Record<string, string>;
  preSubmittedAt?: any;
  exploreStartedAt?: any;
  words?: Record<string, string>;
  unlockedAt?: any;
  post?: Record<string, string>;
  reflection?: Record<string, string>;
  postSubmittedAt?: any;
  _uid?: string;
}
