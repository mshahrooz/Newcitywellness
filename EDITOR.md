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

## Uploads

- Photos are resized and compressed to WebP before uploading.
- Documents support PDF, DOCX, TXT, XLSX, PPTX and CSV up to 8 MB.
- Uploaded videos support MP4 and WebM up to 20 MB. Use a YouTube link for a larger video.
- Upload only public website content. Removing an element removes it from the page, not from earlier commits. Draft JSON backups contain text, structure and file references, not the file bytes.
