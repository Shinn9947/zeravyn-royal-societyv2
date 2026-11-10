import "./globals.css";

export const metadata = {
  title: "Zeravyn Royal Society | Member Selection",
  description: "Official member selection portal of Zeravyn Royal Society."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}