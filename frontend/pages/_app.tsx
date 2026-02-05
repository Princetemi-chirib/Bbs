import type { AppProps } from 'next/app';

// This file exists only to keep Next.js' Pages Router internals satisfied during build
// in environments that still probe for `/_app` / `/_document`.
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
