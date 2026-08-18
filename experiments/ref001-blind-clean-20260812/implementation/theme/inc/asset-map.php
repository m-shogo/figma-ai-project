<?php
return [
    'images' => [
        'main-visual-left' => [
            'pc' => 'assets/images/ref001/rendered/pc/main-visual-left-21378-8041.webp',
            'sp' => 'assets/images/ref001/rendered/sp/main-visual-left-21376-4894.webp',
            'figma' => ['pc' => '21378:8041', 'sp' => '21376:4894'],
        ],
        'main-visual-right' => [
            'pc' => 'assets/images/ref001/rendered/pc/main-visual-right-21378-8036.webp',
            'sp' => 'assets/images/ref001/rendered/sp/main-visual-right-21376-4890.webp',
            'figma' => ['pc' => '21378:8036', 'sp' => '21376:4890'],
        ],
        'reason-1' => [
            'pc' => 'assets/images/ref001/rendered/pc/reason-1-21378-8002.webp',
            'sp' => 'assets/images/ref001/rendered/sp/reason-1-21376-4855.webp',
            'figma' => ['pc' => '21378:8002', 'sp' => '21376:4855'],
        ],
        'reason-2' => [
            'pc' => 'assets/images/ref001/rendered/pc/reason-2-21378-8010.webp',
            'sp' => 'assets/images/ref001/rendered/sp/reason-2-21376-4864.webp',
            'figma' => ['pc' => '21378:8010', 'sp' => '21376:4864'],
        ],
        'reason-3' => [
            'pc' => 'assets/images/ref001/rendered/pc/reason-3-21378-8018.webp',
            'sp' => 'assets/images/ref001/rendered/sp/reason-3-21376-4872.webp',
            'figma' => ['pc' => '21378:8018', 'sp' => '21376:4872'],
        ],
        'education-1' => [
            'pc' => 'assets/images/ref001/rendered/pc/education-1-21378-7980.webp',
            'sp' => 'assets/images/ref001/rendered/sp/education-1-21376-4835.webp',
            'figma' => ['pc' => '21378:7980', 'sp' => '21376:4835'],
        ],
        'education-2' => [
            'pc' => 'assets/images/ref001/rendered/pc/education-2-21378-7946.webp',
            'sp' => 'assets/images/ref001/rendered/sp/education-2-21376-4801.webp',
            'figma' => ['pc' => '21378:7946', 'sp' => '21376:4801'],
        ],
        'education-3' => [
            'pc' => 'assets/images/ref001/rendered/pc/education-3-21378-7917.webp',
            'sp' => 'assets/images/ref001/rendered/sp/education-3-21376-4769.webp',
            'figma' => ['pc' => '21378:7917', 'sp' => '21376:4769'],
        ],
        'education-4' => [
            'pc' => 'assets/images/ref001/rendered/pc/education-4-21378-7889.webp',
            'sp' => 'assets/images/ref001/rendered/sp/education-4-21376-4741.webp',
            'figma' => ['pc' => '21378:7889', 'sp' => '21376:4741'],
        ],
        'voice-1-avatar' => [
            'pc' => 'assets/images/ref001/rendered/pc/voice-1-avatar-21378-7857.webp',
            'sp' => 'assets/images/ref001/rendered/sp/student-voice-01-21376-4709.webp',
            'figma' => ['pc' => '21378:7857', 'sp' => '21376:4709'],
        ],
        'voice-1-detail' => [
            'pc' => 'assets/images/ref001/rendered/pc/voice-1-detail-21378-7849.webp',
            'sp' => 'assets/images/ref001/rendered/sp/voice-1-detail-21376-4701.webp',
            'figma' => ['pc' => '21378:7849', 'sp' => '21376:4701'],
        ],
        'voice-2-avatar' => [
            'pc' => 'assets/images/ref001/rendered/pc/voice-2-avatar-21378-7826.webp',
            'sp' => 'assets/images/ref001/rendered/sp/student-voice-02-21376-4678.webp',
            'figma' => ['pc' => '21378:7826', 'sp' => '21376:4678'],
        ],
        'voice-3-avatar' => [
            'pc' => 'assets/images/ref001/rendered/pc/voice-3-avatar-21378-7795.webp',
            'sp' => 'assets/images/ref001/rendered/sp/student-voice-04-21376-4663.webp',
            'figma' => ['pc' => '21378:7795', 'sp' => '21376:4663'],
        ],
        'messages-photo' => [
            'pc' => 'assets/images/ref001/rendered/pc/messages-photo-21378-7760.webp',
            'sp' => 'assets/images/ref001/rendered/sp/messages-photo-21376-4643.webp',
            'figma' => ['pc' => '21378:7760', 'sp' => '21376:4643'],
        ],
        'cta-person-left' => [
            'pc' => 'assets/images/ref001/rendered/pc/cta-person-left-21378-7489.webp',
            'sp' => 'assets/images/ref001/rendered/sp/cta-person-left-21376-4958.webp',
            'figma' => ['pc' => '21378:7489', 'sp' => '21376:4958'],
            'alpha' => true,
            'silhouette' => 'yellow',
        ],
        'cta-person-right' => [
            'pc' => 'assets/images/ref001/rendered/pc/cta-person-right-21378-7485.webp',
            'sp' => 'assets/images/ref001/rendered/sp/cta-person-right-21376-4962.webp',
            'figma' => ['pc' => '21378:7485', 'sp' => '21376:4962'],
            'alpha' => true,
            'silhouette' => 'green',
        ],
    ],
    'icons' => [
        'document' => 'assets/icons/document.svg',
        'open-campus' => 'assets/icons/open-campus.svg',
        'arrow-left' => 'assets/icons/arrow-left.svg',
        'arrow-right' => 'assets/icons/arrow-right.svg',
        'check' => 'assets/icons/check.svg',
        // The committed SVG filenames follow Figma layer traversal order (IT→public-service),
        // while the content domain is public-service→IT. Map by node identity/meaning, not filename ordinal.
        'course-1' => 'assets/icons/course-7.svg', // public-service, PC Figma 21378:7722
        'course-2' => 'assets/icons/course-6.svg', // accounting, PC Figma 21378:7683
        'course-3' => 'assets/icons/course-5.svg', // business-management, PC Figma 21378:7655
        'course-4' => 'assets/icons/course-4.svg', // finance, PC Figma 21378:7623
        'course-5' => 'assets/icons/course-3.svg', // teaching, PC Figma 21378:7594
        'course-6' => 'assets/icons/course-2.svg', // curator, PC Figma 21378:7565
        // SP curator Figma 21376:4587 intentionally uses the same school/museum
        // silhouette as SP teaching (21376:4558), not the PC curator artwork.
        'course-6-sp' => 'assets/icons/course-3.svg',
        'course-7' => 'assets/icons/course-1.svg', // IT, PC Figma 21378:7533
        'facebook' => 'assets/icons/facebook-outline.svg',
        'youtube' => 'assets/icons/youtube-outline.svg',
        'instagram' => 'assets/icons/instagram-outline.svg',
        'line' => 'assets/icons/line-outline.svg',
    ],
    // Destinations are unresolved in this isolated replay fixture. Keep them
    // centralized so production integration can replace them without touching templates.
    'links' => [
        'document' => '#',
        'open-campus' => '#',
        'campus' => '#',
        'numbers' => '#',
        'facebook' => '#',
        'youtube' => '#',
        'instagram' => '#',
        'line' => '#',
    ],
];
