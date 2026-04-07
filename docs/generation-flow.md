# AI Generation Flow: Създаване на Дигитална Корица (CoverStar)

В този документ е описан **целият процес** от приемането на заявката до финалното генериране на картинката, както и взаимодействието между отделните AI модели в проекта.

Архитектурата използва **двуфазен подход (Two-phase generation)** с модела `gemini-2.5-flash-lite` за текст (Creative Director) и `gemini-2.0-flash-lite` за мултимодална трансформация (синтез на изображението). Очакваме преминаване към специален image модел вбъдеще според правилата (Gemini 2.5 Flash Image).

---

## 1. Как се приема заявката (Входове към сървъра)

Когато потребителят е готов за генериране, се изпраща заявка до API-то (`/app/api/generate/brief/route.ts` или директно втората фаза към `/image/route.ts`). Заявката съдържа строго валидиран JSON обект, дефиниран в Zod схема:

```typescript
const imageSchema = z.object({
  magazineId: z.string(), // напр. "vogue", "time", "mens-health"
  gender: z.enum(['male', 'female', 'unisex']), // Важно: от тук се знае полът!
  userName: z.string().optional(), // Потребителско име за заглавието
  brief: z.any(), // (Опционален или вече създаден от Phase 1 JSON обект със заглавия)
  imageBase64: z.string() // Самото изображение в base64 формат
});
``` 

### Как системата знае пола?
Полът (`gender`) идва от UI селекцията на потребителя. В бекенда, когато се подава на модела (в `lib/creative-director.ts`), това се транслира в лингвистична инструкция към AI:
`The cover star is a ${gender === "unisex" ? "person" : gender === "male" ? "man" : "woman"}.`

---

## 2. Phase 1: Генериране на Креативен Бриф (Creative Director Phase)

Първата фаза **разбира коя корица как да направи** на базата на т.нар. **Magazine DNA** (ДНК на списанието), пазени в масива `MAGAZINES` в `lib/magazines.ts`.

Всеки обект на списание има специфични правила (`editorialPersona`, `tone`, `clothingGuide`, `poseGuide`, `headlineRules`).

### Какъв формат се подава към първия модел?
Използва се Google Gemini (`gemini-2.5-flash-lite`).
Подава му се **System Prompt (Текст)**, в който са сглобени правилата на конкретното списание, заедно с референтни заглавия (Few-Shot examples).
Много важна стъпка тук е **Structured Output Config**: моделът силово е конфигуриран връща *само и единствено JSON* (`responseMimeType: "application/json"`, и се използва `responseSchema`).

### СТРУКТУРАТА на JSON-а (Изходът от "lite" модела):
Този формат е това, което Lite моделът произвежда като креативен бриф, и което след това се взема предвид нататък:

```json
{
  "headline": "Main cover headline following the rules",
  "sublines": [
    "CATEGORY | The first sub headline",
    "CATEGORY | The second sub headline"
  ],
  "clothing": "Specific clothing description for this cover star",
  "pose": "Specific pose description",
  "expression": "Facial expression description",
  "backgroundMood": "Background or mood description"
}
```

---

## 3. Сглобяване на "Mega-Prompt" за изображението (lib/prompt-builder.ts)

Преди да се викне мултимодалният визуален модел, текстовият бриф (JSON от Phase 1) и твърдите DNI правила на списанието се **комбинират**.

Функцията `buildImagePrompt` взема:
1. `Magazine` обекта (твърди правила, цветови палитри).
2. `CreativeBrief` (JSON-а: облекло, лице, поза, създадени от първия модел).
3. `gender` и `userName`.
4. Рандом модификатори от `lib/generation-pools.ts` (`ANGLE_POOL`, `SEASON_POOL`).

### Как се комбинират?
Чрез дълъг шаблон (template literal), който казва на графичния AI:
1. *Кой си ти* (Създаваш покритие за [Име на списание]).
2. **CRITICAL FACE IDENTITY LOCK**: Най-важният блок. Инструктира модела **ДА НЕ** променя лицето, което е подадено, а само да промени облеклото, фона и осветлението.
3. *Styling & Scene*: Слага дрехите и позата (които взема директно от `brief.clothing` и `brief.pose` от JSON-а).
4. *Layout & Grid Rules*: Къде да се сложи текстът (взема от ДНК-то на списанието).
5. Тук влиза и магията със специални инструкции: Например `CRITICAL RULE FOR TIME` налага червената рамка, или правилото за `VOGUE` гласи `ABSOLUTELY NO TEXT OVER THE FACE`.

---

## 4. Phase 2: Синтез на Изображението (Flash Model Phase)

Това се случва в `app/api/generate/image/route.ts`. Подадените данни се валидират, генерира се финалният `buildImagePrompt` (текст) и се извиква вторият модел (към момента `gemini-2.0-flash-lite`, през `@google/genai` SDK).

### Какъв формат се подава към този модел?
Това е **Мултимодална (Multi-modal) заявка**. Подават се два `parts` в `contents` масива. Единият е текстов (мега-промпта), а другият е медиен (снимката):

Структурата на заявката изглежда ето така:
```javascript
const result = await genAI.models.generateContent({
  model: 'gemini-2.0-flash-lite', // (или съответния Gemini визуално-базиран модел)
  contents: [
    {
      parts: [
        // 1. ОРИГИНАЛНАТА СНИМКА В BASE64:
        { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
        
        // 2. ФИНАЛНИЯТ МЕГА-ПРОМПТ (Включващ ДНК-то + JSON Брифа):
        { text: prompt },
      ],
    },
  ],
});
```

### Какво се връща?
Този модел използва контекста на входящата картинка + детайлните инструкции за типография и дрехи, за да генерира нова картинка.
Резултатът се връщатново във вида на base64 Image JSON payload, откъдето бекендът го стриймва обратно към Front-end клиента като SSE (Server-Sent Event), защото генерирането отнема доста време. Форматът е:

```javascript
// Извличане на генерирания image:
imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
```

---

## Резюме на езика на данните

1. **Client**: Изпраща `base64 image + magazineId + gender`.
2. **Server (Route 1)**: Взема `magazineId`, чете `Magazines.ts` (Text), подготвя Prompt към **Gemini Flash Lite (Текстов)**.
3. **Gemini Phase 1**: Връща `JSON Structured Object` съдържащ `headline`, `pose`, `clothing`.
4. **Server (Route 2)**: Взема оригиналния `base64 image` + сглобен мега-Prompt от резултатите на Phase 1 и ДНК-то на списанието.
5. **Gemini Phase 2 (Визуален/Flash)**: Приема `[ base64 image + text prompt ]`. Разпознава и запазва лицето (Identity Lock), но генерира всичко останало от нулата (Типография, дрехи, фон).
6. **Server -> Client**: Стриймва обратно новата снимка като Data URL.

-----

## План за Оптимизация на JSON Структурата и Промпта (Phase 1)

Към март/април 2026 г., най-добрите практики за *Prompt Engineering* и *Structured Outputs (JSON)* с Gemini 2.5 Flash / Lite обръщат изключително внимание на разделянето на **мисловния процес (Chain of Thought)** от **финалните данни**. 

В момента структурата на JSON-а (`CreativeBrief`) е прекалено плоска (flat). Тя смесва типография, облекло и емоция на едно ниво, което често кара модела да дава генерични (клиширани) отговори, защото не е "обмислил" цялостната композиция предварително.

### 1. Оптимизация на JSON Структурата (`CreativeBrief`)

За да постигнем съвършен, професионален резултат, трябва да рефакторираме интерфейса и `responseSchema`, за да изглеждат така:

```json
{
  "editorialConcept": "Обяснение на арт-директора(изкуствен интелект) защо избира тази комбинация от дрехи и осветление. Това действа като Chain-of-Thought и повишава качеството в пъти.",
  "coverCopy": {
    "mainHeadline": "Основно заглавие",
    "subtitles": [
      {
        "category": "Напр. FASHION",
        "text": "Текстът на подзаглавието"
      }
    ]
  },
  "photographyDirection": {
    "clothing": "Много детайлно описание на модата (напр. Вълнено палто Tom Ford с широки ревери)",
    "accessories": "Акценти (часовник, очила, бижута)",
    "poseAndExpression": "Позата на тялото и микро-изражението на лицето",
    "lightingStyle": "Специфично осветление (напр. Rembrandt lighting, Softbox)",
    "backgroundAndSet": "Фон и сценография (напр. Тъмно сиво студио или Неонова светлина)"
  }
}
```

**Защо тази структура?**
- `editorialConcept` принуждава Lite модела първо да *обмисли* кадъра ("Понеже списанието е Vogue, а темата е пролет, ще заложа на флорални мотиви и драматично минималистично осветление"). Доказано през 2026 г. е, че когато Gemini бъде принуден да генерира `rationale / thought process` променлива преди същинските данни, крайният резултат е с над 40% по-кохерентен.
- Разделянето на `coverCopy` и `photographyDirection` позволява по-лесно мапване (mapping) във Фаза 2, когато ще казваме на Imagen 3 кое е текст и кое е визуален детайл.

### 2. Оптимизация на Промпта (The System Prompt)

Промптът към "Creative Director" (Lite модела) трябва да спре да бъде само инструкция и да се превърне в **ролева игра (Persona Prompting)** със строги негативни ограничения.

**Новият подход за промпта:**
```text
${magazine.editorialPersona}

You are the Executive Art Director producing the next cover of ${magazine.name}.
Your job is to conceptualize a visual and editorial masterpiece that matches the magazine's DNA.

TARGET AUDIENCE: ${magazine.targetAudience}
TONE: ${magazine.tone}
FOCUS: ${magazine.focus}

COVER STAR: A ${gender === "unisex" ? "person" : gender === "male" ? "man" : "woman"}.
${topic ? `THEME/TOPIC: ${topic}` : ""}

STEP 1: EDITORIAL CONCEPT
First, document your 'editorialConcept'. Why are you choosing this specific fashion, lighting, and copy? How do they work together to create a stunning cover? Be a visionary.

STEP 2: TYPOGRAPHY & COPY (coverCopy)
- 1 Main Headline (STRICT RULE: ${magazine.headlineRules})
- ${magazine.sublineCount.min} to ${magazine.sublineCount.max} subtitles. Allowed categories: ${magazine.sublineCategories.join(", ")}

STEP 3: PHOTOGRAPHY & STYLE (photographyDirection)
- Clothing: Must match ${magazine.clothingGuide}. Be specific about fabrics and fit.
- Pose & Expression: ${magazine.poseGuide}. Describe the body language.
- Lighting & Background: Match ${magazine.lightingDna}.

CRITICAL RULES:
1. AVOID CLICHES. Do not use generic terms like "nice dress" or "cool pose". Use professional fashion and photography terminology.
2. The clothing MUST harmonize with the lighting and background.
```

### 3. Следващи стъпки (Реализация)
Ако желаеш да задействаме този план:
1. Ще променя `CreativeBrief` интерфейса в `lib/creative-director.ts`.
2. Ще обновя схемата `responseSchema`, за да изисква стриктно вложените (nested) обекти (което е напълно поддържано от Google GenAI SDK v1.x).
3. Ще актуализирам шаблона (Mega-Prompt) в `lib/prompt-builder.ts`, за да разопакова новата структура: `brief.photographyDirection.clothing` вместо `brief.clothing`.
