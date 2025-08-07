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
import { CheckCircle, XCircle, Loader2, Eye, EyeOff, Mail, Lock, User, Phone, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-red-200/30 to-orange-200/30 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-yellow-200/30 rounded-full blur-xl"></div>
        <div className="absolute top-1/3 -left-5 w-24 h-24 bg-gradient-to-br from-red-100/40 to-pink-100/40 rounded-full blur-lg"></div>
        <div className="absolute bottom-1/4 -right-5 w-28 h-28 bg-gradient-to-br from-yellow-100/40 to-orange-100/40 rounded-full blur-lg"></div>
      </div>
      
      {/* Language Switcher positioned at top right */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute top-4 right-4 z-10"
      >
        <LanguageSwitcher />
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 shadow-2xl ring-4 ring-white/50 backdrop-blur-sm"
          >
            <img 
              src="/logo.png" 
              alt="Injapan Food Logo" 
              className="w-full h-full object-contain bg-gradient-to-br from-white to-red-50 p-2"
            />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-4xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-red-700 bg-clip-text text-transparent mb-2"
          >
            Injapan Food
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-sm text-gray-600 font-medium"
          >
            Makanan Indonesia di Jepang
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg">
              <TabsTrigger value="signin" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">{t('auth.signInTab')}</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">{t('auth.signUpTab')}</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="signin">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl">
                    <CardHeader className="text-center pb-8">
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                      >
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{t('auth.signIn')}</CardTitle>
                        <CardDescription className="text-gray-600 mt-2">
                          {t('auth.signInDescription')}
                        </CardDescription>
                      </motion.div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <form onSubmit={handleSignIn} className="space-y-5">
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                        >
                          <Label htmlFor="signin-email" className="text-gray-700 font-medium">{t('auth.email')}</Label>
                          <div className="relative mt-2">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <Input
                              id="signin-email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              placeholder={t('auth.emailPlaceholder')}
                              className="pl-11 h-12 border-gray-200 focus:border-red-300 focus:ring-red-200 transition-all duration-200 bg-white/70"
                            />
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                        >
                          <Label htmlFor="signin-password" className="text-gray-700 font-medium">{t('auth.password')}</Label>
                          <div className="relative mt-2">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <Input
                              id="signin-password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              placeholder={t('auth.passwordPlaceholder')}
                              className="pl-11 h-12 border-gray-200 focus:border-red-300 focus:ring-red-200 transition-all duration-200 bg-white/70"
                            />
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.4 }}
                        >
                          <Button 
                            type="submit" 
                            className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5" 
                            disabled={loading}
                          >
                            {loading ? (
                              <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{t('auth.processing')}</span>
                              </div>
                            ) : (
                              t('auth.signInButton')
                            )}
                          </Button>
                        </motion.div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </AnimatePresence>

              <TabsContent value="signup">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl">
                    <CardHeader className="text-center pb-6">
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                      >
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{t('auth.signUp')}</CardTitle>
                        <CardDescription className="text-gray-600 mt-2">
                          {t('auth.signUpDescription')}
                        </CardDescription>
                      </motion.div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                        >
                          <Label htmlFor="signup-name" className="text-gray-700 font-medium">{t('auth.fullName')} <span className="text-red-500">*</span></Label>
                          <div className="relative mt-2">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <Input
                              id="signup-name"
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              required
                              placeholder={t('auth.fullNamePlaceholder')}
                              className="pl-11 h-12 border-gray-200 focus:border-red-300 focus:ring-red-200 transition-all duration-200 bg-white/70"
                            />
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                        >
                          <Label htmlFor="signup-email" className="text-gray-700 font-medium">{t('auth.email')} <span className="text-red-500">*</span></Label>
                          <div className="relative mt-2">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <Input
                              id="signup-email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              placeholder={t('auth.emailPlaceholder')}
                              className="pl-11 h-12 border-gray-200 focus:border-red-300 focus:ring-red-200 transition-all duration-200 bg-white/70"
                            />
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                        >
                          <Label htmlFor="signup-phone" className="text-gray-700 font-medium">{t('auth.phoneNumber')} <span className="text-red-500">*</span></Label>
                          <div className="relative mt-2">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <Input
                              id="signup-phone"
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              required
                              placeholder={t('auth.phoneNumberPlaceholder')}
                              className="pl-11 h-12 border-gray-200 focus:border-red-300 focus:ring-red-200 transition-all duration-200 bg-white/70"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {t('auth.phoneNumberHelper')}
                          </p>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.4 }}
                        >
                          <Label htmlFor="signup-gender" className="text-gray-700 font-medium">{t('auth.gender')} <span className="text-red-500">*</span></Label>
                          <div className="relative mt-2">
                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                            <Select value={gender} onValueChange={setGender} required>
                              <SelectTrigger className="pl-11 h-12 border-gray-200 focus:border-red-300 focus:ring-red-200 transition-all duration-200 bg-white/70">
                                <SelectValue placeholder={t('auth.selectGender')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">{t('auth.male')}</SelectItem>
                                <SelectItem value="female">{t('auth.female')}</SelectItem>
                                <SelectItem value="other">{t('auth.other')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.5 }}
                        >
                          <Label htmlFor="signup-password" className="text-gray-700 font-medium">{t('auth.password')} <span className="text-red-500">*</span></Label>
                          <div className="relative mt-2">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              placeholder={t('auth.passwordMinCharacters')}
                              minLength={6}
                              className="pl-11 pr-11 h-12 border-gray-200 focus:border-red-300 focus:ring-red-200 transition-all duration-200 bg-white/70"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                              ) : (
                                <Eye className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.6 }}
                        >
                          <Label htmlFor="signup-confirm-password" className="text-gray-700 font-medium">{t('auth.confirmPassword')} <span className="text-red-500">*</span></Label>
                          <div className="relative mt-2">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <Input
                              id="signup-confirm-password"
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                              placeholder={t('auth.repeatPassword')}
                              minLength={6}
                              className="pl-11 pr-11 h-12 border-gray-200 focus:border-red-300 focus:ring-red-200 transition-all duration-200 bg-white/70"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                              ) : (
                                <Eye className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                          <AnimatePresence>
                            {confirmPassword && password !== confirmPassword && (
                              <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-xs text-red-500 mt-2 flex items-center space-x-1"
                              >
                                <XCircle className="h-3 w-3" />
                                <span>{t('auth.passwordNotMatch')}</span>
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.7 }}
                        >
                          <Label htmlFor="signup-referral" className="text-gray-700 font-medium">{t('auth.referralCode')}</Label>
                          <div className="relative mt-2">
                            <Input
                              id="signup-referral"
                              type="text"
                              value={referralCode}
                              onChange={(e) => setReferralCode(e.target.value)}
                              placeholder={t('auth.referralCodePlaceholder')}
                              className={`h-12 ${referralCode ? 'pr-20' : 'pr-11'} border-gray-200 focus:border-red-300 focus:ring-red-200 transition-all duration-200 bg-white/70 ${
                                referralValidationState === 'valid'
                                  ? 'border-green-400 focus:border-green-500'
                                  : referralValidationState === 'invalid'
                                  ? 'border-red-400 focus:border-red-500'
                                  : ''
                              }`}
                            />
                            
                            {/* Right side icons container */}
                            <div className="absolute inset-y-0 right-0 flex items-center">
                              {/* Clear button - shows when there's text */}
                              {referralCode && (
                                <motion.button
                                  type="button"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="mr-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                                  onClick={() => {
                                    setReferralCode('');
                                    setReferralValidationState('idle');
                                    setReferralValidationMessage('');
                                  }}
                                  aria-label="Clear referral code"
                                >
                                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                </motion.button>
                              )}
                              
                              {/* Validation Icon */}
                              <div className="pr-3">
                                <AnimatePresence mode="wait">
                                  {referralValidationState === 'validating' && (
                                    <motion.div
                                      key="loading"
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                    >
                                      <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                                    </motion.div>
                                  )}
                                  {referralValidationState === 'valid' && (
                                    <motion.div
                                      key="valid"
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    </motion.div>
                                  )}
                                  {referralValidationState === 'invalid' && (
                                    <motion.div
                                      key="invalid"
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                    >
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {referralValidationMessage ? (
                              <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className={`text-xs mt-2 ${
                                  referralValidationState === 'valid'
                                    ? 'text-green-600'
                                    : referralValidationState === 'invalid'
                                    ? 'text-red-500'
                                    : 'text-gray-500'
                                }`}
                              >
                                {referralValidationMessage}
                              </motion.p>
                            ) : (
                              <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-xs text-gray-500 mt-2"
                              >
                                {t('auth.referralCodeHelper')}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.8 }}
                        >
                          <Button 
                            type="submit" 
                            className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5" 
                            disabled={loading}
                          >
                            {loading ? (
                              <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{t('auth.processing')}</span>
                              </div>
                            ) : (
                              t('auth.signUpButton')
                            )}
                          </Button>
                        </motion.div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
        </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthForm;