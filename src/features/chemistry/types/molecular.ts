export interface FunctionalGroupMatch {
  name: string;
  count: number;
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
