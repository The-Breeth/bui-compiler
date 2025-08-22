import React, { useState } from 'react';
import { CompileResult, BPod, BPodInput, Profile } from './types';

export interface BUIComponentProps {
  result: CompileResult;
  onAction?: (bpodName: string, action: string, data: any) => void;
  theme?: 'light' | 'dark';
  className?: string;
}

export interface BUIInputProps {
  input: BPodInput;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export interface BUIBPodProps {
  bpod: BPod;
  onSubmit: (data: any) => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface BUIProfileProps {
  profile: Profile;
}

/**
 * Render a BUI input field based on its type
 */
export function BUIInput({ input, value, onChange, disabled }: BUIInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (input.type === 'checkbox') {
      onChange((e.target as HTMLInputElement).checked);
    } else if (input.type === 'number') {
      onChange(Number(e.target.value));
    } else {
      onChange(e.target.value);
    }
  };

  const inputId = `bui-input-${input.name}`;

  switch (input.type) {
    case 'text':
      return (
        <div className="bui-input-group">
          <label htmlFor={inputId} className="bui-label">
            {input.label || input.name}
            {input.required && <span className="bui-required">*</span>}
          </label>
          <input
            id={inputId}
            type="text"
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            placeholder={input.placeholder}
            className="bui-input bui-input-text"
            required={input.required}
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="bui-input-group">
          <label htmlFor={inputId} className="bui-label">
            {input.label || input.name}
            {input.required && <span className="bui-required">*</span>}
          </label>
          <textarea
            id={inputId}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            placeholder={input.placeholder}
            className="bui-input bui-input-textarea"
            required={input.required}
            rows={4}
          />
        </div>
      );

    case 'number':
      return (
        <div className="bui-input-group">
          <label htmlFor={inputId} className="bui-label">
            {input.label || input.name}
            {input.required && <span className="bui-required">*</span>}
          </label>
          <input
            id={inputId}
            type="number"
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            placeholder={input.placeholder}
            className="bui-input bui-input-number"
            min={input.validation?.min}
            max={input.validation?.max}
            required={input.required}
          />
          {input.validation?.message && (
            <div className="bui-validation-message">{input.validation.message}</div>
          )}
        </div>
      );

    case 'checkbox':
      return (
        <div className="bui-input-group bui-checkbox-group">
          <label className="bui-checkbox-label">
            <input
              type="checkbox"
              checked={value || false}
              onChange={handleChange}
              disabled={disabled}
              className="bui-checkbox"
            />
            <span className="bui-checkbox-text">
              {input.label || input.name}
              {input.required && <span className="bui-required">*</span>}
            </span>
          </label>
        </div>
      );

    case 'radio':
      return (
        <div className="bui-input-group">
          <label className="bui-label">
            {input.label || input.name}
            {input.required && <span className="bui-required">*</span>}
          </label>
          <div className="bui-radio-group">
            {input.options?.map((option) => (
              <label key={option} className="bui-radio-label">
                <input
                  type="radio"
                  name={inputId}
                  value={option}
                  checked={value === option}
                  onChange={handleChange}
                  disabled={disabled}
                  className="bui-radio"
                  required={input.required}
                />
                <span className="bui-radio-text">{option}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case 'dropdown':
      return (
        <div className="bui-input-group">
          <label htmlFor={inputId} className="bui-label">
            {input.label || input.name}
            {input.required && <span className="bui-required">*</span>}
          </label>
          <select
            id={inputId}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            className="bui-input bui-input-select"
            required={input.required}
          >
            <option value="">Select {input.label || input.name}</option>
            {input.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );

    case 'toggle':
      return (
        <div className="bui-input-group bui-toggle-group">
          <label className="bui-toggle-label">
            <span className="bui-toggle-text">
              {input.label || input.name}
              {input.required && <span className="bui-required">*</span>}
            </span>
            <input
              type="checkbox"
              checked={value || false}
              onChange={handleChange}
              disabled={disabled}
              className="bui-toggle"
            />
            <span className="bui-toggle-slider"></span>
          </label>
        </div>
      );

    case 'hidden':
      return (
        <input
          type="hidden"
          value={value || ''}
          onChange={handleChange}
          className="bui-input bui-input-hidden"
        />
      );

    default:
      return null;
  }
}

/**
 * Render a BUI profile section
 */
export function BUIProfile({ profile }: BUIProfileProps) {
  return (
    <div className="bui-profile">
      <div className="bui-profile-header">
        {profile.logo && (
          <img src={profile.logo} alt={`${profile.name} logo`} className="bui-profile-logo" />
        )}
        <div className="bui-profile-info">
          <h1 className="bui-profile-name">{profile.name}</h1>
          <p className="bui-profile-description">{profile.description}</p>
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="bui-profile-website">
              {profile.website}
            </a>
          )}
          {profile.contact && (
            <div className="bui-profile-contact">
              <span className="bui-profile-contact-label">Contact:</span>
              <a href={`mailto:${profile.contact}`} className="bui-profile-contact-email">
                {profile.contact}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Render a single BUI BPod
 */
export function BUIBPod({ bpod, onSubmit, disabled, loading }: BUIBPodProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (inputName: string, value: any) => {
    setFormData(prev => ({ ...prev, [inputName]: value }));
    // Clear error when user starts typing
    if (errors[inputName]) {
      setErrors(prev => ({ ...prev, [inputName]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (bpod.inputs) {
      bpod.inputs.forEach(input => {
        if (input.required && (!formData[input.name] || 
            (input.type === 'checkbox' && !formData[input.name]) ||
            (input.type === 'dropdown' && formData[input.name] === ''))) {
          newErrors[input.name] = `${input.label || input.name} is required`;
        }
        
        if (input.type === 'number' && input.validation) {
          const value = formData[input.name];
          if (value !== undefined && value !== '') {
            if (input.validation.min !== undefined && value < input.validation.min) {
              newErrors[input.name] = `Value must be at least ${input.validation.min}`;
            }
            if (input.validation.max !== undefined && value > input.validation.max) {
              newErrors[input.name] = `Value must be at most ${input.validation.max}`;
            }
          }
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="bui-bpod">
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

      <form onSubmit={handleSubmit} className="bui-bpod-form">
        {bpod.inputs && bpod.inputs.length > 0 && (
          <div className="bui-bpod-inputs">
            {bpod.inputs.map(input => (
              <div key={input.name} className="bui-input-wrapper">
                <BUIInput
                  input={input}
                  value={formData[input.name]}
                  onChange={(value) => handleInputChange(input.name, value)}
                  disabled={disabled}
                />
                {errors[input.name] && (
                  <div className="bui-input-error">{errors[input.name]}</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bui-bpod-submit">
          <button
            type="submit"
            disabled={disabled || loading}
            className="bui-submit-button"
          >
            {loading ? 'Processing...' : bpod.submit.label}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Main BUI React renderer component
 */
export function BUIComponent({ result, onAction, theme = 'light', className }: BUIComponentProps) {
  const handleBPodAction = (bpodName: string, data: any) => {
    if (onAction) {
      onAction(bpodName, result.ast.bPods.find(bp => bp.name === bpodName)?.submit.action || '', data);
    }
  };

  if (!result.success) {
    return (
      <div className={`bui-error-container ${className || ''}`}>
        <h2 className="bui-error-title">Compilation Failed</h2>
        <div className="bui-error-list">
          {result.errors.map((error, index) => (
            <div key={index} className="bui-error-item">
              <span className="bui-error-code">{error.code}</span>
              <span className="bui-error-message">{error.message}</span>
              {error.file && (
                <span className="bui-error-file">in {error.file}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bui-container bui-theme-${theme} ${className || ''}`}>
      {result.ast.profile && <BUIProfile profile={result.ast.profile} />}
      
      <div className="bui-bpods">
        {result.ast.bPods.map((bpod) => (
          <BUIBPod
            key={bpod.name}
            bpod={bpod}
            onSubmit={(data) => handleBPodAction(bpod.name, data)}
            disabled={bpod.submit.disabled}
            loading={bpod.submit.loading}
          />
        ))}
      </div>

      {result.warnings.length > 0 && (
        <div className="bui-warnings">
          <h3 className="bui-warnings-title">Warnings</h3>
          <div className="bui-warnings-list">
            {result.warnings.map((warning, index) => (
              <div key={index} className="bui-warning-item">
                <span className="bui-warning-code">{warning.code}</span>
                <span className="bui-warning-message">{warning.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing BUI form state
 */
export function useBUIForm(bpod: BPod) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (bpod.inputs) {
      bpod.inputs.forEach(input => {
        if (input.required && (!formData[input.name] || 
            (input.type === 'checkbox' && !formData[input.name]) ||
            (input.type === 'dropdown' && formData[input.name] === ''))) {
          newErrors[input.name] = `${input.label || input.name} is required`;
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (onSubmit: (data: any) => Promise<void>) => {
    if (!validate()) return false;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      return true;
    } catch (error) {
      console.error('BUI form submission error:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    validate,
    submit
  };
}
