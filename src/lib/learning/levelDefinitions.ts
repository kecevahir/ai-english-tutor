import type { CefrLevel } from "@prisma/client";

export type LevelDefinition = {
  code: string;
  title: string;
  summary: string;
  canDo: string[];
};

/** Placement-facing CEFR descriptions (TR + clear can-do statements). */
export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  {
    code: "A1",
    title: "Beginner",
    summary: "Temel ifadeleri anlar ve kullanır; kendini çok basit yollarla tanıtır.",
    canDo: [
      "Günlük basit kelimeleri ve selamlaşmayı anlar",
      "Kısa, yavaş konuşulan sorulara yanıt verir",
      "Ad, meslek, temel ihtiyaçlar hakkında birkaç cümle kurar",
    ],
  },
  {
    code: "A2",
    title: "Elementary",
    summary: "Alışılmış konularda basit iletişim kurar; kısa metinleri anlar.",
    canDo: [
      "Alışveriş, yol tarifi, rutin işler hakkında konuşur",
      "Kısa e-posta / mesajları anlar",
      "Geçmiş veya gelecek hakkında basit cümleler kurar",
    ],
  },
  {
    code: "B1",
    title: "Intermediate",
    summary: "Tanıdık konularda bağımsız iletişim kurabilir; ana fikri yakalar.",
    canDo: [
      "İş / okul / seyahat konularında konuşmayı sürdürür",
      "Kısa makale veya e-postanın ana noktalarını anlar",
      "Deneyim ve planlarını bağlaçlarla anlatır",
    ],
  },
  {
    code: "B1+",
    title: "Intermediate Plus",
    summary: "B1’in üstü: daha akıcı, daha çeşitli kelime ve yapı kullanır.",
    canDo: [
      "Toplantı veya müşteri görüşmesinde temel noktaları takip eder",
      "Görüşünü gerekçeyle ifade eder",
      "Daha uzun metinlerden detay çıkarır",
    ],
  },
  {
    code: "B2",
    title: "Upper Intermediate",
    summary: "Soyut ve teknik konular dahil akıcı iletişim; nüansı anlar.",
    canDo: [
      "İş toplantılarında aktif rol alır",
      "Rapor / makale okuyup özetler",
      "Avantaj–dezavantaj tartışır, ikna eder",
    ],
  },
  {
    code: "B2+",
    title: "Upper Intermediate Plus",
    summary: "B2’nin üstü: daha doğal hız, daha az hata, daha zengin ifade.",
    canDo: [
      "Karmaşık tartışmalarda sözü takip eder",
      "Detaylı yazılı çıktı üretir",
      "İdiomatik ifadelere yaklaşır",
    ],
  },
  {
    code: "C1",
    title: "Advanced",
    summary: "Esnek ve etkili kullanım; akademik / profesyonel bağlamda rahat.",
    canDo: [
      "Uzun ve zor metinleri kolayca anlar",
      "Kendini akıcı ve doğal ifade eder",
      "Yapılandırılmış, ikna edici yazılar üretir",
    ],
  },
  {
    code: "C2",
    title: "Proficiency",
    summary: "Neredeyse ana dil düzeyinde anlama ve üretim.",
    canDo: [
      "Her türlü konuşma ve metni kolayca anlar",
      "İnce anlam farklarını yakalar",
      "Karmaşık konuları özetler ve yeniden ifade eder",
    ],
  },
];

export function getLevelDefinition(code: string): LevelDefinition | undefined {
  const normalized = code.trim().toUpperCase();
  return LEVEL_DEFINITIONS.find((level) => level.code === normalized);
}

export function cefrEnumToCode(level: CefrLevel): string {
  switch (level) {
    case "B1_PLUS":
      return "B1+";
    case "B2_PLUS":
      return "B2+";
    default:
      return level;
  }
}
