#!/usr/bin/env node

/**
 * BUI Compiler NPM Package Usage Examples
 * 
 * This demonstrates how to use the BUI compiler as a regular npm package
 * that returns rendered output directly (like axios), not creating files.
 */

const { renderBUIString, renderBUIContent, parseBUI } = require('@srk0102/bui-compiler');

// Sample BUI content
const sampleBUI = `
version: "1.0.0"

---
profile: {
  "name": "NPM Package Demo",
  "description": "Demonstrating npm package usage",
  "logo": "https://via.placeholder.com/80x80/007bff/ffffff?text=NPM",
  "website": "https://example.com",
  "contact": "npm@example.com"
}

---
b-pod: "Text Processor" {
  "accepts": ["txt", "md"],
  "description": "Process text files with various operations",
  "tags": ["text", "processing"],
  "inputs": [
    {
      "name": "operation",
      "type": "dropdown",
      "label": "Text Operation",
      "options": ["uppercase", "lowercase", "reverse"],
      "required": true
    },
    {
      "name": "preserve_formatting",
      "type": "checkbox",
      "label": "Preserve Formatting",
      "required": false
    }
  ],
  "submit": { "label": "Process Text", "action": "processText" },
  "api": {
    "url": "https://api.example.com/v1/text/process",
    "method": "POST",
    "fileParams": ["textFile"],
    "bodyTemplate": {
      "file": "{textFile}",
      "operation": "{operation}",
      "preserve_formatting": "{preserve_formatting}",
      "webhook_url": "{webhook_url}"
    },
    "responseType": "file"
  }
}

---
b-pod: "Image Analyzer" {
  "accepts": ["jpg", "png"],
  "description": "Analyze images for content",
  "tags": ["image", "analysis"],
  "inputs": [
    {
      "name": "analysis_type",
      "type": "radio",
      "label": "Analysis Type",
      "options": ["objects", "faces", "text"],
      "required": true
    }
  ],
  "submit": { "label": "Analyze Image", "action": "analyzeImage" },
  "api": {
    "url": "https://api.example.com/v1/image/analyze",
    "method": "POST",
    "fileParams": ["imageFile"],
    "bodyTemplate": {
      "file": "{imageFile}",
      "analysis_type": "{analysis_type}",
      "webhook_url": "{webhook_url}"
    },
    "responseType": "json"
  }
}`;

console.log('🚀 BUI Compiler NPM Package Usage Examples');
console.log('='.repeat(60));
console.log('');

// Example 1: Simple string renderer (like axios)
console.log('📦 Example 1: Simple String Renderer (renderBUIString)');
console.log('-'.repeat(50));

try {
  // Render to HTML (default)
  const htmlOutput = renderBUIString(sampleBUI, 'html', 'light');
  console.log('✅ HTML Output Length:', htmlOutput.length, 'characters');
  console.log('📄 First 200 chars:', htmlOutput.substring(0, 200) + '...');
  
  // Render to React
  const reactOutput = renderBUIString(sampleBUI, 'react', 'dark');
  console.log('✅ React Output Length:', reactOutput.length, 'characters');
  console.log('📄 First 200 chars:', reactOutput.substring(0, 200) + '...');
  
  // Render to JSON
  const jsonOutput = renderBUIString(sampleBUI, 'json');
  console.log('✅ JSON Output Length:', jsonOutput.length, 'characters');
  console.log('📄 First 200 chars:', jsonOutput.substring(0, 200) + '...');
  
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('');

// Example 2: Advanced renderer with options (like axios with config)
console.log('🔧 Example 2: Advanced Renderer (renderBUIContent)');
console.log('-'.repeat(50));

try {
  const result = renderBUIContent(sampleBUI, {
    format: 'html',
    theme: 'dark',
    showWarnings: true,
    showErrors: true,
    className: 'my-custom-app'
  });
  
  if (result.success) {
    console.log('✅ Rendering successful');
    console.log('📊 Output length:', result.output.length, 'characters');
    console.log('⚠️  Warnings:', result.warnings?.length || 0);
    
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => console.log('   -', warning));
    }
  } else {
    console.log('❌ Rendering failed');
    console.log('🚨 Errors:', result.errors?.length || 0);
    if (result.errors) {
      result.errors.forEach(error => console.log('   -', error));
    }
  }
  
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('');

// Example 3: Direct parsing (like axios for data)
console.log('🔍 Example 3: Direct Parsing (parseBUI)');
console.log('-'.repeat(50));

try {
  const parseResult = parseBUI('/tmp/demo.bui', { 
    content: sampleBUI,
    withMetadata: true 
  });
  
  if (parseResult.success) {
    console.log('✅ Parsing successful');
    console.log('📊 Version:', parseResult.ast.version);
    console.log('📊 Profile:', parseResult.ast.profile?.name);
    console.log('📊 BPods:', parseResult.ast.bPods.length);
    
    parseResult.ast.bPods.forEach((bpod, index) => {
      console.log(`   ${index + 1}. ${bpod.name} (${bpod.accepts.join(', ')})`);
    });
    
    if (parseResult.metadata) {
      console.log('📊 Parse time:', parseResult.metadata.parseTime, 'ms');
      console.log('📊 Total size:', parseResult.metadata.totalSize, 'bytes');
    }
  } else {
    console.log('❌ Parsing failed');
    console.log('🚨 Errors:', parseResult.errors.length);
    parseResult.errors.forEach(error => console.log('   -', error.message));
  }
  
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('');

// Example 4: Error handling
console.log('🚨 Example 4: Error Handling');
console.log('-'.repeat(50));

try {
  const invalidBUI = `
version: "1.0.0"

---
profile: {
  "name": "Invalid Demo",
  "description": "This has errors"
}

---
b-pod: "Invalid Service" {
  "accepts": [],
  "submit": { "label": "Process", "action": "process" },
  "api": {
    "url": "not-a-valid-url",
    "method": "POST",
    "fileParams": ["file"],
    "bodyTemplate": {
      "file": "{file}"
    },
    "responseType": "file"
  }
}`;

  const errorResult = renderBUIContent(invalidBUI, {
    format: 'html',
    theme: 'light',
    showErrors: true,
    showWarnings: true
  });
  
  if (!errorResult.success) {
    console.log('✅ Error handling working correctly');
    console.log('🚨 Errors:', errorResult.errors?.length || 0);
    if (errorResult.errors) {
      errorResult.errors.forEach(error => console.log('   -', error));
    }
    console.log('📄 Error HTML length:', errorResult.output.length, 'characters');
  } else {
    console.log('❌ Expected errors but got success');
  }
  
} catch (error) {
  console.log('❌ Unexpected error:', error.message);
}

console.log('');
console.log('🎉 All examples completed!');
console.log('');
console.log('💡 Usage Summary:');
console.log('   • renderBUIString(content, format, theme) - Simple string output');
console.log('   • renderBUIContent(content, options) - Advanced with options');
console.log('   • parseBUI(path, { content: string }) - Direct parsing');
console.log('');
console.log('📦 This works just like axios - pass content, get rendered output back!');
