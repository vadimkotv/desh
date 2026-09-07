import localFont from 'next/font/local';

// Inter + JetBrains Mono (Google Fonts, OFL) self-hosted as variable woff2 so the
// build never depends on fonts.googleapis.com being reachable.
export const inter = localFont({
  src: '../fonts/inter-latin-wght.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
});

export const jetbrains = localFont({
  src: '../fonts/jetbrains-mono-latin-wght.woff2',
  variable: '--font-jetbrains',
  weight: '100 800',
  display: 'swap',
});
