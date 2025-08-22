# Breeth BUI Compiler

A robust, production-grade compiler for parsing, validating, and merging `.bui` files. This compiler provides comprehensive error reporting, validation, and a powerful CLI interface for working with Breeth UI configuration files.

**📦 Package:** `breeth-bui-compiler`  
**👤 Author:** `@srk0102`  
**🔗 NPM:** https://www.npmjs.com/package/breeth-bui-compiler

## 🚀 Quick Start

```bash
npm install breeth-bui-compiler
```

```typescript
import { renderBUIString } from 'breeth-bui-compiler';

// Pass BUI content, get rendered output back (like axios)
const htmlOutput = renderBUIString(buiContent, 'html', 'light');
const reactOutput = renderBUIString(buiContent, 'react', 'dark');
const jsonOutput = renderBUIString(buiContent, 'json');
```

**No file creation - just pass content and get rendered output back!**

## Features

### 🚀 **Production-Grade Compiler**
- **Robust Error Handling**: Comprehensive error codes and detailed error messages
- **Advanced Validation**: Schema validation with Zod, custom validation rules
- **Security Features**: Path traversal protection, file size limits, suspicious file detection
- **Performance Monitoring**: Parse time tracking, file size statistics

### 📁 **Multi-File Support**
- **Project Organization**: Split large configurations across multiple files
- **Dependency Management**: Automatic file inclusion and merging
- **Circular Dependency Detection**: Prevents infinite loops
- **File Validation**: Security checks and size limits

### 🔍 **Comprehensive Validation**
- **Profile Validation**: Name, description, logo, website, contact validation
- **BPod Validation**: API endpoints, file types, body templates
- **URL Validation**: HTTPS enforcement, accessibility checking
- **Schema Validation**: Type safety with comprehensive error reporting
- **File Type Restriction**: Only .bui files are supported
- **HTTP Methods**: Only GET and POST methods are allowed

### 🛠️ **Powerful CLI Interface**
- **Compile Command**: Full compilation with options
- **Validate Command**: Quick validation without compilation
- **Info Command**: Detailed file analysis
- **Multiple Output Formats**: JSON and human-readable output

### 📊 **Advanced Error Reporting**
- **Error Codes**: Standardized error codes for programmatic handling
- **Context Information**: Line numbers, file paths, surrounding code
- **Suggestions**: Helpful hints for fixing issues
- **Grouped Output**: Errors organized by file for better readability

## Installation

```bash
npm install breeth-bui-compiler
```

## Quick Start

### Basic Usage

```typescript
import { parseBUI } from 'breeth-bui-compiler';

const result = parseBUI('config.bui');
if (result.success) {
  console.log(`Compiled ${result.ast.bPods.length} BPods`);
} else {
  console.log(`Compilation failed with ${result.errors.length} errors`);
}
```

### CLI Usage

```bash
# Compile a .bui file
npx breeth-bui-compiler compile index.bui

# Validate a .bui file
npx breeth-bui-compiler validate index.bui

# Render a .bui file to HTML, React, or JSON
npx breeth-bui-compiler render index.bui

# Get detailed information
npx breeth-bui-compiler info index.bui
```

**CLI Command:** `npx breeth-bui-compiler` or `npx breeth-bui-compiler --help`

### Available Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `compile` | Compile and validate .bui files | `npx breeth-bui-compiler compile <file>` |
| `validate` | Quick validation without compilation | `npx breeth-bui-compiler validate <file>` |
| `render` | Render to HTML/React/JSON | `npx breeth-bui-compiler render <file>` |
| `info` | Get detailed file information | `npx breeth-bui-compiler info <file>` |

#### Compile Command

```bash
npx breeth-bui-compiler compile <entry-file> [options]
```

**Options:**
- `-o, --output <file>`: Save output to file (default: console)
- `-f, --format <format>`: Output format: `json` or `pretty` (default: pretty)
- `--strict`: Enable strict validation mode
- `--no-warnings`: Hide warning messages
- `--max-file-size <bytes>`: Max file size limit (default: 1MB)
- `--max-files <count>`: Max number of files (default: 100)
- `--validate-urls`: Check if API URLs are accessible
- `--timeout <ms>`: URL validation timeout (default: 5000ms)
- `--metadata`: Include build metadata in output

#### Render Command

```bash
npx breeth-bui-compiler render <entry-file> [options]
```

**Options:**
- `-f, --format <format>`: Output format: `html`, `react`, or `json` (default: html)
- `-t, --theme <theme>`: Theme: `light` or `dark` (default: light)
- `-o, --output <file>`: Save output to file (default: console)
- `--show-warnings`: Include warnings in output
- `--show-errors`: Include errors in output
- `--class-name <name>`: Custom CSS class name for styling

**Examples:**
```bash
# Render to HTML with light theme
npx breeth-bui-compiler render index.bui -f html -t light

# Render to React component with dark theme
npx breeth-bui-compiler render index.bui -f react -t dark

# Render to JSON and save to file
npx breeth-bui-compiler render index.bui -f json -o output.json

# Render to HTML with custom class and save to file
npx breeth-bui-compiler render index.bui -f html -t light --class-name my-app -o app.html
```

## 📝 BUI File Format

BUI files define AI plugin panels with services, inputs, and API configurations. Here's how to write them:

### Basic BUI File

```yaml
version: "1.0.0"

---
profile: {
  "name": "My AI Service",
  "description": "Process audio files with AI",
  "logo": "https://example.com/logo.png",
  "website": "https://example.com",
  "contact": "support@example.com"
}

---
b-pod: "Audio Processor" {
  "accepts": ["mp3", "wav", "aac"],
  "description": "Convert and enhance audio files",
  "inputs": [
    {
      "name": "quality",
      "type": "dropdown",
      "label": "Output Quality",
      "options": ["low", "medium", "high"],
      "required": true
    },
    {
      "name": "format",
      "type": "radio",
      "label": "Output Format",
      "options": ["mp3", "wav", "aac"],
      "required": true
    }
  ],
  "submit": { "label": "Process Audio", "action": "processAudio" },
  "api": {
    "url": "https://api.example.com/v1/audio/process",
    "method": "POST",
    "fileParams": ["audioFile"],
    "bodyTemplate": {
      "file": "{audioFile}",
      "quality": "{quality}",
      "format": "{format}",
      "webhook_url": "{webhook_url}"
    },
    "responseType": "file"
  }
}
```

### Multi-File Project

For larger projects, you can split your BUI into multiple files:

**index.bui (Main file):**
```yaml
version: "1.0.0"

---
profile: {
  "name": "AI Studio",
  "description": "Complete AI processing suite",
  "logo": "https://example.com/logo.png",
  "website": "https://example.com"
}

---
files: ["services/audio.bui", "services/text.bui"]

---
b-pod: "Main Controller" {
  "accepts": ["txt", "mp3", "jpg"],
  "submit": { "label": "Process", "action": "process" },
  "api": {
    "url": "https://api.example.com/v1/process",
    "method": "POST",
    "fileParams": ["inputFile"],
    "bodyTemplate": {
      "file": "{inputFile}",
      "webhook_url": "{webhook_url}"
    },
    "responseType": "json"
  }
}
```

**services/audio.bui:**
```yaml
b-pod: "Audio Processor" {
  "accepts": ["mp3", "wav", "aac"],
  "description": "Process audio files",
  "inputs": [
    {
      "name": "quality",
      "type": "dropdown",
      "label": "Quality",
      "options": ["low", "medium", "high"],
      "required": true
    }
  ],
  "submit": { "label": "Process Audio", "action": "processAudio" },
  "api": {
    "url": "https://api.example.com/v1/audio",
    "method": "POST",
    "fileParams": ["audioFile"],
    "bodyTemplate": {
      "file": "{audioFile}",
      "quality": "{quality}",
      "webhook_url": "{webhook_url}"
    },
    "responseType": "file"
  }
}
```

### Writing Rules

1. **Main File**: Use `index.bui` as your main file
2. **Profile**: Put your profile info in `index.bui` only
3. **BPods**: Define your services in `index.bui` or separate files
4. **File References**: Use `files: ["file1.bui", "file2.bui"]` to include other files
5. **Separators**: Use `---` to separate different sections

### Input Types

- **text**: Single line text input
- **textarea**: Multi-line text input
- **number**: Numeric input with optional min/max validation
- **checkbox**: Boolean true/false input
- **radio**: Single selection from options
- **dropdown**: Dropdown selection from options

### API Configuration

- **url**: Must be HTTPS URL
- **method**: "GET" or "POST" only
- **fileParams**: Array of file parameter names
- **bodyTemplate**: JSON template with `{variable}` placeholders
- **responseType**: "json" or "file"
- **webhook_url**: Always include `{webhook_url}` in bodyTemplate

## Renderer

The BUI compiler includes a powerful renderer that can convert compiled BUI definitions into multiple output formats:

### Supported Formats

- **HTML**: Complete HTML pages with embedded CSS and JavaScript
- **React**: React components with hooks and state management
- **JSON**: Structured data for programmatic access

### Renderer Functions

- `renderBUI(entryPath, options)`: Main renderer function
- `renderBUICLI(entryPath, options)`: CLI-friendly renderer function

### Renderer Options

```typescript
interface RenderOptions {
  format: 'react' | 'html' | 'json';
  theme?: 'light' | 'dark';
  showErrors?: boolean;
  showWarnings?: boolean;
  className?: string;
  onAction?: (bpodName: string, action: string, data: any) => void;
}
```

### Programmatic Usage

#### Simple String Renderer (Like Axios)

```typescript
import { renderBUIString } from '@srk0102/bui-compiler';

// Render to HTML (default)
const htmlOutput = renderBUIString(buiContent, 'html', 'light');

// Render to React component
const reactOutput = renderBUIString(buiContent, 'react', 'dark');

// Render to JSON
const jsonOutput = renderBUIString(buiContent, 'json');
```

#### Advanced Renderer with Options

```typescript
import { renderBUIContent } from 'breeth-bui-compiler';

const result = renderBUIContent(buiContent, {
  format: 'html',
  theme: 'dark',
  showWarnings: true,
  showErrors: true,
  className: 'my-custom-app'
});

if (result.success) {
  console.log('HTML output:', result.output);
  console.log('Warnings:', result.warnings);
} else {
  console.log('Errors:', result.errors);
}
```

#### Direct Parsing

```typescript
import { parseBUI } from 'breeth-bui-compiler';

const parseResult = parseBUI('/tmp/demo.bui', { 
  content: buiContent,
  withMetadata: true 
});

if (parseResult.success) {
  console.log('Version:', parseResult.ast.version);
  console.log('Profile:', parseResult.ast.profile?.name);
  console.log('BPods:', parseResult.ast.bPods.length);
}
```

#### File-based Rendering (Legacy)

```typescript
import { renderBUI } from 'breeth-bui-compiler';

const htmlResult = renderBUI('index.bui', {
  format: 'html',
  theme: 'light',
  showWarnings: true,
  className: 'my-app'
});

if (htmlResult.success) {
  console.log('HTML output:', htmlResult.output);
} else {
  console.log('Errors:', htmlResult.errors);
}
```

#### CLI-specific Functions

```typescript
import { renderBUICLI } from 'breeth-bui-compiler/cli';

// CLI-specific functions for programmatic CLI usage
renderBUICLI('index.bui', {
  format: 'html',
  theme: 'light'
});
```

### Error Handling

The renderer gracefully handles compilation errors and warnings:

- **Compilation Errors**: Shows detailed error information with error codes, messages, and file locations
- **Compilation Warnings**: Displays warnings that don't prevent rendering
- **Format-Specific Output**: Errors are displayed in the appropriate format (HTML, React, or JSON)

### Demo

Run the included demo to see the renderer in action:

```bash
# Build the project first
npm run build

# Run the demo
node examples/render-demo.js
```

This will generate sample HTML, React, and JSON outputs from a demo BUI file.

## API Reference

### Core Functions

#### `parseBUI(entryPath: string, options?: CompileOptions): CompileResult`

Main compilation function that parses and validates `.bui` files.

**Options:**
- `strict`: Enable strict validation mode
- `allowWarnings`: Allow compilation to succeed with warnings
- `maxFileSize`: Maximum file size in bytes (default: 1MB)
- `maxFiles`: Maximum number of files (default: 100)
- `validateUrls`: Validate API URLs for accessibility
- `timeout`: Timeout for URL validation in milliseconds
- `withMetadata`: Include metadata in output

**Returns:**
```typescript
interface CompileResult {
  ast: {
    version: string;
    profile?: Profile;
    bPods: BPod[];
  };
  metadata?: {
    includedFiles: string[];
    bPodFileMap: Record<string, string>;
    parseTime: number;
    totalSize: number;
    warnings: CompilerWarning[];
  };
  errors: CompilerError[];
  warnings: CompilerWarning[];
  success: boolean;
}
```

### Validation Functions

#### `validateProfile(profile: Profile): ValidationResult<Profile>`
#### `validateBPod(bPod: BPod): ValidationResult<BPod>`
#### `validateFileExtensions(extensions: string[]): ValidationResult<string[]>`
#### `validateApiUrl(url: string, options?: object): Promise<ValidationResult<string>>`
#### `validateBodyTemplate(template: Record<string, string>, fileParams: string[]): ValidationResult<Record<string, string>>`

### Error Handling

#### `createError(code: ErrorCode, message: string, context: ParseContext, suggestion?: string): CompilerError`
#### `createWarning(code: WarningCode, message: string, context: ParseContext, suggestion?: string): CompilerWarning`
#### `formatError(error: CompilerError): string`
#### `formatWarning(warning: CompilerWarning): string`
#### `groupErrorsByFile(errors: CompilerError[]): Record<string, CompilerError[]>`
#### `getErrorStats(errors: CompilerError[], warnings: CompilerWarning[]): object`

### File Management

#### `mergeBuiFiles(entryPath: string, fileList: string[], options?: CompileOptions): MergeResult`
#### `validateFilePath(filePath: string, baseDir: string): { valid: boolean; error?: string }`
#### `getFileStats(filePath: string): { size: number; lastModified: Date; exists: boolean }`
#### `isFileReadable(filePath: string): boolean`

## Error Codes

### Parsing Errors (E001-E099)
- `E001`: Invalid syntax
- `E002`: Missing colon in declaration
- `E003`: Invalid version
- `E004`: Invalid profile JSON
- `E005`: Invalid BPod JSON
- `E006`: Missing BPod name
- `E007`: Duplicate BPod name
- `E008`: Invalid files block

### Validation Errors (E101-E199)
- `E101`: Profile name required
- `E102`: Profile description too long
- `E103`: Invalid logo URL
- `E104`: Invalid website URL

### BPod Validation Errors (E201-E299)
- `E201`: BPod name required
- `E202`: BPod accepts array empty
- `E203`: BPod accepts invalid format
- `E204`: BPod submit label required
- `E205`: BPod submit action required
- `E206`: BPod API URL invalid
- `E207`: BPod API method invalid
- `E208`: BPod body template missing webhook
- `E209`: BPod input options required

### File Handling Errors (E301-E399)
- `E301`: File not found
- `E302`: File too large
- `E303`: Too many files
- `E304`: File read error
- `E305`: Invalid file path

### System Errors (E401-E499)
- `E401`: Timeout error
- `E402`: Memory error
- `E499`: Unknown error

## CLI Commands

### `compile` - Compile a .bui file

```bash
breeth-bui-compiler compile <entry-file> [options]
```

**Options:**
- `-o, --output <file>`: Output file for compilation result
- `-f, --format <format>`: Output format (json, pretty) [default: pretty]
- `--strict`: Enable strict mode with additional validations
- `--no-warnings`: Suppress warnings
- `--max-file-size <bytes>`: Maximum file size in bytes [default: 1048576]
- `--max-files <count>`: Maximum number of files [default: 100]
- `--validate-urls`: Validate API URLs
- `--timeout <ms>`: Timeout for URL validation in milliseconds [default: 5000]
- `--metadata`: Include metadata in output

### `validate` - Validate a .bui file

```bash
breeth-bui-compiler validate <file> [options]
```

**Options:**
- `--strict`: Enable strict validation

### `info` - Display file information

```bash
breeth-bui-compiler info <file>
```

## Configuration

### Compile Options

```typescript
interface CompileOptions {
  strict?: boolean;                    // Enable strict validation
  allowWarnings?: boolean;             // Allow warnings
  maxFileSize?: number;                // Max file size in bytes
  maxFiles?: number;                   // Max number of files
  validateUrls?: boolean;              // Validate API URLs
  timeout?: number;                    // Timeout in milliseconds
  withMetadata?: boolean;              // Include metadata
}
```

### Environment Variables

- `BUI_MAX_FILE_SIZE`: Maximum file size in bytes
- `BUI_MAX_FILES`: Maximum number of files
- `BUI_TIMEOUT`: Default timeout in milliseconds
- `BUI_STRICT`: Enable strict mode by default

## Security Features

### Path Traversal Protection
The compiler prevents path traversal attacks by ensuring all file paths resolve within the base directory.

### File Size Limits
Configurable file size limits prevent memory exhaustion attacks.

### File Type Restriction
Only .bui files are supported, preventing execution of potentially dangerous file types.

### HTTPS Enforcement
All URLs must use HTTPS for security.

## Performance

### Optimizations
- Efficient file parsing with minimal memory allocation
- Lazy validation for large files
- Optimized error reporting with context caching

### Monitoring
- Parse time tracking
- File size statistics
- Memory usage monitoring
- Performance metrics collection

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- compiler.spec.ts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the error codes and suggestions in the output
- Review the validation rules and requirements

## Changelog

### v1.0.0
- Initial production release
- Comprehensive error handling and reporting
- Multi-file support with dependency management
- Advanced validation with Zod schemas
- Powerful CLI interface
- Security features and performance optimizations
- Extensive test coverage
