import LeadForm from "@/app/LeadForm";

import TerminalMock from "./TerminalMock";
import styles from "./friendly-cyberpunk-v1.module.css";

/* ── Data ── */

const tickerItems = [
  "AI-системы под ключ",
  "n8n-автоматизации",
  "RAG и базы знаний",
  "API-интеграции",
  "Telegram-боты",
  "цифровые решения",
  "поддержка после запуска",
];

const heroStats = [
  { value: "n8n", label: "автоматизации" },
  { value: "RAG", label: "базы знаний" },
  { value: "API", label: "интеграции" },
  { value: "AI", label: "решения" },
  { value: "∞", label: "поддержка" },
];

const serviceCards = [
  {
    number: "01 /",
    title: "n8n-автоматизации",
    description:
      "Рутина? Какая рутина? Бот заберёт заявки, уведомления и синхронизацию. Ты даже не заметишь.",
    tags: ["n8n", "Telegram", "CRM", "Webhook"],
    pixels: [1, 4, 6, 9, 12, 13],
  },
  {
    number: "02 /",
    title: "RAG и ассистенты",
    description:
      "Документы, регламенты, база знаний — всё в одном чате. Спроси, и он ответит. По делу.",
    tags: ["RAG", "Docs", "Search", "LLM"],
    pixels: [0, 3, 5, 6, 10, 15],
  },
  {
    number: "03 /",
    title: "API-интеграции",
    description:
      "CRM не дружит с ботом? Бот не видит базу? Связываю всё со всем.",
    tags: ["API", "Webhook", "Backend", "Postgres"],
    pixels: [2, 4, 7, 8, 11, 14],
  },
  {
    number: "04 /",
    title: "AI-системы под ключ",
    description:
      "Полный контур: интерфейс, логика, данные, продакшн. Один проект — одна система — работает.",
    tags: ["LLM", "Product", "Infra", "Support"],
    pixels: [1, 2, 5, 8, 11, 14],
  },
];

const caseCards = [
  {
    category: "Telegram / RAG",
    title: "Tender Copilot",
    description:
      "AI для тендеров. Читает документы, вытаскивает требования, поднимает прошлые ответы, собирает черновик заявки.",
    tags: ["Telegram", "RAG", "PDF", "Decision"],
  },
  {
    category: "Parsing / Analytics",
    title: "Мониторинг цен АЗС",
    description:
      "Собирает цены конкурентов по каждой точке, отслеживает изменения, оценивает достоверность. Отдел ценообразования занимается решениями, а не копипастой.",
    tags: ["Parsing", "Geo", "Analytics", "Dashboard"],
  },
  {
    category: "ML / Forecasting",
    title: "Прогнозатор закупок",
    description:
      "Считает, что и сколько закупать на неделю вперёд. Учитывает сезон, погоду, меню, праздники, остатки.",
    tags: ["ML", "Forecasting", "Optimization", "POS"],
  },
  {
    category: "Agent / CRM",
    title: "AI-квалификация лидов",
    description:
      "Фильтрует входящие, оценивает теплоту, собирает контекст — и передаёт менеджеру готовый summary. AI не продаёт, а готовит почву.",
    tags: ["Agent", "Lead Scoring", "CRM", "Handoff"],
  },
];

const comparisonRows = [
  { label: "Архитектура проекта", ainur: "да", freelancer: "частично", agency: "да" },
  { label: "Понимание AI-стека", ainur: "глубокое", freelancer: "зависит", agency: "поверхностное" },
  { label: "Скорость старта", ainur: "дни", freelancer: "дни", agency: "недели" },
  { label: "Поддержка после", ainur: "да", freelancer: "нет", agency: "по договору" },
  { label: "Прозрачность", ainur: "полная", freelancer: "зависит", agency: "отчёты" },
  { label: "Стоимость", ainur: "от 15к", freelancer: "от 5к", agency: "от 300к" },
];

const priceCards = [
  { label: "Простая автоматизация", value: "от 15 000 ₽" },
  { label: "Бот + интеграции", value: "от 40 000 ₽" },
  { label: "RAG-система", value: "от 60 000 ₽" },
  { label: "AI под ключ", value: "от 100 000 ₽" },
  { label: "Сложный контур", value: "до 200 000 ₽" },
];

const whyCards = [
  {
    title: "AI — руна, не меч",
    description:
      "ИИ — это зачарование на клинке. Сам клинок — цифровое решение: архитектура, интеграции, логика. Без надёжного меча никакая руна не поможет. Я кую и то, и другое.",
    pixels: [0, 2, 4, 6, 8],
  },
  {
    title: "Процесс важнее модели",
    description:
      "Проблема не в отсутствии LLM. Проблема — в разрывах между людьми, данными и действиями.",
    pixels: [1, 3, 4, 5, 7],
  },
  {
    title: "После запуска не исчезаю",
    description:
      "Довожу до продакшна. Остаюсь на поддержке. Развиваю итерациями.",
    pixels: [0, 1, 3, 7, 8],
  },
];

const processSteps = [
  {
    number: "01",
    title: "Разбор",
    description: "Смотрю на процесс, а не на хотелки.",
  },
  {
    number: "02",
    title: "Архитектура",
    description: "Схема до первой строчки кода.",
  },
  {
    number: "03",
    title: "Сборка",
    description: "Рабочая система, не макет.",
  },
  {
    number: "04",
    title: "Поддержка",
    description: "Остаюсь. Правлю. Развиваю.",
  },
];

const faqItems = [
  {
    question: "Только чат-боты?",
    answer:
      "Нет. Автоматизации, RAG, интеграции, AI-агенты, любые цифровые решения — формат под задачу.",
  },
  {
    question: "А если задача простая?",
    answer:
      "Отлично. Один бот, пара интеграций — запросто. Не обязательно строить космолёт.",
  },
  {
    question: "Что после запуска?",
    answer:
      "Передаю с документацией, остаюсь на поддержке или развиваю итерациями. Как удобнее.",
  },
  {
    question: "Сколько стоит?",
    answer:
      "От 15к до 200к. Зависит от сложности. Точнее — после разбора задачи.",
  },
];

/* ── Pixel glyphs ── */

function PixelGlyph({ active }: { active: number[] }) {
  return (
    <>
      {Array.from({ length: 16 }).map((_, i) => (
        <span key={i} className={active.includes(i) ? styles.pixelOn : undefined} />
      ))}
    </>
  );
}

function WhyGlyph({ active }: { active: number[] }) {
  return (
    <>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className={active.includes(i) ? styles.pixelOn : undefined} />
      ))}
    </>
  );
}

/* ── Helpers ── */

function cellClass(value: string) {
  if (value === "да" || value === "глубокое" || value === "полная" || value === "дни")
    return styles.cellYes;
  if (value === "нет") return styles.cellNo;
  return styles.cellMaybe;
}

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export default function FriendlyCyberpunkLanding() {
  return (
    <main className={styles.page}>
      <div className={styles.pixelGrid} aria-hidden="true" />

      {/* ── Navbar ── */}
      <header className={styles.navbar} id="top">
        <a className={styles.logo} href="#top" aria-label="Ainur">
          <span className={styles.logoPx} aria-hidden="true">
            <PixelGlyph active={[0, 3, 5, 6, 8, 11, 12, 13]} />
          </span>
          <span className={styles.logoText}>
            ainur<span>.</span>
          </span>
        </a>

        <nav className={styles.navLinks}>
          <a href="#services">Что кую</a>
          <a href="#cases">Кейсы</a>
          <a href="#why">Почему не бабахнет</a>
          <a href="#process">Процесс</a>
          <a href="#pricing">Ценник</a>
          <a href="#contact">Контакт</a>
        </nav>

        <a
          className={styles.navButton}
          href="https://t.me/foggearthquake_bot"
          target="_blank"
          rel="noreferrer"
        >
          Telegram
        </a>
      </header>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />

        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>AI Forge</div>
          <h1>
            Процессы на ручном
            <br />
            приводе? <span className={styles.accent}>Серьёзно?</span>
          </h1>

          <p className={styles.heroDescription}>
            Кую AI-системы. Автоматизации, агенты, любые цифровые решения — всё,
            что экономит время и нервы. Работает — или переделываю.
          </p>

          <div className={styles.heroActions}>
            <a className={`${styles.pixelButton} ${styles.primaryButton}`} href="#contact">
              Оставить заявку
            </a>
            <a
              className={`${styles.pixelButton} ${styles.outlineButton}`}
              href="https://t.me/foggearthquake_bot"
              target="_blank"
              rel="noreferrer"
            >
              Написать в Telegram
            </a>
          </div>

          <div className={styles.heroStats}>
            {heroStats.map((item) => (
              <div key={item.value} className={styles.stat}>
                <span className={styles.statValue}>{item.value}</span>
                <span className={styles.statLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.runicFrame}>
            <span className={styles.runicCornerTL} aria-hidden="true" />
            <span className={styles.runicCornerTR} aria-hidden="true" />
            <span className={styles.runicCornerBL} aria-hidden="true" />
            <span className={styles.runicCornerBR} aria-hidden="true" />
            <TerminalMock />
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <section className={styles.ticker} aria-label="technology ticker">
        <div className={styles.tickerInner}>
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={`${item}-${i}`} className={styles.tickerItem}>
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── Services ── */}
      <section className={styles.section} id="services">
        <div className={styles.sectionHeaderWide}>
          <div className={styles.sectionLabel}>Что кую</div>
          <h2 className={styles.sectionTitle}>От автоматизации до полного AI-контура</h2>
          <p className={styles.sectionSubtitle}>
            Не предлагаю один инструмент всем подряд. Иногда хватает бота на n8n.
            Иногда нужен RAG, API-слой и продукт целиком.
          </p>
        </div>

        <div className={styles.servicesGridWide}>
          {serviceCards.map((card) => (
            <article key={card.title} className={styles.serviceCard}>
              <div className={styles.serviceIcon} aria-hidden="true">
                <PixelGlyph active={card.pixels} />
              </div>
              <div className={styles.serviceNumber}>{card.number}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <div className={styles.tagList}>
                {card.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Cases ── */}
      <section className={`${styles.section} ${styles.darkSection}`} id="cases">
        <div className={styles.sectionLabel}>Кейсы</div>
        <h2 className={styles.sectionTitle}>Что уже собрано</h2>
        <p className={styles.sectionSubtitle}>
          Реальные проекты. Каждый адаптируется под задачу клиента.
        </p>

        <div className={styles.casesGrid}>
          {caseCards.map((card) => (
            <article key={card.title} className={styles.caseCard}>
              <div className={styles.caseDot} aria-hidden="true" />
              <div className={styles.caseCategory}>{card.category}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <div className={styles.caseTags}>
                {card.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className={styles.caseCta}>
          <div className={styles.caseNote}>
            <strong>Даже если задача простая</strong> — бот, автоматизация, пара
            интеграций — всё запросто собирается в одного Telegram-бота.
            Не надо ждать, пока задача станет «достаточно сложной».
          </div>
          <a
            className={styles.ghostButton}
            href="https://github.com/foggearthquake-star"
            target="_blank"
            rel="noreferrer"
          >
            Смотреть на GitHub
          </a>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className={styles.section} id="compare">
        <div className={styles.sectionLabel}>Сравнение</div>
        <h2 className={styles.sectionTitle}>С кем сравнивать</h2>
        <p className={styles.sectionSubtitle}>
          Коротко и честно — чем отличается работа со мной.
        </p>

        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th></th>
              <th>ainur.</th>
              <th>Фрилансер</th>
              <th>Агентство</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className={cellClass(row.ainur)}>{row.ainur}</td>
                <td className={cellClass(row.freelancer)}>{row.freelancer}</td>
                <td className={cellClass(row.agency)}>{row.agency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Pricing ── */}
      <section className={`${styles.section} ${styles.darkSection}`} id="pricing">
        <div className={styles.sectionLabel}>Ценник</div>
        <h2 className={styles.sectionTitle}>Сколько стоит</h2>
        <p className={styles.sectionSubtitle}>
          Зависит от масштаба, интеграций и числа сценариев. Точнее — после разбора задачи.
        </p>

        <div className={styles.pricingGrid}>
          {priceCards.map((card) => (
            <div key={card.label} className={styles.priceCard}>
              <div className={styles.priceLabel}>{card.label}</div>
              <div className={styles.priceValue}>{card.value}</div>
            </div>
          ))}
        </div>

        <p className={styles.priceNote}>
          Цена формируется после разбора задачи. Первый разговор — бесплатно.
        </p>
      </section>

      {/* ── Why / Trust ── */}
      <section className={styles.section} id="why">
        <div className={styles.sectionLabel}>Доверие</div>
        <h2 className={styles.sectionTitle}>Почему не бабахнет</h2>
        <p className={styles.sectionSubtitle}>
          Структура, логика и контроль на каждом шаге.
        </p>

        <div className={styles.whyGrid}>
          {whyCards.map((card) => (
            <article key={card.title} className={styles.whyCard}>
              <div className={styles.whyGlyph} aria-hidden="true">
                <WhyGlyph active={card.pixels} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Process ── */}
      <section className={styles.section} id="process">
        <div className={styles.sectionLabel}>Процесс</div>
        <h2 className={styles.sectionTitle}>Как это работает</h2>
        <p className={styles.sectionSubtitle}>
          Сначала задача. Потом инструмент.
        </p>

        <div className={styles.processGrid}>
          {processSteps.map((step) => (
            <article key={step.number} className={styles.processStep}>
              <div className={styles.processNumber}>{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.section}>
        <div className={styles.faqGrid}>
          <div className={styles.faqIntro}>
            <div className={styles.sectionLabel}>FAQ</div>
            <h2>Вопросы</h2>
            <p>Чтобы не тратить первый разговор на базовое.</p>
          </div>

          <div className={styles.faqList}>
            {faqItems.map((item, i) => (
              <details key={item.question} className={styles.faqItem} open={i === 0}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className={styles.contactSection} id="contact">
        <div className={styles.contactInner}>
          <div className={styles.contactInfo}>
            <div className={styles.sectionLabel}>Контакт</div>
            <h2>Давай соберём</h2>
            <p>
              Опиши задачу — что есть сейчас, что нужно получить. Остальное разберём.
            </p>
            <a
              className={styles.telegramButton}
              href="https://t.me/foggearthquake_bot"
              target="_blank"
              rel="noreferrer"
            >
              @foggearthquake_bot
            </a>
          </div>

          <div className={styles.formCard}>
            <LeadForm />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span className={styles.footerLogo}>
          ainur<span>.</span>
        </span>
        <div className={styles.footerLinks}>
          <a href="#top">AI Forge</a>
          <a href="https://t.me/foggearthquake_bot" target="_blank" rel="noreferrer">
            Telegram
          </a>
        </div>
        <span>
          © 2025 ainur. · Отправляя заявку, вы соглашаетесь с{" "}
          <a href="/privacy" style={{ textDecoration: "underline" }}>
            Политикой конфиденциальности
          </a>
        </span>
      </footer>
    </main>
  );
}
