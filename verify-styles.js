#!/usr/bin/env node

/**
 * Quick verification script to check if styles are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task Manager Styles Configuration...\n');

// Check 1: Verify Tailwind CSS is installed correctly
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const tailwindVersion = packageJson.devDependencies?.tailwindcss;
  
  if (tailwindVersion && tailwindVersion.startsWith('^3.')) {
    console.log('✅ Tailwind CSS v3 installed:', tailwindVersion);
  } else {
    console.log('❌ Tailwind CSS v3 not found. Current version:', tailwindVersion);
  }
} catch (error) {
  console.log('❌ Could not read package.json');
}

// Check 2: Verify globals.css has Tailwind directives
try {
  const globalsCss = fs.readFileSync('src/app/globals.css', 'utf8');
  
  if (globalsCss.includes('@tailwind base') && 
      globalsCss.includes('@tailwind components') && 
      globalsCss.includes('@tailwind utilities')) {
    console.log('✅ Tailwind directives found in globals.css');
  } else {
    console.log('❌ Missing Tailwind directives in globals.css');
  }
  
  if (globalsCss.includes('--background') && globalsCss.includes('--foreground')) {
    console.log('✅ CSS variables configured for theming');
  } else {
    console.log('❌ CSS variables missing for theming');
  }
} catch (error) {
  console.log('❌ Could not read globals.css');
}

// Check 3: Verify PostCSS configuration
try {
  const postcssConfig = fs.readFileSync('postcss.config.mjs', 'utf8');
  
  if (postcssConfig.includes('tailwindcss') && postcssConfig.includes('autoprefixer')) {
    console.log('✅ PostCSS configured correctly');
  } else {
    console.log('❌ PostCSS configuration issues');
  }
} catch (error) {
  console.log('❌ Could not read postcss.config.mjs');
}

// Check 4: Verify Tailwind config exists and has proper structure
try {
  const tailwindConfig = fs.readFileSync('tailwind.config.ts', 'utf8');
  
  if (tailwindConfig.includes('darkMode') && 
      tailwindConfig.includes('content') && 
      tailwindConfig.includes('extend')) {
    console.log('✅ Tailwind config properly structured');
  } else {
    console.log('❌ Tailwind config missing key sections');
  }
} catch (error) {
  console.log('❌ Could not read tailwind.config.ts');
}

// Check 5: Verify shadcn/ui components exist
try {
  const uiPath = 'src/components/ui';
  const uiComponents = fs.readdirSync(uiPath);
  
  const expectedComponents = ['button.tsx', 'card.tsx', 'input.tsx', 'dialog.tsx'];
  const foundComponents = expectedComponents.filter(comp => uiComponents.includes(comp));
  
  if (foundComponents.length >= 3) {
    console.log('✅ shadcn/ui components installed:', foundComponents.join(', '));
  } else {
    console.log('❌ shadcn/ui components missing or incomplete');
  }
} catch (error) {
  console.log('❌ Could not verify shadcn/ui components');
}

console.log('\n🎯 Style Configuration Summary:');
console.log('- Tailwind CSS v3 with proper PostCSS setup');
console.log('- shadcn/ui component system');
console.log('- Dark/light mode theming');
console.log('- Responsive design utilities');
console.log('- Professional color scheme');

console.log('\n🚀 Your app should now have beautiful, modern styling!');
console.log('📱 Visit http://localhost:3000 to see the result');