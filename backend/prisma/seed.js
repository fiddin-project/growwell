const prisma = require('../src/lib/prisma')
const bcrypt = require('bcryptjs')
const defaultThresholds = require('../src/lib/defaultThresholds')

async function main() {
  await prisma.jawaban.deleteMany()
  await prisma.hasilSkala.deleteMany()
  await prisma.skrining.deleteMany()
  await prisma.ambangBatas.deleteMany()
  await prisma.pertanyaan.deleteMany()
  await prisma.edukasi.deleteMany()
  await prisma.psikolog.deleteMany()
  await prisma.anak.deleteMany()
  await prisma.user.deleteMany()
  await prisma.skala.deleteMany()

  const adminHash = await bcrypt.hash('123', 10)
  const pengasuhHash = await bcrypt.hash('123', 10)

  const admin = await prisma.user.create({
    data: { username: 'admin', password_hash: adminHash, nama_lengkap: 'Administrator', role: 'ADMIN' },
  })
  const pengasuh1 = await prisma.user.create({
    data: { username: 'pengasuh_1', password_hash: pengasuhHash, nama_lengkap: 'Siti Nurhaliza', role: 'PENGASUH' },
  })
  const pengasuh2 = await prisma.user.create({
    data: { username: 'pengasuh_2', password_hash: pengasuhHash, nama_lengkap: 'Budi Santoso', role: 'PENGASUH' },
  })

  await prisma.skala.createMany({
    data: [
      { id_skala: 'E', nama_skala: 'Gejala Emosional', nama_skala_en: 'Emotional Symptoms' },
      { id_skala: 'C', nama_skala: 'Masalah Perilaku', nama_skala_en: 'Conduct Problems' },
      { id_skala: 'H', nama_skala: 'Hiperaktivitas', nama_skala_en: 'Hyperactivity' },
      { id_skala: 'P', nama_skala: 'Masalah Teman Sebaya', nama_skala_en: 'Peer Problems' },
      { id_skala: 'Pro', nama_skala: 'Perilaku Prososial', nama_skala_en: 'Prosocial Behaviour' },
    ],
  })

  await prisma.ambangBatas.createMany({
    data: defaultThresholds,
  })

  await prisma.pertanyaan.createMany({
    data: [
      { urutan: 1, teks_pertanyaan: 'Dapat mempedulikan perasaan orang lain', teks_pertanyaan_en: "Considerate of other people's feelings", id_skala: 'Pro', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 2, teks_pertanyaan: 'Gelisah, terlalu aktif, tidak dapat diam untuk waktu lama', teks_pertanyaan_en: 'Restless, overactive, cannot stay still for long', id_skala: 'H', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 3, teks_pertanyaan: 'Sering mengeluh sakit kepala, sakit perut atau sakit-sakit lainnya', teks_pertanyaan_en: 'Often complains of headaches, stomach-aches or sickness', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 4, teks_pertanyaan: 'Kalau mempunyai mainan, kesenangan, atau pensil, anak bersedia berbagi dengan anak-anak lain', teks_pertanyaan_en: 'Shares readily with other youth, for example food, games, pens', id_skala: 'Pro', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 5, teks_pertanyaan: 'Sering sulit mengendalikan kemarahan', teks_pertanyaan_en: 'Often loses temper', id_skala: 'C', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 6, teks_pertanyaan: 'Cenderung menyendiri, lebih suka bermain seorang diri', teks_pertanyaan_en: 'Would rather be alone than with other youth', id_skala: 'P', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 7, teks_pertanyaan: 'Umumnya bertingkah laku baik, biasanya melakukan apa yang disuruh oleh orangdewasa', teks_pertanyaan_en: 'Generally well behaved, usually does what adults request', id_skala: 'C', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
      { urutan: 8, teks_pertanyaan: 'Banyak kekhawatiran atau sering tampak khawatir', teks_pertanyaan_en: 'Many worries or often seems worried', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 9, teks_pertanyaan: 'Suka menolong jika seseorang terluka, kecewa atau merasa sakit', teks_pertanyaan_en: 'Helpful if someone is hurt, upset or feeling ill', id_skala: 'Pro', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 10, teks_pertanyaan: 'Terus menerus bergerak dengan resah atau menggeliat-geliat', teks_pertanyaan_en: 'Constantly fidgeting or squirming', id_skala: 'H', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 11, teks_pertanyaan: 'Mempunyai satu atau lebih teman baik', teks_pertanyaan_en: 'Has at least one good friend', id_skala: 'P', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
      { urutan: 12, teks_pertanyaan: 'Sering berkelahi dengan anak-anak lain atau mengintimidasi mereka', teks_pertanyaan_en: 'Often fights with other youth or bullies them', id_skala: 'C', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 13, teks_pertanyaan: 'Sering merasa tidak bahagia, sedih atau menangis', teks_pertanyaan_en: 'Often unhappy, depressed or tearful', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 14, teks_pertanyaan: 'Pada umumnya disukai oleh anak-anak lain', teks_pertanyaan_en: 'Generally liked by other youth', id_skala: 'P', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
      { urutan: 15, teks_pertanyaan: 'Mudah teralih perhatiannya, tidak dapat berkonsentrasi', teks_pertanyaan_en: 'Easily distracted, concentration wanders', id_skala: 'H', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 16, teks_pertanyaan: 'Gugup atau sulit berpisah dengan orang tua/pengasuhnya pada situasi baru, mudahkehilangan rasa percaya diri', teks_pertanyaan_en: 'Nervous in new situations, easily loses confidence', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 17, teks_pertanyaan: 'Bersikap baik terhadap anak-anak yang lebih muda', teks_pertanyaan_en: 'Kind to younger children', id_skala: 'Pro', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 18, teks_pertanyaan: 'Sering berbohong atau berbuat curang', teks_pertanyaan_en: 'Often lies or cheats', id_skala: 'C', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 19, teks_pertanyaan: 'Diganggu, di permainkan, di intimidasi atau di ancam oleh anak-anak lain', teks_pertanyaan_en: 'Picked on or bullied by other youth', id_skala: 'P', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 20, teks_pertanyaan: 'Sering menawarkan diri untuk membantu orang lain (orang tua, guru, anak-anak lain)', teks_pertanyaan_en: 'Often offers to help others (parents, teachers, children)', id_skala: 'Pro', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 21, teks_pertanyaan: 'Sebelum melakukan sesuatu ia berpikir dahulu tentang akibatnya', teks_pertanyaan_en: 'Thinks things out before acting', id_skala: 'H', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
      { urutan: 22, teks_pertanyaan: 'Mencuri dari rumah, sekolah atau tempat lain', teks_pertanyaan_en: 'Steals from home, school or elsewhere', id_skala: 'C', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 23, teks_pertanyaan: 'Lebih mudah berteman dengan orang dewasa daripada dengan anak-anak lain', teks_pertanyaan_en: 'Gets along better with adults than with other youth', id_skala: 'P', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 24, teks_pertanyaan: 'Banyak yang ditakuti, mudah menjadi takut', teks_pertanyaan_en: 'Many fears, easily scared', id_skala: 'E', skor_tidak_benar: 0, skor_agak_benar: 1, skor_selalu_benar: 2 },
      { urutan: 25, teks_pertanyaan: 'Memiliki perhatian yang baik terhadap apapun, mampu menyelesaikan tugas atau pekerjaan rumah sampai selesai', teks_pertanyaan_en: 'Good attention span, sees work through to the end', id_skala: 'H', skor_tidak_benar: 2, skor_agak_benar: 1, skor_selalu_benar: 0 },
    ],
  })


  await prisma.anak.createMany({
    data: [
      { nama: 'Andi Pratama', tanggal_lahir: new Date('2016-03-15'), jenis_kelamin: 'L', created_by: pengasuh1.id, created_by_admin: false },
      { nama: 'Sari Dewi', tanggal_lahir: new Date('2012-07-22'), jenis_kelamin: 'P', created_by: pengasuh1.id, created_by_admin: false },
      { nama: 'Rizky Maulana', tanggal_lahir: new Date('2014-11-01'), jenis_kelamin: 'L', created_by: admin.id, created_by_admin: true },
    ],
  })

  await prisma.edukasi.createMany({
    data: [
      { judul: 'Mengenali Emosi Anak', judul_en: 'Recognizing Child Emotions', deskripsi: 'Panduan untuk orang tua dalam mengenali dan memahami emosi anak sejak dini.', deskripsi_en: "A guide for parents to recognize and understand children's emotions early on.", tipe: 'pdf', url_atau_file: '/sample.pdf', is_active: true },
      { judul: 'Cara Mengatasi Hiperaktivitas', judul_en: 'Managing Hyperactivity', deskripsi: 'Strategi dan tips untuk mengelola anak dengan gejala hiperaktivitas.', deskripsi_en: 'Strategies and tips for managing children with hyperactivity symptoms.', tipe: 'youtube', url_atau_file: 'https://youtube.com/watch?v=dQw4w9WgXcQ', is_active: true },
      { judul: 'Komunikasi Efektif dengan Remaja', judul_en: 'Effective Communication with Teens', deskripsi: 'Teknik komunikasi yang efektif untuk membangun hubungan positif dengan remaja.', deskripsi_en: 'Effective communication techniques to build positive relationships with teenagers.', tipe: 'pdf', url_atau_file: '/sample2.pdf', is_active: true },
    ],
  })

  await prisma.psikolog.createMany({
    data: [
      { nama: 'Dr. Maya Sari, M.Psi', spesialisasi: 'Psikologi Anak', spesialisasi_en: 'Child Psychology', nomor_whatsapp: '628123456789', pesan_default: 'Halo Dok, saya ingin konsultasi terkait tumbuh kembang anak saya.', pesan_default_en: "Hello Doctor, I would like to consult about my child's development.", is_active: true },
      { nama: 'Dr. Andi Rahman, M.Psi, Psikolog', spesialisasi: 'Psikologi Remaja', spesialisasi_en: 'Adolescent Psychology', nomor_whatsapp: '628987654321', pesan_default: 'Halo Dok, saya ingin berkonsultasi mengenai perkembangan remaja saya.', pesan_default_en: "Hello Doctor, I would like to consult about my teenager's development.", is_active: true },
    ],
  })

  console.log('Seed completed: 3 users, 5 scales, 6 thresholds, 25 questions, 3 anak, 3 edukasi, 2 psikolog')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
