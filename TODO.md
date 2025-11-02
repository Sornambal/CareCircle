# Multilanguage Enhancement Plan (Using Polyglot.js)

## Overview
Enhance the current simple key-value translation system to use Polyglot.js for better scalability. Support Tamil, English, Telugu, Malayalam, Hindi. All text on dashboard screens and notifications (except medicine names) will be translatable.

## Steps
- [ ] Install polyglot.js dependency in frontend.
- [ ] Create JSON translation files: en.json, ta.json, te.json, ml.json, hi.json (convert from translations.js).
- [ ] Create i18n setup file (e.g., src/utils/i18n.js) to load translations and provide t function.
- [ ] Update useMultilingualNotifications.js to use new t function for notifications.
- [ ] Update ElderlyDashboard.js to use t function.
- [ ] Update CaregiverDashboard.js to use t function.
- [ ] Update SOSButton.js for any hardcoded translations.
- [ ] Update other components if needed (e.g., MedicineCard.js, ReportCard.js).
- [ ] Test text translations on dashboards and notifications in all languages.
- [ ] Verify medicine names remain untranslated.
- [ ] Update backend preferredLanguage if needed (add Telugu support).
