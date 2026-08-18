<?php
/**
 * Machine-readable Figma authority for REF-001 V2 + Human Review decisions.
 * Figma evidence and explicit user/product overrides remain distinguishable.
 */
return [
    'file' => 'ZYTdtw4wCgkcBy2cVnhxVI',
    'page' => '21376:1600',
    'frames' => [
        'pc' => ['node' => '21384:8173', 'width' => 1380, 'height' => 7714],
        'sp' => ['node' => '21376:4401', 'width' => 375, 'height' => 10817, 'device_chrome' => 40],
    ],
    'sections' => [
        'header' => ['pc' => ['21378:8066'], 'sp' => ['21376:4918']],
        'main-visual' => ['pc' => ['21378:8032'], 'sp' => ['21376:4886']],
        'reason' => ['pc' => ['21378:7999'], 'sp' => ['21376:4852']],
        'education' => ['pc' => ['21378:7868'], 'sp' => ['21376:4720']],
        'shared-cta' => ['pc' => ['21378:7867', '21378:7730'], 'sp' => ['21376:4719', '21376:4628']],
        'student-voice' => ['pc' => ['21378:7766'], 'sp' => ['21376:4650']],
        'messages' => ['pc' => ['21378:7746'], 'sp' => ['21376:4629']],
        'courses' => ['pc' => ['21378:7505'], 'sp' => ['21376:4403']],
        'links' => ['pc' => ['21378:7458'], 'sp' => ['21376:4919']],
        'cta-value' => ['pc' => ['21378:7481'], 'sp' => ['21376:4942']],
        'footer' => ['pc' => ['21378:7457'], 'sp' => ['21376:4402']],
    ],
    'layout' => [
        'sp_max_width' => 767,
        'desktop_from_width' => 768,
        'desktop_min_canvas_width' => 1280,
        'runtime_authority' => 'PRODUCT_DECISION',
        'rule' => 'User explicitly requested the PC endpoint design language from 768px upward with body min-width 1280px. Do not invent a separate fluid/tablet composition in 768-1279.',
    ],
    'interaction' => [
        'transition_ms' => 300,
        'prototype' => [
            'pc_final_frame_reactions' => 0,
            'sp_final_frame_reactions' => 0,
            'valid_ref001_reactions' => 0,
            'authority' => 'AUDITED',
            'note' => 'The final frames have no direct Prototype reactions. Main-component reactions were traced to their destinations before deciding whether they were valid REF-001 behavior.',
            'component_reaction_audit' => [
                'pc-header' => [
                    'instance' => '21378:8066', 'main_component' => '280:267',
                    'observed' => 'ON_HOVER -> CHANGE_TO -> DISSOLVE 0.3s',
                    'destination' => '14654:3046', 'destination_name' => 'Header/hover',
                    'status' => 'STALE_REJECTED',
                    'reason' => 'Destination contains unrelated National Institute of Genetics navigation/content, so it is copied-source contamination rather than REF-001 authority.',
                ],
                'pc-footer' => [
                    'instance' => '21378:7457', 'main_component' => '280:368',
                    'observed' => 'ON_HOVER -> CHANGE_TO -> DISSOLVE 0.3s',
                    'destination' => '14654:3787', 'destination_name' => 'Footer/hover',
                    'status' => 'STALE_REJECTED',
                    'reason' => 'Destination contains unrelated National Institute of Genetics footer/content, so it is copied-source contamination rather than REF-001 authority.',
                ],
                'pc-cta' => ['instance' => '21378:7867', 'main_component' => '21035:67', 'valid_reactions' => 0],
                'sp-header' => ['instance' => '21376:4918', 'main_component' => '280:193', 'valid_reactions' => 0],
                'sp-cta' => ['instances' => ['21376:4719', '21376:4628'], 'main_component' => '21150:388', 'valid_reactions' => 0],
                'sp-footer' => ['instance' => '21376:4402', 'main_component' => '280:75', 'valid_reactions' => 0],
            ],
            'validation_rule' => 'A reaction is not AUTHORED merely because it exists. Validate Instance -> mainComponent -> reaction destination -> same-project semantic/component lineage. Reject stale copied destinations.',
        ],
        'student-voice' => [
            'figma_authority' => 'STRONGLY_INFERRED',
            'runtime_authority' => 'PRODUCT_DECISION',
            'figma_visible_states' => ['item-1' => 'open', 'item-2' => 'collapsed', 'item-3' => 'collapsed'],
            'figma_complete_detail_content' => ['item-1' => true, 'item-2' => false, 'item-3' => false],
            'runtime_detail_content' => ['item-1' => 'AUTHORED', 'item-2' => 'DUMMY', 'item-3' => 'DUMMY'],
            'runtime_rule' => 'User explicitly requested dummy detail content for items 2/3 and clickable disclosures. Do not mislabel those dummy details as Figma-authored.',
        ],
        'messages' => [
            'figma_authority' => 'STRONGLY_INFERRED',
            'runtime_authority' => 'PRODUCT_DECISION',
            'visible_indicator_total' => 4,
            'authored_slide_content_count' => 1,
            'runtime_slide_count' => 4,
            'runtime_engine' => 'Swiper',
            'runtime_rule' => 'User explicitly requested autoplay + clickable four-slide Swiper with both copy and image changing. Slide 1 uses the authored Messages image; slides 2-4 use dummy text and existing dummy raster assets and must not be labeled Figma-authored.',
        ],
        'page-top' => [
            'runtime_authority' => 'PRODUCT_DECISION',
            'show_after_scroll_px' => 320,
            'duration_ms' => 300,
        ],
    ],
];
