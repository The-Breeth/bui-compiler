import { CompileResult, Profile, BPod, BPodInput } from './types';
import { parseBUI } from './core/parser';

export interface RenderOptions {
  format: 'react' | 'html' | 'json';
  theme?: 'light' | 'dark';
  showErrors?: boolean;
  showWarnings?: boolean;
  className?: string;
  onAction?: (bpodName: string, action: string, data: any) => void;
}

export interface RenderResult {
  success: boolean;
  output: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Main renderer function that compiles BUI and renders it in the specified format
 */
export function renderBUI(
  entryPath: string,
  options: RenderOptions
): RenderResult {
  try {
    // Parse the BUI file
    const result = parseBUI(entryPath, { withMetadata: true });
    
    if (!result.success) {
      if (options.format === 'html') {
        return {
          success: false,
          output: generateErrorHTML(result.errors, result.warnings, options.theme),
          errors: result.errors.map(e => e.message),
          warnings: result.warnings.map(w => w.message)
        };
      } else if (options.format === 'react') {
        return {
          success: false,
          output: generateErrorReact(result.errors, result.warnings, options.theme, options.className),
          errors: result.errors.map(e => e.message),
          warnings: result.warnings.map(w => w.message)
        };
      } else {
        return {
          success: false,
          output: JSON.stringify({ errors: result.errors, warnings: result.warnings }, null, 2),
          errors: result.errors.map(e => e.message),
          warnings: result.warnings.map(w => w.message)
        };
      }
    }

    // Render successful compilation
    switch (options.format) {
      case 'html':
        return {
          success: true,
          output: generateBUIHTML(result, options),
          warnings: options.showWarnings ? result.warnings.map(w => w.message) : []
        };
      
      case 'react':
        return {
          success: true,
          output: generateBUIReact(result, options),
          warnings: options.showWarnings ? result.warnings.map(w => w.message) : []
        };
      
      case 'json':
        return {
          success: true,
          output: JSON.stringify(result, null, 2),
          warnings: options.showWarnings ? result.warnings.map(w => w.message) : []
        };
      
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      output: `Error rendering BUI: ${errorMessage}`,
      errors: [errorMessage]
    };
  }
}

/**
 * Generate HTML output for successful BUI compilation
 */
function generateBUIHTML(result: CompileResult, options: RenderOptions): string {
  const theme = options.theme || 'light';
  const className = options.className || '';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BUI Application - ${result.ast.profile?.name || 'Untitled'}</title>
    <style>
        ${generateCSS(theme)}
    </style>
</head>
<body class="bui-theme-${theme}">
    <div class="bui-container ${className}">
        ${result.ast.profile ? generateProfileHTML(result.ast.profile) : ''}
        
        <div class="bui-bpods">
            ${result.ast.bPods.map(bpod => generateBPodHTML(bpod, options.onAction)).join('\n')}
        </div>
        
        ${options.showWarnings && result.warnings.length > 0 ? generateWarningsHTML(result.warnings) : ''}
    </div>
    
    <script>
        ${generateJavaScript(options.onAction)}
    </script>
</body>
</html>`;
}

/**
 * Generate React component output for successful BUI compilation
 */
function generateBUIReact(result: CompileResult, options: RenderOptions): string {
  const theme = options.theme || 'light';
  const className = options.className || '';
  
  return `
import React, { useState } from 'react';

export function BUIApplication() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({});

  const handleInputChange = (bpodName, fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [bpodName]: {
        ...prev[bpodName],
        [fieldName]: value
      }
    }));
    
    // Clear errors when user starts typing
    if (errors[bpodName]?.[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [bpodName]: {
          ...prev[bpodName],
          [fieldName]: ''
        }
      }));
    }
  };

  const handleSubmit = async (bpodName, data) => {
    setLoading(prev => ({ ...prev, [bpodName]: true }));
    
    try {
      ${options.onAction ? `
      if (window.handleBUIAction) {
        await window.handleBUIAction(bpodName, data);
      }` : `
      // Handle form submission here
      console.log('Form submitted:', { bpodName, data });
      `}
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setLoading(prev => ({ ...prev, [bpodName]: false }));
    }
  };

  return (
    <div className="bui-container bui-theme-${theme} ${className}">
      ${result.ast.profile ? generateProfileReact(result.ast.profile) : ''}
      
      <div className="bui-bpods">
        {[
          ${result.ast.bPods.map(bpod => generateBPodReact(bpod)).join(',\n          ')}
        ].map((bpod, index) => (
          <div key={index} className="bui-bpod">
            <div className="bui-bpod-header">
              <h2 className="bui-bpod-name">{bpod.name}</h2>
              {bpod.description && (
                <p className="bui-bpod-description">{bpod.description}</p>
              )}
              {bpod.tags && bpod.tags.length > 0 && (
                <div className="bui-bpod-tags">
                  {bpod.tags.map(tag => (
                    <span key={tag} className="bui-bpod-tag">{tag}</span>
                  ))}
                </div>
              )}
              <div className="bui-bpod-accepts">
                <span className="bui-bpod-accepts-label">Accepts:</span>
                {bpod.accepts.map(ext => (
                  <span key={ext} className="bui-bpod-accept">{ext}</span>
                ))}
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const data = formData[bpod.name] || {};
              handleSubmit(bpod.name, data);
            }} className="bui-bpod-form">
              {bpod.inputs && bpod.inputs.length > 0 && (
                <div className="bui-bpod-inputs">
                  {bpod.inputs.map(input => (
                    <div key={input.name} className="bui-input-wrapper">
                      <label className="bui-label">
                        {input.label || input.name}
                        {input.required && <span className="bui-required">*</span>}
                      </label>
                      {generateInputReact(input, bpod.name, handleInputChange)}
                      {errors[bpod.name]?.[input.name] && (
                        <div className="bui-input-error">{errors[bpod.name][input.name]}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="bui-bpod-submit">
                <button
                  type="submit"
                  disabled={loading[bpod.name]}
                  className="bui-submit-button"
                >
                  {loading[bpod.name] ? 'Processing...' : bpod.submit.label}
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
      
      ${options.showWarnings && result.warnings.length > 0 ? generateWarningsReact(result.warnings) : ''}
    </div>
  );
}

// Export individual components for modular use
export { BUIProfile, BUIBPod, BUIInput } from './react-renderer';
`;
}

/**
 * Generate error HTML
 */
function generateErrorHTML(errors: any[], warnings: any[], theme: string = 'light'): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BUI Compilation Error</title>
    <style>
        ${generateCSS(theme)}
    </style>
</head>
<body class="bui-theme-${theme}">
    <div class="bui-container">
        <div class="bui-error-container">
            <h2 class="bui-error-title">Compilation Failed</h2>
            <div class="bui-error-list">
                ${errors.map(error => `
                <div class="bui-error-item">
                    <span class="bui-error-code">${error.code}</span>
                    <span class="bui-error-message">${error.message}</span>
                    ${error.file ? `<span class="bui-error-file">in ${error.file}</span>` : ''}
                </div>
                `).join('')}
            </div>
            
            ${warnings.length > 0 ? `
            <div class="bui-warnings">
                <h3 class="bui-warnings-title">Warnings</h3>
                <div class="bui-warnings-list">
                    ${warnings.map(warning => `
                    <div class="bui-warning-item">
                        <span class="bui-warning-code">${warning.code}</span>
                        <span class="bui-warning-message">${warning.message}</span>
                    </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate error React component
 */
function generateErrorReact(errors: any[], warnings: any[], theme: string = 'light', className: string = ''): string {
  return `
import React from 'react';

export function BUIErrorDisplay() {
  return (
    <div className="bui-error-container ${className}">
      <h2 className="bui-error-title">Compilation Failed</h2>
      <div className="bui-error-list">
        {[
          ${errors.map(error => `{
            code: '${error.code}',
            message: '${error.message}',
            file: '${error.file || ''}'
          }`).join(',\n          ')}
        ].map((error, index) => (
          <div key={index} className="bui-error-item">
            <span className="bui-error-code">{error.code}</span>
            <span className="bui-error-message">{error.message}</span>
            {error.file && <span className="bui-error-file">in {error.file}</span>}
          </div>
        ))}
      </div>
      
      ${warnings.length > 0 ? `
      <div className="bui-warnings">
        <h3 className="bui-warnings-title">Warnings</h3>
        <div className="bui-warnings-list">
          {[
            ${warnings.map(warning => `{
              code: '${warning.code}',
              message: '${warning.message}'
            }`).join(',\n            ')}
          ].map((warning, index) => (
            <div key={index} className="bui-warning-item">
              <span className="bui-warning-code">{warning.code}</span>
              <span className="bui-warning-message">{warning.message}</span>
            </div>
          ))}
        </div>
      </div>
      ` : ''}
    </div>
  );
}`;
}

/**
 * Generate profile HTML
 */
function generateProfileHTML(profile: Profile): string {
  return `
        <div class="bui-profile">
            <div class="bui-profile-header">
                ${profile.logo ? `<img src="${profile.logo}" alt="${profile.name} logo" class="bui-profile-logo" />` : ''}
                <div class="bui-profile-info">
                    <h1 class="bui-profile-name">${profile.name}</h1>
                    <p class="bui-profile-description">${profile.description}</p>
                    ${profile.website ? `<a href="${profile.website}" target="_blank" rel="noopener noreferrer" class="bui-profile-website">${profile.website}</a>` : ''}
                    ${profile.contact ? `
                    <div class="bui-profile-contact">
                        <span class="bui-profile-contact-label">Contact:</span>
                        <a href="mailto:${profile.contact}" class="bui-profile-contact-email">${profile.contact}</a>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>`;
}

/**
 * Generate profile React component
 */
function generateProfileReact(profile: Profile): string {
  return `
        <div className="bui-profile">
          <div className="bui-profile-header">
            {${profile.logo ? `'${profile.logo}'` : 'null'} && (
              <img src="${profile.logo}" alt="${profile.name} logo" className="bui-profile-logo" />
            )}
            <div className="bui-profile-info">
              <h1 className="bui-profile-name">${profile.name}</h1>
              <p className="bui-profile-description">${profile.description}</p>
              {${profile.website ? `'${profile.website}'` : 'null'} && (
                <a href="${profile.website}" target="_blank" rel="noopener noreferrer" className="bui-profile-website">
                  ${profile.website}
                </a>
              )}
              {${profile.contact ? `'${profile.contact}'` : 'null'} && (
                <div className="bui-profile-contact">
                  <span className="bui-profile-contact-label">Contact:</span>
                  <a href="mailto:${profile.contact}" className="bui-profile-contact-email">
                    ${profile.contact}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>`;
}

/**
 * Generate BPod HTML
 */
function generateBPodHTML(bpod: BPod, onAction?: (bpodName: string, action: string, data: any) => void): string {
  return `
            <div class="bui-bpod">
                <div class="bui-bpod-header">
                    <h2 class="bui-bpod-name">${bpod.name}</h2>
                    ${bpod.description ? `<p class="bui-bpod-description">${bpod.description}</p>` : ''}
                    ${bpod.tags && bpod.tags.length > 0 ? `
                    <div class="bui-bpod-tags">
                        ${bpod.tags.map(tag => `<span class="bui-bpod-tag">${tag}</span>`).join('')}
                    </div>
                    ` : ''}
                    <div class="bui-bpod-accepts">
                        <span class="bui-bpod-accepts-label">Accepts:</span>
                        ${bpod.accepts.map(ext => `<span class="bui-bpod-accept">${ext}</span>`).join('')}
                    </div>
                </div>

                <form class="bui-bpod-form" onsubmit="handleFormSubmit(event, '${bpod.name}')">
                    ${bpod.inputs && bpod.inputs.length > 0 ? `
                    <div class="bui-bpod-inputs">
                        ${bpod.inputs.map(input => generateInputHTML(input, bpod.name)).join('')}
                    </div>
                    ` : ''}

                    <div class="bui-bpod-submit">
                        <button type="submit" class="bui-submit-button">
                            ${bpod.submit.label}
                        </button>
                    </div>
                </form>
            </div>`;
}

/**
 * Generate BPod React component
 */
function generateBPodReact(bpod: BPod): string {
  return `{
    name: '${bpod.name}',
    description: ${bpod.description ? `'${bpod.description}'` : 'null'},
    tags: ${bpod.tags && bpod.tags.length > 0 ? `[${bpod.tags.map(tag => `'${tag}'`).join(', ')}]` : 'null'},
    accepts: [${bpod.accepts.map(ext => `'${ext}'`).join(', ')}],
    inputs: ${bpod.inputs && bpod.inputs.length > 0 ? `[${bpod.inputs.map(input => generateInputReact(input, bpod.name, () => {})).join(', ')}]` : 'null'},
    submit: { label: '${bpod.submit.label}', action: '${bpod.submit.action}' }
  }`;
}

/**
 * Generate input HTML
 */
function generateInputHTML(input: BPodInput, bpodName: string): string {
  const inputId = `bui-input-${bpodName}-${input.name}`;
  
  switch (input.type) {
    case 'text':
      return `
                        <div class="bui-input-wrapper">
                            <label for="${inputId}" class="bui-label">
                                ${input.label || input.name}
                                ${input.required ? '<span class="bui-required">*</span>' : ''}
                            </label>
                            <input
                                id="${inputId}"
                                type="text"
                                name="${input.name}"
                                placeholder="${input.placeholder || ''}"
                                ${input.required ? 'required' : ''}
                                class="bui-input bui-input-text"
                                onchange="handleInputChange('${bpodName}', '${input.name}', this.value)"
                            />
                        </div>`;
    
    case 'textarea':
      return `
                        <div class="bui-input-wrapper">
                            <label for="${inputId}" class="bui-label">
                                ${input.label || input.name}
                                ${input.required ? '<span class="bui-required">*</span>' : ''}
                            </label>
                            <textarea
                                id="${inputId}"
                                name="${input.name}"
                                placeholder="${input.placeholder || ''}"
                                ${input.required ? 'required' : ''}
                                class="bui-input bui-input-textarea"
                                rows="4"
                                onchange="handleInputChange('${bpodName}', '${input.name}', this.value)"
                            ></textarea>
                        </div>`;
    
    case 'number':
      return `
                        <div class="bui-input-wrapper">
                            <label for="${inputId}" class="bui-label">
                                ${input.label || input.name}
                                ${input.required ? '<span class="bui-required">*</span>' : ''}
                            </label>
                            <input
                                id="${inputId}"
                                type="number"
                                name="${input.name}"
                                placeholder="${input.placeholder || ''}"
                                ${input.validation?.min ? `min="${input.validation.min}"` : ''}
                                ${input.validation?.max ? `max="${input.validation.max}"` : ''}
                                ${input.required ? 'required' : ''}
                                class="bui-input bui-input-number"
                                onchange="handleInputChange('${bpodName}', '${input.name}', this.value)"
                            />
                        </div>`;
    
    case 'checkbox':
      return `
                        <div class="bui-input-wrapper">
                            <label class="bui-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="${input.name}"
                                    ${input.required ? 'required' : ''}
                                    class="bui-checkbox"
                                    onchange="handleInputChange('${bpodName}', '${input.name}', this.checked)"
                                />
                                <span class="bui-checkbox-text">
                                    ${input.label || input.name}
                                    ${input.required ? '<span class="bui-required">*</span>' : ''}
                                </span>
                            </label>
                        </div>`;
    
    case 'radio':
      return `
                        <div class="bui-input-wrapper">
                            <label class="bui-label">
                                ${input.label || input.name}
                                ${input.required ? '<span class="bui-required">*</span>' : ''}
                            </label>
                            <div class="bui-radio-group">
                                ${input.options?.map(option => `
                                <label class="bui-radio-label">
                                    <input
                                        type="radio"
                                        name="${inputId}"
                                        value="${option}"
                                        ${input.required ? 'required' : ''}
                                        class="bui-radio"
                                        onchange="handleInputChange('${bpodName}', '${input.name}', '${option}')"
                                    />
                                    <span class="bui-radio-text">${option}</span>
                                </label>
                                `).join('')}
                            </div>
                        </div>`;
    
    case 'dropdown':
      return `
                        <div class="bui-input-wrapper">
                            <label for="${inputId}" class="bui-label">
                                ${input.label || input.name}
                                ${input.required ? '<span class="bui-required">*</span>' : ''}
                            </label>
                            <select
                                id="${inputId}"
                                name="${input.name}"
                                ${input.required ? 'required' : ''}
                                class="bui-input bui-input-select"
                                onchange="handleInputChange('${bpodName}', '${input.name}', this.value)"
                            >
                                <option value="">Select ${input.label || input.name}</option>
                                ${input.options?.map(option => `<option value="${option}">${option}</option>`).join('')}
                            </select>
                        </div>`;
    
    default:
      return '';
  }
}

/**
 * Generate input React component
 */
function generateInputReact(input: BPodInput, bpodName: string, handleInputChange: Function): string {
  const inputId = `bui-input-${bpodName}-${input.name}`;
  
  switch (input.type) {
    case 'text':
      return `
                        <input
                          type="text"
                          placeholder="${input.placeholder || ''}"
                          ${input.required ? 'required' : ''}
                          className="bui-input bui-input-text"
                          onChange={(e) => handleInputChange('${bpodName}', '${input.name}', e.target.value)}
                        />`;
    
    case 'textarea':
      return `
                        <textarea
                          placeholder="${input.placeholder || ''}"
                          ${input.required ? 'required' : ''}
                          className="bui-input bui-input-textarea"
                          rows={4}
                          onChange={(e) => handleInputChange('${bpodName}', '${input.name}', e.target.value)}
                        />`;
    
    case 'number':
      return `
                        <input
                          type="number"
                          placeholder="${input.placeholder || ''}"
                          ${input.validation?.min ? `min={${input.validation.min}}` : ''}
                          ${input.validation?.max ? `max={${input.validation.max}}` : ''}
                          ${input.required ? 'required' : ''}
                          className="bui-input bui-input-number"
                          onChange={(e) => handleInputChange('${bpodName}', '${input.name}', Number(e.target.value))}
                        />`;
    
    case 'checkbox':
      return `
                        <input
                          type="checkbox"
                          ${input.required ? 'required' : ''}
                          className="bui-checkbox"
                          onChange={(e) => handleInputChange('${bpodName}', '${input.name}', e.target.checked)}
                        />`;
    
    case 'radio':
      return `
                        <div className="bui-radio-group">
                          {[
                            ${input.options?.map(option => `'${option}'`).join(', ')}
                          ].map(option => (
                            <label key={option} className="bui-radio-label">
                              <input
                                type="radio"
                                name="${inputId}"
                                value={option}
                                ${input.required ? 'required' : ''}
                                className="bui-radio"
                                onChange={(e) => handleInputChange('${bpodName}', '${input.name}', option)}
                              />
                              <span className="bui-radio-text">{option}</span>
                            </label>
                          ))}
                        </div>`;
    
    case 'dropdown':
      return `
                        <select
                          ${input.required ? 'required' : ''}
                          className="bui-input bui-input-select"
                          onChange={(e) => handleInputChange('${bpodName}', '${input.name}', e.target.value)}
                        >
                          <option value="">Select ${input.label || input.name}</option>
                          {[
                            ${input.options?.map(option => `'${option}'`).join(', ')}
                          ].map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>`;
    
    default:
      return '';
  }
}

/**
 * Generate warnings HTML
 */
function generateWarningsHTML(warnings: any[]): string {
  return `
        <div class="bui-warnings">
            <h3 class="bui-warnings-title">Warnings</h3>
            <div class="bui-warnings-list">
                ${warnings.map(warning => `
                <div class="bui-warning-item">
                    <span class="bui-warning-code">${warning.code}</span>
                    <span class="bui-warning-message">${warning.message}</span>
                </div>
                `).join('')}
            </div>
        </div>`;
}

/**
 * Generate warnings React component
 */
function generateWarningsReact(warnings: any[]): string {
  return `
      {[
        ${warnings.map(warning => `{
          code: '${warning.code}',
          message: '${warning.message}'
        }`).join(',\n        ')}
      ].length > 0 && (
        <div className="bui-warnings">
          <h3 className="bui-warnings-title">Warnings</h3>
          <div className="bui-warnings-list">
            {[
              ${warnings.map(warning => `{
                code: '${warning.code}',
                message: '${warning.message}'
              }`).join(',\n              ')}
            ].map((warning, index) => (
              <div key={index} className="bui-warning-item">
                <span className="bui-warning-code">{warning.code}</span>
                <span className="bui-warning-message">{warning.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}`;
}

/**
 * Generate CSS styles
 */
function generateCSS(theme: string): string {
  return `
        .bui-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .bui-theme-${theme} {
          ${theme === 'dark' ? `
          --bui-bg-primary: #1a1a1a;
          --bui-bg-secondary: #2d2d2d;
          --bui-bg-tertiary: #404040;
          --bui-text-primary: #ffffff;
          --bui-text-secondary: #b0b0b0;
          --bui-border-color: #555555;
          --bui-accent-color: #4dabf7;
          --bui-success-color: #51cf66;
          --bui-error-color: #ff6b6b;
          --bui-warning-color: #ffd43b;
          ` : `
          --bui-bg-primary: #ffffff;
          --bui-bg-secondary: #f8f9fa;
          --bui-bg-tertiary: #e9ecef;
          --bui-text-primary: #212529;
          --bui-text-secondary: #6c757d;
          --bui-border-color: #dee2e6;
          --bui-accent-color: #007bff;
          --bui-success-color: #28a745;
          --bui-error-color: #dc3545;
          --bui-warning-color: #ffc107;
          `}
        }
        
        .bui-profile {
          background: var(--bui-bg-secondary);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
          border: 1px solid var(--bui-border-color);
        }
        
        .bui-bpod {
          background: var(--bui-bg-primary);
          border: 1px solid var(--bui-border-color);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .bui-input {
          padding: 12px 16px;
          border: 2px solid var(--bui-border-color);
          border-radius: 8px;
          font-size: 14px;
          background: var(--bui-bg-primary);
          color: var(--bui-text-primary);
          width: 100%;
          box-sizing: border-box;
        }
        
        .bui-submit-button {
          width: 100%;
          padding: 14px 24px;
          background: var(--bui-accent-color);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        
        .bui-error-container {
          background: var(--bui-bg-secondary);
          border: 1px solid var(--bui-error-color);
          border-radius: 8px;
          padding: 24px;
          text-align: center;
        }
        
        .bui-warnings {
          background: var(--bui-bg-secondary);
          border: 1px solid var(--bui-warning-color);
          border-radius: 8px;
          padding: 16px;
          margin-top: 24px;
        }`;
}

/**
 * Generate JavaScript for HTML output
 */
function generateJavaScript(onAction?: (bpodName: string, action: string, data: any) => void): string {
  return `
        // Form data storage
        const formData = {};
        
        // Handle input changes
        function handleInputChange(bpodName, fieldName, value) {
          if (!formData[bpodName]) {
            formData[bpodName] = {};
          }
          formData[bpodName][fieldName] = value;
        }
        
        // Handle form submission
        function handleFormSubmit(event, bpodName) {
          event.preventDefault();
          const data = formData[bpodName] || {};
          
          ${onAction ? `
          // Call the action handler if provided
          if (window.handleBUIAction) {
            window.handleBUIAction(bpodName, data);
          } else {
            console.log('Form submitted:', { bpodName, data });
          }
          ` : `
          console.log('Form submitted:', { bpodName, data });
          `}
        }
        
        // Make action handler available globally
        ${onAction ? `
        window.handleBUIAction = function(bpodName, data) {
          // Implement your action handling logic here
          console.log('Action triggered:', { bpodName, data });
        };
        ` : ''}`;
}

/**
 * CLI renderer function
 */
export function renderBUICLI(entryPath: string, options: RenderOptions): void {
  const result = renderBUI(entryPath, options);
  
  if (result.success) {
    console.log('✅ BUI rendered successfully');
    console.log('\n' + '='.repeat(50));
    console.log(result.output);
    console.log('='.repeat(50));
    
    if (result.warnings && result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
  } else {
    console.log('❌ BUI rendering failed');
    console.log('\n' + '='.repeat(50));
    console.log(result.output);
    console.log('='.repeat(50));
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n🚨 Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
  }
}

/**
 * Render BUI content directly from string (no file system dependency)
 */
export function renderBUIContent(
  content: string,
  options: RenderOptions
): RenderResult {
  try {
    // Create a temporary file path for parsing
    const tempPath = '/tmp/bui-content.bui';
    
    // Parse the BUI content using the existing parser
    const result = parseBUI(tempPath, { 
      withMetadata: true,
      content: content // Pass content directly
    });
    
    if (!result.success) {
      if (options.format === 'html') {
        return {
          success: false,
          output: generateErrorHTML(result.errors, result.warnings, options.theme),
          errors: result.errors.map(e => e.message),
          warnings: result.warnings.map(w => w.message)
        };
      } else if (options.format === 'react') {
        return {
          success: false,
          output: generateErrorReact(result.errors, result.warnings, options.theme, options.className),
          errors: result.errors.map(e => e.message),
          warnings: result.warnings.map(w => w.message)
        };
      } else {
        return {
          success: false,
          output: JSON.stringify({ errors: result.errors, warnings: result.warnings }, null, 2),
          errors: result.errors.map(e => e.message),
          warnings: result.warnings.map(w => w.message)
        };
      }
    }

    // Render successful compilation
    switch (options.format) {
      case 'html':
        return {
          success: true,
          output: generateBUIHTML(result, options),
          warnings: options.showWarnings ? result.warnings.map(w => w.message) : []
        };
      
      case 'react':
        return {
          success: true,
          output: generateBUIReact(result, options),
          warnings: options.showWarnings ? result.warnings.map(w => w.message) : []
        };
      
      case 'json':
        return {
          success: true,
          output: JSON.stringify(result, null, 2),
          warnings: options.showWarnings ? result.warnings.map(w => w.message) : []
        };
      
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      output: `Error rendering BUI: ${errorMessage}`,
      errors: [errorMessage]
    };
  }
}

/**
 * Simple renderer function for common use cases
 */
export function renderBUIString(
  buiContent: string,
  format: 'html' | 'react' | 'json' = 'html',
  theme: 'light' | 'dark' = 'light'
): string {
  const result = renderBUIContent(buiContent, {
    format,
    theme,
    showWarnings: false,
    showErrors: false
  });
  
  return result.output;
}
