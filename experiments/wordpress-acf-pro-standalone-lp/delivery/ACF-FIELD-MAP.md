# Standalone LP Sample — ACF Field Map

Validation fixture field ownership for the selectable `page-lp.php` Page Template.

| Field | Stable key | Type | Ownership / behavior |
| --- | --- | --- | --- |
| Hero title | `field_lp_hero_title` | Text | Required editor-owned heading |
| Hero body | `field_lp_hero_body` | Textarea | Optional editor-owned body copy |
| Hero CTA | `field_lp_hero_cta` | Link | Optional editor-owned link |
| Cards | `field_lp_cards` | Repeater | Optional editor-managed collection, 0–12 rows |
| Card title | `field_lp_card_title` | Text | Required within a card row |
| Card body | `field_lp_card_body` | Textarea | Optional within a card row |
| Card image | `field_lp_card_image` | Image | Optional, returns WordPress attachment ID |
| Card link | `field_lp_card_link` | Link | Optional within a card row |

Field group: `group_standalone_lp_sample` (`Standalone LP Sample`).

The Repeater is intentional **only for this fixture** because its QA contract explicitly exercises editor add/remove/reorder behavior. Repeated visual appearance by itself is not sufficient reason to use Repeater or Flexible Content in a real project.

Changing a `group_*` or `field_*` key is treated as a content-schema migration, not as routine visual repair.
