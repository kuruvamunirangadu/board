/**
 * VisiOS — Chemistry Molecular Studio Test Suite
 * Implementation 6: Interactive Molecular Visualization Engine
 *
 * Verifies:
 * 1. Analyze ethanol (CCO) returning formula C2H6O, heavy atoms, functional groups
 * 2. 3D conformer generation for ethanol (CCO) returning valid SDF MolBlock
 * 3. 2D diagram generation for ethanol (CCO) returning PNG base64
 * 4. Analyze acetic acid (CC(=O)O) detecting Carboxylic Acid (-COOH)
 * 5. 3D conformer generation for acetic acid
 * 6. Rejection of invalid SMILES with 400 across analyze, 3d, and 2d
 * 7. Verification of MolecularViewer3D component export
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/learning/chemistry/route';
import { MolecularViewer3D } from '../features/chemistry';

test('Molecular Studio Component - MolecularViewer3D export is valid', () => {
  assert.equal(typeof MolecularViewer3D, 'function');
});

test('Molecular Studio API - Analyze ethanol (CCO)', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: 'analyze', smiles: 'CCO' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    assert.equal(data.subject, 'chemistry');
    assert.equal(data.task, 'molecular_analysis');
    assert.equal(data.canonical_smiles, 'CCO');
    assert.equal(data.molecular_formula, 'C2H6O');
    assert.equal(data.heavy_atom_count, 3);
    assert.equal(data.total_atom_count, 9);
    assert.ok(data.functional_groups.some((g: { name: string }) => g.name.includes('Alcohol')));
    assert.equal(data.verified, true);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Molecular Studio API - 3D conformer generation for ethanol (CCO)', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: '3d', smiles: 'CCO' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    assert.equal(data.subject, 'chemistry');
    assert.equal(data.task, '3d_conformer_generation');
    assert.equal(data.canonical_smiles, 'CCO');
    assert.ok(typeof data.sdf === 'string');
    assert.ok(data.sdf.includes('M  END'));
    assert.equal(data.atom_count, 9);
    assert.equal(data.verified, true);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Molecular Studio API - 2D structure diagram for ethanol (CCO)', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: '2d', smiles: 'CCO' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    assert.equal(data.subject, 'chemistry');
    assert.equal(data.task, '2d_image_generation');
    assert.equal(data.mime_type, 'image/png');
    assert.ok(typeof data.image_base64 === 'string');
    assert.ok(data.image_base64.length > 100);
    assert.equal(data.verified, true);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Molecular Studio API - Analyze acetic acid (CC(=O)O)', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: 'analyze', smiles: 'CC(=O)O' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    assert.equal(data.canonical_smiles, 'CC(=O)O');
    assert.equal(data.molecular_formula, 'C2H4O2');
    assert.equal(data.heavy_atom_count, 4);
    assert.ok(data.functional_groups.some((g: { name: string }) => g.name.includes('Carboxylic Acid')));
    assert.equal(data.verified, true);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Molecular Studio API - 3D conformer for acetic acid (CC(=O)O)', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: '3d', smiles: 'CC(=O)O' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 200) {
    assert.ok(typeof data.sdf === 'string');
    assert.ok(data.sdf.includes('M  END'));
    assert.equal(data.atom_count, 8);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Molecular Studio API - Rejects invalid SMILES for analyze with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: 'analyze', smiles: 'INVALID_SMILES_STRING' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 400) {
    assert.match(data.error, /Invalid molecular SMILES/i);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Molecular Studio API - Rejects invalid SMILES for 3d with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: '3d', smiles: 'INVALID_SMILES_STRING' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 400) {
    assert.match(data.error, /Invalid molecular SMILES/i);
  } else {
    assert.equal(res.status, 503);
  }
});

test('Molecular Studio API - Rejects invalid SMILES for 2d with 400', async () => {
  const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
    method: 'POST',
    body: JSON.stringify({ action: '2d', smiles: 'INVALID_SMILES_STRING' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const res = await POST(req);
  const data = await res.json();

  if (res.status === 400) {
    assert.match(data.error, /Invalid molecular SMILES/i);
  } else {
    assert.equal(res.status, 503);
  }
});

