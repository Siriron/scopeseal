export type Verdict = "" | "COMPLIANT" | "SCOPE_VIOLATION" | "INCONCLUSIVE";

export interface PublishProfile {
  package_name: string;
  owner: string;
  allow_lifecycle_scripts: boolean;
  max_dependency_count: number;
  allow_platform_restriction: boolean;
  created_at: number;
}

export interface ReleaseDeclaration {
  declaration_id: number;
  package_name: string;
  version: string;
  declarer: string;
  declared_allow_lifecycle_scripts: boolean;
  declared_max_dependency_count: number;
  declared_allow_platform_restriction: boolean;
  status: "declared" | "checked";
  verdict: Verdict;
  observed_has_lifecycle_script: boolean;
  observed_dependency_count: number;
  observed_has_platform_restriction: boolean;
  reasoning_summary: string;
  created_at: number;
  checked_at: number;
}

export interface PackageLedger {
  package_name: string;
  compliant_count: number;
  violation_count: number;
  inconclusive_count: number;
  latest_verdict: Verdict;
  latest_declaration_id: number;
}
