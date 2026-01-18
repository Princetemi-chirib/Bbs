import { Head, Html, Main, NextScript } from 'next/document';

// This project uses the App Router (`frontend/app/*`).
// Some build environments still attempt to load `/_document` during `next build`.
// Providing a minimal custom Document prevents `PageNotFoundError: /_document`.
export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

