import { 
  collection, 
  getDocs, 
  addDoc,
  doc,
  updateDoc 
} from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Migration service to move data from old bank_accounts collection to new admin_bank_accounts collection
 * Also handles migrating from hardcoded data in checkout form
 */

interface OldBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchName?: string;
  branchCode?: string;
  swiftCode?: string;
  routingNumber?: string;
  bankAddress?: string;
  country: string;
  currency: string;
  accountType: string;
  isActive: boolean;
  isDefault: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface NewBankAccount {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  country: 'ID' | 'JP';
  currency: 'IDR' | 'JPY';
  isActive: boolean;
  isDefault: boolean;
  branch?: string;
  swiftCode?: string;
  bankCode?: string;
  branchCode?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Check if migration from old system is needed
 */
export const checkMigrationNeeded = async (): Promise<boolean> => {
  try {
    // Check if new collection is empty
    const newSnapshot = await getDocs(collection(db, 'admin_bank_accounts'));
    if (!newSnapshot.empty) {
      return false; // Already migrated
    }

    // Check if old collection has data
    const oldSnapshot = await getDocs(collection(db, 'bank_accounts'));
    return !oldSnapshot.empty;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};

/**
 * Migrate data from old bank_accounts collection to new admin_bank_accounts collection
 */
export const migrateOldBankAccounts = async (): Promise<void> => {
  try {
    console.log('🔄 [Migration] Starting migration from old bank_accounts collection...');

    const oldSnapshot = await getDocs(collection(db, 'bank_accounts'));
    
    if (oldSnapshot.empty) {
      console.log('ℹ️ [Migration] No old bank accounts found to migrate');
      return;
    }

    let migratedCount = 0;

    for (const docSnap of oldSnapshot.docs) {
      const oldData = docSnap.data() as OldBankAccount;
      
      // Map old structure to new structure
      const newData: NewBankAccount = {
        bankName: oldData.bankName,
        accountNumber: oldData.accountNumber,
        accountHolderName: oldData.accountHolder,
        country: mapCountryToCode(oldData.country),
        currency: oldData.currency === 'JPY' ? 'JPY' : 'IDR',
        isActive: oldData.isActive,
        isDefault: oldData.isDefault,
        branch: oldData.branchName,
        swiftCode: oldData.swiftCode,
        bankCode: oldData.branchCode,
        branchCode: oldData.branchCode,
        createdAt: oldData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'admin_bank_accounts'), newData);
      migratedCount++;

      console.log(`✅ [Migration] Migrated ${oldData.bankName} from old collection`);
    }

    console.log(`🎉 [Migration] Successfully migrated ${migratedCount} bank accounts from old system`);

    // Mark old collection as migrated (add a migration flag)
    await addDoc(collection(db, 'admin_bank_accounts'), {
      _migration: true,
      _migratedAt: new Date().toISOString(),
      _migratedFrom: 'bank_accounts',
      _migratedCount: migratedCount,
      bankName: 'MIGRATION_MARKER',
      accountNumber: 'MIGRATION_COMPLETE',
      accountHolderName: 'SYSTEM',
      country: 'ID',
      currency: 'IDR',
      isActive: false,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Migration] Error migrating old bank accounts:', error);
    throw error;
  }
};

/**
 * Helper function to map country names to country codes
 */
const mapCountryToCode = (country: string): 'ID' | 'JP' => {
  const countryLower = country.toLowerCase();
  
  if (countryLower.includes('japan') || countryLower.includes('jp')) {
    return 'JP';
  } else if (countryLower.includes('indonesia') || countryLower.includes('id')) {
    return 'ID';
  }
  
  // Default to Indonesia
  return 'ID';
};

/**
 * Run complete migration process
 */
export const runCompleteMigration = async (): Promise<void> => {
  try {
    const needsMigration = await checkMigrationNeeded();
    
    if (needsMigration) {
      await migrateOldBankAccounts();
    } else {
      console.log('ℹ️ [Migration] No migration needed - system already up to date');
    }
  } catch (error) {
    console.error('❌ [Migration] Complete migration failed:', error);
    throw error;
  }
};
