"use client";

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthCard from '../../components/auth/AuthCard';
import FormInput from '../../components/auth/FormInput';
import Button from '../../components/auth/Button';
import { resetPassword } from '../../api/auth';

// This component will be used inside the Suspense boundary
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Get token from query parameters
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setSubmitError('Reset token is missing. Please use the link from your email.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user starts typing again
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear submit error when form changes
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'New password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setSubmitError('Reset token is missing. Please use the link from your email.');
      return;
    }
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setSubmitError('');
    
    try {
      await resetPassword({
        token,
        password: formData.password,
      });
      
      setSuccessMessage('Your password has been successfully reset!');
      // Clear form data after successful reset
      setFormData({
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Password reset failed. The link may have expired or is invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard title="Set New Password">
      {successMessage ? (
        <div className="text-center">
          <div className="mb-6 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
            {successMessage}
          </div>
          
          <Link href="/auth/login">
            <Button variant="primary" fullWidth>
              Go to Login
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {submitError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {submitError}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <FormInput
              id="password"
              label="New Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              autoComplete="new-password"
            />
            
            <FormInput
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />
            
            <div className="mt-6">
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={isLoading}
                disabled={isLoading || !token}
                fullWidth
              >
                Reset Password
              </Button>
            </div>
            
            <div className="mt-4 text-center">
              <Link 
                href="/auth/login" 
                className="text-sm text-purple-600 hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </>
      )}
    </AuthCard>
  );
}

// Main component with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthCard title="Loading..."><p>Loading...</p></AuthCard>}>
      <ResetPasswordContent />
    </Suspense>
  );
} 