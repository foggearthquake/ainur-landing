import LeadForm from "@/app/LeadForm";
import TerminalMock from "./TerminalMock";
import HexParticles from "./HexParticles";
import ScrollReveal from "./ScrollReveal";
import { Settings, SearchCode, Link, ShieldCheck, Send, GitBranch, Globe } from "lucide-react";
import styles from "./arcane-v2.module.css";

/* ── Data ── */

const tickerItems = [
  "сайты и лендинги",
  "платформы",
  "n8n-автоматизации",
  "RAG-системы",
  "API-интеграции",
  "AI-агенты",
  "Telegram-боты",
  "веб-приложения",
  "парсинг и аналитика",
  "до 7 дней",
  "цифровые решения",
  "поддержка после запуска",
];

const heroStats = [
  { value: "n8n", label: "автоматизации" },
  { value: "RAG", label: "базы знаний" },
  { value: "API", label: "интеграции" },
  { value: "AI", label: "агенты" },
  { value: "3–7", label: "дней до результата" },
];

const serviceCards = [
  {
    icon: <Globe size={24} />,
    number: "01",
    title: "Сайты, платформы и веб-приложения",
    description: "Лендинги, многостраничники, личные кабинеты, дашборды, внутренние инструменты для команд. Под ключ.",
    tags: ["Next.js", "React", "UI/UX", "Fullstack"],
  },
  {
    icon: <Settings size={24} />,
    number: "02",
    title: "Автоматизации",
    description: "Рутина? Забирает бот. Заявки, уведомления, синхронизация — на автопилоте.",
    tags: ["n8n", "Telegram", "CRM", "Webhook"],
  },
  {
    icon: <SearchCode size={24} />,
    number: "03",
    title: "RAG и ассистенты",
    description: "Документы, регламенты, база знаний — в одном чате. Спроси — ответит по делу.",
    tags: ["RAG", "Docs", "Search", "LLM"],
  },
  {
    icon: <Link size={24} />,
    number: "04",
    title: "API-интеграции",
    description: "CRM не видит бота? Бот не знает базу? Связываю. Всё. Со всем.",
    tags: ["API", "Webhook", "Backend", "Postgres"],
  },
  {
    icon: <ShieldCheck size={24} />,
    number: "05",
    title: "AI-системы под ключ",
    description: "Полный контур: интерфейс, логика, данные, продакшн. Одна система — работает.",
    tags: ["LLM", "Product", "Infra", "Support"],
  },
];

const caseCards = [
  {
    category: "Telegram / RAG",
    title: "Tender Copilot",
    description: "AI читает тендерную документацию, вытаскивает требования, поднимает прошлые ответы и собирает первый черновик заявки.",
    tags: ["RAG", "PDF", "Chat-to-Docs", "Generation"],
    formula: "Tender docs + bid library + AI = быстрые и сильные заявки",
    results: ["Быстрый первый черновик заявки", "Меньше ручной рутины для bid manager", "Прошлые материалы используются по максимуму", "Меньше риска пропустить требования"],
  },
  {
    category: "Parsing / Analytics",
    title: "Мониторинг цен АЗС",
    description: "Собирает цены конкурентов по каждой точке, отслеживает изменения, оценивает достоверность. Решения вместо гугления.",
    tags: ["Parsing", "Geo", "Analytics", "Pricing"],
    formula: "Открытые данные + карта конкурентов + AI = быстрее реакция на рынок",
    results: ["Автоматический мониторинг конкурентов", "Локальное ценообразование по каждой точке", "Единый источник данных", "База для pricing-рекомендаций"],
  },
  {
    category: "ML / Forecasting",
    title: "Прогнозатор закупок",
    description: "Считает, что и сколько закупать на неделю. Сезон, погода, меню, праздники — всё учтено.",
    tags: ["ML", "Forecasting", "Optimization", "POS"],
    formula: "Продажи + меню + внешние факторы = точный план закупок",
    results: ["Снижение списаний", "Снижение out-of-stock", "Прогноз с объяснением причин", "Готовый план закупки к дате"],
  },
  {
    category: "Agent / CRM",
    title: "AI-квалификация лидов",
    description: "Фильтрует входящие, оценивает теплоту, собирает контекст — передаёт менеджеру готовый summary.",
    tags: ["Agent", "Lead Scoring", "CRM", "Handoff"],
    formula: "Лид + AI-квалификация + передача человеку = эффективнее sales",
    results: ["Меньше ручной рутины в продажах", "Быстрее реакция на входящие", "Качественная передача в отдел продаж", "AI усиливает, а не заменяет людей"],
  },
];

const comparisonRows = [
  { label: "Архитектура проекта", ainur: "да", freelancer: "иногда", agency: "да" },
  { label: "Глубина в digital/AI", ainur: "глубокая", freelancer: "по-разному", agency: "поверхностная" },
  { label: "Скорость старта", ainur: "3–7 дней", freelancer: "дни–недели", agency: "недели–месяцы" },
  { label: "Поддержка после", ainur: "да", freelancer: "нет", agency: "по договору" },
  { label: "Прозрачность", ainur: "полная", freelancer: "по-разному", agency: "отчёты" },
  { label: "Стоимость", ainur: "от 15к", freelancer: "от 5к", agency: "от 300к" },
];

const processSteps = [
  { number: "01", title: "Разбор", description: "Разбираю задачу. Не хотелки — процесс." },
  { number: "02", title: "Схема", description: "Архитектура. До первой строчки кода." },
  { number: "03", title: "Сборка", description: "Рабочее решение за 3–7 дней. Сложная задача? За 7 дней согласуем решение и стартуем." },
  { number: "04", title: "Поддержка", description: "Не исчезаю. Правлю. Развиваю." },
];

const whyCards = [
  {
    title: "AI — руна, не меч",
    description: "ИИ — зачарование на клинке. Клинок — архитектура, интеграции, логика. Без надёжного меча руна бесполезна. Кую и то, и другое.",
  },
  {
    title: "Процесс важнее модели",
    description: "Проблема не в отсутствии LLM. Проблема — в разрывах между людьми, данными и действиями. Закрываю разрывы.",
  },
  {
    title: "После запуска не исчезаю",
    description: "Довожу до продакшна. Остаюсь на поддержке. Итерации, а не «удачи, дальше сами».",
  },
];

const priceHighlights = [
  "Сайт или лендинг",
  "Платформа / веб-приложение",
  "Бот + пара интеграций",
  "Telegram + CRM + webhook",
  "RAG-система, база знаний",
  "Полный разбор процесса с оптимизацией",
];

const faqItems = [
  {
    question: "Только AI и боты?",
    answer: "Нет. Сайты, лендинги, платформы, веб-приложения, автоматизации, RAG, интеграции, AI-агенты — любой цифровой формат под задачу.",
  },
  {
    question: "Как быстро будет готово?",
    answer: "Простые задачи — 3–7 дней. Для сложных — за 7 дней согласуем решение и стартуем разработку.",
  },
  {
    question: "А если задача простая?",
    answer: "Ещё лучше. Лендинг, бот, пара интеграций — запросто. Не обязательно строить космолёт, чтобы долететь до магазина.",
  },
  {
    question: "Что после запуска?",
    answer: "Передаю с документацией, остаюсь на связи. Развиваю итерациями — или просто поддерживаю.",
  },
  {
    question: "Сколько стоит?",
    answer: "От 15к до 200к. Точнее — после разбора задачи. Первый разговор бесплатный, не кусаюсь.",
  },
];

/* ── Helpers ── */

function cellClass(value: string) {
  if (["да", "глубокая", "полная", "дни", "3–7 дней"].includes(value)) return styles.cellYes;
  if (value === "нет") return styles.cellNo;
  return styles.cellMaybe;
}

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export default function ArcaneLanding() {
  return (
    <ScrollReveal>
      <main className={styles.page}>
      {/* Background layers */}
      <HexParticles />
      <div className={styles.noiseOverlay} aria-hidden="true" />
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* ── Navbar ── */}
      <header className={styles.navbar} id="top">
        <a className={styles.logo} href="#top" aria-label="Ainur">
          <span className={styles.logoImg} aria-hidden="true" />
          <span className={styles.logoText}>
            ainur<span>.</span>
          </span>
        </a>

        <input type="checkbox" id="nav-toggle" className={styles.navToggle} aria-hidden="true" />
        <label htmlFor="nav-toggle" className={styles.navBurger} aria-label="Меню">
          <span /><span /><span />
        </label>

        <nav className={styles.navLinks}>
          <a href="#services">Арсенал</a>
          <a href="#cases">Кейсы</a>
          <a href="#why">Почему</a>
          <a href="#pricing">Ценник</a>
          <a href="#contact">Контакт</a>
          <a
            className={styles.navButton}
            href="https://t.me/foggearthquake_bot"
            target="_blank"
            rel="noreferrer"
          >
            <Send size={14} />
            Telegram
          </a>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />

        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>Digital & AI Forge</div>
          <h1>
            Цифровая кузница.
            <br />
            Любое решение — <span className={styles.accent}>за 3–7 дней.</span>
          </h1>

          <p className={styles.heroDescription}>
            Закрываем цифровые задачи бизнеса: сайты, боты, автоматизации, платформы, AI-системы.
            Нет — выкую с нуля. Не работает — перекую.
          </p>

          <div className={styles.heroActions}>
            <a className={styles.btnPrimary} href="#contact">
              Оставить заявку
            </a>
            <a
              className={styles.btnOutline}
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
            <span className={`${styles.runicCorner} ${styles.runicCornerTL}`} aria-hidden="true" />
            <span className={`${styles.runicCorner} ${styles.runicCornerTR}`} aria-hidden="true" />
            <span className={`${styles.runicCorner} ${styles.runicCornerBL}`} aria-hidden="true" />
            <span className={`${styles.runicCorner} ${styles.runicCornerBR}`} aria-hidden="true" />
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
      <section className={styles.section} id="services" data-reveal>
        <div className={styles.sectionLabel}>Арсенал</div>
        <h2 className={styles.sectionTitle}>Что умею ковать</h2>
        <p className={styles.sectionSubtitle}>
          Иногда хватит бота. Иногда нужна целая система.
          Не навязываю лишнего — собираю ровно то, что нужно.
        </p>

        <div className={styles.servicesGrid}>
          {serviceCards.map((card) => (
            <article key={card.title} className={styles.serviceCard}>
              <div className={styles.serviceIconWrap} aria-hidden="true">
                {card.icon}
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
      <section className={`${styles.section} ${styles.darkSection}`} id="cases" data-reveal>
        <div className={styles.sectionLabel}>Кейсы</div>
        <h2 className={styles.sectionTitle}>Уже выковано</h2>
        <p className={styles.sectionSubtitle}>
          Не теория — реальные системы. Наведи на карточку, чтобы увидеть результат.
        </p>

        <div className={styles.casesGrid}>
          {caseCards.map((card) => (
            <div key={card.title} className={styles.caseFlip}>
              <div className={styles.caseFlipInner}>
                {/* Front */}
                <article className={styles.caseFront}>
                  <div className={styles.caseDot} aria-hidden="true" />
                  <div className={styles.caseCategory}>{card.category}</div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <div className={styles.caseTags}>
                    {card.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className={styles.caseFlipHint}>↻ наведи для деталей</div>
                </article>
                {/* Back */}
                <div className={styles.caseBack}>
                  <div className={styles.caseFormula}>{card.formula}</div>
                  <div className={styles.caseBackTitle}>Результат</div>
                  <ul className={styles.caseBackList}>
                    {card.results.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why ── */}
      <section className={styles.section} id="why" data-reveal>
        <div className={styles.sectionLabel}>Философия</div>
        <h2 className={styles.sectionTitle}>Почему не бабахнет</h2>
        <p className={styles.sectionSubtitle}>
          Три принципа. Без них любая система — бомба замедленного действия.
        </p>

        <div className={styles.whyGrid}>
          {whyCards.map((card) => (
            <article key={card.title} className={styles.whyCard}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className={`${styles.section} ${styles.darkSection}`} id="compare" data-reveal>
        <div className={styles.sectionLabel}>Сравнение</div>
        <h2 className={styles.sectionTitle}>С кем сравнивать</h2>
        <p className={styles.sectionSubtitle}>
          Честно и без понтов.
        </p>

        <div className={styles.tableWrap}>
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
        </div>
      </section>

      {/* ── Process ── */}
      <section className={`${styles.section} ${styles.darkSection}`} id="process" data-reveal>
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

      {/* ── Pricing ── */}
      <section className={styles.section} id="pricing" data-reveal>
        <div className={styles.sectionLabel}>Ценник</div>
        <h2 className={styles.sectionTitle}>Сколько стоит магия</h2>
        <p className={styles.sectionSubtitle}>
          Зависит от масштаба. Точнее — после разбора задачи. Первый разговор бесплатный.
        </p>

        <div className={styles.priceHero}>
          <div className={styles.priceHeroValue}>
            от 15 000 <span>₽</span>
          </div>
          <div className={styles.priceHeroSub}>
            Точная стоимость — после разбора задачи. Первый разговор бесплатный.
          </div>
          <ul className={styles.priceHeroList}>
            {priceHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <a className={styles.btnPrimary} href="#contact">
            Обсудить задачу
          </a>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.section} data-reveal>
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
      <section className={styles.contactSection} id="contact" data-reveal>
        <div className={styles.contactInner}>
          <div className={styles.contactInfo}>
            <div className={styles.sectionLabel}>Контакт</div>
            <h2>Есть задача?</h2>
            <p>
              Расскажи, что болит. Что есть сейчас, что хочешь получить — разберём.
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
            <p className={styles.privacyNote}>
              Отправляя заявку, вы даёте согласие на обработку персональных данных
              в соответствии с{" "}
              <a href="/privacy">Политикой конфиденциальности</a>.
            </p>
          </div>
        </div>
      </section>

      {/* ── SEO Content ── */}
      <section className={styles.section} data-reveal>
        <div className={styles.sectionLabel}>О нас</div>
        <h2 className={styles.sectionTitle}>Закрываем цифровые задачи бизнеса</h2>
        <p className={styles.sectionSubtitle}>
          От аналитики и разработки любой сложности до проектного консалтинга и поддержки готового решения.
        </p>
        <div className={styles.whyGrid}>
          <article className={styles.whyCard}>
            <h3>Разработка сайтов и приложений</h3>
            <p>
              Создание сайтов, лендингов, интернет-магазинов, личных кабинетов, дашбордов
              и внутренних инструментов для команд. Адаптивный дизайн, быстрая загрузка,
              SEO-оптимизация из коробки.
            </p>
          </article>
          <article className={styles.whyCard}>
            <h3>Автоматизация и интеграции</h3>
            <p>
              Автоматизация бизнес-процессов через n8n, Telegram-боты, CRM-интеграции,
              API-связки, webhook-сценарии. Подключение 1С, Битрикс24, AmoCRM
              и любых внешних сервисов.
            </p>
          </article>
          <article className={styles.whyCard}>
            <h3>AI-решения и консалтинг</h3>
            <p>
              Внедрение искусственного интеллекта: RAG-системы, AI-агенты,
              машинное обучение, аналитика данных. Проектный консалтинг по
              цифровой трансформации и оптимизации процессов.
            </p>
          </article>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span className={styles.footerLogo}>
          ainur<span>.</span>
        </span>
        <div className={styles.footerLinks}>
          <a href="#top">Digital & AI Forge</a>
          <a href="https://github.com/foggearthquake-star" target="_blank" rel="noreferrer">
            <GitBranch size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
            GitHub
          </a>
          <a href="https://t.me/foggearthquake_bot" target="_blank" rel="noreferrer">
            Telegram
          </a>
        </div>
        <span>
          © 2026 ainur. · Все права защищены
        </span>
      </footer>
      </main>
    </ScrollReveal>
  );
}
