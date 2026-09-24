import React, { useState, useEffect, useRef } from "react";
import type { BlogCardDTO } from "../lib/ghl/types";

interface BlogSectionProps {
  content: {
    title: string;
  };
  items: BlogCardDTO[];
  lang: string;
  readMoreText?: string;
  previousText?: string;
  nextText?: string;
  noPostsText?: string;
  itemsPerPage?: number;
}

export default function BlogSection({
  content,
  items = [],
  lang = "en",
  readMoreText = "Read More",
  previousText = "Previous",
  nextText = "Next",
  noPostsText = "No blog posts available at the moment.",
  itemsPerPage = 9,
}: BlogSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLElement | null>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Client-side pagination slice
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = items.slice(startIndex, startIndex + itemsPerPage);

  // Same line-split pattern as the Signature h2 so the mask reveal matches
  const lines = content.title.split(/<br\s*\/?>/i);

  // Hook to handle fade-up-a animations consistently with Layout.astro on mount and page changes
  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll<HTMLElement>(
      ".fade-up-a, .fade-down-a, .fade-left-a, .fade-right-a, .mask-reveal",
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.getBoundingClientRect(); // Force reflow
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                el.classList.add("active");
              });
            });
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 },
    );

    elements.forEach((el) => {
      el.classList.remove("active");
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [currentPage, currentItems.length]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section
      ref={containerRef}
      className="w-full flex flex-col justify-center items-center bg-white pt-16 md:pt-20"
    >
      <div className="container-full flex flex-col justify-center items-center py-16 gap-8 md:gap-16">
        <div className="flex flex-col justify-center items-center gap-12">
          <h1 className="text-[56px] md:text-[96px] font-rust text-black leading-[100%] font-normal mask-reveal text-center isolate">
            {lines.map((line, index) => (
              <div
                key={index}
                className={`relative overflow-clip ${index !== 0 ? "z-[3] -mt-[0.4em] pt-[0.4em]" : "z-0"}`}
              >
                <span
                  className="block font-rust mask-line"
                  style={{ animationDelay: `${index * 100}ms` }}
                  dangerouslySetInnerHTML={{ __html: line }}
                />
              </div>
            ))}
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="paragraph text-[#717171] fade-up-a">{noPostsText}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7.5 w-full">
              {currentItems.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-start items-start gap-4 fade-up-a"
                >
                  <a
                    href={`/${lang}/blog/${item.id}`}
                    className="w-full h-auto relative overflow-hidden rounded-2xl group block"
                    style={{ aspectRatio: "438.6/251" }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      width={950}
                      height={650}
                      decoding="async"
                      loading="lazy"
                      className="w-full h-full object-center object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    />
                  </a>

                  {item.date && (
                    <p className="text-[13px] font-medium leading-[150%] text-[#717171] fade-up-a">
                      {item.date}
                    </p>
                  )}

                  <h2 className="subtitle-sm text-black fade-up-a line-clamp-2">
                    <a
                      href={`/${lang}/blog/${item.id}`}
                      className="hover:text-secondary transition-colors duration-200"
                    >
                      {item.title}
                    </a>
                  </h2>

                  {item.description && (
                    <p className="paragraph fade-up-a line-clamp-3 text-[#4A4A4A]">
                      {item.description}
                    </p>
                  )}

                  <a
                    className="group w-full h-12 rounded-[8px] border border-[#0D0D0D26] flex justify-center items-center text-[16px] font-paragraph font-bold leading-[100%] hover:bg-[#EEEEEE] hover:scale-103 transition-all duration-300 text-black overflow-hidden"
                    href={`/${lang}/blog/${item.id}`}
                  >
                    <span className="relative overflow-hidden">
                      <span className="flex items-center justify-center transition-transform duration-200 ease-out group-hover:-translate-y-[calc(100%+0.5rem)] motion-reduce:transition-none motion-reduce:transform-none">
                        {readMoreText}
                      </span>
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-full mt-2 flex items-center justify-center transition-transform duration-200 ease-out group-hover:-translate-y-[calc(100%+0.5rem)] motion-reduce:transition-none motion-reduce:transform-none"
                      >
                        {readMoreText}
                      </span>
                    </span>
                  </a>
                </article>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav
                aria-label="Blog pagination"
                className="flex justify-center items-center gap-2 md:gap-3 mt-8 md:mt-12 fade-up-a"
              >
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2.5 rounded-full border-[1.5px] border-[#E6E6E6] text-sm font-semibold transition-all duration-200 ${
                    currentPage === 1
                      ? "opacity-40 cursor-not-allowed text-[#9E9E9E]"
                      : "hover:bg-accent hover:border-accent text-black cursor-pointer"
                  }`}
                >
                  {previousText}
                </button>

                <div className="flex items-center gap-1.5 md:gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => {
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          aria-current={isActive ? "page" : undefined}
                          className={`w-10 h-10 rounded-full border-[1.5px] flex items-center justify-center text-sm font-bold transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "bg-accent border-accent text-black"
                              : "border-[#E6E6E6] text-black hover:bg-accent/30 hover:border-accent"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2.5 rounded-full border-[1.5px] border-[#E6E6E6] text-sm font-semibold transition-all duration-200 ${
                    currentPage === totalPages
                      ? "opacity-40 cursor-not-allowed text-[#9E9E9E]"
                      : "hover:bg-accent hover:border-accent text-black cursor-pointer"
                  }`}
                >
                  {nextText}
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
