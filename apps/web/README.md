# Web (apps/web)

Developer notes for the web package.

-   Autocomplete

    -   The project includes a reusable `Autocomplete` component at `src/components/ui/autocomplete.tsx`.
    -   It supports both local `options` and an async `fetchOptions` prop with a 300ms debounce. It selects on click and will auto-select an exact match on blur.
    -   The `NewAssessment` page uses Autocomplete for both `category` and `title` fields. Title suggestions are fetched from the API (`/api/rpc/query`) and limited to 10 results.

-   PDFs and files

    -   As a deliberate choice, PDFs are not uploaded to Supabase Storage. The frontend sends only metadata (name/size/mime) to `/api/assessments` and the server inserts lightweight attachment records.

-   Router migration
    -   A migration to TanStack Router was attempted but reverted to keep the repo buildable. The app currently uses `react-router-dom` (v6).
    -   If you want a full migration to TanStack Router, pick the exact major version you want and I can perform a careful, multi-step migration (update `package.json`, adapt route definitions, then update `useNavigate` usages across pages).

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/250a25d9-7849-4342-9771-2e313f03ad2e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/250a25d9-7849-4342-9771-2e313f03ad2e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

-   Navigate to the desired file(s).
-   Click the "Edit" button (pencil icon) at the top right of the file view.
-   Make your changes and commit the changes.

**Use GitHub Codespaces**

-   Navigate to the main page of your repository.
-   Click on the "Code" button (green button) near the top right.
-   Select the "Codespaces" tab.
-   Click on "New codespace" to launch a new Codespace environment.
-   Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

-   Vite
-   TypeScript
-   React
-   shadcn-ui
-   Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/250a25d9-7849-4342-9771-2e313f03ad2e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
