export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            function getThemePreference() {
              const storedTheme = localStorage.getItem('literature-shop-theme');
              if (storedTheme) return storedTheme;
              
              return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            
            const theme = getThemePreference();
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(theme);
            
            // For debugging
            console.log('Theme script executed, theme set to:', theme);
          })();
        `,
      }}
    />
  )
}

