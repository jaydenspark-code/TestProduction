import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'classic' | 'professional';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('classic');

  useEffect(() => {
    const savedTheme = localStorage.getItem('earnpro-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('earnpro-theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'classic' ? 'professional' : 'classic';
    handleSetTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, toggleTheme }}>
      <div className={theme === 'professional' ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};