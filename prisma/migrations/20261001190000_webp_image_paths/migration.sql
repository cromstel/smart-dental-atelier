-- Rewrite every stored image path to its WebP equivalent.
--
-- `scripts/optimize-images.mjs` transcodes the bundled photography to WebP and
-- deletes the source files, but image paths are also stored as rows: the
-- gallery is seeded from `lib/content.js`, and the OG image is a site setting.
-- Without this migration those rows keep pointing at files that no longer exist
-- and every portfolio tile renders as a broken image.
--
-- Only the extension is rewritten, and only for paths under `/images/`, so a
-- genuine `/uploads/...webp` path or any `http(s)://` URL is left alone.

UPDATE `GalleryImage`
SET `url` = REPLACE(`url`, '.jpg', '.webp')
WHERE `url` LIKE '/images/%' AND `url` REGEXP '\\.(jpg|jpeg|png|bmp|tiff?)(\\?|$)';

UPDATE `Service`
SET `image` = REPLACE(`image`, '.jpg', '.webp')
WHERE `image` LIKE '/images/%' AND `image` REGEXP '\\.(jpg|jpeg|png|bmp|tiff?)(\\?|$)';

UPDATE `Testimonial`
SET `image` = REPLACE(`image`, '.jpg', '.webp')
WHERE `image` LIKE '/images/%' AND `image` REGEXP '\\.(jpg|jpeg|png|bmp|tiff?)(\\?|$)';

UPDATE `Page`
SET `image` = REPLACE(`image`, '.jpg', '.webp')
WHERE `image` LIKE '/images/%' AND `image` REGEXP '\\.(jpg|jpeg|png|bmp|tiff?)(\\?|$)';

UPDATE `Setting`
SET `value` = REPLACE(`value`, '.jpg', '.webp')
WHERE `value` LIKE '/images/%' AND `value` REGEXP '\\.(jpg|jpeg|png|bmp|tiff?)(\\?|$)';

-- Page blocks hold HTML, so every occurrence in the body is rewritten.
UPDATE `PageBlock`
SET `body` = REPLACE(REPLACE(`body`, '.jpg', '.webp'), '.jpeg', '.webp')
WHERE `body` REGEXP '/images/[^[:space:]"<>]*\\.(jpg|jpeg|png|bmp|tiff?)(\\?|$)';