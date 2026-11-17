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

## Page Studio

Use the [GitHub Pages Page Studio](https://mshahrooz.github.io/Newcitywellness/studio/) to draft and preview edits. Approved editors sign in with credentials from the dedicated NewCity Wellness Supabase project and click **Publish to GitHub Pages**. Choose any of the 15 public pages using the dropdown. Switching pages saves the current draft in this browser. New browsers open the last fully deployed draft when one exists. Publishing updates only the selected page and never updates another page’s draft.

The **Add element** palette groups text, media and links, and layout blocks. Use **Preview** and the device buttons to check placement before publishing.

- **Sections** in the top bar lists the current order. Move a section up or down from the list or with its selection toolbar arrows.
- Select an element, then hold and drag it directly on the canvas or use its grip. The grid is visible while dragging. Drag a block from **Add element** onto an insertion gap to place it. Drag an existing block near another block’s edge to reorder it. Hold **Shift** to move without changing the order.
- Drag a card over another card in **Explore Our Therapies** or **Areas We Support**. The card follows your pointer and its neighbors shift while you drag. Release to keep the new order or press **Escape** to cancel. Drag decorative dividers as a unit, or drop them into a nearby flow position.
- The **Add element** toolbox is drag-only. Hover over a tile for its grip, then drag it onto the page. Clicking the tile does not add a block or activate placement.
- **YouTube video** accepts watch, share, Shorts, and live URLs and renders the video automatically. Use **Preview** to play it.
- **Embed code** accepts an HTTPS embed URL, iframe code, or HTML snippets. Custom code runs in an isolated frame. Some providers limit where embeds work.
- Drop a block into the space to the left or right of another block to create columns without adding a row first. Drop at the edge of an existing automatic column to extend the group.
- The dotted outline identifies the active drop target. The selected block’s up/down arrows reorder adjacent content. Arrow keys move the selection, and Alt plus an arrow nudges without reordering.
- **Columns** accepts a custom count from 1 to 100. Click the row or a column, then drag the green divider between two columns. A focused divider also supports keyboard arrow keys. Rows stack on phones. Very wide rows can scroll horizontally on larger screens.

See [the publisher setup and rollback guide](supabase/README.md). GitHub is the source and host. Vercel is not part of this publishing flow.

Studio automatically opens the verified GitHub Pages version when a published page is opened and when a new deployment goes live. Browser-only changes are kept under **Draft tools → Recovered drafts** if the editor switches to a live version. Drafts based on the current page can be resumed there. A page without a Studio publication still restores its last saved browser draft.
