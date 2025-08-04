import { LogOut, User, ShoppingBag, Settings, Percent, UserCog } from 'lucide-react';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useLanguage } from '@/hooks/useLanguage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          // Check admin status from Firestore
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.role === 'admin');
          } else {
            // Fallback to email check
            const adminEmails = [
              'admin@gmail.com', 
              'ari4rich@gmail.com',
              'newadmin@gmail.com',
              'injpn@food.com',
              'admin2@gmail.com'
            ];
            setIsAdmin(adminEmails.includes(user.email || ''));
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          // Fallback to email check
          const adminEmails = [
            'admin@gmail.com', 
            'ari4rich@gmail.com',
            'newadmin@gmail.com',
            'injpn@food.com',
            'admin2@gmail.com'
          ];
          setIsAdmin(adminEmails.includes(user.email || ''));
        }
      }
    };

    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleOrdersClick = () => {
    navigate('/orders');
  };

  const handleReferralClick = () => {
    navigate('/referral');
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
          <User className="w-4 h-4" />
          <span className="hidden md:inline">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.displayName || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick}>
          <UserCog className="mr-2 h-4 w-4" />
          <span>{t('profile.title')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOrdersClick}>
          <ShoppingBag className="mr-2 h-4 w-4" />
          <span>{t('profile.orderHistory')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleReferralClick}>
          <Percent className="mr-2 h-4 w-4" />
          <span>{t('profile.affiliateProgram')}</span>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAdminClick}>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t('profile.adminPanel')}</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('profile.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;