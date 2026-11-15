# Page Studio publishing

The [Page Studio](https://mshahrooz.github.io/Newcitywellness/studio/) is public for editing and previewing. Only approved accounts in the dedicated NewCity Wellness Supabase project can write to GitHub. The existing [Pages workflow](https://github.com/mshahrooz/Newcitywellness/actions/workflows/deploy.yml) owns deployment. Choose any public page from the top-bar dropdown. Each publish changes the selected page and its draft, without changing other pages, site hosting, or DNS.

## One-time owner setup

1. In [GitHub App settings](https://github.com/settings/apps/new), create a private app owned by `mshahrooz`, with Home page URL `https://mshahrooz.github.io/Newcitywellness/studio/`. Disable webhooks. Under Repository permissions, grant **Contents → Read and write**. No user OAuth or write to Actions is required.
2. Open the app's **Install App** page. Install it on **Only select repositories → Newcitywellness**. The installation ID is the final number on its installation settings URL. Record the **App ID** from the app's **General** tab and generate a **private key** there.
3. In the separate [NewCity Wellness Supabase project](https://supabase.com/dashboard/project/wiwujlfmqqirswhbvvyy), go to **Authentication → Users** to create a user with an email and strong temporary password or invite a user through your preferred account-onboarding flow. A password user who is set up directly must have a confirmed email before publishing. Use a distinct account per publisher. Disable public user sign-ups in the project's Auth settings. Copy the UID of each confirmed user who should publish.
4. Open [Edge Function Secrets](https://supabase.com/dashboard/project/wiwujlfmqqirswhbvvyy/functions/secrets) in the NewCity Wellness project and add:

   | Name | Value |
   | --- | --- |
   | `STUDIO_GITHUB_APP_ID` | The App ID from GitHub |
   | `STUDIO_GITHUB_INSTALLATION_ID` | The installation ID for Newcitywellness |
   | `STUDIO_GITHUB_PRIVATE_KEY` | The entire downloaded private key PEM, including BEGIN and END lines |
   | `STUDIO_PUBLISHER_IDS` | The approved Supabase user UIDs, separated by commas |

   Do not put the private key or editor passwords in the repository. No Supabase secret or service-role key is required in the browser. The publishable key in the editor config is designed to be public.
5. In Studio, open **Publish page**, sign in with your Supabase publisher account, and click **Test publishing access**. This checks GitHub write access without changing the live site. To publish after checking your visual edits, click **Publish to GitHub Pages**. The confirmation links to the commit and the Pages build. Direct branch rules still apply. Remove a UID from the Edge Function secret to revoke that person's right to publish.

## Function maintenance

Deploy `supabase/functions/publish-homepage/index.ts` with `publisher.mjs` and `pages.mjs` as `publish-homepage` in project `wiwujlfmqqirswhbvvyy` with JWT verification enabled. The function also looks up the current user and checks the server-side UID allowlist before accessing GitHub.

The publishing request can include up to 24 MiB of page content and media. GitHub changes are limited to the selected page’s publication JSON, recoverable draft, and recognized media. Home retains its original paths. Interior publications are stored in `src/content/studio-pages/` and `public/homepage-studio/pages/`. The function rejects stale base revisions and does not force-push. The GitHub Pages build validates the result before deploying. To roll back a publication, revert its commit in GitHub. To build locally, use the repository's normal `BUILD_TARGET=pages BASE_PATH=/Newcitywellness npm run build:pages` command.
