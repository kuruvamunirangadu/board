export interface FunctionalGroupMatch {
  name: string;
  count: number;
}

export interface FunctionalGroupMatchDetail {
  atom_indices: number[];
  atom_symbols: string[];
}

export interface FunctionalGroupDetection {
  id: string;
  name: string;
  description: string;
  example: string;
  significance: string;
  occurrences: number;
  matches: FunctionalGroupMatchDetail[];
}

export interface FunctionalGroupRecognitionResult {
  subject: "chemistry";
  task: "functional_group_recognition";
  input_smiles: string;
  canonical_smiles: string;
  molecular_formula: string;
  functional_group_count: number;
  total_occurrences: number;
  highlighted_atom_indices: number[];
  detected_groups: FunctionalGroupDetection[];
  verified: boolean;
}

export interface MolecularAnalysisResult {
  subject: "chemistry";
  task: "molecular_analysis";
  input_smiles: string;
  canonical_smiles: string;
  molecular_formula: string;
  molecular_weight: number;
  exact_mass: number;
  heavy_atom_count: number;
  total_atom_count: number;
  total_bond_count: number;
  atom_breakdown: Record<string, number>;
  functional_groups: FunctionalGroupMatch[];
  verified: boolean;
}

export interface Conformer3DResult {
  subject: "chemistry";
  task: "3d_conformer_generation";
  canonical_smiles: string;
  sdf: string;
  optimization_status: number;
  atom_count: number;
  heavy_atom_count: number;
  verified: boolean;
}

export interface MolecularImage2DResult {
  subject: "chemistry";
  task: "2d_image_generation";
  smiles: string;
  image_base64: string;
  mime_type: string;
  verified: boolean;
}

export type MolecularStyle = "stick" | "sphere" | "line" | "cross";
