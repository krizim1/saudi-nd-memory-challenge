/**
 * Arabic copy. This is the reference locale — every other locale must
 * satisfy the same shape (see `Dictionary` in `./index.ts`).
 *
 * Values may be functions when a string interpolates runtime data; that
 * keeps word order a translation concern rather than a JSX concern.
 */

export const ar = {
  common: {
    start: 'ابدأ',
    startChallenge: 'ابدأ التحدي',
    ready: 'استعد',
    continue: 'متابعة',
    back: 'رجوع',
    newChallenge: 'تحدي جديد',
    close: 'إغلاق',
    seconds: 'ثانية',
    points: 'نقطة',
    vs: 'VS',
  },

  attract: {
    tapToStart: 'المس الشاشة للبدء',
    viewLeaderboard: 'لوحة المتصدرين',
  },

  mode: {
    title: 'اختر طريقة اللعب',
    solo: 'لاعب واحد',
    soloHint: 'العب وحدك وسجّل أفضل نتيجة',
    duel: 'تحدي شخصين',
    duelHint: 'تنافسا وجهاً لوجه',
  },

  registration: {
    title: 'تسجيل المتسابقين',
    titleSolo: 'تسجيل المتسابق',
    playerName: 'اسم المتسابق',
    playerOne: 'المتسابق الأول',
    playerTwo: 'المتسابق الثاني',
    namePlaceholder: 'اكتب الاسم',
    errorEmpty: 'الرجاء إدخال الاسم',
    errorTooShort: (min: number) => `الاسم يجب أن يكون ${min} أحرف على الأقل`,
    errorSameName: 'الرجاء اختيار اسمين مختلفين',
  },

  intro: {
    title: 'تحدي الذاكرة',
    rulesHeading: 'طريقة اللعب',
    rules: [
      'اقلب بطاقتين للبحث عن البطاقات المتطابقة',
      'ثلاثة مستويات لكل متسابق',
      'كل ثانية متبقية تضيف نقاطاً إضافية',
    ],
  },

  ready: {
    yourTurn: 'دورك الآن',
    getReady: 'استعد',
  },

  countdown: {
    go: 'ابدأ',
  },

  level: {
    one: 'المستوى الأول',
    two: 'المستوى الثاني',
    three: 'المستوى الثالث',
    label: (n: number) => `المستوى ${n}`,
    timeLeft: 'الوقت المتبقي',
    score: 'النقاط',
    streak: 'التتابع',
    pairs: 'الأزواج',
    timeUp: 'انتهى الوقت',
  },

  levelComplete: {
    wellDone: 'أحسنت!',
    completed: 'تم إنهاء المستوى',
    getReadyNext: 'استعد للمستوى التالي',
    matchScore: 'المطابقات',
    streakBonus: 'مكافأة التتابع',
    accuracyBonus: 'مكافأة الدقة',
    speedBonus: 'مكافأة السرعة',
    timeBonus: 'مكافأة الوقت',
    clearBonus: 'إنهاء المستوى',
    subtotal: 'المجموع',
    multiplier: (m: number) => `مضاعف المستوى ×${m}`,
    levelTotal: 'مجموع المستوى',
  },

  playerComplete: {
    recorded: 'تم تسجيل نتيجتك',
    thanks: 'شكراً لمشاركتك',
    soloDone: 'انتهى التحدي',
  },

  playerSwitch: {
    nextPlayer: 'استعد للمتسابق التالي',
    turnOf: (name: string) => `الآن دور ${name}`,
  },

  results: {
    title: 'النتيجة النهائية',
    yourScore: 'نتيجتك',
    matches: 'المطابقات',
    totalTime: 'الوقت المستغرق',
    scoreDifference: 'فارق النقاط',
    bestStreak: 'أفضل تتابع',
    fastestTime: 'أسرع وقت',
    totalAttempts: 'عدد المحاولات',
    draw: 'تعادل',
  },

  winner: {
    title: 'فائز!',
    congratulations: (name: string) => `مبروك ${name}`,
  },

  leaderboard: {
    title: 'أفضل المتسابقين',
    subtitle: 'لوحة الشرف',
    rank: 'الترتيب',
    name: 'الاسم',
    score: 'النقاط',
    time: 'الوقت',
    empty: 'لا توجد نتائج بعد',
    emptyHint: 'كن أول من يسجّل اسمه في لوحة الشرف',
    champion: 'البطل',
    latest: 'جولتك',
    participants: (n: number) => `${n} مشارك`,
    allPlayers: 'جميع اللاعبين',
    accuracy: 'الدقة',
    back: 'رجوع',
  },

  admin: {
    title: 'لوحة المشغل',
    session: 'الجولة',
    resetGame: 'إعادة ضبط الجولة',
    resetLeaderboard: 'مسح لوحة المتصدرين',
    audio: 'الصوت',
    sound: 'تشغيل الصوت',
    volume: 'مستوى الصوت',
    on: 'تشغيل',
    off: 'إيقاف',
    timers: 'مؤقتات المستويات',
    kiosk: 'وضع الكشك',
    autoReset: 'العودة التلقائية بعد',
    showLeaderboard: 'إظهار لوحة المتصدرين',
    branding: 'العلامة',
    gameTitle: 'اسم اللعبة',
    eventTitle: 'اسم الفعالية',
    testing: 'تجربة',
    testLevel: (n: number) => `تجربة المستوى ${n}`,
    restoreDefaults: 'استعادة الإعدادات الافتراضية',
    confirmClear: 'اضغط مرة أخرى للتأكيد',
  },
} as const
