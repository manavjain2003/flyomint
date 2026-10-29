export default function TravelJournalPage() {
  const articles = [
    {
      tag: "FLYCHART TRAVEL DESK",
      title: "Cabin vs Check-in: Baggage Rules Explained",
      href: "#",
    },
    {
      tag: "FLYCHART EDITORIAL",
      title: "The 10-Point Traveler Checklist Before You Fly",
      href: "#",
    },
    {
      tag: "FLYCHART TRAVEL DESK",
      title: "How to Save on International Flights",
      href: "#",
    },
    {
      tag: "FLYCHART EDITORIAL",
      title: "Top Budget Airlines in India (2026 Guide)",
      href: "#",
    },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <section className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 tracking-wide uppercase mb-2">
            Travel Journal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Reads for the runway.
          </h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Guides, tips, and opinionated takes from travelers who actually fly — no SEO fluff, no listicles.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, i) => (
            <article
              key={i}
              className="group rounded-2xl border border-slate-100 bg-white dark:bg-gray-900 overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Gradient Image Placeholder */}
              <div className="relative h-52 w-full bg-gradient-to-br from-sky-100 via-sky-200 to-sky-400" />

              {/* Content */}
              <div className="p-5">
                <p className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase mb-2">
                  {article.tag}
                </p>
                <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-3">
                  {article.title}
                </h3>
                <a
                  href={article.href}
                  className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                >
                  Read article
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}