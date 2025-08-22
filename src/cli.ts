#!/usr/bin/env node

import { Command } from 'commander';
import { parseBUI } from './index';
import { formatError, formatWarning, groupErrorsByFile, getErrorStats } from './core/error-reporter';
import { validateFilePath } from './core/merger';
import { renderBUI, RenderOptions } from './renderer';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('breeth-bui-compiler')
  .description('Breeth .bui compiler for parsing, validating, and merging .bui files')
  .version('1.0.0');

program
  .command('compile')
  .description('Compile a .bui file or project')
  .argument('<entry-file>', 'Entry .bui file to compile')
  .option('-o, --output <file>', 'Output file for compilation result')
  .option('-f, --format <format>', 'Output format (json, pretty)', 'pretty')
  .option('--strict', 'Enable strict mode with additional validations')
  .option('--no-warnings', 'Suppress warnings')
  .option('--max-file-size <bytes>', 'Maximum file size in bytes', '1048576')
  .option('--max-files <count>', 'Maximum number of files', '100')
  .option('--validate-urls', 'Validate API URLs')
  .option('--timeout <ms>', 'Timeout for URL validation in milliseconds', '5000')
  .option('--metadata', 'Include metadata in output')
  .action(async (entryFile: string, options: any) => {
    try {
      // Validate entry file
      if (!fs.existsSync(entryFile)) {
        console.error(`❌ Error: Entry file not found: ${entryFile}`);
        process.exit(1);
      }

      // Parse options
      const compileOptions = {
        strict: options.strict || false,
        allowWarnings: options.warnings !== false,
        maxFileSize: parseInt(options.maxFileSize),
        maxFiles: parseInt(options.maxFiles),
        validateUrls: options.validateUrls || false,
        timeout: parseInt(options.timeout),
        withMetadata: options.metadata || false
      };

      console.log(`🔍 Compiling: ${entryFile}`);
      console.log(`⚙️  Options: ${JSON.stringify(compileOptions, null, 2)}`);
      console.log('');

      // Compile
      const startTime = Date.now();
      const result = parseBUI(entryFile, compileOptions);
      const compileTime = Date.now() - startTime;

      // Display results
      console.log(`✅ Compilation completed in ${compileTime}ms`);
      console.log(`📊 Summary:`);
      console.log(`   - BPods: ${result.ast.bPods.length}`);
      console.log(`   - Profile: ${result.ast.profile ? '✅' : '❌'}`);
      console.log(`   - Version: ${result.ast.version}`);
      console.log(`   - Success: ${result.success ? '✅' : '❌'}`);
      console.log('');

      // Display errors and warnings
      if (result.errors.length > 0 || result.warnings.length > 0) {
        const stats = getErrorStats(result.errors, result.warnings);
        
        if (result.errors.length > 0) {
          console.log(`❌ Errors (${result.errors.length}):`);
          const errorsByFile = groupErrorsByFile(result.errors);
          
          Object.entries(errorsByFile).forEach(([file, errors]) => {
            console.log(`\n📁 ${file}:`);
            errors.forEach(error => {
              console.log(formatError(error));
            });
          });
          console.log('');
        }

        if (result.warnings.length > 0 && options.warnings !== false) {
          console.log(`⚠️  Warnings (${result.warnings.length}):`);
          const warningsByFile = groupErrorsByFile(result.warnings as any);
          
          Object.entries(warningsByFile).forEach(([file, warnings]) => {
            console.log(`\n📁 ${file}:`);
            warnings.forEach((warning: any) => {
              console.log(formatWarning(warning));
            });
          });
          console.log('');
        }

        console.log(`📈 Statistics:`);
        console.log(`   - Total issues: ${stats.total}`);
        console.log(`   - Errors: ${stats.errors}`);
        console.log(`   - Warnings: ${stats.warnings}`);
        console.log(`   - Critical: ${stats.critical}`);
        console.log('');
      }

      // Output result
      if (options.output) {
        const outputData = options.format === 'json' 
          ? JSON.stringify(result, null, 2)
          : formatPrettyOutput(result);
        
        fs.writeFileSync(options.output, outputData);
        console.log(`💾 Output written to: ${options.output}`);
      } else if (options.format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatPrettyOutput(result));
      }

      // Exit with appropriate code
      process.exit(result.success ? 0 : 1);

    } catch (error) {
      console.error(`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate a .bui file without compilation')
  .argument('<file>', 'File to validate')
  .option('--strict', 'Enable strict validation')
  .action(async (file: string, options: any) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`❌ Error: File not found: ${file}`);
        process.exit(1);
      }

      console.log(`🔍 Validating: ${file}`);
      
      // Basic file validation
      const stats = fs.statSync(file);
      console.log(`📊 File size: ${stats.size} bytes`);
      console.log(`📅 Last modified: ${stats.mtime.toISOString()}`);
      
      // Check file extension
      const ext = path.extname(file);
      if (ext !== '.bui') {
        console.error(`❌ Error: Only .bui files are supported, got: ${ext}`);
        process.exit(1);
      }

      // Check if it's an index.bui file
      const fileName = path.basename(file);
      if (fileName !== 'index.bui') {
        console.error(`❌ Error: Only index.bui files can be used as entry points, got: ${fileName}`);
        console.error(`   Rename your file to index.bui or use index.bui as the entry point`);
        process.exit(1);
      }

      // Validate file path
      const pathValidation = validateFilePath(file, process.cwd());
      if (!pathValidation.valid) {
        console.error(`❌ Path validation failed: ${pathValidation.error}`);
        process.exit(1);
      }

      // Try to parse for validation
      const result = parseBUI(file, { 
        strict: options.strict || false,
        withMetadata: true 
      });

      if (result.success) {
        console.log(`✅ File is valid!`);
        console.log(`📊 Contains ${result.ast.bPods.length} BPods`);
        if (result.ast.profile) {
          console.log(`👤 Profile: ${result.ast.profile.name}`);
        }
      } else {
        console.log(`❌ File has validation errors`);
        result.errors.forEach(error => {
          console.log(formatError(error));
        });
      }

    } catch (error) {
      console.error(`❌ Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('render')
  .description('Render a .bui file to HTML, React, or JSON')
  .argument('<entry-file>', 'Entry .bui file to render')
  .option('-f, --format <format>', 'Output format (html, react, json)', 'html')
  .option('-t, --theme <theme>', 'Theme (light, dark)', 'light')
  .option('-o, --output <file>', 'Output file for rendered result')
  .option('--show-warnings', 'Show warnings in output')
  .option('--show-errors', 'Show errors in output')
  .option('--class-name <className>', 'Custom CSS class name')
  .action(async (entryFile: string, options: any) => {
    try {
      // Validate entry file
      if (!fs.existsSync(entryFile)) {
        console.error(`❌ Error: Entry file not found: ${entryFile}`);
        process.exit(1);
      }

      // Check file extension
      const ext = path.extname(entryFile);
      if (ext !== '.bui') {
        console.error(`❌ Error: Only .bui files are supported, got: ${ext}`);
        process.exit(1);
      }

      // Check if it's an index.bui file
      const fileName = path.basename(entryFile);
      if (fileName !== 'index.bui') {
        console.error(`❌ Error: Only index.bui files can be used as entry points, got: ${fileName}`);
        console.error(`   Rename your file to index.bui or use index.bui as the entry point`);
        process.exit(1);
      }

      // Parse options
      const renderOptions: RenderOptions = {
        format: options.format as 'html' | 'react' | 'json',
        theme: options.theme as 'light' | 'dark',
        showWarnings: options.showWarnings || false,
        showErrors: options.showErrors || false,
        className: options.className || ''
      };

      console.log(`🎨 Rendering: ${entryFile}`);
      console.log(`⚙️  Options: ${JSON.stringify(renderOptions, null, 2)}`);
      console.log('');

      // Render
      const startTime = Date.now();
      const result = renderBUI(entryFile, renderOptions);
      const renderTime = Date.now() - startTime;

      // Display results
      if (result.success) {
        console.log(`✅ Rendering completed in ${renderTime}ms`);
        console.log(`📊 Summary:`);
        console.log(`   - Format: ${renderOptions.format}`);
        console.log(`   - Theme: ${renderOptions.theme}`);
        console.log(`   - Output length: ${result.output.length} characters`);
        
        if (result.warnings && result.warnings.length > 0) {
          console.log(`   - Warnings: ${result.warnings.length}`);
        }
        console.log('');

        // Write to file or display
        if (options.output) {
          fs.writeFileSync(options.output, result.output);
          console.log(`💾 Output written to: ${options.output}`);
        } else {
          console.log(`📄 Rendered Output:`);
          console.log('='.repeat(50));
          console.log(result.output);
          console.log('='.repeat(50));
        }
      } else {
        console.log(`❌ Rendering failed in ${renderTime}ms`);
        console.log(`📊 Summary:`);
        console.log(`   - Format: ${renderOptions.format}`);
        console.log(`   - Theme: ${renderOptions.theme}`);
        console.log('');

        if (result.errors && result.errors.length > 0) {
          console.log(`🚨 Errors:`);
          result.errors.forEach(error => console.log(`   - ${error}`));
          console.log('');
        }

        if (result.warnings && result.warnings.length > 0) {
          console.log(`⚠️  Warnings:`);
          result.warnings.forEach(warning => console.log(`   - ${warning}`));
          console.log('');
        }

        // Write error output to file or display
        if (options.output) {
          options.output && fs.writeFileSync(options.output, result.output);
          console.log(`💾 Error output written to: ${options.output}`);
        } else {
          console.log(`📄 Error Output:`);
          console.log('='.repeat(50));
          console.log(result.output);
          console.log('='.repeat(50));
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('info')
  .description('Display information about a .bui file')
  .argument('<file>', 'File to analyze')
  .action(async (file: string) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`❌ Error: File not found: ${file}`);
        process.exit(1);
      }

      console.log(`🔍 Analyzing: ${file}`);
      
      const result = parseBUI(file, { withMetadata: true });
      
      console.log(`\n📋 File Information:`);
      console.log(`   - Version: ${result.ast.version}`);
      console.log(`   - BPods: ${result.ast.bPods.length}`);
      
      if (result.ast.profile) {
        console.log(`   - Profile: ${result.ast.profile.name}`);
        console.log(`   - Description: ${result.ast.profile.description}`);
      }

      if (result.metadata) {
        console.log(`   - Total files: ${result.metadata.includedFiles.length}`);
        console.log(`   - Parse time: ${result.metadata.parseTime}ms`);
        console.log(`   - Total size: ${result.metadata.totalSize} bytes`);
      }

      if (result.ast.bPods.length > 0) {
        console.log(`\n🚀 BPods:`);
        result.ast.bPods.forEach((bpod, index) => {
          console.log(`   ${index + 1}. ${bpod.name}`);
          console.log(`      - Accepts: ${bpod.accepts.join(', ')}`);
          console.log(`      - API: ${bpod.api.method} ${bpod.api.url}`);
          if (bpod.description) {
            console.log(`      - Description: ${bpod.description}`);
          }
        });
      }

    } catch (error) {
      console.error(`❌ Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

function formatPrettyOutput(result: any): string {
  let output = '';
  
  output += `=== BUI Compilation Result ===\n`;
  output += `Success: ${result.success ? 'Yes' : 'No'}\n`;
  output += `Version: ${result.ast.version}\n`;
  output += `BPods: ${result.ast.bPods.length}\n`;
  
  if (result.ast.profile) {
    output += `Profile: ${result.ast.profile.name}\n`;
  }
  
  if (result.errors.length > 0) {
    output += `\nErrors: ${result.errors.length}\n`;
    result.errors.forEach((error: any) => {
      output += `  ${error.code}: ${error.message}\n`;
    });
  }
  
  if (result.warnings.length > 0) {
    output += `\nWarnings: ${result.warnings.length}\n`;
    result.warnings.forEach((warning: any) => {
      output += `  ${warning.code}: ${warning.message}\n`;
    });
  }
  
  return output;
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`❌ Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(`❌ Unhandled Rejection: ${reason}`);
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);
