# New City Wellness visual editor

The editor is at `/admin/` under the website's base path. It edits designated content slots without rewriting the page layout, navigation, booking links, or forms. Each of the 15 public pages has a preview, editable hero text, other designated copy, and an additional block area. The homepage, overview pages and individual service pages also support selected photo replacements. The public site receives static HTML on deployment and does not request content from the GitHub API.

## Unlock and publish

1. On GitHub, create a fine-grained personal access token restricted to the **Newcitywellness** repository. Set **Repository permissions → Contents → Read and write** and an expiration.
2. Enter the token in the editor's single password field. The token is sent only to GitHub's API and kept in tab memory. It is not stored in the repository, local storage, preview iframe, or draft download. Use a token you control and lock the editor when finished.
3. Choose a page and preview size. Click a heading, paragraph, or supported photo to open its edit popup, then choose **Apply to draft**. Use **Show editable areas** or **Find item** to locate content. The preview fills the workspace, and **Fullscreen** can hide the browser chrome. Use **Add / manage blocks** for headings, paragraphs, and public PDF/DOCX downloads. Drag blocks into order or use the arrow buttons.
4. Select **Publish to GitHub**, then confirm. This commits the content and assets atomically to `main` and starts the existing Pages workflow. The content is public once published. Check Actions if the deployment takes longer than expected.
5. For rollback, revert the publishing commit in GitHub and let Pages redeploy.

GitHub Pages serves the login screen as a public static page. This is not a private admin URL or a custom-password server. GitHub validates the token and enforces repository writes. No Supabase, database, or additional service is needed. A token with Contents write can edit other files in the same repository, so do not share a personal token or grant unnecessary permissions.

## Uploads and drafts

- Photos are converted to WebP on-device and resized before upload. Uploaded photos and files are stored in the repository, never hotlinked.
- Public PDF and DOCX files up to 4 MB can be published. Never upload patient information, filled-in insurance forms, or other private data.
- JSON draft backups contain copy and references, not the actual files. Keep originals until publication is verified. Unpublished changes are held in the editor tab and are not stored remotely.
- Removing a document block removes the link from the page, not the previously published file or its Git history.
- Concurrent changes are rejected rather than overwritten. Copy or download your edits before reopening the editor if GitHub reports a conflict.
