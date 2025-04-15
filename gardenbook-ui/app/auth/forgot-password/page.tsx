"use client";

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import AuthCard from '../../components/auth/AuthCard';
import FormInput from '../../components/auth/FormInput';
import Button from '../../components/auth/Button';
import { requestPasswordReset } from '../../api/auth';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Clear error when user starts typing again
    if (error) {
      setError('');
    }
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await requestPasswordReset({ email });
      setSuccessMessage('If an account exists with this email, you will receive password reset instructions shortly.');
      setEmail(''); // Clear the form
    } catch {
      // For security reasons, we don't want to reveal if an email exists or not
      // So we show the same success message even if the request fails
      setSuccessMessage('If an account exists with this email, you will receive password reset instructions shortly.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard 
      title="Reset Your Password" 
      footer={
        <p className="text-sm text-center text-gray-600">
          Remember your password?{' '}
          <Link href="/auth/login" className="text-purple-600 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {successMessage ? (
        <div className="text-center">
          <div className="mb-6 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
            {successMessage}
          </div>
          
          <Link href="/auth/login">
            <Button variant="outline" fullWidth>
              Return to Login
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-gray-600">
            Enter the email address associated with your account, and we&apos;ll send you a link to reset your password.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <FormInput
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error=""
              required
              autoComplete="email"
            />
            
            <div className="mt-6">
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={isLoading}
                disabled={isLoading}
                fullWidth
              >
                Send Reset Link
              </Button>
            </div>
          </form>
        </>
      )}
    </AuthCard>
  );
} 