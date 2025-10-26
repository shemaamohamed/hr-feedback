'use client';

import React, { useEffect, useState } from 'react';
// no client-side Link used here
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { getAuth } from 'firebase/auth';


export default function NewEmployeePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 6,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password)
    };
    return checks;
  };

  const passwordChecks = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const doPasswordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (!formData.name.trim()) {
    setError('Name is required');
    return;
  }

  if (!isPasswordValid) {
    setError('Password must be at least 6 characters and contain both letters and numbers');
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  setIsLoading(true);

  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError('You must be logged in');
      setIsLoading(false);
      return;
    }

    // 2️⃣ Only allow HR users
    // Assuming your custom user object (from context) has the role
    if ((user as any)?.role !== 'hr') {
      setError('Only HR users can create accounts');
      setIsLoading(false);
      return;
    }

    // 3️⃣ Get ID token from Firebase user
    const idToken = await currentUser.getIdToken();

    // 4️⃣ Call your backend API
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: 'employee'
      })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || 'Failed to create employee');
    }

    // Success
    showToast('Employee account created');
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });

  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred during registration');
  } finally {
    setIsLoading(false);
  }
};


  // Simple toast
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const showToast = (message: string) => {
    setToast({ message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // redirect non-HR away if desired, or just show access denied inside render (handled below)
  }, []);

  const PasswordCheck = ({ check, label }: { check: boolean; label: string }) => (
    <div className="flex items-center space-x-2 text-xs">
      {check ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="h-3 w-3 text-red-400" />
      )}
      <span className={check ? 'text-green-600' : 'text-gray-500'}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-50">
          <div className="rounded-md bg-green-600 text-white px-4 py-2 shadow">{toast.message}</div>
        </div>
      )}
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">HR</span>
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Create an account</CardTitle>
    
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange('email')}
                required
                disabled={isLoading}
              />
              {formData.email.toLowerCase().includes('hr') && (
                <p className="text-xs text-blue-600">
                  ℹ️ Emails containing &quot;hr&quot; will be assigned HR role
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <PasswordCheck check={passwordChecks.length} label="At least 6 characters" />
                  <PasswordCheck check={passwordChecks.hasLetter} label="Contains letters" />
                  <PasswordCheck check={passwordChecks.hasNumber} label="Contains numbers" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && (
                <div className="flex items-center space-x-2 text-xs">
                  {doPasswordsMatch ? (
                    <>
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3 text-red-400" />
                      <span className="text-red-500">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
            
          
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
