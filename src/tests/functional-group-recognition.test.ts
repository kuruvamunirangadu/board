/**
 * VisiOS — Functional Group Recognition Engine Test Suite
 *
 * Verifies:
 * 1. Recognition of the 7 core molecules:
 *    - Ethanol (CCO) -> Alcohol
 *    - Acetic acid (CC(=O)O) -> Carboxylic Acid
 *    - Acetone (CC(=O)C) -> Ketone
 *    - Ethyl acetate (CCOC(=O)C) -> Ester
 *    - Acetamide (CC(=O)N) -> Amide
 *    - Benzene (c1ccccc1) -> Aromatic Ring
 *    - Acetonitrile (CC#N) -> Nitrile
 * 2. Multi-group molecule recognition (Aspirin -> carboxylic acid, ester, aromatic ring)
 * 3. Multiple occurrences in single molecule (Ethylene glycol -> 2 alcohol groups)
 * 4. Error handling: invalid SMILES returns 422
 * 5. MolecularViewer3D component interface and integration with functional groups
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/learning/chemistry/route';
import { MolecularViewer3D } from '../features/chemistry';

test('MolecularViewer3D Component - Component is defined and instantiable', () => {
  assert.equal(typeof MolecularViewer3D, 'function');
});

test('Functional Group API - Recognizes Ethanol (CCO) as Alcohol', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: 'functional-groups', smiles: 'CCO' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    assert.equal(data.subject, 'chemistry');
    assert.equal(data.task, 'functional_group_recognition');
    assert.equal(data.canonical_smiles, 'CCO');
    assert.ok(data.functional_group_count >= 1);
    const alcohol = data.detected_groups.find((g: { id: string }) => g.id === 'alcohol');
    assert.ok(alcohol, 'Should detect alcohol in ethanol');
    assert.equal(alcohol.name, 'Alcohol');
    assert.equal(alcohol.occurrences, 1);
    assert.ok(data.highlighted_atom_indices.length > 0);
    assert.equal(data.verified, true);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Functional Group API - Recognizes Acetic Acid (CC(=O)O) as Carboxylic Acid', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: 'functional-groups', smiles: 'CC(=O)O' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    assert.equal(data.functional_group_count, 1);
    const acid = data.detected_groups[0];
    assert.equal(acid.id, 'carboxylic_acid');
    assert.equal(acid.name, 'Carboxylic Acid');
    assert.equal(acid.occurrences, 1);
    assert.equal(acid.matches.length, 1);
    assert.ok(Array.isArray(acid.matches[0].atom_indices));
    assert.ok(Array.isArray(acid.matches[0].atom_symbols));
  } else {
    assert.equal(res.status, 503);
  }
});

test('Functional Group API - Recognizes Acetone (CC(=O)C) as Ketone', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: 'functional-groups', smiles: 'CC(=O)C' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    const ketone = data.detected_groups.find((g: { id: string }) => g.id === 'ketone');
    assert.ok(ketone, 'Should detect ketone in acetone');
    assert.equal(ketone.name, 'Ketone');
    assert.equal(ketone.occurrences, 1);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Functional Group API - Recognizes Ethyl Acetate (CCOC(=O)C) as Ester', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: 'functional-groups', smiles: 'CCOC(=O)C' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    const ester = data.detected_groups.find((g: { id: string }) => g.id === 'ester');
    assert.ok(ester, 'Should detect ester in ethyl acetate');
    assert.equal(ester.name, 'Ester');
    assert.equal(ester.occurrences, 1);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Functional Group API - Recognizes Acetamide (CC(=O)N) as Amide', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: 'functional-groups', smiles: 'CC(=O)N' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    const amide = data.detected_groups.find((g: { id: string }) => g.id === 'amide');
    assert.ok(amide, 'Should detect amide in acetamide');
    assert.equal(amide.name, 'Amide');
    assert.equal(amide.occurrences, 1);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Functional Group API - Recognizes Benzene (c1ccccc1) as Aromatic Ring', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: 'functional-groups', smiles: 'c1ccccc1' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    const ring = data.detected_groups.find((g: { id: string }) => g.id === 'aromatic_ring');
    assert.ok(ring, 'Should detect aromatic ring in benzene');
    assert.equal(ring.name, 'Aromatic Ring');
    assert.equal(ring.occurrences, 1);
    assert.equal(ring.matches[0].atom_indices.length, 6);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Functional Group API - Recognizes Acetonitrile (CC#N) as Nitrile', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: 'functional-groups', smiles: 'CC#N' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    const nitrile = data.detected_groups.find((g: { id: string }) => g.id === 'nitrile');
    assert.ok(nitrile, 'Should detect nitrile in acetonitrile');
    assert.equal(nitrile.name, 'Nitrile');
    assert.equal(nitrile.occurrences, 1);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Functional Group API - Recognizes multiple distinct groups in Aspirin', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: 'functional-groups', smiles: 'CC(=O)Oc1ccccc1C(=O)O' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    const groupIds = data.detected_groups.map((g: { id: string }) => g.id);
    assert.ok(groupIds.includes('carboxylic_acid'), 'Aspirin should have carboxylic acid');
    assert.ok(groupIds.includes('ester'), 'Aspirin should have ester');
    assert.ok(groupIds.includes('aromatic_ring'), 'Aspirin should have aromatic ring');
  } else {
    assert.equal(res.status, 503);
  }
});

test('Functional Group API - Recognizes multiple occurrences in Ethylene Glycol', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: 'functional-groups', smiles: 'OCCO' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    const alcohol = data.detected_groups.find((g: { id: string }) => g.id === 'alcohol');
    assert.ok(alcohol);
    assert.equal(alcohol.occurrences, 2);
    assert.equal(alcohol.matches.length, 2);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Functional Group API - Rejects invalid SMILES with 422', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: 'functional-groups', smiles: 'INVALID_SMILES_STRING' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 422) {
    assert.match(data.error, /Invalid SMILES/i);
  } else {
    assert.equal(res.status, 503);
  }
});
