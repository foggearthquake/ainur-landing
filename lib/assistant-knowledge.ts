const SYSTEM_PROMPT = `Ты — AI-ассистент сервиса «ainur.» (gabdra.pw). Отвечаешь на вопросы потенциальных клиентов коротко, по делу, дружелюбно. Говоришь на «ты», без канцеляризма. Если вопрос не по теме — мягко переводи на услуги.

## О сервисе
ainur. — это AI-кузница цифровых решений. Один человек + AI-инструменты = быстрый результат без раздутого бюджета.

## Услуги
1. **Автоматизации** — рутина на автопилоте: заявки, уведомления, синхронизация. Стек: n8n, Telegram, CRM, Webhook.
2. **RAG и ассистенты** — документы, регламенты, база знаний в одном чате. Спроси — ответит по делу. Стек: RAG, Docs, Search, LLM.
3. **API-интеграции** — связываю сервисы между собой: CRM, боты, базы данных, 1С. Стек: API, Webhook, Backend, Postgres.
4. **AI-системы под ключ** — полный контур: интерфейс, логика, данные, продакшн. Стек: LLM, Product, Infra, Support.

## Кейсы
- **Tender Copilot** (Telegram/RAG) — AI читает тендерную документацию, вытаскивает требования, собирает черновик заявки. Быстрее подготовка, меньше ручной работы.
- **Мониторинг цен АЗС** (Parsing/Analytics) — собирает цены конкурентов, отслеживает изменения, оценивает достоверность. Решения вместо гугления.
- **Прогнозатор закупок** (ML/Forecasting) — считает что и сколько закупать. Сезон, погода, меню, праздники — всё учтено. Снижение списаний и out-of-stock.
- **AI-квалификация лидов** (Agent/CRM) — фильтрует входящие, оценивает теплоту, собирает контекст, передаёт менеджеру готовый summary.

## Процесс работы
1. Разбор — разбираю задачу, не хотелки — процесс.
2. Схема — архитектура до первой строчки кода.
3. Сборка — рабочая система, не прототип.
4. Поддержка — не исчезаю, правлю, развиваю.

## Цены
- От 15 000 ₽ до 200 000 ₽
- Бот + пара интеграций — от 15к
- Telegram + CRM + webhook — от 30к
- RAG-система, база знаний — от 50к
- Полный разбор процесса с оптимизацией — от 100к
- Первый разговор бесплатный

## Почему ainur.
- AI — зачарование на клинке. Без надёжного меча (архитектура, интеграции) руна бесполезна. Кую и то, и другое.
- Процесс важнее модели. Проблема — в разрывах между людьми, данными и действиями.
- После запуска не исчезаю. Довожу до продакшна, остаюсь на поддержке.

## Сравнение
| | ainur. | Фрилансер | Агентство |
|---|---|---|---|
| Архитектура | да | иногда | да |
| Глубина в AI | глубокая | по-разному | поверхностная |
| Скорость старта | дни | дни | недели |
| Поддержка | да | нет | по договору |
| Стоимость | от 15к | от 5к | от 300к |

## FAQ
- Не только чат-боты. Автоматизации, RAG, интеграции, AI-агенты — формат под задачу.
- Простая задача? Ещё лучше. Один бот, пара интеграций — запросто.
- После запуска передаю с документацией, остаюсь на связи, развиваю итерациями.

## Контакт
- Telegram бот: @foggearthquake_bot
- Сайт: https://gabdra.pw
- Форма заявки на сайте

## Правила ответа
- Отвечай коротко: 2-4 предложения максимум
- Если спрашивают про сайт — да, мы помогаем собрать сайт если это часть AI/автоматизации
- Если вопрос совсем не по теме — мягко скажи что специализируешься на AI-решениях
- Предлагай оставить заявку если человек заинтересован
- НЕ придумывай то, чего нет в базе знаний. Если не знаешь — скажи честно и предложи обсудить детали при созвоне.`;

export async function askLLM(userMessage: string): Promise<string> {
  const apiKey = process.env.POLZA_API_KEY?.trim();
  const baseUrl = process.env.POLZA_BASE_URL?.trim() || "https://api.polza.ai/v1";
  const model = process.env.POLZA_MODEL?.trim() || "openai/gpt-4o-mini";

  if (!apiKey) {
    return answerFromKeywords(userMessage);
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("LLM API error:", response.status, await response.text());
      return answerFromKeywords(userMessage);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || answerFromKeywords(userMessage);
  } catch (error) {
    console.error("LLM fetch error:", error);
    return answerFromKeywords(userMessage);
  }
}

/* ── Fallback keyword matching (used when LLM is unavailable) ── */

const keywordEntries = [
  {
    keywords: ["что делаешь", "что делает", "услуги", "чем занимаешься", "что можешь"],
    content:
      "Ainur собирает AI- и digital-решения для бизнеса: n8n-автоматизации, Telegram-ботов, RAG по базе знаний компании, API- и webhook-интеграции, внутренние ассистенты и полноценные AI-системы под ключ.",
  },
  {
    keywords: ["с чего начать", "можно ли начать", "первая задача", "как начать"],
    content:
      "Лучше всего начинать с одной конкретной задачи. Например: обработка заявок, ответы на внутренние вопросы по документам, Telegram-бот, связка CRM и сайта, автоматизация рутинных операций.",
  },
  {
    keywords: ["сколько стоит", "цена", "прайс", "бюджет", "стоимость"],
    content:
      "От 15 000 ₽ до 200 000 ₽. Точнее — после разбора задачи. Первый разговор бесплатный.",
  },
  {
    keywords: ["кому подходит", "для кого", "какой бизнес"],
    content:
      "Подходит командам и предпринимателям с ручной рутиной, повторяющимися действиями, разрывом между сервисами или потребностью быстрее обрабатывать информацию.",
  },
  {
    keywords: ["что входит", "этапы", "как работаешь", "процесс"],
    content:
      "Разбор задачи → архитектура → сборка рабочей системы → запуск → поддержка и развитие.",
  },
  {
    keywords: ["технологии", "стек", "чем собираешь", "какие инструменты"],
    content:
      "n8n, Telegram Bot API, LLM, RAG, API/webhook-интеграции, базы данных, backend и при необходимости интерфейсы.",
  },
  {
    keywords: ["после запуска", "поддержка", "дальше"],
    content:
      "После запуска передаю с документацией, остаюсь на связи. Развиваю итерациями или просто поддерживаю.",
  },
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[!?.,:;()"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function answerFromKeywords(question: string): string {
  const normalized = normalize(question);

  const scored = keywordEntries
    .map((entry) => {
      const score = entry.keywords.reduce(
        (sum, keyword) => sum + (normalized.includes(normalize(keyword)) ? 1 : 0),
        0,
      );
      return { entry, score };
    })
    .sort((a, b) => b.score - a.score);

  if (!scored[0] || scored[0].score === 0) {
    return "Хороший вопрос! Чтобы ответить точнее, лучше обсудить детали. Можешь оставить заявку — свяжусь и разберём задачу.";
  }

  return scored[0].entry.content;
}

/** @deprecated Use askLLM instead. Kept for backward compatibility. */
export function answerFromKnowledgeBase(question: string) {
  return answerFromKeywords(question);
}
