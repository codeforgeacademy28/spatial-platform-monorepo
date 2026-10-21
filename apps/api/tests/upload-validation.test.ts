import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getExtension,
  hasValidContentSignature,
  isAllowedForAssetType,
} from '../src/services/upload-validation.ts';

test('extension detection is case-insensitive and rejects unknown extensions', () => {
  assert.equal(getExtension('HOUSE.GLB'), '.glb');
  assert.equal(getExtension('plan.final.DXF'), '.dxf');
  assert.equal(getExtension('model.exe'), null);
  assert.equal(getExtension('no-extension'), null);
});

test('GLB and GLTF are validated by their actual content, not just MIME type', () => {
  const glb = Buffer.alloc(12);
  glb.write('glTF', 0, 'ascii');
  glb.writeUInt32LE(2, 4);
  glb.writeUInt32LE(12, 8);
  assert.equal(hasValidContentSignature('.glb', glb), true);
  glb.writeUInt32LE(100, 8);
  assert.equal(hasValidContentSignature('.glb', glb), false);
  assert.equal(hasValidContentSignature('.glb', Buffer.from('not a model')), false);
  assert.equal(
    hasValidContentSignature('.gltf', Buffer.from(JSON.stringify({ asset: { version: '2.0' } }))),
    true,
  );
  assert.equal(
    hasValidContentSignature('.gltf', Buffer.from(JSON.stringify({ asset: { version: '1.0' } }))),
    false,
  );
});

test('image and PDF signatures reject extension spoofing', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  assert.equal(hasValidContentSignature('.png', png), true);
  assert.equal(hasValidContentSignature('.jpg', png), false);
  assert.equal(hasValidContentSignature('.pdf', Buffer.from('%PDF-1.7')), true);
  assert.equal(hasValidContentSignature('.pdf', Buffer.from('hello')), false);
});

test('CAD and mesh text formats require recognizable content', () => {
  assert.equal(hasValidContentSignature('.ifc', Buffer.from('ISO-10303-21;\nHEADER;')), true);
  assert.equal(hasValidContentSignature('.dxf', Buffer.from('0\nSECTION\n2\nENTITIES')), true);
  assert.equal(hasValidContentSignature('.obj', Buffer.from('v 0 0 0\nf 1 1 1')), true);
  assert.equal(hasValidContentSignature('.stl', Buffer.from('solid part\nfacet normal 0 0 1\nvertex 0 0 0')), true);
  assert.equal(hasValidContentSignature('.ifc', Buffer.from('not IFC')), false);
});

test('asset type allowlist prevents models being uploaded as images or blueprints', () => {
  assert.equal(isAllowedForAssetType('model', '.glb'), true);
  assert.equal(isAllowedForAssetType('model', '.ifc'), true);
  assert.equal(isAllowedForAssetType('image', '.glb'), false);
  assert.equal(isAllowedForAssetType('blueprint', '.pdf'), true);
  assert.equal(isAllowedForAssetType('blueprint', '.dwg'), false);
});
