# TODO: Fix Preferred Language Issue

## Problem
User selects "Tamil" during registration, but dashboard remains in English because the i18n system expects language codes ('ta') instead of full names ('Tamil').

## Solution
- Add language mapping in dashboard components to convert full language names to i18n codes.
- Update ElderlyDashboard.js and CaregiverDashboard.js to use mapped language codes.

## Steps
1. Update ElderlyDashboard.js to include language mapping and set correct language code.
2. Update CaregiverDashboard.js to include language mapping and set correct language code.
3. Test the fix by registering with Tamil and logging in to verify dashboard language changes.
