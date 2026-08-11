# REF-001 Blind Clean FIRST PASS implementation

Isolated WordPress-compatible benchmark fixture. It intentionally does **not** claim the unresolved production theme/runtime integration.

## Ownership map

| Figma section | PHP owner | Style owner | Content owner |
|---|---|---|---|
| Header | `template-parts/header-site.php` | `style.css` Header | global site-owned |
| Main Visual | `sections/main-visual.php` | `style.css` Main visual | art-direction + page copy |
| Reason | `sections/reason.php` | `style.css` Reason | page ACF fixed fields |
| Education | `sections/education.php` | `style.css` Education | fixed semantic steps; copy/image candidates |
| Shared CTA ×2 | `sections/shared-cta.php` | `style.css` Shared CTA | shared/global; URLs unresolved |
| Student Voice | `sections/student-voice.php` | `style.css` Student voice | fixed visible states; no invented accordion |
| Messages | `sections/messages.php` | `style.css` Messages | one visible record; no invented carousel |
| Courses | `sections/courses.php` + `inc/course-domain.php` | `style.css` Courses | 7 identities/order/color code-owned; 21 page copy fields |
| Links | `sections/links.php` | `style.css` Links | labels evidenced; URLs unresolved |
| CTA Value | `sections/cta-value.php` | `style.css` CTA value | layered composition; action URLs unresolved |
| Footer | `template-parts/footer-site.php` | `style.css` Footer | global site-owned |

## Responsive authority

Only one production breakpoint is implemented: mobile `<= 767px`, desktop `>= 768px`. Exact visual acceptance endpoints remain 375px and 1380px. Other requested widths are runtime-safety probes.

## Asset limitation in this FIRST PASS

The connected Figma tool exposes short-lived image URLs but this execution sandbox cannot persist those URL bytes into the repository without publishing the short-lived URLs. The FIRST PASS therefore keeps real media ownership/crop boxes explicit while rendering neutral fixture media placeholders. This limitation is recorded as unresolved evidence and must not be hidden by CSS hacks.
