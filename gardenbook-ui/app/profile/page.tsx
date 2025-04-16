"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Button from '../components/auth/Button';
import FormInput from '../components/auth/FormInput';

export default function ProfilePage() {
  const { user, isLoading, refreshUser, logout } = useAuth();
  const router = useRouter();
  
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirect if not authenticated
  if (!isLoading && !user) {
    router.push('/auth/login');
    return null;
  }
  
  // Initialize form data when user data is loaded
  if (user && !formData.username && !formData.email) {
    setFormData({
      ...formData,
      username: user.username,
      email: user.email,
    });
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user starts typing again
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Username validation
    if (editMode && !formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    // Email validation
    if (editMode && !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (editMode && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Password validation (only if attempting to change password)
    if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }
      
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitError('');
    setSuccessMessage('');
    
    try {
      // Mock implementation - in a real app would call API endpoint
      // to update user profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user data (mock)
      setSuccessMessage('Profile updated successfully!');
      setEditMode(false);
      
      // Refresh user data
      await refreshUser();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-900 to-purple-700 p-6">
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-purple-200 mt-2">Manage your account settings</p>
        </div>
        
        <div className="p-6">
          {successMessage && (
            <div className="mb-6 p-3 bg-green-100 border border-green-300 text-green-700 rounded">
              {successMessage}
            </div>
          )}
          
          {submitError && (
            <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {submitError}
            </div>
          )}
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
            
            {!editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Username</label>
                  <p className="mt-1 text-gray-900">{user?.username}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="mt-1 text-gray-900">{user?.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">Account Created</label>
                  <p className="mt-1 text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                
                <div className="pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditMode(true)}
                  >
                    Edit Profile
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <FormInput
                  id="username"
                  label="Username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  error={errors.username}
                  required
                />
                
                <FormInput
                  id="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                />
                
                <h3 className="text-lg font-medium text-gray-800 mt-8 mb-4">Change Password</h3>
                <p className="text-sm text-gray-600 mb-4">Leave blank if you don&apos;t want to change your password</p>
                
                <FormInput
                  id="currentPassword"
                  label="Current Password"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  error={errors.currentPassword}
                />
                
                <FormInput
                  id="newPassword"
                  label="New Password"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  error={errors.newPassword}
                />
                
                <FormInput
                  id="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                />
                
                <div className="flex items-center space-x-4 mt-6">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Save Changes
                  </Button>
                  
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditMode(false);
                      setErrors({});
                      setSubmitError('');
                      // Reset form data to current user data
                      if (user) {
                        setFormData({
                          username: user.username,
                          email: user.email,
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Actions</h2>
            
            <div className="space-y-4">
              <div>
                <Button
                  type="button"
                  variant="danger"
                  onClick={logout}
                >
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 