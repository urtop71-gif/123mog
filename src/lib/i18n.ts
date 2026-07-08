export const translations = {
  ko: {
    app: { name: '123MOG', tagline: '한식, 일식, 양식, 동남아 음식의 영양소를 간편하게 기록하고 목표 체중까지 체계적으로 관리하세요' },
    nav: { dashboard: '대시보드', meals: '식사 기록', profile: '프로필' },
    home: { login: '로그인', register: '회원가입', feature1: '음식 검색', feature1desc: '한중일양 음식 DB에서 검색', feature2: '영양 분석', feature2desc: '칼로리·탄단지 자동 계산', feature3: '목표 관리', feature3desc: 'BMR·TDEE 기반 맞춤 목표' },
    login: { title: '123MOG', desc: '로그인하고 식단을 관리하세요', email: '이메일', password: '비밀번호', submit: '로그인', loading: '로그인 중...', noAccount: '계정이 없으신가요?', signUp: '회원가입', error: '이메일 또는 비밀번호가 올바르지 않습니다' },
    register: { title: '회원가입', desc: '123MOG와 함께 건강한 식단을 시작하세요', name: '이름', email: '이메일', password: '비밀번호 (6자 이상)', submit: '회원가입', loading: '가입 중...', hasAccount: '이미 계정이 있으신가요?', login: '로그인', error: '회원가입에 실패했습니다' },
    meals: { title: '식사 기록', mealType: '식사 종류', search: '음식 검색', searchPlaceholder: '음식 이름 검색...', all: '전체', korean: '한식', japanese: '일식', western: '양식', seasian: '동남아', cart: '선택한 음식', add: '추가', remove: '삭제', submit: '식사 기록하기', edit: '식사 수정하기', saving: '저장 중...', recorded: '식사가 기록되었습니다! 🎉', updated: '식사가 수정되었습니다! ✏️', today: '오늘의 식사 기록', empty: '아직 기록이 없습니다', editBtn: '수정', deleteBtn: '삭제', confirmDelete: '정말 삭제할까요?', breakfast: '아침 🌅', lunch: '점심 ☀️', dinner: '저녁 🌙', snack: '간식 🍪' },
    dashboard: { title: '대시보드', today: '오늘', mealList: '식사 내역', empty: '아직 기록된 식사가 없습니다', emptyHint: '오늘의 식사를 기록해보세요!', macroRatio: '영양소 비율 (g)', mealCalories: '식사별 칼로리', noData: '데이터가 없습니다', calories: '칼로리', protein: '단백질', fat: '지방', carbs: '탄수화물', over: '초과', targetExceeded: '목표 초과' },
    profile: { title: '내 프로필', age: '나이', gender: '성별', male: '남성', female: '여성', height: '키 (cm)', weight: '몸무게 (kg)', goalWeight: '목표 몸무게 (kg)', activity: '활동량', healthTitle: '건강 상태', diabetes: '🩸 당뇨', diabetesDesc: '탄수화물 200g 이하, 단백질 조정', cholesterol: '❤️ 고지혈증/고콜레스테롤', cholesterolDesc: '지방 20% 이하로 제한', hypertension: '💙 고혈압', hypertensionDesc: '저염 식단 권장', bmr: 'BMR', tdee: 'TDEE', dailyTarget: '일일 목표', proteinTarget: '단백질', fatTarget: '지방', carbsTarget: '탄수화물', save: '프로필 저장', saving: '저장 중...', saved: '저장되었습니다! ✅' },
    health: { ldl_good: '💚LDL', ldl_bad: '❤️LDL', ldl_neutral: '💛LDL', sugar_good: '💚혈당', sugar_bad: '❤️혈당', sugar_neutral: '💛혈당' },
  },
  en: {
    app: { name: '123MOG', tagline: 'Easily track nutrition from Korean, Japanese, Western & SE Asian cuisine. Reach your weight goals systematically.' },
    nav: { dashboard: 'Dashboard', meals: 'Meals', profile: 'Profile' },
    home: { login: 'Login', register: 'Sign Up', feature1: 'Food Search', feature1desc: 'Search Korean, Japanese, Western & SE Asian foods', feature2: 'Nutrition Analysis', feature2desc: 'Auto-calculate calories, macros', feature3: 'Goal Tracking', feature3desc: 'Personalized BMR/TDEE targets' },
    login: { title: '123MOG', desc: 'Log in to manage your diet', email: 'Email', password: 'Password', submit: 'Login', loading: 'Logging in...', noAccount: 'No account?', signUp: 'Sign Up', error: 'Invalid email or password' },
    register: { title: 'Sign Up', desc: 'Start your healthy journey with 123MOG', name: 'Name', email: 'Email', password: 'Password (6+ chars)', submit: 'Sign Up', loading: 'Creating...', hasAccount: 'Already have an account?', login: 'Login', error: 'Registration failed' },
    meals: { title: 'Meal Log', mealType: 'Meal Type', search: 'Search Foods', searchPlaceholder: 'Search food...', all: 'All', korean: 'Korean', japanese: 'Japanese', western: 'Western', seasian: 'SE Asian', cart: 'Selected Items', add: 'Add', remove: 'Delete', submit: 'Log Meal', edit: 'Update Meal', saving: 'Saving...', recorded: 'Meal logged! 🎉', updated: 'Meal updated! ✏️', today: "Today's Meals", empty: 'No meals logged yet', editBtn: 'Edit', deleteBtn: 'Delete', confirmDelete: 'Really delete?', breakfast: 'Breakfast 🌅', lunch: 'Lunch ☀️', dinner: 'Dinner 🌙', snack: 'Snack 🍪' },
    dashboard: { title: 'Dashboard', today: 'Today', mealList: 'Meals', empty: 'No meals recorded', emptyHint: 'Start logging your meals!', macroRatio: 'Macro Ratio (g)', mealCalories: 'Calories by Meal', noData: 'No data', calories: 'Calories', protein: 'Protein', fat: 'Fat', carbs: 'Carbs', over: 'Over', targetExceeded: 'Over target' },
    profile: { title: 'My Profile', age: 'Age', gender: 'Gender', male: 'Male', female: 'Female', height: 'Height (cm)', weight: 'Weight (kg)', goalWeight: 'Goal Weight (kg)', activity: 'Activity Level', healthTitle: 'Health Conditions', diabetes: '🩸 Diabetes', diabetesDesc: 'Carbs ≤ 200g, adjusted protein', cholesterol: '❤️ High Cholesterol', cholesterolDesc: 'Fat ≤ 20% of calories', hypertension: '💙 Hypertension', hypertensionDesc: 'Low sodium recommended', bmr: 'BMR', tdee: 'TDEE', dailyTarget: 'Daily Target', proteinTarget: 'Protein', fatTarget: 'Fat', carbsTarget: 'Carbs', save: 'Save Profile', saving: 'Saving...', saved: 'Saved! ✅' },
    health: { ldl_good: '💚LDL', ldl_bad: '❤️LDL', ldl_neutral: '💛LDL', sugar_good: '💚Sugar', sugar_bad: '❤️Sugar', sugar_neutral: '💛Sugar' },
  },
};

export type Lang = 'ko' | 'en';
export type TranslationKey = typeof translations.ko;
