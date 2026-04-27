// policies.js
const fs = require('fs');
const path = require('path');

const loadPolicyTexts = () => {
  try {
    const tos_he = fs.readFileSync(path.join(__dirname, 'texts/tos_he.txt'), 'utf-8');
    const tos_en = fs.readFileSync(path.join(__dirname, 'texts/tos_en.txt'), 'utf-8');
    const tos_ar = fs.readFileSync(path.join(__dirname, 'texts/tos_ar.txt'), 'utf-8');
    const privacy_ar = fs.readFileSync(path.join(__dirname, 'texts/privacy_ar.txt'), 'utf-8');
    const privacy_he = fs.readFileSync(path.join(__dirname, 'texts/privacy_he.txt'), 'utf-8');
    const privacy_en = fs.readFileSync(path.join(__dirname, 'texts/privacy_en.txt'), 'utf-8');
    const app_usage_he = fs.readFileSync(path.join(__dirname, 'texts/HOW_TO_USE_he.txt'), 'utf-8');
    const app_usage_en = fs.readFileSync(path.join(__dirname, 'texts/HOW_TO_USE_en.txt'), 'utf-8');
    const app_usage_ar = fs.readFileSync(path.join(__dirname, 'texts/HOW_TO_USE_ar.txt'), 'utf-8');
    return {
      tos_he,
      tos_en,
      tos_ar,
      privacy_ar,
      privacy_he,
      privacy_en,
      app_usage_he,
      app_usage_en,
      app_usage_ar
    };
  } catch (error) {
    console.error('Error loading policy texts:', error);
    // Return default texts if files can't be loaded
    return {
      tos_he: 'תנאי שימוש',
      tos_en: 'Terms of Service',
      tos_ar: 'شروط الاستخدام',
      privacy_ar: 'سياسة الخصوصية',
      privacy_he: 'מדיניות פרטיות',
      privacy_en: 'Privacy Policy',
      app_usage_he: 'דרכי השימוש של האפליקציה',
      app_usage_en: 'How to use the app',
      app_usage_ar: 'كيفية استخدام التطبيق'
    };
  }
};

module.exports = { loadPolicyTexts }; 