// src/utils/breakpoints.js

export const BREAKPOINTS = {
  md: 768,
  lg: 1024,
  xl: 1280, 
};

export const MEDIA_QUERIES = {
  // Solo pantallas XL o superiores activan Desktop Pin
  isDesktopPin: `(min-width: ${BREAKPOINTS.xl}px)`,

  // Todo lo inferior a XL (incluyendo iPads verticales) activa Mobile/Tablet Flow
  isTabletMobileFlow: `(max-width: ${BREAKPOINTS.xl - 1}px)`,
};
