"use client";
import Image from "next/image";
import { BookBookmarkIcon } from "@phosphor-icons/react";
import ContentSection from "@/components/content";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center bg-zinc-50 min-h-screen">
        <Image
          src="https://github.com/praveen-tek/Manger-Maki/blob/main/web/public/manger-samo.png?raw=true"
          alt="Manger Maki Logo"
          width={300}
          height={300}
        />
        <div className="flex flex-row items-center justify-center pt-10">
          <BookBookmarkIcon size={102} className="text-black px-2" />
          <span className="text-8xl instrument-serif-regular text-black">Manger Maki</span>
        </div>
        <p className="text-lg instrument-serif-regular text-black max-w-2xl text-center pt-10">
          Manger Maki is a powerful knowledge management tool designed to help you organize and access your information effortlessly. With its intuitive interface and robust features, Manger Maki allows you to create, categorize, and search through your notes, documents, and resources with ease. Whether you&apos;re a student, professional, or anyone looking to streamline their information management, Manger Maki provides the tools you need to stay organized and productive.
        </p>
      </div>

      <ContentSection />
      <Footer />
    </>
  );
}