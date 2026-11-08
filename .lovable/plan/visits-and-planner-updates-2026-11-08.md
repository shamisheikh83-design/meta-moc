# Visits and Planner updates

## What will change
- Add a date-range filter and visit-count grouping to the Visits retailer list. Show each shop's count; tapping it opens its visit dates. Count filters cover 0, 1, 2, 3, 4, and 5+ visits, with 0 meaning no visits in the chosen range. Sort matching shops from most visits downward.
- Limit the Planner calendar year selector to 2026–2040.
- Add multi-select deletion for retailers in the selected Planner day, removing only selected shops from that plan.

## Technical details
- Reuse the existing Visits and Planner components, store types, checkboxes, and calendar. Add focused tests for date-range counts, count buckets, and the supported Planner year range.
