// policies.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loadPolicyTexts = () => {
  const tos_he = fs.readFileSync(path.join(__dirname, 'texts/tos_he.txt'), 'utf-8');
  const tos_en = fs.readFileSync(path.join(__dirname, 'texts/tos_en.txt'), 'utf-8');
  const tos_ar = fs.readFileSync(path.join(__dirname, 'texts/tos_ar.txt'), 'utf-8');
  const privacy_ar = fs.readFileSync(path.join(__dirname, 'texts/privacy_ar.txt'), 'utf-8');
  const privacy_he = fs.readFileSync(path.join(__dirname, 'texts/privacy_he.txt'), 'utf-8');
  const privacy_en = fs.readFileSync(path.join(__dirname, 'texts/privacy_en.txt'), 'utf-8');

  return {
    tos_he,
    tos_en,
    tos_ar,
    privacy_ar,
    privacy_he,
    privacy_en
  };
};
