import React, { useState } from 'react';
import { parseBUI } from './index';
import { BUIComponent, useBUIForm } from './react-renderer';
import './react-renderer.css';

/**
 * Demo component showing how to use the BUI React renderer
 */
export function BUIDemo() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Sample BUI content for demo
  const sampleBUI = `
version: "1.0.0"

---
profile: {
  "name": "BUI Demo Application",
  "description": "This is a demonstration of how BUI files render in React",
  "logo": "https://via.placeholder.com/80x80/007bff/ffffff?text=BUI",
  "website": "https://example.com",
  "contact": "demo@example.com"
}

---
b-pod: "Text Processor" {
  "accepts": ["txt", "md"],
  "description": "Process text files with various operations",
  "tags": ["text", "processing", "demo"],
  "inputs": [
    {
      "name": "operation",
      "type": "dropdown",
      "label": "Text Operation",
      "options": ["uppercase", "lowercase", "reverse", "count_words"],
      "required": true
    },
    {
      "name": "preserve_formatting",
      "type": "checkbox",
      "label": "Preserve Formatting",
      "required": false
    },
    {
      "name": "max_length",
      "type": "number",
      "label": "Maximum Length",
      "required": false,
      "placeholder": "1000",
      "validation": {
        "min": 1,
        "max": 10000,
        "message": "Length must be between 1 and 10000"
      }
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
      "max_length": "{max_length}",
      "webhook_url": "{webhook_url}"
    },
    "responseType": "file"
  }
}

---
b-pod: "Image Analyzer" {
  "accepts": ["jpg", "png", "gif"],
  "description": "Analyze images for content and metadata",
  "tags": ["image", "analysis", "ai"],
  "inputs": [
    {
      "name": "analysis_type",
      "type": "radio",
      "label": "Analysis Type",
      "options": ["objects", "faces", "text", "colors"],
      "required": true
    },
    {
      "name": "detailed_report",
      "type": "toggle",
      "label": "Detailed Report",
      "required": false
    },
    {
      "name": "confidence_threshold",
      "type": "number",
      "label": "Confidence Threshold",
      "required": false,
      "placeholder": "0.8",
      "validation": {
        "min": 0.1,
        "max": 1.0,
        "message": "Threshold must be between 0.1 and 1.0"
      }
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
      "detailed_report": "{detailed_report}",
      "confidence_threshold": "{confidence_threshold}",
      "webhook_url": "{webhook_url}"
    },
    "responseType": "json"
  }
}`;

  const handleCompile = async () => {
    setLoading(true);
    try {
      // In a real app, you'd parse an actual file
      // For demo purposes, we'll create a temporary file
      const tempFile = new File([sampleBUI], 'demo.bui', { type: 'text/plain' });
      
      // Simulate file parsing (in real app, you'd use parseBUI with file path)
      // For demo, we'll create a mock result
      const mockResult = {
        success: true,
        ast: {
          version: "1.0.0",
          profile: {
            name: "BUI Demo Application",
            description: "This is a demonstration of how BUI files render in React",
            logo: "https://via.placeholder.com/80x80/007bff/ffffff?text=BUI",
            website: "https://example.com",
            contact: "demo@example.com"
          },
          bPods: [
            {
              name: "Text Processor",
              accepts: ["txt", "md"],
              description: "Process text files with various operations",
              tags: ["text", "processing", "demo"],
              inputs: [
                {
                  name: "operation",
                  type: "dropdown",
                  label: "Text Operation",
                  options: ["uppercase", "lowercase", "reverse", "count_words"],
                  required: true
                },
                {
                  name: "preserve_formatting",
                  type: "checkbox",
                  label: "Preserve Formatting",
                  required: false
                },
                {
                  name: "max_length",
                  type: "number",
                  label: "Maximum Length",
                  required: false,
                  placeholder: "1000",
                  validation: {
                    min: 1,
                    max: 10000,
                    message: "Length must be between 1 and 10000"
                  }
                }
              ],
              submit: { label: "Process Text", action: "processText" },
              api: {
                url: "https://api.example.com/v1/text/process",
                method: "POST",
                fileParams: ["textFile"],
                bodyTemplate: {
                  file: "{textFile}",
                  operation: "{operation}",
                  preserve_formatting: "{preserve_formatting}",
                  max_length: "{max_length}",
                  webhook_url: "{webhook_url}"
                },
                responseType: "file"
              }
            },
            {
              name: "Image Analyzer",
              accepts: ["jpg", "png", "gif"],
              description: "Analyze images for content and metadata",
              tags: ["image", "analysis", "ai"],
              inputs: [
                {
                  name: "analysis_type",
                  type: "radio",
                  label: "Analysis Type",
                  options: ["objects", "faces", "text", "colors"],
                  required: true
                },
                {
                  name: "detailed_report",
                  type: "toggle",
                  label: "Detailed Report",
                  required: false
                },
                {
                  name: "confidence_threshold",
                  type: "number",
                  label: "Confidence Threshold",
                  required: false,
                  placeholder: "0.8",
                  validation: {
                    min: 0.1,
                    max: 1.0,
                    message: "Threshold must be between 0.1 and 1.0"
                  }
                }
              ],
              submit: { label: "Analyze Image", action: "analyzeImage" },
              api: {
                url: "https://api.example.com/v1/image/analyze",
                method: "POST",
                fileParams: ["imageFile"],
                bodyTemplate: {
                  file: "{imageFile}",
                  analysis_type: "{analysis_type}",
                  detailed_report: "{detailed_report}",
                  confidence_threshold: "{confidence_threshold}",
                  webhook_url: "{webhook_url}"
                },
                responseType: "json"
              }
            }
          ]
        },
        errors: [],
        warnings: [
          {
            message: "Profile is missing a custom logo",
            code: "W101",
            line: 0,
            column: 0,
            severity: "warning"
          }
        ]
      };
      
      setResult(mockResult);
    } catch (error) {
      console.error('Failed to compile BUI:', error);
      setResult({
        success: false,
        errors: [{ message: 'Failed to compile BUI file', code: 'E001', line: 0, column: 0, severity: 'error' }],
        warnings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (bpodName: string, action: string, data: any) => {
    console.log(`BUI Action: ${bpodName} -> ${action}`, data);
    
    // In a real app, you'd make an API call here
    alert(`Action triggered: ${bpodName} -> ${action}\nData: ${JSON.stringify(data, null, 2)}`);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="bui-demo-container">
      <div className="bui-demo-header">
        <h1>BUI React Renderer Demo</h1>
        <p>This demonstrates how BUI files render as React components</p>
        
        <div className="bui-demo-controls">
          <button 
            onClick={handleCompile} 
            disabled={loading}
            className="bui-demo-button"
          >
            {loading ? 'Compiling...' : 'Load Demo BUI'}
          </button>
          
          <button 
            onClick={toggleTheme}
            className="bui-demo-button bui-demo-button-secondary"
          >
            Toggle {theme === 'light' ? 'Dark' : 'Light'} Theme
          </button>
        </div>
      </div>

      {result && (
        <div className="bui-demo-content">
          <BUIComponent
            result={result}
            onAction={handleAction}
            theme={theme}
            className="bui-demo-renderer"
          />
        </div>
      )}

      {!result && (
        <div className="bui-demo-placeholder">
          <h2>Click "Load Demo BUI" to see the renderer in action</h2>
          <p>The demo will show:</p>
          <ul>
            <li>Profile section with logo, name, and contact info</li>
            <li>Text Processor BPod with dropdown, checkbox, and number inputs</li>
            <li>Image Analyzer BPod with radio buttons, toggle, and validation</li>
            <li>Form validation and error handling</li>
            <li>Light/dark theme switching</li>
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Example of using the useBUIForm hook
 */
export function BUIFormHookExample() {
  const bpod = {
    name: "Example Form",
    accepts: ["txt"],
    inputs: [
      {
        name: "text_input",
        type: "text" as const,
        label: "Text Input",
        required: true
      },
      {
        name: "number_input",
        type: "number" as const,
        label: "Number Input",
        required: false
      }
    ],
    submit: { label: "Submit", action: "submit" },
    api: {
      url: "https://api.example.com/v1/submit",
      method: "POST" as const,
      fileParams: ["file"],
      bodyTemplate: { file: "{file}", webhook_url: "{webhook_url}" },
      responseType: "json" as const
    }
  };

  const { formData, errors, isSubmitting, updateField, submit } = useBUIForm(bpod);

  const handleSubmit = async (data: any) => {
    console.log('Form submitted:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="bui-form-hook-example">
      <h3>useBUIForm Hook Example</h3>
      <form onSubmit={(e) => { e.preventDefault(); submit(handleSubmit); }}>
        <div>
          <label>Text Input:</label>
          <input
            type="text"
            value={formData.text_input || ''}
            onChange={(e) => updateField('text_input', e.target.value)}
          />
          {errors.text_input && <span className="error">{errors.text_input}</span>}
        </div>
        
        <div>
          <label>Number Input:</label>
          <input
            type="number"
            value={formData.number_input || ''}
            onChange={(e) => updateField('number_input', e.target.value)}
          />
        </div>
        
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
