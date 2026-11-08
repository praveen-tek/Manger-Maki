import Link from "next/link";
import { Newsreader } from "next/font/google";

const serif = Newsreader({ subsets: ["latin"], weight: ["300", "400"] });

type Block =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] };

type Section = { title: string; blocks: Block[] };

const SECTIONS: Section[] = [
  {
    title: "Terms of Service",
    blocks: [
      {
        type: "p",
        text: "By accessing and using Manger Maki, you accept and agree to be bound by the terms and provision of this agreement.",
      },
      {
        type: "ul",
        items: [
          "You agree to use this service only for lawful purposes and in a way that does not infringe upon the rights of others or restrict their use and enjoyment of the web.",
          "Prohibited behavior includes harassing or causing distress or inconvenience to any person, transmitting obscene or offensive content or disrupting the normal flow of dialogue within our web site.",
          "We reserve the right to refuse service to anyone for any reason at any time.",
          "We reserve the right to modify or discontinue this service at any time without notice.",
        ],
      },
    ],
  },
  {
    title: "Privacy Policy",
    blocks: [
      {
        type: "p",
        text: "Your privacy is important to us. This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our extension.",
      },
      { type: "h3", text: "Information We Collect" },
      {
        type: "ul",
        items: [
          "Information you voluntarily provide (name, email, usage data)",
          "Automatically collected information (IP address, browser type, pages visited)",
          "Information from your device (operating system, unique identifiers)",
        ],
      },
      { type: "h3", text: "How We Use Your Information" },
      {
        type: "ul",
        items: [
          "To provide and maintain our service",
          "To notify you about changes to our service",
          "To allow you to participate in interactive features",
          "To provide customer support",
          "To gather analysis or valuable information for improving our service",
        ],
      },
    ],
  },
  {
    title: "Data Security",
    blocks: [
      {
        type: "p",
        text: "The security of your data is important to us, but no method of transmission over the Internet is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.",
      },
    ],
  },
  {
    title: "Third-Party Links",
    blocks: [
      {
        type: "p",
        text: "Our extension may contain links to third-party web sites. We are not responsible for the content, accuracy, or practices of these external sites. Your use of third-party websites is subject to their terms and policies.",
      },
    ],
  },
  {
    title: "Disclaimer",
    blocks: [
      {
        type: "p",
        text: "Manger Maki is provided on an “AS IS” and “AS AVAILABLE” basis. We make no representations or warranties of any kind, express or implied, as to the operation of the extension or the information, content, or materials included in the extension.",
      },
      {
        type: "p",
        text: "To the fullest extent permissible by applicable law, we disclaim all warranties, express or implied, including, but not limited to, implied warranties of merchantability and fitness for a particular purpose.",
      },
    ],
  },
  {
    title: "Limitation of Liability",
    blocks: [
      {
        type: "p",
        text: "In no event shall Manger Maki, its owners, or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Manger Maki.",
      },
    ],
  },
  {
    title: "Intellectual Property Rights",
    blocks: [
      {
        type: "p",
        text: "Unless otherwise stated, Manger Maki and/or its licensors own the intellectual property rights for all material on the extension. All intellectual property rights are reserved. You may view and print pages from the extension for your personal use, subject to restrictions set in these terms and conditions.",
      },
    ],
  },
  {
    title: "Changes to Legal Pages",
    blocks: [
      {
        type: "p",
        text: "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the extension. Your continued use of the extension following the posting of revised terms means that you accept and agree to the changes.",
      },
    ],
  },
  {
    title: "Contact Us",
    blocks: [
      {
        type: "p",
        text: "If you have any questions about these legal pages, please contact us at support@mangermaki.com",
      },
    ],
  },
];

export default function Legal() {
  return (
    <main
      className={`${serif.className} min-h-screen bg-[#1c1c1c] px-6 py-10 text-white sm:px-10`}
    >
      <div className="mx-auto max-w-3xl">
        <nav className="flex items-center justify-between border-b border-white/25 pb-4">
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

        <h1 className="mt-16 text-6xl font-light leading-[1.05] sm:text-7xl">
          Legal
        </h1>

        <div className="mt-14 space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.title} className="border-t border-white/25 pt-6">
              <h2 className="mb-4 text-3xl font-light">{section.title}</h2>
              <div className="space-y-4 text-lg font-light leading-relaxed text-white/80">
                {section.blocks.map((block, i) => {
                  if (block.type === "p") return <p key={i}>{block.text}</p>;
                  if (block.type === "h3")
                    return (
                      <h3 key={i} className="pt-2 text-xl font-normal text-white">
                        {block.text}
                      </h3>
                    );
                  return (
                    <ul key={i} className="list-disc space-y-2 pl-5 marker:text-white/40">
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-16 flex items-center justify-between border-t border-white/25 pt-4 text-sm font-light text-white/70">
          <span>© 2026 Manger Maki. All rights reserved.</span>
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </footer>
      </div>
    </main>
  );
}