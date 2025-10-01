/**
 * Hypertune Configuration for Next.js App Router
 *
 * To set up Hypertune:
 * 1. Sign up at https://app.hypertune.com
 * 2. Create a new project
 * 3. Get your API token from the project settings
 * 4. Add NEXT_PUBLIC_HYPERTUNE_TOKEN to your .env.local file
 * 5. Install the Hypertune SDK: npm install hypertune
 * 6. Generate types: npx hypertune --token=YOUR_TOKEN generate
 *
 * For more information, see:
 * https://docs.hypertune.com/getting-started/next.js-app-router-quickstart
 */

// Uncomment and configure when you have your Hypertune token:
// import { initHypertune } from "hypertune";
// import { cookies, headers } from "next/headers";

// export async function getHypertune() {
//   const hypertuneToken = process.env.NEXT_PUBLIC_HYPERTUNE_TOKEN;

//   if (!hypertuneToken) {
//     console.warn("NEXT_PUBLIC_HYPERTUNE_TOKEN is not set");
//     return null;
//   }

//   const hypertune = initHypertune({
//     token: hypertuneToken,
//     context: {
//       // Add your context here, for example:
//       // environment: process.env.NODE_ENV,
//       // version: process.env.NEXT_PUBLIC_APP_VERSION,
//     },
//   });

//   return hypertune;
// }

export const hypertuneConfig = {
    placeholder: true,
    message: "Configure Hypertune by following the instructions above",
};
