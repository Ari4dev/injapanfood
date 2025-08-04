import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { validateReferralCode } from '@/services/affiliateService';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Referral code validation states
  const [referralValidationState, setReferralValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [referralValidationMessage, setReferralValidationMessage] = useState('');
  const [validationTimeoutId, setValidationTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // Get tab and referral code from URL if available
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    const refParam = urlParams.get('ref');
    
    // Set active tab if specified in URL
    if (tabParam === 'signup' || tabParam === 'daftar') {
      document.querySelector('[data-state="inactive"][value="signup"]')?.click();
    }
    
    // Set referral code if present in URL
    if (refParam) {
      setReferralCode(refParam);
      console.log('Referral code found in URL:', refParam);
    }
  }, [location.search]);

  // Validate referral code function
  const validateReferralCodeHandler = async (code: string) => {
    if (!code || code.length < 3) {
      setReferralValidationState('idle');
      setReferralValidationMessage('');
      return;
    }

    setReferralValidationState('validating');
    setReferralValidationMessage('');

    try {
      const isValid = await validateReferralCode(code);
      
      if (isValid) {
        setReferralValidationState('valid');
        setReferralValidationMessage('Kode referral valid! Anda akan mendapat bonus pendaftaran.');
        toast({
          title: "Kode Referral Valid",
          description: "Kode referral berhasil diverifikasi. Anda akan mendapat bonus pendaftaran!",
        });
      } else {
        setReferralValidationState('invalid');
        setReferralValidationMessage('Kode referral tidak ditemukan. Periksa kembali kode yang Anda masukkan.');
        toast({
          title: "Kode Referral Tidak Valid",
          description: "Kode referral yang Anda masukkan tidak ditemukan.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setReferralValidationState('invalid');
      setReferralValidationMessage('Terjadi kesalahan saat memvalidasi kode referral.');
      toast({
        title: "Error Validasi",
        description: "Terjadi kesalahan saat memvalidasi kode referral. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  // Debounce referral code validation
  useEffect(() => {
    // Clear existing timeout
    if (validationTimeoutId) {
      clearTimeout(validationTimeoutId);
    }

    // Set new timeout only if referral code is not empty
    if (referralCode.trim()) {
      const timeoutId = setTimeout(() => {
        validateReferralCodeHandler(referralCode.trim());
      }, 1000); // 1 second debounce
      
      setValidationTimeoutId(timeoutId);
    } else {
      setReferralValidationState('idle');
      setReferralValidationMessage('');
    }

    // Cleanup
    return () => {
      if (validationTimeoutId) {
        clearTimeout(validationTimeoutId);
      }
    };
  }, [referralCode]);

  const getFirebaseErrorMessage = (error: any) => {
    const errorCode = error?.code || '';
    
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Email atau password yang Anda masukkan salah. Silakan periksa kembali data Anda.';
      
      case 'auth/invalid-email':
        return 'Format email tidak valid. Silakan masukkan alamat email yang benar.';
      
      case 'auth/user-disabled':
        return 'Akun Anda telah dinonaktifkan. Silakan hubungi customer service.';
      
      case 'auth/too-many-requests':
        return 'Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa menit.';
      
      case 'auth/email-already-in-use':
        return 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk dengan akun yang sudah ada.';
      
      case 'auth/weak-password':
        return 'Password terlalu lemah. Gunakan minimal 6 karakter dengan kombinasi huruf dan angka.';
      
      default:
        return 'Terjadi kesalahan pada sistem. Silakan coba lagi atau hubungi customer service kami jika masalah berlanjut.';
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        const errorMessage = getFirebaseErrorMessage(error);
        
        toast({
          title: "Login Gagal",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Berhasil",
          description: "Selamat datang! Anda berhasil masuk ke akun Anda.",
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Login Gagal",
        description: "Terjadi kesalahan pada sistem. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (!fullName.trim()) {
        toast({
          title: "Pendaftaran Gagal",
          description: "Nama lengkap wajib diisi",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!email.trim()) {
        toast({
          title: "Pendaftaran Gagal",
          description: "Email wajib diisi",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!phoneNumber.trim()) {
        toast({
          title: "Pendaftaran Gagal",
          description: "Nomor telepon wajib diisi",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!gender) {
        toast({
          title: "Pendaftaran Gagal",
          description: "Jenis kelamin wajib dipilih",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        toast({
          title: "Pendaftaran Gagal",
          description: "Password minimal 6 karakter",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast({
          title: "Pendaftaran Gagal",
          description: "Password dan konfirmasi password tidak sama",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate referral code if provided
      if (referralCode.trim() && referralValidationState === 'invalid') {
        toast({
          title: "Pendaftaran Gagal",
          description: "Kode referral tidak valid. Silakan periksa kembali atau kosongkan field ini.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Store referral code in localStorage if provided
      if (referralCode) {
        localStorage.setItem('referralCode', referralCode);
        localStorage.setItem('referralTimestamp', Date.now().toString());
        console.log('Stored referral code before signup:', referralCode);
      }

      const { error } = await signUp(email, password, fullName);

      if (error) {
        const errorMessage = getFirebaseErrorMessage(error);
        
        toast({
          title: "Pendaftaran Gagal",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Pendaftaran Berhasil",
          description: "Akun Anda berhasil dibuat! Selamat datang di Injapan Food.",
        });
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setPhoneNumber('');
        setGender('');
        setReferralCode('');
        // Redirect to home
        navigate('/');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Pendaftaran Gagal",
        description: "Terjadi kesalahan pada sistem. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Language Switcher positioned at top right */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4">
            <img 
              src="/logo.png" 
              alt="Injapan Food Logo" 
              className="w-full h-full object-contain bg-white p-2"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Injapan Food</h2>
          <p className="mt-2 text-sm text-gray-600">Makanan Indonesia di Jepang</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">{t('auth.signInTab')}</TabsTrigger>
            <TabsTrigger value="signup">{t('auth.signUpTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>{t('auth.signIn')}</CardTitle>
                <CardDescription>
                  {t('auth.signInDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">{t('auth.email')}</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={t('auth.emailPlaceholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">{t('auth.password')}</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder={t('auth.passwordPlaceholder')}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? t('auth.processing') : t('auth.signInButton')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>{t('auth.signUp')}</CardTitle>
                <CardDescription>
                  {t('auth.signUpDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">{t('auth.fullName')} {t('auth.required')}</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder={t('auth.fullNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">{t('auth.email')} {t('auth.required')}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={t('auth.emailPlaceholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-phone">{t('auth.phoneNumber')} {t('auth.required')}</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      placeholder={t('auth.phoneNumberPlaceholder')}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('auth.phoneNumberHelper')}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="signup-gender">{t('auth.gender')} {t('auth.required')}</Label>
                    <Select value={gender} onValueChange={setGender} required>
                      <SelectTrigger>
                        <SelectValue placeholder={t('auth.selectGender')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t('auth.male')}</SelectItem>
                        <SelectItem value="female">{t('auth.female')}</SelectItem>
                        <SelectItem value="other">{t('auth.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="signup-password">{t('auth.password')} {t('auth.required')}</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder={t('auth.passwordMinCharacters')}
                        minLength={6}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.585 6.585m3.293 3.293L12 12m0 0l2.122 2.122M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signup-confirm-password">{t('auth.confirmPassword')} {t('auth.required')}</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder={t('auth.repeatPassword')}
                        minLength={6}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.585 6.585m3.293 3.293L12 12m0 0l2.122 2.122M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">
                        {t('auth.passwordNotMatch')}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="signup-referral">{t('auth.referralCode')}</Label>
                    <div className="relative">
                      <Input
                        id="signup-referral"
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        placeholder={t('auth.referralCodePlaceholder')}
                        className={`pr-10 ${
                          referralValidationState === 'valid'
                            ? 'border-green-500 focus:border-green-500'
                            : referralValidationState === 'invalid'
                            ? 'border-red-500 focus:border-red-500'
                            : ''
                        }`}
                      />
                      {/* Validation Icon */}
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {referralValidationState === 'validating' && (
                          <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                        )}
                        {referralValidationState === 'valid' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {referralValidationState === 'invalid' && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    {/* Validation Message */}
                    {referralValidationMessage && (
                      <p className={`text-xs mt-1 ${
                        referralValidationState === 'valid'
                          ? 'text-green-600'
                          : referralValidationState === 'invalid'
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}>
                        {referralValidationMessage}
                      </p>
                    )}
                    
                    {/* Default Helper Text (only show when no validation message) */}
                    {!referralValidationMessage && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t('auth.referralCodeHelper')}
                      </p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? t('auth.processing') : t('auth.signUpButton')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthForm;