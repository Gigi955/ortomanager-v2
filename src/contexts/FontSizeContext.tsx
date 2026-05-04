import { createContext, useContext, useEffect, useState } from 'react';

export type FontSize = 'normal' | 'large' | 'xlarge' | 'xxlarge';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType>({
  fontSize: 'normal',
  setFontSize: () => {},
});

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>('normal');

  useEffect(() => {
    // Leggi preferenza salvata
    const saved = localStorage.getItem('orto-font-size') as FontSize | null;
    if (saved === 'large' || saved === 'normal' || saved === 'xlarge' || saved === 'xxlarge') {
      setFontSizeState(saved);
      applyFontSize(saved);
    }
  }, []);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('orto-font-size', size);
    applyFontSize(size);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

function applyFontSize(size: FontSize) {
  const root = document.documentElement;
  if (size === 'xxlarge') {
    root.style.fontSize = '22px';
  } else if (size === 'xlarge') {
    root.style.fontSize = '20px';
  } else if (size === 'large') {
    root.style.fontSize = '18px';
  } else {
    root.style.fontSize = '16px';
  }
}

export function useFontSize() {
  return useContext(FontSizeContext);
}
