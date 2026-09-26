import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  type MouseEvent,
  type TouchEvent,
} from "react";

const AUTOPLAY_INTERVAL = 8000;

type ReviewItem = {
  description: string;
  name: string;
};

interface CarouselReviewProps {
  items: ReviewItem[];
}

export default function ReviewCarousel({ items }: CarouselReviewProps) {
  const N = items.length;
  const expandedItems = [...items, ...items, ...items];

  const [currentIndex, setCurrentIndex] = useState(N);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const dragStart = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isResetting = useRef(false);

  const measureContainerWidth = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
    }
  }, []);

  // True once we know the real viewport width. Before that every slide
  // would compute width 0 and pile up at translate 0, so the track stays
  // hidden and unanimated until measurement lands.
  const isMeasured = containerWidth > 0;

  // useLayoutEffect so the width is measured before the browser paints —
  // otherwise the zero-width (piled-up) layout flashes on load.
  useLayoutEffect(() => {
    const handleResize = () => {
      setIsTransitioning(false);
      measureContainerWidth();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // The carousel fills remaining flex space, so its width can change
    // without a window resize (e.g. siblings loading). Observe it directly.
    const el = containerRef.current;
    let observer: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        setIsTransitioning(false);
        measureContainerWidth();
      });
      observer.observe(el);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer) observer.disconnect();
    };
  }, [measureContainerWidth]);

  useEffect(() => {
    if (!isTransitioning && isMeasured) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
        isResetting.current = false;
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [currentIndex, isTransitioning, isMeasured]);

  const stopAutoplay = useCallback(() => {
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current);
      autoplayTimer.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    autoplayTimer.current = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, AUTOPLAY_INTERVAL);
  }, [stopAutoplay]);

  useEffect(() => {
    if (!isMeasured) return;
    startAutoplay();
    return () => stopAutoplay();
  }, [isMeasured, startAutoplay, stopAutoplay]);

  const handleTransitionEnd = () => {
    if (isResetting.current) return;

    if (currentIndex >= 2 * N || currentIndex < N) {
      isResetting.current = true;
      setIsTransitioning(false);
      const equivalentIndex = N + (((currentIndex % N) + N) % N);
      setCurrentIndex(equivalentIndex);
    }
  };

  const slide = useCallback(
    (direction: 1 | -1) => {
      stopAutoplay();
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + direction);
      startAutoplay();
    },
    [stopAutoplay, startAutoplay],
  );

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    stopAutoplay();
    setIsTransitioning(false);
    dragStart.current = e.clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.current;
    setDragOffset(deltaX);
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50;
    setIsTransitioning(true);

    if (dragOffset < -threshold) {
      setCurrentIndex((prev) => prev + 1);
    } else if (dragOffset > threshold) {
      setCurrentIndex((prev) => prev - 1);
    }

    setDragOffset(0);
    startAutoplay();
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    stopAutoplay();
    setIsTransitioning(false);
    if (e.touches.length > 0) {
      dragStart.current = e.touches[0].clientX;
    }
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length === 0) return;
    const deltaX = e.touches[0].clientX - dragStart.current;
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 50;
    setIsTransitioning(true);

    if (dragOffset < -threshold) {
      setCurrentIndex((prev) => prev + 1);
    } else if (dragOffset > threshold) {
      setCurrentIndex((prev) => prev - 1);
    }

    setDragOffset(0);
    startAutoplay();
  };

  if (N === 0) return null;

  // One slide fills the viewport exactly. The track has no inter-item gap,
  // so each step is exactly one container width — no sliver of the next
  // slide can peek through (including subpixel rounding cases).
  const itemWidth = containerWidth > 0 ? containerWidth : 0;
  const stepWidth = itemWidth;
  const translateX = -currentIndex * stepWidth + dragOffset;

  const arrowClass =
    "w-8 h-8 rounded-full border border-black text-black flex items-center justify-center transition-colors duration-300 hover:border-secondary hover:text-secondary cursor-pointer";

  return (
    <section className="w-full lg:w-auto lg:flex-1 min-w-0 flex flex-col justify-center items-center">
      <div className="w-full ">
        <div
          ref={containerRef}
          className="w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: "pan-y" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDragStart={(e) => e.preventDefault()}
        >
          <div
            className="flex items-stretch"
            style={{
              gap: 0,
              transform: `translate3d(${translateX}px, 0, 0)`,
              transition:
                isTransitioning && isMeasured
                  ? "transform 300ms ease-out"
                  : "none",
              visibility: isMeasured ? "visible" : "hidden",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {expandedItems.map((item, index) => (
              <div
                className={`shrink-0 flex flex-col md:flex-row justify-center items-start md:items-stretch gap-4 md:gap-6`}
                style={{ width: itemWidth }}
                key={index}
              >
                <p className="self-start md:[writing-mode:vertical-lr] rotate-0 md:rotate-180 text-[16px] font-medium leading-[120%] tracking-[5.12px] uppercase text-secondary">
                  {item.name}
                </p>
                <div className="w-full md:w-[1px] h-[1px] md:h-auto bg-paragraph/10" />
                <div className="flex flex-col justify-center items-start gap-4 md:gap-6">
                  <p className="paragraph text-paragraph">{item.description}</p>
                  <div className="flex justify-center items-center gap-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <img
                        key={i}
                        src="/icons/star-small.svg"
                        alt="Star"
                        decoding="async"
                        loading="eager"
                        width="8"
                        height="8"
                        className="w-4 h-4"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-start gap-4 mt-8 w-full">
          <button
            type="button"
            onClick={() => slide(-1)}
            aria-label="Previous review"
            className={arrowClass}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
            >
              <g clip-path="url(#clip0_140_1037)">
                <path
                  d="M20 0.5C25.1717 0.5 30.1321 2.55398 33.7891 6.21094C37.446 9.8679 39.5 14.8283 39.5 20C39.5 25.1717 37.446 30.1321 33.7891 33.7891C30.1321 37.446 25.1717 39.5 20 39.5C14.8283 39.5 9.8679 37.446 6.21094 33.7891C2.55398 30.1321 0.5 25.1717 0.5 20C0.5 14.8283 2.55398 9.8679 6.21094 6.21094C9.8679 2.55398 14.8283 0.5 20 0.5ZM20 1C14.9609 1 10.1286 3.00224 6.56543 6.56543C3.00224 10.1286 1 14.9609 1 20C1 25.0391 3.00224 29.8714 6.56543 33.4346C10.1286 36.9978 14.9609 39 20 39C25.0391 39 29.8714 36.9978 33.4346 33.4346C36.9978 29.8714 39 25.0391 39 20C39 14.9609 36.9978 10.1286 33.4346 6.56543C29.8714 3.00224 25.0391 1 20 1ZM19.125 14.374C19.2245 14.3741 19.3202 14.4131 19.3906 14.4834C19.4612 14.5539 19.501 14.6502 19.501 14.75C19.5009 14.8246 19.4782 14.8968 19.4375 14.958L19.3906 15.0156L15.6328 18.7715L14.7793 19.625H26.125C26.2245 19.625 26.3203 19.6641 26.3906 19.7344C26.4609 19.8047 26.5 19.9005 26.5 20C26.5 20.0995 26.4609 20.1953 26.3906 20.2656C26.3203 20.3359 26.2245 20.375 26.125 20.375H14.7793L15.6328 21.2285L19.3906 24.9844C19.4255 25.0193 19.4528 25.0609 19.4717 25.1064C19.4905 25.152 19.5009 25.2007 19.501 25.25C19.501 25.2994 19.4906 25.3489 19.4717 25.3945C19.4528 25.44 19.4254 25.4818 19.3906 25.5166C19.3557 25.5514 19.3141 25.5788 19.2686 25.5977C19.223 25.6165 19.1743 25.6259 19.125 25.626C19.0756 25.626 19.0261 25.6166 18.9805 25.5977C18.9349 25.5788 18.8933 25.5514 18.8584 25.5166L13.6084 20.2656L13.5615 20.209C13.5478 20.1885 13.5359 20.1665 13.5264 20.1436C13.5075 20.098 13.498 20.0493 13.498 20C13.498 19.9507 13.5075 19.902 13.5264 19.8564C13.5359 19.8335 13.5478 19.8115 13.5615 19.791L13.6084 19.7344L18.8584 14.4834C18.9289 14.4129 19.0253 14.374 19.125 14.374Z"
                  stroke="#0D0D0D"
                />
              </g>
              <defs>
                <clipPath id="clip0_140_1037">
                  <rect width="40" height="40" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => slide(1)}
            aria-label="Next review"
            className={arrowClass}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
            >
              <g clip-path="url(#clip0_140_1039)">
                <path
                  d="M20 0.5C14.8283 0.5 9.8679 2.55398 6.21094 6.21094C2.55398 9.8679 0.5 14.8283 0.5 20C0.5 25.1717 2.55398 30.1321 6.21094 33.7891C9.8679 37.446 14.8283 39.5 20 39.5C25.1717 39.5 30.1321 37.446 33.7891 33.7891C37.446 30.1321 39.5 25.1717 39.5 20C39.5 14.8283 37.446 9.8679 33.7891 6.21094C30.1321 2.55398 25.1717 0.5 20 0.5ZM20 1C25.0391 1 29.8714 3.00224 33.4346 6.56543C36.9978 10.1286 39 14.9609 39 20C39 25.0391 36.9978 29.8714 33.4346 33.4346C29.8714 36.9978 25.0391 39 20 39C14.9609 39 10.1286 36.9978 6.56543 33.4346C3.00224 29.8714 1 25.0391 1 20C1 14.9609 3.00224 10.1286 6.56543 6.56543C10.1286 3.00224 14.9609 1 20 1ZM20.875 14.374C20.7755 14.3741 20.6798 14.4131 20.6094 14.4834C20.5388 14.5539 20.499 14.6502 20.499 14.75C20.4991 14.8246 20.5218 14.8968 20.5625 14.958L20.6094 15.0156L24.3672 18.7715L25.2207 19.625H13.875C13.7755 19.625 13.6797 19.6641 13.6094 19.7344C13.5391 19.8047 13.5 19.9005 13.5 20C13.5 20.0995 13.5391 20.1953 13.6094 20.2656C13.6797 20.3359 13.7755 20.375 13.875 20.375H25.2207L24.3672 21.2285L20.6094 24.9844C20.5745 25.0193 20.5472 25.0609 20.5283 25.1064C20.5095 25.152 20.4991 25.2007 20.499 25.25C20.499 25.2994 20.5094 25.3489 20.5283 25.3945C20.5472 25.44 20.5746 25.4818 20.6094 25.5166C20.6443 25.5514 20.6859 25.5788 20.7314 25.5977C20.777 25.6165 20.8257 25.6259 20.875 25.626C20.9244 25.626 20.9739 25.6166 21.0195 25.5977C21.0651 25.5788 21.1067 25.5514 21.1416 25.5166L26.3916 20.2656L26.4385 20.209C26.4522 20.1885 26.4641 20.1665 26.4736 20.1436C26.4925 20.098 26.502 20.0493 26.502 20C26.502 19.9507 26.4925 19.902 26.4736 19.8564C26.4641 19.8335 26.4522 19.8115 26.4385 19.791L26.3916 19.7344L21.1416 14.4834C21.0711 14.4129 20.9747 14.374 20.875 14.374Z"
                  stroke="#0D0D0D"
                />
              </g>
              <defs>
                <clipPath id="clip0_140_1039">
                  <rect
                    width="40"
                    height="40"
                    fill="white"
                    transform="matrix(-1 0 0 1 40 0)"
                  />
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
