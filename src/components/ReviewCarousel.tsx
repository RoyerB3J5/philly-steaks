import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type MouseEvent,
  type TouchEvent,
} from "react";

const GAP = 24;
const AUTOPLAY_INTERVAL = 8000;

type ReviewItem = {
  description: string;
  name: string;
  color: string;
  icon: string;
};

interface CarouselReviewProps {
  items: ReviewItem[];
}

export default function ReviewCarousel({ items }: CarouselReviewProps) {
  if (items.length === 0) return null;

  const N = items.length;
  const expandedItems = [...items, ...items, ...items];

  const [currentIndex, setCurrentIndex] = useState(N);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [visibleItems, setVisibleItems] = useState(1);
  const [peekFraction, setPeekFraction] = useState(0.2);

  const dragStart = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isResetting = useRef(false);

  const measureContainerWidth = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsTransitioning(false);

      const windowWidth = window.innerWidth;
      if (windowWidth < 640) {
        setVisibleItems(1);
        setPeekFraction(0.02);
      } else if (windowWidth < 1024) {
        setVisibleItems(2);
        setPeekFraction(0.15);
      } else if (windowWidth < 1280) {
        setVisibleItems(3);
        setPeekFraction(0.2);
      } else {
        setVisibleItems(4);
        setPeekFraction(0.2);
      }

      measureContainerWidth();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measureContainerWidth]);

  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
        isResetting.current = false;
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [currentIndex, isTransitioning]);

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
    startAutoplay();
    return () => stopAutoplay();
  }, [visibleItems, startAutoplay, stopAutoplay]);

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

  const itemWidth =
    containerWidth > 0
      ? (containerWidth - (visibleItems + 1) * GAP) /
        (visibleItems + 2 * peekFraction)
      : 0;
  const stepWidth = itemWidth + GAP;
  // Account for the outer gaps so the neighboring-card peeks match exactly.
  const peekOffset = peekFraction * itemWidth + GAP;
  const translateX = -currentIndex * stepWidth + peekOffset + dragOffset;

  const arrowClass =
    "w-8 h-8 rounded-full border border-white text-white flex items-center justify-center transition-colors duration-300 hover:bg-[#2D2D2D] hover:text-white cursor-pointer";

  return (
    <section className="w-full flex flex-col justify-center items-center">
      <div className="w-full">
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
              gap: `${GAP}px`,
              transform: `translate3d(${translateX}px, 0, 0)`,
              transition: isTransitioning ? "transform 300ms ease-out" : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {expandedItems.map((item, index) => (
              <div
                className={`shrink-0 rounded-3xl ${item.color} flex flex-col justify-center items-start gap-7 p-8 border-2 border-black`}
                style={{ width: itemWidth }}
                key={index}
              >
                <img
                  src="/icons/coma.svg"
                  alt="Coma"
                  className="w-[34px] h-8"
                  decoding="async"
                  loading="lazy"
                />
                <p className="paragraph text-primary">{item.description}</p>
                <div className="w-full flex justify-between items-center">
                  <h3 className="paragraph-bold text-secondary">{item.name}</h3>
                  <img
                    src={`/icons/${item.icon}.svg`}
                    alt={item.icon}
                    className="w-14 h-14"
                    decoding="async"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mt-6 hidden">
          <button
            type="button"
            onClick={() => slide(-1)}
            aria-label="Previous review"
            className={arrowClass}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => slide(1)}
            aria-label="Next review"
            className={arrowClass}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
