export const mockUsers = [
  { id: 1, username: 'admin', password: '123', nama_lengkap: 'Administrator', role: 'ADMIN' },
  { id: 2, username: 'pengasuh_1', password: '123', nama_lengkap: 'Siti Nurhaliza', role: 'PENGASUH' },
  { id: 3, username: 'pengasuh_2', password: '123', nama_lengkap: 'Budi Santoso', role: 'PENGASUH' },
]

export const mockSkala = [
  { id_skala: 'E', nama_skala: 'Gejala Emosional', nama_skala_en: 'Emotional Symptoms' },
  { id_skala: 'C', nama_skala: 'Masalah Perilaku', nama_skala_en: 'Conduct Problems' },
  { id_skala: 'H', nama_skala: 'Hiperaktivitas', nama_skala_en: 'Hyperactivity' },
  { id_skala: 'P', nama_skala: 'Masalah Teman Sebaya', nama_skala_en: 'Peer Problems' },
  { id_skala: 'Pro', nama_skala: 'Perilaku Prososial', nama_skala_en: 'Prosocial Behaviour' },
]

export const mockAmbangBatas = [
  { id: 1, id_skala: null, batas_normal_max: 13, batas_borderline_max: 16, is_reversed: false },
  { id: 2, id_skala: 'E', batas_normal_max: 3, batas_borderline_max: 4, is_reversed: false },
  { id: 3, id_skala: 'C', batas_normal_max: 2, batas_borderline_max: 3, is_reversed: false },
  { id: 4, id_skala: 'H', batas_normal_max: 5, batas_borderline_max: 6, is_reversed: false },
  { id: 5, id_skala: 'P', batas_normal_max: 2, batas_borderline_max: 3, is_reversed: false },
  { id: 6, id_skala: 'Pro', batas_normal_max: 4, batas_borderline_max: 5, is_reversed: true },
]

export const mockPertanyaan = [
  { id: 1, urutan: 1, teks_pertanyaan: 'Dapat mempedulikan perasaan orang lain', teks_pertanyaan_en: "Considerate of other people's feelings", id_skala: 'Pro', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 2, urutan: 2, teks_pertanyaan: 'Gelisah, terlalu aktif, tidak dapat diam untuk waktu lama', teks_pertanyaan_en: 'Restless, overactive, cannot stay still for long', id_skala: 'H', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 3, urutan: 3, teks_pertanyaan: 'Sering mengeluh sakit kepala, sakit perut atau sakit-sakit lainnya', teks_pertanyaan_en: 'Often complains of headaches, stomach-aches or sickness', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 4, urutan: 4, teks_pertanyaan: 'Kalau mempunyai mainan, kesenangan, atau pensil, anak bersedia berbagi dengan anak-anak lain', teks_pertanyaan_en: 'Shares readily with other youth, for example food, games, pens', id_skala: 'Pro', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 5, urutan: 5, teks_pertanyaan: 'Sering sulit mengendalikan kemarahan', teks_pertanyaan_en: 'Often loses temper', id_skala: 'C', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 6, urutan: 6, teks_pertanyaan: 'Cenderung menyendiri, lebih suka bermain seorang diri', teks_pertanyaan_en: 'Would rather be alone than with other youth', id_skala: 'P', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 7, urutan: 7, teks_pertanyaan: 'Umumnya bertingkah laku baik, biasanya melakukan apa yang disuruh oleh orangdewasa', teks_pertanyaan_en: 'Generally well behaved, usually does what adults request', id_skala: 'C', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
  { id: 8, urutan: 8, teks_pertanyaan: 'Banyak kekhawatiran atau sering tampak khawatir', teks_pertanyaan_en: 'Many worries or often seems worried', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 9, urutan: 9, teks_pertanyaan: 'Suka menolong jika seseorang terluka, kecewa atau merasa sakit', teks_pertanyaan_en: 'Helpful if someone is hurt, upset or feeling ill', id_skala: 'Pro', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 10, urutan: 10, teks_pertanyaan: 'Terus menerus bergerak dengan resah atau menggeliat-geliat', teks_pertanyaan_en: 'Constantly fidgeting or squirming', id_skala: 'H', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 11, urutan: 11, teks_pertanyaan: 'Mempunyai satu atau lebih teman baik', teks_pertanyaan_en: 'Has at least one good friend', id_skala: 'P', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
  { id: 12, urutan: 12, teks_pertanyaan: 'Sering berkelahi dengan anak-anak lain atau mengintimidasi mereka', teks_pertanyaan_en: 'Often fights with other youth or bullies them', id_skala: 'C', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 13, urutan: 13, teks_pertanyaan: 'Sering merasa tidak bahagia, sedih atau menangis', teks_pertanyaan_en: 'Often unhappy, depressed or tearful', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 14, urutan: 14, teks_pertanyaan: 'Pada umumnya disukai oleh anak-anak lain', teks_pertanyaan_en: 'Generally liked by other youth', id_skala: 'P', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
  { id: 15, urutan: 15, teks_pertanyaan: 'Mudah teralih perhatiannya, tidak dapat berkonsentrasi', teks_pertanyaan_en: 'Easily distracted, concentration wanders', id_skala: 'H', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 16, urutan: 16, teks_pertanyaan: 'Gugup atau sulit berpisah dengan orang tua/pengasuhnya pada situasi baru, mudahkehilangan rasa percaya diri', teks_pertanyaan_en: 'Nervous in new situations, easily loses confidence', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 17, urutan: 17, teks_pertanyaan: 'Bersikap baik terhadap anak-anak yang lebih muda', teks_pertanyaan_en: 'Kind to younger children', id_skala: 'Pro', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 18, urutan: 18, teks_pertanyaan: 'Sering berbohong atau berbuat curang', teks_pertanyaan_en: 'Often lies or cheats', id_skala: 'C', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 19, urutan: 19, teks_pertanyaan: 'Diganggu, di permainkan, di intimidasi atau di ancam oleh anak-anak lain', teks_pertanyaan_en: 'Picked on or bullied by other youth', id_skala: 'P', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 20, urutan: 20, teks_pertanyaan: 'Sering menawarkan diri untuk membantu orang lain (orang tua, guru, anak-anak lain)', teks_pertanyaan_en: 'Often offers to help others (parents, teachers, children)', id_skala: 'Pro', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 21, urutan: 21, teks_pertanyaan: 'Sebelum melakukan sesuatu ia berpikir dahulu tentang akibatnya', teks_pertanyaan_en: 'Thinks things out before acting', id_skala: 'H', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
  { id: 22, urutan: 22, teks_pertanyaan: 'Mencuri dari rumah, sekolah atau tempat lain', teks_pertanyaan_en: 'Steals from home, school or elsewhere', id_skala: 'C', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 23, urutan: 23, teks_pertanyaan: 'Lebih mudah berteman dengan orang dewasa daripada dengan anak-anak lain', teks_pertanyaan_en: 'Gets along better with adults than with other youth', id_skala: 'P', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 24, urutan: 24, teks_pertanyaan: 'Banyak yang ditakuti, mudah menjadi takut', teks_pertanyaan_en: 'Many fears, easily scared', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 25, urutan: 25, teks_pertanyaan: 'Memiliki perhatian yang baik terhadap apapun, mampu menyelesaikan tugas atau pekerjaan rumah sampai selesai', teks_pertanyaan_en: 'Good attention span, sees work through to the end', id_skala: 'H', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
]

export const mockAnak = [
  { id: 1, nama: 'Andi Pratama', tanggal_lahir: '2016-03-15', jenis_kelamin: 'L', created_by: 2, created_by_admin: false },
  { id: 2, nama: 'Sari Dewi', tanggal_lahir: '2012-07-22', jenis_kelamin: 'P', created_by: 2, created_by_admin: false },
  { id: 3, nama: 'Rizky Maulana', tanggal_lahir: '2014-11-01', jenis_kelamin: 'L', created_by: 1, created_by_admin: true },
]

export const mockSkrining = [
  {
    id: 1, anak_id: 1, pengasuh_id: 2, tanggal_skrining: '2025-11-15',
    total_score: 12, kategori_total: 'Normal',
    per_skala: [
      { id_skala: 'E', skor: 3, kategori: 'Normal' },
      { id_skala: 'C', skor: 2, kategori: 'Normal' },
      { id_skala: 'H', skor: 4, kategori: 'Normal' },
      { id_skala: 'P', skor: 3, kategori: 'Borderline' },
      { id_skala: 'Pro', skor: 7, kategori: 'Normal' },
    ],
  },
  {
    id: 2, anak_id: 1, pengasuh_id: 2, tanggal_skrining: '2025-12-20',
    total_score: 14, kategori_total: 'Borderline',
    per_skala: [
      { id_skala: 'E', skor: 4, kategori: 'Borderline' },
      { id_skala: 'C', skor: 3, kategori: 'Borderline' },
      { id_skala: 'H', skor: 5, kategori: 'Normal' },
      { id_skala: 'P', skor: 2, kategori: 'Normal' },
      { id_skala: 'Pro', skor: 6, kategori: 'Normal' },
    ],
  },
  {
    id: 3, anak_id: 2, pengasuh_id: 2, tanggal_skrining: '2025-12-10',
    total_score: 18, kategori_total: 'Abnormal',
    per_skala: [
      { id_skala: 'E', skor: 6, kategori: 'Abnormal' },
      { id_skala: 'C', skor: 4, kategori: 'Abnormal' },
      { id_skala: 'H', skor: 5, kategori: 'Normal' },
      { id_skala: 'P', skor: 3, kategori: 'Borderline' },
      { id_skala: 'Pro', skor: 4, kategori: 'Abnormal' },
    ],
  },
]

export const mockEdukasi = [
  { id: 1, judul: 'Mengenali Emosi Anak', judul_en: 'Recognizing Child Emotions', deskripsi: 'Panduan untuk orang tua dalam mengenali dan memahami emosi anak sejak dini.', deskripsi_en: 'A guide for parents to recognize and understand children\'s emotions early on.', tipe: 'pdf', url_atau_file: '/sample.pdf', is_active: true },
  { id: 2, judul: 'Cara Mengatasi Hiperaktivitas', judul_en: 'Managing Hyperactivity', deskripsi: 'Strategi dan tips untuk mengelola anak dengan gejala hiperaktivitas.', deskripsi_en: 'Strategies and tips for managing children with hyperactivity symptoms.', tipe: 'youtube', url_atau_file: 'https://youtube.com/watch?v=dQw4w9WgXcQ', is_active: true },
  { id: 3, judul: 'Komunikasi Efektif dengan Remaja', judul_en: 'Effective Communication with Teens', deskripsi: 'Teknik komunikasi yang efektif untuk membangun hubungan positif dengan remaja.', deskripsi_en: 'Effective communication techniques to build positive relationships with teenagers.', tipe: 'pdf', url_atau_file: '/sample2.pdf', is_active: true },
]

export const mockPsikolog = [
  { id: 1, nama: 'Dr. Maya Sari, M.Psi', spesialisasi: 'Psikologi Anak', spesialisasi_en: 'Child Psychology', nomor_whatsapp: '628123456789', pesan_default: 'Halo Dok, saya ingin konsultasi terkait tumbuh kembang anak saya.', pesan_default_en: "Hello Doctor, I would like to consult about my child's development.", is_active: true },
  { id: 2, nama: 'Dr. Andi Rahman, M.Psi, Psikolog', spesialisasi: 'Psikologi Remaja', spesialisasi_en: 'Adolescent Psychology', nomor_whatsapp: '628987654321', pesan_default: 'Halo Dok, saya ingin berkonsultasi mengenai perkembangan remaja saya.', pesan_default_en: "Hello Doctor, I would like to consult about my teenager's development.", is_active: true },
]
