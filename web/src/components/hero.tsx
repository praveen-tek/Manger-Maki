"use client";

import Image from "next/image";
import Link from "next/link";
import { Newsreader } from "next/font/google";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { PaperTexture } from "@paper-design/shaders-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const serif = Newsreader({ subsets: ["latin"], weight: ["300", "400"] });

const LINKS = [
  { name: "Hacker News", url: "https://news.ycombinator.com", domain: "news.ycombinator.com" },
  { name: "GitHub", url: "https://github.com", domain: "github.com" },
  { name: "Product Hunt", url: "https://producthunt.com", domain: "producthunt.com" },
  { name: "Dribbble", url: "https://dribbble.com", domain: "dribbble.com" },
  { name: "MDN", url: "https://developer.mozilla.org", domain: "developer.mozilla.org" },
  { name: "Pinterest", url: "https://pinterest.com", domain: "pinterest.com" },
];

export default function Hero() {
  return (
    <section className="flex h-screen w-full items-center justify-center overflow-hidden bg-[#1c1c1c]">
      <div className="relative aspect-video w-[min(100vw,calc(100vh*16/9))] [container-type:inline-size]">
        <PaperTexture
          fit="contain"
          scale={0.9}
          blending={1}
          distortion={0.75}
          clip={false}
          angle={300}
          seed={4}
          roughness={0.4}
          roughnessSize={0.5}
          roughnessRows={0}
          fiber={0.4}
          fiberSize={0.5}
          folds={0.5}
          foldSizeX={1}
          foldSizeY={1}
          foldOffsetX={0}
          foldOffsetY={0}
          wrinkles={1}
          wrinkleSize={0.65}
          drops={0.4}
          image={`${BASE}/mnt.png`}
          colorBack="#00000000"
          colorPaper="#FFFFFF"
          colorShadow="#CCCCCC"
          className="absolute inset-0 h-full w-full"
        />

        <nav
          className={`${serif.className} absolute left-[10.5%] right-[9%] top-[7%] z-10 flex items-center justify-between border-b border-white/25 pb-[1cqw] text-white`}
        >
          <Link
            href="/"
            className="text-[1.9cqw] font-normal tracking-tight transition-opacity hover:opacity-70"
          >
            Manger Maki
          </Link>
          <div className="flex items-center gap-[2.4cqw] text-[1.25cqw] font-light text-white/90">
            <Link href="/legal" className="transition-opacity hover:opacity-60">
              Legal
            </Link>
            <Link href="/pricing" className="transition-opacity hover:opacity-60">
              Pricing
            </Link>
            <Link
              href="https://github.com/praveen-tek/Manger-Maki"
              className="flex items-center gap-[0.5cqw] border-l border-white/25 pl-[2.4cqw] transition-opacity hover:opacity-60"
            >
              Download
              <DownloadSimpleIcon size="1.1em" weight="bold" />
            </Link>
          </div>
        </nav>

        <h1
          className={`${serif.className} absolute left-[10.5%] top-[17%] mt-3 text-[8.2cqw] font-light leading-[1.05] text-white`}
        >
          Manger
          <br />
          Maki
        </h1>

        <p
          className={`${serif.className} absolute left-[10.5%] top-[50%] mt-3 w-[30cqw] text-[1.5cqw] font-light leading-[1.5] text-white/85`}
        >
          Every site you rely on, sorted into categories and one click away
          each time you open a new tab. Manage it once, maintain it effortlessly.
        </p>

        <div
          className={`${serif.className} absolute left-[57%] right-[9%] top-[19%] mt-3 grid grid-cols-2 gap-x-[3cqw] gap-y-[1.6cqw]`}
        >
          {LINKS.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-[0.7cqw] text-[1.35cqw] text-white/90 transition-opacity hover:opacity-60"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${link.domain}&sz=64`}
                alt=""
                className="h-[1.3cqw] w-[1.3cqw] rounded-sm"
              />
              {link.name}
            </a>
          ))}
        </div>

        <footer
          className={`${serif.className} absolute bottom-[8.5%] left-[10.5%] flex w-[55cqw] items-center justify-between border-t border-white/25 pt-[1cqw] text-[1.1cqw] font-light text-white/75`}
        >
          <span>© 2026 Manger Maki</span>
          <div className="flex items-center gap-[2cqw]">
            <Link href="/legal" className="transition-opacity hover:opacity-60">
              Legal
            </Link>
            <Link href="/pricing" className="transition-opacity hover:opacity-60">
              Pricing
            </Link>
            <Link
              href="https://github.com/praveen-tek/Manger-Maki"
              className="transition-opacity hover:opacity-60"
            >
              GitHub
            </Link>
          </div>
        </footer>

        <Image
          src={`${BASE}/logo-white.png`}
          alt=""
          width={600}
          height={600}
          priority
          className="pointer-events-none absolute bottom-[7%] right-[9%] h-auto w-[20cqw]"
        />
      </div>
    </section>
  );
}