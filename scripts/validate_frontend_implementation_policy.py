#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_POLICY = ROOT / "config" / "frontend-implementation-policy.yaml"

REQUIRED_CANONICAL = {
    "authority_model",
    "quick_contract",
    "implementation_standard",
    "maintainability_qa",
    "repeatable_content",
    "stress_qa",
    "pattern_library",
    "reuse_before_build",
    "external_integration_matrix",
    "decorative_pattern_cookbook",
    "visual_repair_learning_loop",
    "coverage_map",
    "css_foundation_reset",
    "font_loading",
    "production_runtime",
    "delivery_security",
}
REQUIRED_RULE_STATES = {
    "CORE",
    "ACTIVE",
    "CANDIDATE",
    "PROJECT_ONLY",
    "DEPRECATED",
    "RETIRED",
}
REQUIRED_OBJECTIVES = {
    "VISUAL_FIDELITY",
    "FINDABILITY",
    "LOCALITY",
    "CONTENT_RESILIENCE",
    "REPEATABLE_CONTENT_RESILIENCE",
    "RESPONSIVE_RESILIENCE",
    "RUNTIME_STATE_RESILIENCE",
    "INTERACTION_ACCESSIBILITY",
    "PERFORMANCE_LOADING_RESPONSIVENESS",
    "THIRD_PARTY_BOUNDARY_SAFETY",
    "DELIVERY_SECURITY_RESPONSIBILITY",
    "INTERNATIONALIZATION_RESILIENCE",
    "REGRESSION_SCOPE_SAFETY",
    "HUMAN_REPAIRABILITY",
    "REUSE_EFFICIENCY",
    "LEARNING_REWORK_REDUCTION",
    "SIMPLICITY",
}
REQUIRED_CONTENT_RISKS = {
    "STATIC_AUTHORED",
    "EDITOR_OWNED",
    "LOCALIZED",
    "EXTERNAL_DATA",
    "USER_GENERATED",
}
REQUIRED_LINE_STRATEGIES = {
    "NATURAL_WRAP",
    "PHRASE_WRAP",
    "AUTHORED_BREAK",
    "TRUNCATION",
}
REQUIRED_QA_TIERS = {"FAST_PR_GATE", "TARGETED_MUTATION", "DEEP_PERIODIC"}
REQUIRED_CWV = {"LCP", "CLS", "INP"}
REQUIRED_RUNTIME_STATES = {
    "DEFAULT",
    "LOADING",
    "EMPTY",
    "PARTIAL",
    "ERROR",
    "SUCCESS",
    "DISABLED",
    "OFFLINE_OR_NETWORK_FAILURE",
}
REQUIRED_EXTERNAL_STATUSES = {
    "USE_NOW",
    "USE_WHEN_PRESENT",
    "CONDITIONAL",
    "CLEAN_REPLAY_CANDIDATE",
    "KEEP_SMALL_GLUE",
    "RETIRE_AS_DEFAULT",
}
REQUIRED_OPTIONAL_CAPABILITIES = {
    "PRINT_REQUIRED",
    "PDF_OUTPUT_REQUIRED",
    "OFFLINE_REQUIRED",
    "PWA_REQUIRED",
    "REDUCED_DATA_REQUIRED",
    "RTL_REQUIRED",
    "SEO_REQUIRED",
    "SHARE_METADATA_REQUIRED",
    "EMBED_SECURITY_REVIEW_REQUIRED",
    "SECURITY_HEADER_REVIEW_REQUIRED",
    "CONSENT_REQUIRED",
    "ANALYTICS_REQUIRED",
    "ERROR_ROUTE_REQUIRED",
    "BOT_PROTECTION_REQUIRED",
    "CACHE_POLICY_REQUIRED",
    "RUM_REQUIRED",
}


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML must be an object: {path}")
    return value


def mapping(value: Any, label: str, errors: list[str]) -> dict[str, Any]:
    if not isinstance(value, dict):
        errors.append(f"{label} must be an object")
        return {}
    return value


def string_list(value: Any, label: str, errors: list[str]) -> list[str]:
    if not isinstance(value, list) or not all(isinstance(item, str) and item for item in value):
        errors.append(f"{label} must be an array of non-empty strings")
        return []
    return list(value)


def require_true(block: dict[str, Any], keys: tuple[str, ...], prefix: str, errors: list[str]) -> None:
    for key in keys:
        if block.get(key) is not True:
            errors.append(f"{prefix}.{key} must be true")


def require_subset(actual: set[str], required: set[str], label: str, errors: list[str]) -> None:
    missing = sorted(required - actual)
    if missing:
        errors.append(f"{label} missing required values: {', '.join(missing)}")


def policy_errors(data: dict[str, Any], *, root: Path = ROOT) -> list[str]:
    errors: list[str] = []

    if data.get("schema_version") != 5:
        errors.append("frontend implementation policy schema_version must be 5")

    canonical = mapping(data.get("canonical"), "canonical", errors)
    missing = sorted(REQUIRED_CANONICAL - set(canonical))
    if missing:
        errors.append(f"canonical missing required entries: {', '.join(missing)}")
    for key, raw_path in canonical.items():
        if not isinstance(raw_path, str) or not raw_path.strip():
            errors.append(f"canonical.{key} must be a non-empty path")
        elif not (root / raw_path).is_file():
            errors.append(f"canonical.{key} does not exist: {raw_path}")

    lifecycle = mapping(data.get("rule_lifecycle"), "rule_lifecycle", errors)
    lifecycle_states = set(
        string_list(lifecycle.get("allowed_states"), "rule_lifecycle.allowed_states", errors)
    )
    require_subset(lifecycle_states, REQUIRED_RULE_STATES, "rule lifecycle states", errors)
    if lifecycle.get("numeric_thresholds_default") != "CANDIDATE":
        errors.append("rule_lifecycle.numeric_thresholds_default must remain CANDIDATE")
    if lifecycle.get("one_observation_must_not_create_permanent_ban") is not True:
        errors.append("rule_lifecycle.one_observation_must_not_create_permanent_ban must be true")

    authority = mapping(data.get("authority"), "authority", errors)
    if authority.get("model") != "ROLE_BASED_NOT_SINGLE_LINEAR_PRECEDENCE":
        errors.append("authority.model must remain role-based rather than a single linear precedence")
    if authority.get("visual_source") != "FIGMA_REFERENCE":
        errors.append("authority.visual_source must remain FIGMA_REFERENCE")
    if authority.get("frontend_standard_role") != "FALLBACK_DECISION_FRAMEWORK":
        errors.append("frontend standard must remain a fallback decision framework")
    require_true(
        authority,
        (
            "company_hard_constraints_are_top",
            "existing_codebase_is_required_baseline",
            "explicit_authorized_project_override_can_supersede_stale_existing_baseline",
            "explicit_override_cannot_bypass_company_security_or_protected_scope",
            "effective_project_contract_resolves_existing_plus_authorized_overrides",
            "figma_implementation_evidence_is_input_to_decision",
            "frontend_standard_must_not_override_effective_project_contract",
            "frontend_standard_must_not_override_figma_visual_truth",
            "figma_structure_must_not_be_mechanically_copied_to_web_mechanism",
            "agent_inference_is_last",
            "explicit_instruction_inferred_structure_and_agent_inference_are_distinct",
        ),
        "authority",
        errors,
    )

    objectives = set(string_list(data.get("objectives"), "objectives", errors))
    require_subset(objectives, REQUIRED_OBJECTIVES, "objectives", errors)

    naming = mapping(data.get("naming"), "naming", errors)
    require_true(
        naming,
        (
            "existing_company_rule_first",
            "owner_searchability_is_core",
            "global_css_bem_prefix_default",
            "scoped_css_local_names_allowed_when_owner_boundary_is_unambiguous",
            "do_not_force_bem_only_to_increase_prefix_count",
        ),
        "naming",
        errors,
    )

    layout = mapping(data.get("layout"), "layout", errors)
    require_true(
        layout,
        (
            "property_bans_are_not_goal",
            "fixed_dimensions_are_not_globally_banned",
            "absolute_is_not_globally_banned",
            "figma_rendered_coordinate_is_not_automatically_web_constraint",
            "property_count_is_not_quality_score",
            "hover_must_not_introduce_layout_box_metrics",
            "reserve_hover_border_at_rest",
            "missing_interactive_transition_defaults_to_existing_or_0_3s",
        ),
        "layout",
        errors,
    )

    css = mapping(data.get("css_ownership"), "css_ownership", errors)
    require_true(
        css,
        (
            "authoritative_base_owner_required",
            "legal_contextual_selector_repetition_allowed",
            "duplicate_detection_prefer_parser_ast",
            "simple_regex_must_not_fail_legal_contexts",
            "permanent_final_fix_zone_prohibited",
            "repair_canonical_owner_first",
            "repeated_patch_is_design_review_signal",
        ),
        "css_ownership",
        errors,
    )
    if css.get("hard_patch_count_threshold") is not None:
        errors.append("css_ownership.hard_patch_count_threshold must stay null")

    nesting = mapping(data.get("nesting"), "nesting", errors)
    require_true(
        nesting,
        (
            "global_bem_selectors_flat_by_default",
            "scoped_css_existing_convention_first",
            "ampersand_is_not_required_for_simple_descendant",
            "parent_selector_list_specificity_must_be_considered",
        ),
        "nesting",
        errors,
    )
    if nesting.get("deep_descendant_nesting") != "WARN":
        errors.append("nesting.deep_descendant_nesting must remain WARN")

    responsive = mapping(data.get("responsive"), "responsive", errors)
    if responsive.get("product_viewport_source") != "EFFECTIVE_ENVIRONMENT_CONTRACT":
        errors.append("responsive.product_viewport_source must remain EFFECTIVE_ENVIRONMENT_CONTRACT")
    fallback_viewport = responsive.get("unresolved_product_viewport_fallback_css_px")
    if not isinstance(fallback_viewport, (int, float)) or fallback_viewport <= 0:
        errors.append("responsive.unresolved_product_viewport_fallback_css_px must be a positive candidate value")
    if responsive.get("unresolved_product_viewport_fallback_status") != "CANDIDATE":
        errors.append("responsive unresolved product viewport fallback must remain CANDIDATE")
    require_true(
        responsive,
        (
            "company_existing_breakpoints_first",
            "below_resolved_product_minimum_not_default_visual_target",
            "accessibility_reflow_is_separate_probe",
            "breakpoint_means_layout_boundary_not_device_identity",
            "breakpoint_continuity_probe_when_material",
        ),
        "responsive",
        errors,
    )

    responsive_dom = mapping(data.get("responsive_dom"), "responsive_dom", errors)
    if responsive_dom.get("duplicate_same_semantic_content_for_pc_sp_by_default") is not False:
        errors.append("responsive_dom.duplicate_same_semantic_content_for_pc_sp_by_default must be false")
    require_true(
        responsive_dom,
        (
            "separate_markup_allowed_when_structure_interaction_or_source_really_differs",
            "separate_markup_requires_focus_id_js_analytics_cms_review",
        ),
        "responsive_dom",
        errors,
    )

    risks = mapping(data.get("content_risk_factors"), "content_risk_factors", errors)
    if risks.get("multiple_factors_can_apply") is not True:
        errors.append("content_risk_factors.multiple_factors_can_apply must be true")
    categories = set(string_list(risks.get("required_categories"), "content_risk_factors.required_categories", errors))
    require_subset(categories, REQUIRED_CONTENT_RISKS, "content risk factors", errors)

    line_break = mapping(data.get("line_break_strategy"), "line_break_strategy", errors)
    strategies = set(string_list(line_break.get("required_strategies"), "line_break_strategy.required_strategies", errors))
    require_subset(strategies, REQUIRED_LINE_STRATEGIES, "line break strategies", errors)
    require_true(
        line_break,
        (
            "screenshot_line_break_is_not_automatically_contract",
            "phrase_wrap_requires_semantic_or_art_direction_reason",
            "phrase_wrap_must_not_be_mechanically_applied_to_localized_or_cms_copy",
            "truncation_requires_explicit_information_loss_contract",
        ),
        "line_break_strategy",
        errors,
    )

    repeatable = mapping(data.get("repeatable_content"), "repeatable_content", errors)
    require_true(
        repeatable,
        (
            "same_format_sequence_triggers_review",
            "do_not_force_cms_conversion",
            "parent_owns_collection_layout",
            "item_owns_internal_layout",
            "ordinary_count_change_should_not_require_item_position_css",
            "semantic_variant_must_not_depend_only_on_accidental_index",
            "nth_child_is_not_globally_banned",
        ),
        "repeatable_content",
        errors,
    )

    javascript = mapping(data.get("javascript"), "javascript", errors)
    if javascript.get("data_js_is_not_global_requirement") is not True:
        errors.append("javascript.data_js_is_not_global_requirement must be true")
    if javascript.get("hook_convention") != "EXISTING_PROJECT_FIRST":
        errors.append("javascript.hook_convention must remain EXISTING_PROJECT_FIRST")
    if javascript.get("primary_state_source_required_when_multiple_state_representations_exist") is not True:
        errors.append("javascript must require a primary state source")
    if javascript.get("state_representations_must_stay_synchronized") is not True:
        errors.append("javascript.state_representations_must_stay_synchronized must be true")

    forms = mapping(data.get("forms"), "forms", errors)
    require_true(
        forms,
        (
            "semantic_labeling_required_when_applicable",
            "placeholder_must_not_be_only_label",
            "autocomplete_considered_for_user_data",
            "inputmode_enterkeyhint_considered_for_mobile_input",
            "inputmode_is_not_validation",
            "ime_composition_must_not_be_misclassified_as_committed_input",
            "autofill_state_must_not_break_layout_or_labeling",
            "submit_lifecycle_has_single_primary_state",
            "error_must_not_be_conveyed_by_color_only",
        ),
        "forms",
        errors,
    )

    runtime_states = mapping(data.get("runtime_states"), "runtime_states", errors)
    states = set(string_list(runtime_states.get("recognized_states"), "runtime_states.recognized_states", errors))
    require_subset(states, REQUIRED_RUNTIME_STATES, "runtime states", errors)
    require_true(
        runtime_states,
        (
            "async_state_contract_when_applicable",
            "all_states_not_required_for_every_section",
            "empty_and_error_are_distinct",
            "external_failure_must_not_break_unrelated_primary_content",
        ),
        "runtime_states",
        errors,
    )

    font = mapping(data.get("font_loading"), "font_loading", errors)
    require_true(
        font,
        (
            "font_is_shared_layout_dependency",
            "final_family_name_alone_is_not_sufficient_contract",
            "fallback_render_must_not_lose_content",
            "metric_adjustment_requires_measured_reason_and_browser_support",
            "font_display_is_not_single_global_value",
            "preload_only_critical_faces",
            "cjk_and_localized_glyph_coverage_when_relevant",
            "font_change_expands_regression_scope",
        ),
        "font_loading",
        errors,
    )

    third_party = mapping(data.get("third_party"), "third_party", errors)
    require_true(
        third_party,
        (
            "explicit_trust_boundary_required_when_present",
            "review_privacy_security_loading_cls_and_failure",
            "consent_gated_integrations_supported",
            "third_party_failure_must_not_break_unrelated_primary_content",
        ),
        "third_party",
        errors,
    )

    delivery = mapping(data.get("delivery_security"), "delivery_security", errors)
    require_true(
        delivery,
        (
            "client_shipped_private_secrets_forbidden",
            "server_security_policy_owner_must_remain_explicit",
            "section_worker_must_not_weaken_csp_to_fit_implementation",
            "cms_api_user_output_requires_escape_or_sanitization_owner",
            "frontend_validation_is_not_server_validation",
            "js_failure_contract_when_relevant",
            "soft_404_is_not_default",
            "analytics_event_owner_required_when_present",
            "analytics_duplicate_firing_must_be_reviewed",
            "consent_lifecycle_when_required",
            "cache_versioning_follows_existing_build_or_deployment",
            "service_worker_not_default_cache_fix",
            "production_debug_or_secret_exposure_prohibited",
        ),
        "delivery_security",
        errors,
    )

    i18n = mapping(data.get("internationalization"), "internationalization", errors)
    require_true(
        i18n,
        (
            "localized_means_more_than_text_expansion",
            "lang_semantics_when_applicable",
            "directionality_semantics_when_applicable",
            "dir_auto_candidate_for_unknown_direction_external_or_user_data",
            "rtl_is_not_globally_required",
            "logical_properties_selected_from_real_bidi_need_not_fashion",
        ),
        "internationalization",
        errors,
    )

    a11y = mapping(data.get("accessibility"), "accessibility", errors)
    if a11y.get("reflow_vertical_content_width_equivalent_css_px") != 320:
        errors.append("accessibility reflow width equivalent must be 320 CSS px")
    if a11y.get("resize_text_reflow_and_text_spacing_are_distinct") is not True:
        errors.append("accessibility must keep Resize Text, Reflow, and Text Spacing distinct")
    if fallback_viewport == a11y.get("reflow_vertical_content_width_equivalent_css_px"):
        errors.append("candidate product viewport fallback and WCAG reflow probe must remain distinct concepts")

    performance = mapping(data.get("performance"), "performance", errors)
    cwv = set(string_list(performance.get("inspect_when_relevant"), "performance.inspect_when_relevant", errors))
    require_subset(cwv, REQUIRED_CWV, "performance Core Web Vitals", errors)

    degradation = mapping(data.get("graceful_degradation"), "graceful_degradation", errors)
    require_true(
        degradation,
        (
            "unreadably_small_text_is_not_default_fit_strategy",
            "blanket_scale_is_not_default_fit_strategy",
            "hidden_information_is_not_default_fit_strategy",
            "project_can_override_priority_with_explicit_contract",
        ),
        "graceful_degradation",
        errors,
    )

    qa = mapping(data.get("qa_tiers"), "qa_tiers", errors)
    tiers = set(string_list(qa.get("required"), "qa_tiers.required", errors))
    require_subset(tiers, REQUIRED_QA_TIERS, "qa tiers", errors)
    if qa.get("full_cartesian_mutation_product_every_pr") is not False:
        errors.append("qa_tiers.full_cartesian_mutation_product_every_pr must be false")

    impact = mapping(data.get("change_impact"), "change_impact", errors)
    require_true(
        impact,
        (
            "qa_scope_follows_dependency_blast_radius",
            "changed_line_count_is_not_proxy_for_impact",
            "dependency_map_should_be_reused_when_available",
        ),
        "change_impact",
        errors,
    )
    if impact.get("dependency_driven_qa_selector") != "CANDIDATE":
        errors.append("dependency-driven QA selector must remain CANDIDATE until evidence promotes it")

    capability = mapping(data.get("native_capability_adoption"), "native_capability_adoption", errors)
    require_true(
        capability,
        (
            "existing_solution_first",
            "actual_need_and_figma_evidence_before_adoption",
            "company_browser_matrix_required",
            "accessibility_and_reduced_motion_review_when_relevant",
            "feature_availability_alone_must_not_force_migration",
        ),
        "native_capability_adoption",
        errors,
    )

    reuse = mapping(data.get("reuse_before_build"), "reuse_before_build", errors)
    require_true(
        reuse,
        (
            "effective_project_contract_and_existing_code_first",
            "browser_and_native_web_before_custom_infrastructure",
            "official_project_tooling_before_reimplementation",
            "existing_design_system_or_library_before_new_equivalent",
            "mature_oss_requires_project_fit_review",
            "custom_implementation_is_last_option_not_prohibited",
            "custom_gap_must_be_small_and_owned",
            "reuse_rate_is_diagnostic_not_hard_kpi",
            "standalone_lp_must_not_be_forced_into_shared_system_tooling",
        ),
        "reuse_before_build",
        errors,
    )

    external = mapping(data.get("external_integration"), "external_integration", errors)
    require_true(
        external,
        (
            "matrix_required",
            "upstream_before_custom",
            "upstream_heavy_mechanism_must_not_be_reimplemented",
            "custom_glue_must_be_small_owned_and_retireable",
            "existing_custom_path_retired_only_after_clean_replay",
            "plan_license_privacy_and_project_fit_required",
            "figma_download_assets_before_fallback_transport_when_available",
            "code_connect_clone_prohibited",
            "playwright_first_for_browser_visual_regression",
            "existing_storybook_first_for_shared_component_surface",
            "browserslist_shared_target_source_when_present",
            "stylelint_postcss_before_new_regex_css_parser_when_present",
            "wordpress_official_environment_evaluated_before_new_generic_fixture",
            "acf_official_json_cli_before_custom_import_export_when_supported",
            "update_radar_reuses_upstream_release_sources",
        ),
        "external_integration",
        errors,
    )
    external_statuses = set(
        string_list(external.get("allowed_statuses"), "external_integration.allowed_statuses", errors)
    )
    require_subset(external_statuses, REQUIRED_EXTERNAL_STATUSES, "external integration statuses", errors)

    decorative = mapping(data.get("decorative_fidelity"), "decorative_fidelity", errors)
    require_true(
        decorative,
        (
            "css_only_is_not_success_condition",
            "exact_existing_or_figma_source_checked_before_redraw",
            "editable_text_separated_from_decorative_shape_when_practical",
            "css_complexity_escape_to_asset_or_hybrid",
            "property_bans_are_not_used_as_escape_rule",
            "pattern_promotion_requires_repeated_evidence",
        ),
        "decorative_fidelity",
        errors,
    )

    visual_learning = mapping(data.get("visual_repair_learning"), "visual_repair_learning", errors)
    require_true(
        visual_learning,
        (
            "section_first_root_cause_repair",
            "canonical_owner_repair_first",
            "blind_rerun_is_not_failure_diagnosis",
            "existing_playwright_and_project_qa_first",
            "dedicated_large_visual_engine_is_not_default",
            "human_correction_cost_is_diagnostic",
            "repeated_feedback_is_learning_signal",
            "one_feedback_event_must_not_create_permanent_rule",
        ),
        "visual_repair_learning",
        errors,
    )

    optional = mapping(data.get("optional_project_capabilities"), "optional_project_capabilities", errors)
    if optional.get("not_global_core") is not True:
        errors.append("optional project capabilities must not become global core")
    available = set(string_list(optional.get("available"), "optional_project_capabilities.available", errors))
    require_subset(available, REQUIRED_OPTIONAL_CAPABILITIES, "optional project capabilities", errors)

    human = mapping(data.get("human_maintainability"), "human_maintainability", errors)
    if human.get("simple_data_change_css_diff_zero") != "GOOD_SIGNAL_NOT_HARD_KPI":
        errors.append("simple data change CSS diff=0 must remain a signal, not a hard KPI")
    if human.get("temporary_final_fix_layer_at_final") != "PROHIBITED":
        errors.append("human_maintainability.temporary_final_fix_layer_at_final must remain PROHIBITED")

    return errors


def main() -> int:
    try:
        data = load_yaml(DEFAULT_POLICY)
        errors = policy_errors(data)
    except Exception as exc:
        errors = [str(exc)]

    if errors:
        print(f"FAIL {DEFAULT_POLICY.relative_to(ROOT)}")
        for error in errors:
            print(f"  - {error}")
        return 1

    print(f"PASS {DEFAULT_POLICY.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
