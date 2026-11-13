# Image assets

- Store every image used by this GitHub Pages site in this repository. Place page photos under `public/images/` and use local paths that work with the GitHub Pages `BASE_PATH`. Do not hotlink images from WordPress, stock sites, or other hosts. This includes CSS backgrounds, favicons, posters, and social preview images.
- Optimize new raster images before committing them. Compare the result with the original at the size visitors will see, including high-density screens. Use WebP or AVIF for photos when smaller, keep SVG for vector artwork, and use lossless encoding for assets where fidelity or transparency calls for it. Keep an existing optimized format if conversion increases size or visibly changes the image.
- Size photos to their display needs, use responsive variants when useful, and preserve important framing, faces, text, and transparency. Add width and height to prevent layout shifts. Lazy-load below-the-fold images, not the main hero.
- Test the static export with `python3 scripts/check_local_images.py out`. The Pages deployment runs the same check before publishing. Normal links to other websites, such as booking and directions, are unaffected.
