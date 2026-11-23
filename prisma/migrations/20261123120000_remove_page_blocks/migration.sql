-- PageBlock never had a renderer, an editor, an API route or seed rows. The
-- admin screen has always been an SEO/visibility editor, so the block table
-- is dead weight. Drop it; the bundled page components own long-form copy.
DROP TABLE IF EXISTS `PageBlock`;

-- The home hero H1 is now the admin-editable heading. Keep seeded rows in sync
-- so existing databases render the same H1 as a fresh install -- but only when
-- the stored heading is still the old default. A heading an admin customised
-- must survive the upgrade.
UPDATE `Page`
SET `heading` = 'Dental Atelier is here to empower you to live a healthy, happy life with a peace of mind.'
WHERE `slug` = 'home'
  AND (`heading` = 'A state-of-the-art laboratory' OR `heading` IS NULL);
