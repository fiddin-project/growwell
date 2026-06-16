const { determineKategori } = require('../../services/scoring')

describe('determineKategori', () => {
  const ambang = { batas_normal_max: 5, batas_borderline_max: 8 }

  describe('non-reversed (higher score = worse)', () => {
    it('returns Normal when score <= batas_normal_max', () => {
      expect(determineKategori(0, ambang, false)).toBe('Normal')
      expect(determineKategori(3, ambang, false)).toBe('Normal')
      expect(determineKategori(5, ambang, false)).toBe('Normal')
    })

    it('returns Borderline when score is between normal_max and borderline_max', () => {
      expect(determineKategori(6, ambang, false)).toBe('Borderline')
      expect(determineKategori(7, ambang, false)).toBe('Borderline')
      expect(determineKategori(8, ambang, false)).toBe('Borderline')
    })

    it('returns Abnormal when score > batas_borderline_max', () => {
      expect(determineKategori(9, ambang, false)).toBe('Abnormal')
      expect(determineKategori(15, ambang, false)).toBe('Abnormal')
      expect(determineKategori(40, ambang, false)).toBe('Abnormal')
    })
  })

  describe('reversed (higher score = better, e.g. Prosocial)', () => {
    it('returns Normal when score > batas_borderline_max', () => {
      expect(determineKategori(9, ambang, true)).toBe('Normal')
      expect(determineKategori(15, ambang, true)).toBe('Normal')
    })

    it('returns Borderline when score is between normal_max and borderline_max', () => {
      expect(determineKategori(6, ambang, true)).toBe('Borderline')
      expect(determineKategori(7, ambang, true)).toBe('Borderline')
      expect(determineKategori(8, ambang, true)).toBe('Borderline')
    })

    it('returns Abnormal when score <= batas_normal_max', () => {
      expect(determineKategori(0, ambang, true)).toBe('Abnormal')
      expect(determineKategori(3, ambang, true)).toBe('Abnormal')
      expect(determineKategori(5, ambang, true)).toBe('Abnormal')
    })
  })

  describe('edge cases', () => {
    it('handles score of 0', () => {
      expect(determineKategori(0, ambang, false)).toBe('Normal')
      expect(determineKategori(0, ambang, true)).toBe('Abnormal')
    })

    it('handles exact boundary values', () => {
      expect(determineKategori(5, ambang, false)).toBe('Normal')
      expect(determineKategori(8, ambang, false)).toBe('Borderline')
      expect(determineKategori(9, ambang, false)).toBe('Abnormal')
    })

    it('handles reversed exact boundary values', () => {
      expect(determineKategori(5, ambang, true)).toBe('Abnormal')
      expect(determineKategori(8, ambang, true)).toBe('Borderline')
      expect(determineKategori(9, ambang, true)).toBe('Normal')
    })
  })

  describe('real-world SDQ thresholds', () => {
    const totalAmbang = { batas_normal_max: 13, batas_borderline_max: 16 }
    const proAmbang = { batas_normal_max: 4, batas_borderline_max: 5 }

    it('Total Difficulties: score 0 = Normal', () => {
      expect(determineKategori(0, totalAmbang, false)).toBe('Normal')
    })

    it('Total Difficulties: score 14 = Borderline', () => {
      expect(determineKategori(14, totalAmbang, false)).toBe('Borderline')
    })

    it('Total Difficulties: score 20 = Abnormal', () => {
      expect(determineKategori(20, totalAmbang, false)).toBe('Abnormal')
    })

    it('Prosocial (reversed): score 8 = Normal', () => {
      expect(determineKategori(8, proAmbang, true)).toBe('Normal')
    })

    it('Prosocial (reversed): score 3 = Abnormal', () => {
      expect(determineKategori(3, proAmbang, true)).toBe('Abnormal')
    })
  })
})
