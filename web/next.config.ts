import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@creit.tech/stellar-wallets-kit"],
  // The StellarWalletsKit modules inject a CSS custom property
  // (`--swk-background`) onto <html> during their import-time evaluation.
  // This causes React to flag a hydration-mismatch warning, which the
  // Next.js dev overlay paints as a red badge in the corner of the page.
  // The mismatch is harmless at runtime (the DOM converges after hydration
  // and the value is only an internal kit style variable), but the badge
  // dominates documentation screenshots. Suppressing the indicator keeps
  // the page clean for the README capture while still surfacing real
  // errors in the browser console. The mismatch does not exist in
  // production builds (`next start`) — `devIndicators: false` is purely a
  // dev-mode ergonomics fix.
  devIndicators: false,
};

export default nextConfig;
