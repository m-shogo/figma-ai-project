from __future__ import annotations

import copy
import unittest

from scripts.validate_frontend_implementation_policy import ROOT, load_yaml, policy_errors

POLICY_PATH = ROOT / "config" / "frontend-implementation-policy.yaml"


class FrontendImplementationPolicyTest(unittest.TestCase):
    def setUp(self) -> None:
        self.policy = load_yaml(POLICY_PATH)

    def errors_after(self, mutate) -> list[str]:
        data = copy.deepcopy(self.policy)
        mutate(data)
        return policy_errors(data, root=ROOT)

    def test_current_policy_is_valid(self) -> None:
        self.assertEqual([], policy_errors(self.policy, root=ROOT))

    def test_authority_model_file_is_required(self) -> None:
        errors = self.errors_after(lambda data: data["canonical"].pop("authority_model"))
        self.assertTrue(any("canonical missing required entries" in error for error in errors))

    def test_runtime_font_and_delivery_contracts_are_required(self) -> None:
        def mutate(data):
            data["canonical"].pop("production_runtime")
            data["canonical"].pop("font_loading")
            data["canonical"].pop("delivery_security")

        errors = self.errors_after(mutate)
        self.assertTrue(any("canonical missing required entries" in error for error in errors))
        self.assertTrue(any("delivery_security" in error for error in errors))

    def test_reuse_and_external_integration_contracts_are_required(self) -> None:
        def mutate(data):
            data["canonical"].pop("reuse_before_build")
            data["canonical"].pop("external_integration_matrix")
            data["canonical"].pop("decorative_pattern_cookbook")
            data["canonical"].pop("visual_repair_learning_loop")

        errors = self.errors_after(mutate)
        self.assertTrue(any("canonical missing required entries" in error for error in errors))
        self.assertTrue(any("external_integration_matrix" in error for error in errors))

    def test_rule_lifecycle_keeps_candidate_default_for_numeric_thresholds(self) -> None:
        errors = self.errors_after(
            lambda data: data["rule_lifecycle"].__setitem__("numeric_thresholds_default", "CORE")
        )
        self.assertTrue(any("numeric_thresholds_default" in error for error in errors))

    def test_rule_lifecycle_keeps_all_supported_states(self) -> None:
        errors = self.errors_after(
            lambda data: data["rule_lifecycle"]["allowed_states"].remove("PROJECT_ONLY")
        )
        self.assertTrue(any("rule lifecycle states" in error and "PROJECT_ONLY" in error for error in errors))

    def test_authority_must_remain_role_based(self) -> None:
        errors = self.errors_after(lambda data: data["authority"].__setitem__("model", "SINGLE_LINEAR_PRECEDENCE"))
        self.assertTrue(any("role-based" in error for error in errors))

    def test_figma_remains_visual_source(self) -> None:
        errors = self.errors_after(lambda data: data["authority"].__setitem__("visual_source", "STANDARD"))
        self.assertTrue(any("visual_source" in error for error in errors))

    def test_existing_is_baseline_but_authorized_override_can_supersede_stale_existing(self) -> None:
        errors = self.errors_after(
            lambda data: data["authority"].__setitem__(
                "explicit_authorized_project_override_can_supersede_stale_existing_baseline", False
            )
        )
        self.assertTrue(any("explicit_authorized_project_override" in error for error in errors))

    def test_explicit_override_cannot_bypass_company_or_protected_scope(self) -> None:
        errors = self.errors_after(
            lambda data: data["authority"].__setitem__(
                "explicit_override_cannot_bypass_company_security_or_protected_scope", False
            )
        )
        self.assertTrue(any("explicit_override_cannot_bypass" in error for error in errors))

    def test_frontend_standard_remains_fallback_framework(self) -> None:
        errors = self.errors_after(
            lambda data: data["authority"].__setitem__("frontend_standard_role", "HIGHER_AUTHORITY")
        )
        self.assertTrue(any("fallback decision framework" in error for error in errors))

    def test_figma_structure_is_not_mechanical_web_mapping(self) -> None:
        errors = self.errors_after(
            lambda data: data["authority"].__setitem__(
                "figma_structure_must_not_be_mechanically_copied_to_web_mechanism", False
            )
        )
        self.assertTrue(any("figma_structure_must_not_be_mechanically" in error for error in errors))

    def test_delivery_security_objective_is_required(self) -> None:
        errors = self.errors_after(
            lambda data: data["objectives"].remove("DELIVERY_SECURITY_RESPONSIBILITY")
        )
        self.assertTrue(any("DELIVERY_SECURITY_RESPONSIBILITY" in error for error in errors))

    def test_reuse_and_human_repair_objectives_are_required(self) -> None:
        def mutate(data):
            data["objectives"].remove("HUMAN_REPAIRABILITY")
            data["objectives"].remove("REUSE_EFFICIENCY")
            data["objectives"].remove("LEARNING_REWORK_REDUCTION")

        errors = self.errors_after(mutate)
        self.assertTrue(any("HUMAN_REPAIRABILITY" in error for error in errors))
        self.assertTrue(any("REUSE_EFFICIENCY" in error for error in errors))
        self.assertTrue(any("LEARNING_REWORK_REDUCTION" in error for error in errors))

    def test_scoped_css_can_keep_local_names_when_owner_is_clear(self) -> None:
        errors = self.errors_after(
            lambda data: data["naming"].__setitem__(
                "scoped_css_local_names_allowed_when_owner_boundary_is_unambiguous", False
            )
        )
        self.assertTrue(any("scoped_css_local_names" in error for error in errors))

    def test_property_ban_cannot_become_goal(self) -> None:
        errors = self.errors_after(lambda data: data["layout"].__setitem__("property_bans_are_not_goal", False))
        self.assertTrue(any("property_bans_are_not_goal" in error for error in errors))

    def test_repeated_patch_threshold_is_not_hard_number(self) -> None:
        errors = self.errors_after(lambda data: data["css_ownership"].__setitem__("hard_patch_count_threshold", 2))
        self.assertTrue(any("hard_patch_count_threshold" in error for error in errors))

    def test_nesting_specificity_review_stays_enabled(self) -> None:
        errors = self.errors_after(
            lambda data: data["nesting"].__setitem__("parent_selector_list_specificity_must_be_considered", False)
        )
        self.assertTrue(any("parent_selector_list_specificity" in error for error in errors))

    def test_product_viewport_comes_from_effective_environment_contract(self) -> None:
        errors = self.errors_after(
            lambda data: data["responsive"].__setitem__("product_viewport_source", "FIXED_DEFAULT")
        )
        self.assertTrue(any("product_viewport_source" in error for error in errors))

    def test_unresolved_product_viewport_fallback_stays_candidate(self) -> None:
        errors = self.errors_after(
            lambda data: data["responsive"].__setitem__("unresolved_product_viewport_fallback_status", "ACTIVE")
        )
        self.assertTrue(any("fallback must remain CANDIDATE" in error for error in errors))

    def test_unresolved_product_viewport_fallback_must_be_positive(self) -> None:
        errors = self.errors_after(
            lambda data: data["responsive"].__setitem__("unresolved_product_viewport_fallback_css_px", 0)
        )
        self.assertTrue(any("positive candidate value" in error for error in errors))

    def test_candidate_product_floor_and_wcag_reflow_probe_are_distinct(self) -> None:
        errors = self.errors_after(
            lambda data: data["responsive"].__setitem__("unresolved_product_viewport_fallback_css_px", 320)
        )
        self.assertTrue(any("distinct concepts" in error for error in errors))

    def test_breakpoint_continuity_probe_stays_available(self) -> None:
        errors = self.errors_after(
            lambda data: data["responsive"].__setitem__("breakpoint_continuity_probe_when_material", False)
        )
        self.assertTrue(any("breakpoint_continuity_probe_when_material" in error for error in errors))

    def test_same_semantic_pc_sp_dom_is_not_duplicated_by_default(self) -> None:
        errors = self.errors_after(
            lambda data: data["responsive_dom"].__setitem__(
                "duplicate_same_semantic_content_for_pc_sp_by_default", True
            )
        )
        self.assertTrue(any("duplicate_same_semantic_content_for_pc_sp_by_default" in error for error in errors))

    def test_content_risk_supports_multiple_factors(self) -> None:
        errors = self.errors_after(
            lambda data: data["content_risk_factors"].__setitem__("multiple_factors_can_apply", False)
        )
        self.assertTrue(any("multiple_factors_can_apply" in error for error in errors))

    def test_phrase_wrap_strategy_is_required(self) -> None:
        def mutate(data):
            data["line_break_strategy"]["required_strategies"].remove("PHRASE_WRAP")

        errors = self.errors_after(mutate)
        self.assertTrue(
            any(
                "line break strategies" in error and "PHRASE_WRAP" in error
                for error in errors
            )
        )

    def test_screenshot_wrap_does_not_become_contract(self) -> None:
        errors = self.errors_after(
            lambda data: data["line_break_strategy"].__setitem__(
                "screenshot_line_break_is_not_automatically_contract", False
            )
        )
        self.assertTrue(any("screenshot_line_break" in error for error in errors))

    def test_data_js_is_not_global_requirement(self) -> None:
        errors = self.errors_after(lambda data: data["javascript"].__setitem__("data_js_is_not_global_requirement", False))
        self.assertTrue(any("data_js_is_not_global_requirement" in error for error in errors))

    def test_state_representations_stay_synchronized(self) -> None:
        errors = self.errors_after(
            lambda data: data["javascript"].__setitem__("state_representations_must_stay_synchronized", False)
        )
        self.assertTrue(any("state_representations_must_stay_synchronized" in error for error in errors))

    def test_forms_keep_semantics_and_ime_safety(self) -> None:
        errors = self.errors_after(
            lambda data: data["forms"].__setitem__("ime_composition_must_not_be_misclassified_as_committed_input", False)
        )
        self.assertTrue(any("ime_composition" in error for error in errors))

    def test_async_empty_and_error_stay_distinct(self) -> None:
        errors = self.errors_after(lambda data: data["runtime_states"].__setitem__("empty_and_error_are_distinct", False))
        self.assertTrue(any("empty_and_error" in error for error in errors))

    def test_runtime_state_set_keeps_partial_and_network_failure(self) -> None:
        def mutate(data):
            data["runtime_states"]["recognized_states"].remove("PARTIAL")
            data["runtime_states"]["recognized_states"].remove("OFFLINE_OR_NETWORK_FAILURE")

        errors = self.errors_after(mutate)
        self.assertTrue(any("runtime states missing required values" in error for error in errors))

    def test_font_loading_is_layout_dependency(self) -> None:
        errors = self.errors_after(
            lambda data: data["font_loading"].__setitem__("font_is_shared_layout_dependency", False)
        )
        self.assertTrue(any("font_is_shared_layout_dependency" in error for error in errors))

    def test_font_display_does_not_become_one_global_value(self) -> None:
        errors = self.errors_after(
            lambda data: data["font_loading"].__setitem__("font_display_is_not_single_global_value", False)
        )
        self.assertTrue(any("font_display_is_not_single_global_value" in error for error in errors))

    def test_third_party_failure_does_not_break_primary_content(self) -> None:
        errors = self.errors_after(
            lambda data: data["third_party"].__setitem__(
                "third_party_failure_must_not_break_unrelated_primary_content", False
            )
        )
        self.assertTrue(any("third_party_failure" in error for error in errors))

    def test_delivery_security_invariants_are_enforced(self) -> None:
        def mutate(data):
            data["delivery_security"]["client_shipped_private_secrets_forbidden"] = False
            data["delivery_security"]["section_worker_must_not_weaken_csp_to_fit_implementation"] = False

        errors = self.errors_after(mutate)
        self.assertTrue(any("client_shipped_private_secrets_forbidden" in error for error in errors))
        self.assertTrue(any("section_worker_must_not_weaken_csp" in error for error in errors))

    def test_rtl_does_not_become_global_requirement(self) -> None:
        errors = self.errors_after(lambda data: data["internationalization"].__setitem__("rtl_is_not_globally_required", False))
        self.assertTrue(any("rtl_is_not_globally_required" in error for error in errors))

    def test_resize_reflow_spacing_stay_distinct(self) -> None:
        errors = self.errors_after(
            lambda data: data["accessibility"].__setitem__(
                "resize_text_reflow_and_text_spacing_are_distinct", False
            )
        )
        self.assertTrue(any("Resize Text, Reflow, and Text Spacing" in error for error in errors))

    def test_all_current_core_web_vitals_are_kept(self) -> None:
        def mutate(data):
            data["performance"]["inspect_when_relevant"].remove("INP")

        errors = self.errors_after(mutate)
        self.assertTrue(any("Core Web Vitals" in error for error in errors))

    def test_graceful_degradation_does_not_shrink_text_by_default(self) -> None:
        errors = self.errors_after(
            lambda data: data["graceful_degradation"].__setitem__(
                "unreadably_small_text_is_not_default_fit_strategy", False
            )
        )
        self.assertTrue(any("unreadably_small_text" in error for error in errors))

    def test_every_pr_does_not_require_cartesian_fuzz(self) -> None:
        errors = self.errors_after(
            lambda data: data["qa_tiers"].__setitem__("full_cartesian_mutation_product_every_pr", True)
        )
        self.assertTrue(any("full_cartesian_mutation_product_every_pr" in error for error in errors))

    def test_qa_scope_follows_blast_radius(self) -> None:
        errors = self.errors_after(
            lambda data: data["change_impact"].__setitem__("qa_scope_follows_dependency_blast_radius", False)
        )
        self.assertTrue(any("qa_scope_follows_dependency_blast_radius" in error for error in errors))

    def test_dependency_selector_stays_candidate_until_proven(self) -> None:
        errors = self.errors_after(
            lambda data: data["change_impact"].__setitem__("dependency_driven_qa_selector", "CORE")
        )
        self.assertTrue(any("dependency-driven QA selector" in error for error in errors))

    def test_changed_line_count_is_not_impact_proxy(self) -> None:
        errors = self.errors_after(
            lambda data: data["change_impact"].__setitem__("changed_line_count_is_not_proxy_for_impact", False)
        )
        self.assertTrue(any("changed_line_count_is_not_proxy" in error for error in errors))

    def test_native_feature_availability_does_not_force_migration(self) -> None:
        errors = self.errors_after(
            lambda data: data["native_capability_adoption"].__setitem__(
                "feature_availability_alone_must_not_force_migration", False
            )
        )
        self.assertTrue(any("feature_availability_alone" in error for error in errors))

    def test_upstream_heavy_mechanism_cannot_be_reimplemented_by_default(self) -> None:
        errors = self.errors_after(
            lambda data: data["external_integration"].__setitem__(
                "upstream_heavy_mechanism_must_not_be_reimplemented", False
            )
        )
        self.assertTrue(any("upstream_heavy_mechanism" in error for error in errors))

    def test_external_integration_status_lifecycle_is_complete(self) -> None:
        errors = self.errors_after(
            lambda data: data["external_integration"]["allowed_statuses"].remove("RETIRE_AS_DEFAULT")
        )
        self.assertTrue(any("external integration statuses" in error for error in errors))

    def test_code_connect_unavailability_must_not_create_a_clone(self) -> None:
        errors = self.errors_after(
            lambda data: data["external_integration"].__setitem__("code_connect_clone_prohibited", False)
        )
        self.assertTrue(any("code_connect_clone_prohibited" in error for error in errors))

    def test_old_custom_path_requires_clean_replay_before_retirement(self) -> None:
        errors = self.errors_after(
            lambda data: data["external_integration"].__setitem__(
                "existing_custom_path_retired_only_after_clean_replay", False
            )
        )
        self.assertTrue(any("existing_custom_path_retired_only_after_clean_replay" in error for error in errors))

    def test_optional_capabilities_do_not_become_global_core(self) -> None:
        errors = self.errors_after(
            lambda data: data["optional_project_capabilities"].__setitem__("not_global_core", False)
        )
        self.assertTrue(any("optional project capabilities" in error for error in errors))

    def test_delivery_optional_capabilities_remain_available(self) -> None:
        def mutate(data):
            data["optional_project_capabilities"]["available"].remove("CONSENT_REQUIRED")
            data["optional_project_capabilities"]["available"].remove("RUM_REQUIRED")

        errors = self.errors_after(mutate)
        self.assertTrue(any("CONSENT_REQUIRED" in error for error in errors))
        self.assertTrue(any("RUM_REQUIRED" in error for error in errors))

    def test_temporary_final_fix_layer_stays_prohibited(self) -> None:
        errors = self.errors_after(
            lambda data: data["human_maintainability"].__setitem__(
                "temporary_final_fix_layer_at_final", "WARN"
            )
        )
        self.assertTrue(any("temporary_final_fix_layer_at_final" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
