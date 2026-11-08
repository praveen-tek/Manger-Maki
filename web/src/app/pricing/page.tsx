import Link from "next/link";
import { Newsreader } from "next/font/google";

const serif = Newsreader({ subsets: ["latin"], weight: ["300", "400"] });

const FEATURES = [
  "Unlimited notes and documents",
  "Full-text search across all content",
  "Organize with custom categories and tags",
  "Rich text formatting and markdown support",
  "Browser extension for quick capture",
  "Automatic backup and sync",
  "Dark mode and light mode themes",
  "Cross-platform support",
  "Regular updates and new features",
  "Community support and documentation",
];

const WHY = [
  "We believe that powerful knowledge management tools should be accessible to everyone. That’s why Manger Maki will always be completely free with no limitations on features or storage.",
  "Our mission is to help students, professionals, and lifelong learners organize their information effectively without worrying about subscription costs or data privacy concerns.",
  "We sustain Manger Maki through community support and are committed to keeping it free forever.",
];

const FAQS = [
  {
    q: "Will Manger Maki always be free?",
    a: "Yes, Manger Maki is and will always be free. We’re committed to providing powerful knowledge management tools at no cost.",
  },
  {
    q: "Is there a storage limit?",
    a: "No, there are no storage limits. Store as many notes, documents, and resources as you need.",
  },
  {
    q: "What about my data privacy?",
    a: "Your data is yours. We don’t sell your information or use it for advertising. Your privacy is protected by our privacy policy.",
  },
  {
    q: "Do I need an account to use Manger Maki?",
    a: "Creating an account allows you to sync across devices and back up your data. You can use basic features without an account.",
  },
  {
    q: "Can I export my data?",
    a: "Yes, you can export all your notes and documents in multiple formats at any time.",
  },
  {
    q: "Is there a mobile app?",
    a: "Yes, Manger Maki is available on all platforms including iOS, Android, Windows, and macOS.",
  },
];

export default function Pricing() {
  return (
    <main
      className={`${serif.className} min-h-screen bg-[#1c1c1c] px-6 py-16 text-white sm:px-10`}
    >
      <div className="mx-auto max-w-4xl">
        <nav className="mb-16 flex items-center justify-between border-b border-white/25 pb-4">
          <Link
            href="/"
            className="text-2xl font-normal tracking-tight transition-opacity hover:opacity-70"
          >
            Manger Maki
          </Link>
          <div className="flex items-center gap-8 text-base font-light text-white/90">
            <Link href="/legal" className="transition-opacity hover:opacity-60">
              Legal
            </Link>
            <Link href="/pricing" className="transition-opacity hover:opacity-60">
              Pricing
            </Link>
          </div>
        </nav>

        <header className="border-b border-white/25 pb-10">
          <h1 className="text-5xl font-light leading-[1.05] sm:text-7xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-6 max-w-xl text-xl font-light text-white/80">
            Manger Maki is completely free. No hidden charges, no premium plans.
          </p>
        </header>

        <section className="grid gap-10 border-b border-white/25 py-12 md:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-3xl font-light">Free Plan</h2>
            <div className="mt-4 text-8xl font-light leading-none">$0</div>
            <p className="mt-4 text-lg font-light text-white/70">
              Forever free for everyone
            </p>
            <button className="mt-8 w-full border border-white px-6 py-3 text-lg font-light transition-colors hover:bg-white hover:text-[#1c1c1c]">
              Get Started Free
            </button>
          </div>

          <ul className="divide-y divide-white/15 border-t border-white/25 text-lg font-light text-white/85">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-4 py-3">
                <span className="text-white/50">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-b border-white/25 py-12">
          <h2 className="mb-6 text-3xl font-light">Why Manger Maki is Free</h2>
          <div className="max-w-2xl space-y-4 text-lg font-light leading-relaxed text-white/80">
            {WHY.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        </section>

        <section className="py-12">
          <h2 className="mb-8 text-3xl font-light">Frequently Asked Questions</h2>
          <div className="divide-y divide-white/15 border-t border-white/25">
            {FAQS.map((faq) => (
              <div key={faq.q} className="grid gap-2 py-6 md:grid-cols-[1fr_1.4fr] md:gap-10">
                <h3 className="text-xl font-normal">{faq.q}</h3>
                <p className="text-lg font-light leading-relaxed text-white/75">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}