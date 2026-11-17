# GitHub Pages Homepage Builder

`public/studio/homepage/` is the deployable Vite build of the private New City Wellness Homepage Builder, based on source commit `9b12e856b1089ee76a3d40b37c43695357e48e7b`. The source project is separate. The integration patch here limits this build to Home, links the existing Classic Studio pages, and retains export and portable project backup.

To refresh from the source project, apply `github-studio.patch` to the source checkout at that commit, install the locked dependencies with `npm ci`, run `npm test`, then run `npm run build -- --mode github-studio`. Replace the contents of `public/studio/homepage/` with the resulting `dist/` contents. The main repository's existing GitHub Pages build deploys these static files without changes to its workflow. The original materialized live homepage is a baseline snapshot and should be updated in the builder source when a new live layout needs to become the starting point.

The route at `/Newcitywellness/studio/` and `?page=home` enters the new Home editor. `?page=home&editor=classic` explicitly opens the Classic Home draft and keeps its Supabase-backed publishing workflow. Deep links to all other pages remain in Classic. The new builder writes only to its own browser storage and does not call the live publisher.
