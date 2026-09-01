export const BUTTON_COLOR_CLASSES = {
  text1: "text-paragraph uppercase",
  text2: "text-white uppercase",
  bg1: "bg-secondary",
  bg2: "bg-accent w-full",
  borderPrimary: "border-primary",
  borderInverse: "border-black",
} as const;

export const BUTTON_VARIANT_CLASSES = {
  light: {
    textClass: BUTTON_COLOR_CLASSES.text1,
    extraBtnClass: `${BUTTON_COLOR_CLASSES.borderPrimary} ${BUTTON_COLOR_CLASSES.bg1}`,
  },
  dark: {
    textClass: BUTTON_COLOR_CLASSES.text2,
    extraBtnClass: `${BUTTON_COLOR_CLASSES.bg2} ${BUTTON_COLOR_CLASSES.borderInverse}`,
  },
} as const;
