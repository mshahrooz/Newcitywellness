# New City Wellness website builder

Open `/admin/` under the GitHub Pages site path. Choose **Try the builder without publishing** to practice on the current site in a temporary draft, or unlock it with a GitHub token to publish. No external dashboard backend is required.

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

## GrapesJS Design Studio

Open **GrapesJS Design Studio** from the builder header, or go to `/admin/grapes/`. The studio opens in a demo state and does not write to GitHub until you connect and confirm publishing.

- Select the page, then drag a section, columns, title, paragraph, photo, button, file download, YouTube video or local video from **Blocks**. Double-click new text to edit it. The block panel also has a click-to-insert option.
- Click a new block to open its **Styles** panel or the relevant media controls. Uploaded files use the same repository and limits as the existing builder. Use **Layers** to review the structure and the device controls to check widths.
- Existing Next.js sections are shown as reorderable cards. They are not imported as editable HTML. Use the original Site Builder to edit their copy, colors, and content so forms and interactive features keep working. If a page has been reordered in GrapesJS, its published section order is controlled by GrapesJS.
- GitHub stores the editable GrapesJS project and separate HTML/CSS output. The build cleans and scopes that output before rendering it on the public page. **Backup** downloads the project and HTML/CSS as JSON. Uploaded files are not embedded in that backup.
