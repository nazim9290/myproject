# Skill: Excel Template Mapper

Excel ফাইল রিভিউ করে AgencyOS-এর জন্য {{placeholder}} টেমপ্লেট বানিয়ে দেয়।

## Usage

```
/excel-map <filepath>
```

উদাহরণ:
```
/excel-map templates/tokyo-school-form.xlsx
/excel-map /home/user/myproject/templates/入学願書.xlsx
```

## Steps

1. Read the Excel file using the Read tool (it supports .xlsx)
2. Analyze every sheet, header, label, and cell
3. Map each field to the correct AgencyOS system placeholder
4. Output the mapping table + template instructions

## System Fields Reference (111 placeholders)

### ব্যক্তিগত (Personal) — 19 fields
| Key | Data | Split Variants |
|-----|------|----------------|
| `name_en` | ইংরেজি নাম (পুরো) | `:first`, `:last` |
| `name_bn` | বাংলা নাম | — |
| `name_katakana` | কাতাকানা নাম | `:first`, `:last` |
| `dob` | জন্ম তারিখ | `:year`, `:month`, `:day` |
| `age` | বয়স | — |
| `gender` | লিঙ্গ | — |
| `marital_status` | বৈবাহিক অবস্থা | — |
| `nationality` | জাতীয়তা | — |
| `blood_group` | রক্তের গ্রুপ | — |
| `phone` | ফোন | — |
| `whatsapp` | হোয়াটসঅ্যাপ | — |
| `email` | ইমেইল | — |

### পাসপোর্ট / NID — 10 fields
| Key | Data | Split Variants |
|-----|------|----------------|
| `nid` | NID নম্বর | — |
| `passport_number` | পাসপোর্ট নম্বর | — |
| `passport_issue` | পাসপোর্ট ইস্যু তারিখ | `:year`, `:month`, `:day` |
| `passport_expiry` | পাসপোর্ট মেয়াদ শেষ | `:year`, `:month`, `:day` |

### ঠিকানা — 2 fields
| Key | Data |
|-----|------|
| `permanent_address` | স্থায়ী ঠিকানা |
| `current_address` | বর্তমান ঠিকানা |

### পরিবার — 14 fields
| Key | Data | Split Variants |
|-----|------|----------------|
| `father_name` | পিতার নাম (বাংলা) | — |
| `father_name_en` | পিতার নাম (ইংরেজি) | — |
| `mother_name` | মাতার নাম (বাংলা) | — |
| `mother_name_en` | মাতার নাম (ইংরেজি) | — |
| `father_dob` | পিতার জন্ম তারিখ | `:year`, `:month`, `:day` |
| `father_occupation` | পিতার পেশা | — |
| `mother_dob` | মাতার জন্ম তারিখ | `:year`, `:month`, `:day` |
| `mother_occupation` | মাতার পেশা | — |

### শিক্ষা — 14 fields
| Key | Data |
|-----|------|
| `edu_ssc_school` | SSC স্কুলের নাম |
| `edu_ssc_year` | SSC পাসের সাল |
| `edu_ssc_board` | SSC বোর্ড |
| `edu_ssc_gpa` | SSC GPA |
| `edu_ssc_subject` | SSC গ্রুপ |
| `edu_hsc_school` | HSC কলেজের নাম |
| `edu_hsc_year` | HSC পাসের সাল |
| `edu_hsc_board` | HSC বোর্ড |
| `edu_hsc_gpa` | HSC GPA |
| `edu_hsc_subject` | HSC গ্রুপ |
| `edu_honours_school` | অনার্স বিশ্ববিদ্যালয় |
| `edu_honours_year` | অনার্স সাল |
| `edu_honours_gpa` | অনার্স GPA |
| `edu_honours_subject` | অনার্স বিষয় |

### জাপানি ভাষা — 5 fields
| Key | Data |
|-----|------|
| `jp_exam_type` | পরীক্ষার ধরন (JLPT/NAT/JFT) |
| `jp_level` | লেভেল (N5/N4/N3) |
| `jp_score` | স্কোর |
| `jp_result` | ফলাফল |
| `jp_exam_date` | পরীক্ষার তারিখ |

### স্পন্সর (経費支弁者) — 12 fields
| Key | Data |
|-----|------|
| `sponsor_name` | স্পন্সরের নাম (বাংলা) |
| `sponsor_name_en` | স্পন্সরের নাম (ইংরেজি) |
| `sponsor_relationship` | সম্পর্ক |
| `sponsor_phone` | স্পন্সরের ফোন |
| `sponsor_address` | স্পন্সরের ঠিকানা |
| `sponsor_company` | স্পন্সরের কোম্পানি |
| `sponsor_income_y1` | আয় (১ম বছর) |
| `sponsor_income_y2` | আয় (২য় বছর) |
| `sponsor_income_y3` | আয় (৩য় বছর) |
| `sponsor_tax_y1` | ট্যাক্স (১ম বছর) |
| `sponsor_tax_y2` | ট্যাক্স (২য় বছর) |
| `sponsor_tax_y3` | ট্যাক্স (৩য় বছর) |

### গন্তব্য — 4 fields
| Key | Data |
|-----|------|
| `country` | গন্তব্য দেশ |
| `intake` | ইনটেক |
| `visa_type` | ভিসার ধরন |
| `student_type` | স্টুডেন্ট টাইপ |

## Japanese Label → Placeholder Mapping

| Japanese | Placeholder |
|----------|-------------|
| 氏名 / 名前 | `name_en` or `name_katakana` |
| 姓 (Surname) | `name_en:last` or `name_katakana:last` |
| 名 (Given) | `name_en:first` or `name_katakana:first` |
| フリガナ | `name_katakana` |
| 生年月日 | `dob` (or `dob:year`/`dob:month`/`dob:day`) |
| 年 | `:year` suffix |
| 月 | `:month` suffix |
| 日 | `:day` suffix |
| 性別 | `gender` |
| 国籍 | `nationality` |
| 婚姻状況 | `marital_status` |
| パスポート番号 / 旅券番号 | `passport_number` |
| 有効期限 | `passport_expiry` |
| 発行日 | `passport_issue` |
| 現住所 | `current_address` |
| 本籍地 | `permanent_address` |
| 電話番号 | `phone` |
| メール / Eメール | `email` |
| 父の氏名 / 父親 | `father_name_en` |
| 母の氏名 / 母親 | `mother_name_en` |
| 父の職業 | `father_occupation` |
| 母の職業 | `mother_occupation` |
| 父の生年月日 | `father_dob` |
| 母の生年月日 | `mother_dob` |
| 最終学歴 | `edu_hsc_school` or `edu_honours_school` |
| 卒業年月 | `edu_hsc_year` or `edu_honours_year` |
| 日本語能力 / 日本語レベル | `jp_level` |
| 日本語試験 | `jp_exam_type` |
| 合格 / 不合格 | `jp_result` |
| 点数 / スコア | `jp_score` |
| 経費支弁者 / 経費支弁者氏名 | `sponsor_name_en` |
| 経費支弁者との関係 | `sponsor_relationship` |
| 経費支弁者の職業 | `sponsor_company` |
| 経費支弁者の住所 | `sponsor_address` |
| 年収 / 収入 | `sponsor_income_y1` |
| 納税額 | `sponsor_tax_y1` |
| 預貯金額 | manual (not in system) |

## English Label → Placeholder Mapping

| English | Placeholder |
|---------|-------------|
| Full Name / Name | `name_en` |
| First Name / Given Name | `name_en:first` |
| Last Name / Surname / Family Name | `name_en:last` |
| Date of Birth / DOB | `dob` |
| Passport No. | `passport_number` |
| Date of Issue | `passport_issue` |
| Date of Expiry / Valid Until | `passport_expiry` |
| Father's Name | `father_name_en` |
| Mother's Name | `mother_name_en` |
| Permanent Address | `permanent_address` |
| Present / Current Address | `current_address` |
| Phone / Mobile / Contact No. | `phone` |
| Email / E-mail | `email` |
| NID / National ID | `nid` |
| Blood Group | `blood_group` |
| Sponsor / Guarantor | `sponsor_name_en` |

## Decision Rules

### Date: Split or Full?
- Separate cells for Year/Month/Day or 年/月/日 → use `dob:year`, `dob:month`, `dob:day`
- One single cell → use `dob`
- Same rule for `passport_issue`, `passport_expiry`, `father_dob`, `mother_dob`

### Name: Split or Full?
- Separate cells for First/Last or 姓/名 → use `:first`, `:last`
- One single cell → use base field (`name_en`, `name_katakana`)

### Katakana vs English?
- フリガナ row → `name_katakana`
- ローマ字 / Alphabet / English row → `name_en`
- Both present → map both separately

### Education: Which Level?
- Look at form context. Japanese school forms usually want highest education
- If "高校" or "High School" → `edu_hsc_*`
- If "大学" or "University" → `edu_honours_*`
- If "中学校" or below → `edu_ssc_*`

### Sponsor Income: Which Year?
- If form has columns for 3 years → `sponsor_income_y1`, `y2`, `y3`
- If only one year → use `sponsor_income_y1`
- Same for `sponsor_tax_y1/y2/y3`

## Output Format

### 1. Summary
```
📋 ফাইল: [filename]
📊 শীট: [count]টি
📝 মোট ফিল্ড: [count]টি
✅ ম্যাপ করা: [count]টি
⚠️ ম্যানুয়াল: [count]টি
```

### 2. Mapping Table (per sheet)
```
### শীট: [Sheet Name]

| সেল | ফর্মের লেবেল | প্লেসহোল্ডার | নোট |
|-----|-------------|--------------|------|
| B3  | 氏名        | {{name_en}}  | Full English name |
| B4  | 生年月日     | {{dob:year}}年{{dob:month}}月{{dob:day}}日 | Split date |
| B5  | 性別        | {{gender}}   | Male/Female |
| ...  | ...         | ...          | ... |
```

### 3. Unmapped Fields
```
⚠️ সিস্টেমে নেই — ম্যানুয়ালি পূরণ করতে হবে:
- C15: 入学希望時期 (Desired enrollment) → ম্যানুয়াল
- D20: 来日予定日 (Expected arrival) → ম্যানুয়াল
```

### 4. Template Instructions
```
📌 টেমপ্লেট বানানোর ধাপ:
1. মূল Excel ফাইলের কপি করুন
2. নিচের সেলগুলোতে placeholder বসান:
   - B3 → {{name_en}}
   - B4 → {{dob:year}}年{{dob:month}}月{{dob:day}}日
   - ...
3. AgencyOS → এক্সেল অটোফিল → টেমপ্লেট আপলোড
4. স্টুডেন্ট সিলেক্ট → ডাউনলোড → সব অটো পূরণ!
```

## Rules

1. **NEVER guess** — ফিল্ড নিশ্চিত না হলে "ম্যানুয়াল" হিসেবে রিপোর্ট করুন
2. **সব শীট দেখুন** — অনেক ফর্মে একাধিক শীট থাকে
3. **ফরম্যাটিং নোট করুন** — তারিখের ফরম্যাট, uppercase/lowercase, ইত্যাদি
4. **মার্জ সেল চেক করুন** — Excel ফর্মে প্রায়ই সেল মার্জ থাকে
5. **হেডার vs ডাটা** — হেডার/লেবেল সেল চিনুন, ডাটা সেলে placeholder বসান
6. **একই ফিল্ড একাধিকবার** — কিছু ফর্মে একই তথ্য একাধিক জায়গায় লাগে, সব ম্যাপ করুন
