import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quack 2.0',
  description: 'Real-time 3D Multiplayer Stream Overlay',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
