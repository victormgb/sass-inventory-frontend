import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /*
       * A tenant logo travels to a Server Action, and this is the cap on the raw
       * request body: Next.js defaults it to 1MB and the framework rejects anything
       * larger with a digest error that reaches the browser as raw JSON, naming
       * neither the field nor the real limit.
       *
       * Deliberately 3mb and not the 2mb Laravel enforces. The limit counts the
       * bytes multipart adds for its boundaries and part headers (roughly 10-20KB),
       * so matching the two exactly would mean a logo just under the cap still
       * tripping the framework check and showing that error instead of the API's
       * own, which names the limit and the field. Staying above leaves Laravel as
       * the single place the rule lives.
       *
       * Raise this together with the `max` and `dimensions` rules in
       * UploadOrganizationLogoRequest, never on its own.
       */
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;