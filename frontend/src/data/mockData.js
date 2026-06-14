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
  { id: 1, id_skala: null, batas_normal_max: 13, batas_borderline_max: 14, is_reversed: false },
  { id: 2, id_skala: 'E', batas_normal_max: 3, batas_borderline_max: 4, is_reversed: false },
  { id: 3, id_skala: 'C', batas_normal_max: 2, batas_borderline_max: 3, is_reversed: false },
  { id: 4, id_skala: 'H', batas_normal_max: 5, batas_borderline_max: 6, is_reversed: false },
  { id: 5, id_skala: 'P', batas_normal_max: 2, batas_borderline_max: 3, is_reversed: false },
  { id: 6, id_skala: 'Pro', batas_normal_max: 4, batas_borderline_max: 5, is_reversed: true },
]

export const mockPertanyaan = [
  { id: 1, urutan: 1, teks_pertanyaan: 'Saya sering sakit kepala, sakit perut atau macam-macam sakit lainnya', teks_pertanyaan_en: 'I get a lot of headaches, stomach-aches or sickness', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 2, urutan: 2, teks_pertanyaan: 'Saya banyak merasa cemas atau khawatir terhadap apapun', teks_pertanyaan_en: 'I worry a lot', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 3, urutan: 3, teks_pertanyaan: 'Saya sering merasa tidak bahagia, sedih atau menangis', teks_pertanyaan_en: 'I am often unhappy, downhearted or tearful', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 4, urutan: 4, teks_pertanyaan: 'Saya merasa gugup dalam situasi baru, saya mudah kehilangan rasa percaya diri', teks_pertanyaan_en: 'I am nervous in new situations, I easily lose confidence', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 5, urutan: 5, teks_pertanyaan: 'Banyak yang saya takuti, saya mudah menjadi takut', teks_pertanyaan_en: 'I have many fears, I am easily scared', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 6, urutan: 6, teks_pertanyaan: 'Saya menjadi sangat marah dan sering tidak dapat mengendalikan kemarahan saya', teks_pertanyaan_en: 'I get very angry and often lose my temper', id_skala: 'C', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 7, urutan: 7, teks_pertanyaan: 'Saya biasanya melakukan apa yang diperintahkan oleh orang lain', teks_pertanyaan_en: 'I usually do as I am told', id_skala: 'C', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
  { id: 8, urutan: 8, teks_pertanyaan: 'Saya sering bertengkar dengan orang lain. Saya dapat memaksa orang lain melakukan apa yang saya inginkan', teks_pertanyaan_en: 'I fight a lot. I can make other people do what I want', id_skala: 'C', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 9, urutan: 9, teks_pertanyaan: 'Saya sering dituduh berbohong atau berbuat curang', teks_pertanyaan_en: 'I am often accused of lying or cheating', id_skala: 'C', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 10, urutan: 10, teks_pertanyaan: 'Saya mengambil barang yang bukan milik saya dari rumah, sekolah atau dari mana saja', teks_pertanyaan_en: 'I take things that are not mine from home, school or elsewhere', id_skala: 'C', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 11, urutan: 11, teks_pertanyaan: 'Saya gelisah, saya tidak dapat diam untuk waktu lama', teks_pertanyaan_en: 'I am restless, I cannot stay still for long', id_skala: 'H', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 12, urutan: 12, teks_pertanyaan: 'Bila sedang gelisah atau cemas badan saya sering bergerak-gerak tanpa saya sadari', teks_pertanyaan_en: 'I am constantly fidgeting or squirming', id_skala: 'H', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 13, urutan: 13, teks_pertanyaan: 'Perhatian saya mudah teralih, saya sulit untuk memusatkan perhatian pada apapun', teks_pertanyaan_en: 'I am easily distracted, I find it difficult to concentrate', id_skala: 'H', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 14, urutan: 14, teks_pertanyaan: 'Saya berpikir terlebih dulu akibat yang akan terjadi, sebelum berbuat atau melakukan sesuatu', teks_pertanyaan_en: 'I think before I do things', id_skala: 'H', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
  { id: 15, urutan: 15, teks_pertanyaan: 'Saya menyelesaikan pekerjaan yang sedang saya lakukan. Saya mempunyai perhatian yang baik terhadap apapun', teks_pertanyaan_en: 'I finish the work I am doing. My attention is good', id_skala: 'H', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
  { id: 16, urutan: 16, teks_pertanyaan: 'Saya lebih suka sendiri daripada bersama dengan orang yang seusiaku', teks_pertanyaan_en: 'I would rather be alone than with people of my age', id_skala: 'P', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 17, urutan: 17, teks_pertanyaan: 'Saya mempunyai satu orang teman baik atau lebih', teks_pertanyaan_en: 'I have one good friend or more', id_skala: 'P', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
  { id: 18, urutan: 18, teks_pertanyaan: 'Orang lain seusia saya umumnya menyukai saya', teks_pertanyaan_en: 'Other people my age generally like me', id_skala: 'P', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
  { id: 19, urutan: 19, teks_pertanyaan: 'Saya sering diganggu atau dipermainkan oleh anak-anak atau remaja lainnya', teks_pertanyaan_en: 'Other children or young people pick on me or bully me', id_skala: 'P', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 20, urutan: 20, teks_pertanyaan: 'Saya lebih mudah berteman dengan orang dewasa daripada dengan orang seusia saya', teks_pertanyaan_en: 'I get on better with adults than with people my own age', id_skala: 'P', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
  { id: 21, urutan: 21, teks_pertanyaan: 'Saya berusaha baik kepada orang lain. Saya peduli dengan perasaan mereka', teks_pertanyaan_en: 'I try to be nice to other people. I care about their feelings', id_skala: 'Pro', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
  { id: 22, urutan: 22, teks_pertanyaan: 'Kalau saya memiliki mainan, CD, atau makanan, saya biasanya berbagi dengan orang lain', teks_pertanyaan_en: 'I usually share with others, for example CDs, games, food', id_skala: 'Pro', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
  { id: 23, urutan: 23, teks_pertanyaan: 'Saya selalu siap menolong jika seseorang terluka, kecewa atau merasa sakit', teks_pertanyaan_en: 'I am helpful if someone is hurt, upset or feeling ill', id_skala: 'Pro', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
  { id: 24, urutan: 24, teks_pertanyaan: 'Saya bersikap baik terhadap anak-anak yang lebih muda dari saya', teks_pertanyaan_en: 'I am kind to younger children', id_skala: 'Pro', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
  { id: 25, urutan: 25, teks_pertanyaan: 'Saya sering menawarkan diri untuk membantu orang lain (orang tua, guru, anak-anak)', teks_pertanyaan_en: 'I often volunteer to help others (parents, teachers, children)', id_skala: 'Pro', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
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
