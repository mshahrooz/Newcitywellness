# New City Wellness website builder

Open `/admin/` or `/admin/pageforge/` under the GitHub Pages site path to see the current site in a temporary draft. Connect a GitHub token when you want to publish. No external dashboard backend is required.

## Build a page

1. Pick one of the 15 pages and choose Desktop, Tablet or Mobile. Use **Fullscreen** for more workspace. **Preview** hides editing controls.
2. Drag a title, paragraph, photo, button, file download, YouTube video or uploaded video from the toolbar onto a dotted slot. On touchscreens or with a keyboard, click the slot instead and pick an element. Fill in the popup and select **Apply to draft**.
3. Use **Section** or a section divider to insert a new section. Drag section handles to divider lines or use the up/down buttons. Open section settings to name it or set background and text colors.
4. Use **Add row** to create one to four columns, then drag elements between rows, columns or sections. The columns stack on mobile. **Move to…** in an element’s popup provides a non-drag alternative. Undo and Redo work across the draft.
5. Click existing text or supported photos to edit them. **Find text** is useful for text inside closed menus and accordions, including shared header and footer labels. Existing forms and interactive templates stay in place. Use the surrounding drop zones and inline slots to add new content without replacing those features.

## Publish

Create a fine-grained GitHub personal access token restricted to **Newcitywellness**, with **Contents: Read and write** and an expiration. Paste it directly into the builder’s password field. It is kept in tab memory, sent only to GitHub, and never written to content or drafts. The demo cannot publish.

Choose **Publish to GitHub**, then confirm. One Git commit contains the changes and any attached public assets. GitHub Pages rebuilds the static site. A concurrent content edit is rejected rather than overwritten. To roll back a published change, revert that commit in GitHub.

If a token expires or GitHub denies access while publishing, use **More → Reconnect GitHub** with a new token. Keep the same tab open so the draft and uploads remain available. Select **Only select repositories → Newcitywellness** and confirm **Contents → Read and write** when creating the token. The editor reports whether GitHub rejected the token, denied a repository operation, limited requests, or blocked a branch update.

## Uploads

- Photos are resized and compressed to WebP before uploading.
- Documents support PDF, DOCX, TXT, XLSX, PPTX and CSV up to 8 MB.
- Uploaded videos support MP4 and WebM up to 20 MB. Use a YouTube link for a larger video.
- Upload only public website content. Removing an element removes it from the page, not from earlier commits. Draft JSON backups contain text, structure and file references, not the file bytes.

## PageForge Studio integration

The dashboard now opens directly into the website canvas in draft mode and does not require a token to start editing. Use **Connect GitHub** only when you are ready to publish. Your current draft stays open when you connect, provided the published content has not changed since you loaded it.

- Select a page to see its original header, sections, images, and footer. Click editable text or photos for a popup. Use **Find text** for content inside a collapsed menu or accordion.
- Drag a block from the toolbar. PageForge drop guides appear inside sections and at section boundaries. Hover over a section to drag its handle to another position. **Drop zones** exposes the same placement controls for keyboard and touch use.
- Choose **Section** or its settings to add a section or change colors. **Add row** creates up to four columns. Existing text inside interactive components can be edited but is not detached from the component.
- The editor shows the site's actual markup and styling. Live form submission and application scripts are disabled inside the editing frame. The published site still uses its own production React components and scripts.

The integration adapts the drag state and midpoint insertion behavior of [PageForge Studio](https://github.com/VinodPrabhashvara/PageForge-Studio), distributed under MIT. See [the license](licenses/PageForge-Studio.txt). The old `/admin/grapes/` address is a compatibility entry to the same dashboard.

## Homepage Studio publishing

The WPBakery-style [Homepage Studio](https://new-city-wellness-bakery-studio.vercel.app/) writes only the GitHub Pages homepage publication, its recoverable editor draft, and the media referenced by it. It does not change the other pages, the old dashboards, or any content on newcitywellness.com. A normal Pages build with no studio publication uses the original Next.js homepage.

Edit the page and check desktop and mobile preview, then choose **Publish homepage**. Sign in to GitHub as `mshahrooz` and create a fine-grained token for **Only select repositories → Newcitywellness** with **Contents → Read and write**. Give the token an expiry. Paste it in the editor's password field, review the confirmation, and publish. The token is used only for that publish request and sent directly to GitHub. Do not add it to the repository or the hosting environment. **Save draft** still saves only in the browser. After the commit, use **Watch Pages build** or **Check live homepage**.

Upload background media before publishing rather than hotlinking a remote image or video. Media used by the homepage goes into `public/images/homepage-studio/` or `public/media/homepage-studio/`. Subsequent browsers can choose **Load published homepage into editor** to resume a saved publication.

A Pages build validates the edited HTML and local assets after Next.js exports the site. It preserves the production homepage's metadata, fonts, and stylesheet links. The homepage-only runtime retains the mobile menu, testimonial arrows, and mailto contact form. If the native homepage source changes, the build falls back to the updated native page instead of showing a stale Studio publication. Do not edit the homepage simultaneously in the old dashboard and in Studio. Revert a Studio publication commit in GitHub to roll back.
