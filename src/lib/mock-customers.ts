export type Treatment = {
  date: string;
  menu: string;
  staff: string;
  price: number;
  note?: string;
};

export type Customer = {
  id: string;
  ownerName: string;
  phone: string;
  lineRegistered: boolean;
  petName: string;
  breed: string;
  sex: "♀" | "♂";
  age: number;
  weight: number;
  birthday: string;
  emoji: string;
  flags: string[];
  lastVisitDaysAgo: number;
  visitCount: number;
  regularPrice: number;
  nextVisitSuggestion: string;
  treatments: Treatment[];
};

export const customers: Customer[] = [
  {
    id: "1",
    ownerName: "田中様", phone: "090-1234-5678", lineRegistered: true,
    petName: "モカ", breed: "トイプードル", sex: "♀", age: 4, weight: 3.2, birthday: "2022-03-15",
    emoji: "🐕", flags: ["爪切り注意"],
    lastVisitDaysAgo: 30, visitCount: 12, regularPrice: 8800, nextVisitSuggestion: "6月1日頃",
    treatments: [
      { date: "2026-04-07", menu: "フルコース + 部分カット", staff: "美咲", price: 8800, note: "爪切り問題なし" },
      { date: "2026-03-05", menu: "フルコース", staff: "美咲", price: 8800 },
      { date: "2026-02-01", menu: "シャンプーのみ", staff: "美咲", price: 4400 },
      { date: "2026-01-06", menu: "フルコース + 部分カット", staff: "美咲", price: 8800 },
      { date: "2025-12-02", menu: "フルコース", staff: "美咲", price: 8800, note: "冬毛で少し時間かかった" },
    ],
  },
  {
    id: "2",
    ownerName: "山田様", phone: "090-2345-6789", lineRegistered: true,
    petName: "こてつ", breed: "シーズー", sex: "♂", age: 7, weight: 6.8, birthday: "2019-07-22",
    emoji: "🐩", flags: ["皮膚弱め", "高齢犬ケア"],
    lastVisitDaysAgo: 35, visitCount: 8, regularPrice: 5500, nextVisitSuggestion: "6月10日頃",
    treatments: [
      { date: "2026-04-02", menu: "シャンプーのみ", staff: "美咲", price: 5500, note: "皮膚の赤みあり、低刺激シャンプー使用" },
      { date: "2026-03-01", menu: "シャンプーのみ", staff: "美咲", price: 5500 },
      { date: "2026-01-20", menu: "フルコース", staff: "美咲", price: 7200, note: "高齢のためゆっくり施術" },
      { date: "2025-12-15", menu: "シャンプーのみ", staff: "美咲", price: 5500 },
    ],
  },
  {
    id: "3",
    ownerName: "佐藤様", phone: "090-3456-7890", lineRegistered: true,
    petName: "ラテ", breed: "ゴールデンレトリバー", sex: "♀", age: 3, weight: 28.5, birthday: "2023-01-10",
    emoji: "🐕‍🦺", flags: ["爪切り苦手", "大型犬"],
    lastVisitDaysAgo: 42, visitCount: 25, regularPrice: 12800, nextVisitSuggestion: "6月15日頃",
    treatments: [
      { date: "2026-03-26", menu: "フルコース + 爪切り", staff: "美咲", price: 12800, note: "爪切りで少し興奮" },
      { date: "2026-02-20", menu: "フルコース + ハーブパック", staff: "美咲", price: 14800 },
      { date: "2026-01-22", menu: "フルコース + 爪切り", staff: "美咲", price: 12800 },
      { date: "2025-12-18", menu: "フルコース", staff: "美咲", price: 12800 },
      { date: "2025-11-20", menu: "フルコース + ハーブパック", staff: "美咲", price: 14800, note: "毛並み絶好調" },
    ],
  },
  {
    id: "4",
    ownerName: "鈴木様", phone: "090-4567-8901", lineRegistered: false,
    petName: "ベル", breed: "ポメラニアン", sex: "♀", age: 2, weight: 2.1, birthday: "2024-02-14",
    emoji: "🐕", flags: ["爪切り注意"],
    lastVisitDaysAgo: 28, visitCount: 6, regularPrice: 7200, nextVisitSuggestion: "6月3日頃",
    treatments: [
      { date: "2026-04-09", menu: "フルコース", staff: "美咲", price: 7200 },
      { date: "2026-03-10", menu: "シャンプーのみ", staff: "美咲", price: 3800 },
      { date: "2026-02-08", menu: "フルコース", staff: "美咲", price: 7200, note: "爪切り途中で中断" },
    ],
  },
  {
    id: "5",
    ownerName: "高橋様", phone: "090-5678-9012", lineRegistered: true,
    petName: "空(そら)", breed: "ミニチュアシュナウザー", sex: "♂", age: 5, weight: 7.2, birthday: "2021-05-20",
    emoji: "🐶", flags: [],
    lastVisitDaysAgo: 12, visitCount: 3, regularPrice: 9500, nextVisitSuggestion: "5月24日頃",
    treatments: [
      { date: "2026-04-26", menu: "フルコース + ハーブパック", staff: "美咲", price: 9500 },
      { date: "2026-03-28", menu: "フルコース", staff: "美咲", price: 8800 },
      { date: "2026-02-25", menu: "フルコース", staff: "美咲", price: 8800, note: "初来店、大人しかった" },
    ],
  },
  {
    id: "6",
    ownerName: "伊藤様", phone: "090-6789-0123", lineRegistered: true,
    petName: "こなつ", breed: "トイプードル", sex: "♀", age: 6, weight: 3.8, birthday: "2020-08-05",
    emoji: "🐩", flags: ["アレルギー(特定シャンプー不可)"],
    lastVisitDaysAgo: 60, visitCount: 18, regularPrice: 8800, nextVisitSuggestion: "至急連絡推奨",
    treatments: [
      { date: "2026-03-08", menu: "フルコース", staff: "美咲", price: 8800, note: "低アレルギーシャンプー使用" },
      { date: "2026-02-05", menu: "フルコース + 部分カット", staff: "美咲", price: 9800 },
      { date: "2026-01-08", menu: "フルコース", staff: "美咲", price: 8800 },
      { date: "2025-12-10", menu: "フルコース + 部分カット", staff: "美咲", price: 9800 },
    ],
  },
  {
    id: "7",
    ownerName: "渡辺様", phone: "090-7890-1234", lineRegistered: false,
    petName: "小麦", breed: "柴犬", sex: "♀", age: 8, weight: 9.1, birthday: "2018-04-03",
    emoji: "🦮", flags: ["高齢犬ケア", "関節注意"],
    lastVisitDaysAgo: 5, visitCount: 4, regularPrice: 6800, nextVisitSuggestion: "6月7日頃",
    treatments: [
      { date: "2026-05-03", menu: "シャンプー + 顔バリ", staff: "美咲", price: 6800 },
      { date: "2026-04-01", menu: "シャンプー + 顔バリ", staff: "美咲", price: 6800, note: "高齢のため短時間で終了" },
      { date: "2026-03-02", menu: "シャンプーのみ", staff: "美咲", price: 3800 },
    ],
  },
  {
    id: "8",
    ownerName: "中村様", phone: "090-8901-2345", lineRegistered: true,
    petName: "さくら", breed: "ヨークシャーテリア", sex: "♀", age: 3, weight: 2.8, birthday: "2023-05-15",
    emoji: "🐕", flags: [],
    lastVisitDaysAgo: 90, visitCount: 22, regularPrice: 7800, nextVisitSuggestion: "至急連絡推奨",
    treatments: [
      { date: "2026-02-06", menu: "フルコース + カット", staff: "美咲", price: 7800, note: "来週誕生日" },
      { date: "2026-01-08", menu: "フルコース + カット", staff: "美咲", price: 7800 },
      { date: "2025-12-09", menu: "フルコース", staff: "美咲", price: 6800 },
      { date: "2025-11-10", menu: "フルコース + カット", staff: "美咲", price: 7800 },
      { date: "2025-10-12", menu: "フルコース", staff: "美咲", price: 6800 },
    ],
  },
];
