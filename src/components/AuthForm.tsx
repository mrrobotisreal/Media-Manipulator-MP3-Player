import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { signIn, signUp } from '@/lib/auth';
import { analytics } from '@/lib/firebase';
import { logEvent } from 'firebase/analytics';
import { Music, Eye, EyeOff } from 'lucide-react';
import mixpanel from 'mixpanel-browser';
import { toast } from 'sonner';

// Login schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Initialize form for login only
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleSubmit = async (data: LoginFormData) => {
    setLoading(true);

    try {
      await signIn(data.email, data.password);

      // Show success toast
      const username = data.email.split('@')[0];
      toast.success('Success!', {
        description: `Welcome back ${username}!`,
      });

      // Track login attempt with Firebase Analytics
      logEvent(analytics, 'login', {
        method: 'email',
        username: username
      });

      // Track login with Mixpanel
      mixpanel.track('User Login', {
        method: 'email',
        username: username
      });
    } catch (error: any) {
      // Show error toast
      toast.error('Error!', {
        description: 'Email or password is incorrect, please double check your spelling and try again.',
      });

      // Track auth error with Firebase Analytics
      logEvent(analytics, 'auth_error', {
        error_message: error.message,
        auth_method: 'login'
      });

      // Track error with Mixpanel
      mixpanel.track('Auth Error', {
        error_message: error.message,
        auth_method: 'login'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(true); // Always set to login since signup is disabled

    // Track form toggle with Firebase Analytics
    logEvent(analytics, 'auth_form_toggle', {
      mode: 'login'
    });

    // Track form toggle with Mixpanel
    mixpanel.track('Auth Form Toggle', {
      mode: 'login'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Music className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome Back
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Sign in to access your MP3 Drive Player
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        autoComplete='email'
                        autoCapitalize='none'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={isLogin ? 'Enter your password' : 'Create a password'}
                          autoComplete={isLogin ? 'current-password' : 'new-password'}
                          autoCapitalize='none'
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-gray-400 dark:text-gray-500 font-medium cursor-not-allowed">
                      Sign up
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-center">
                      Please contact mitchellwintrow@gmail.com if you wish to sign up; not accepting new users currently unless they go through mitchellwintrow@gmail.com
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};