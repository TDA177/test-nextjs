// app/layout.js
import "./globals.css";

export const viewport = {
  themeColor: "#FF8FB1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata = {
  title: "Nhật ký bé xinh 📔 - Ghi chép từng ngày yêu thương",
  description: "Ghi lại từng khoảnh khắc bé xíu đáng yêu trong ngày — ảnh, tâm trạng, âm nhạc, video và hơn thế nữa.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nhật ký bé xinh",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <meta name="application-name" content="Nhật ký bé xinh" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nhật ký bé xinh" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
