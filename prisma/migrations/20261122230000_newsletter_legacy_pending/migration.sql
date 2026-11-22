-- Legacy rows were created by the old signup handler with active=true and a
-- null confirmedAt: they were never confirmed, because confirmation did not
-- exist. Double opt-in only means anything if those rows start inactive too.
-- A fresh confirmation link is sent when such an address signs up again.
UPDATE `NewsletterSubscriber`
SET `active` = false
WHERE `confirmedAt` IS NULL AND `active` = true;
