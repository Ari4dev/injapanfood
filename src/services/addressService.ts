import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Address {
  id: string;
  userId: string;
  name: string; // Nama penerima
  phone: string;
  address: string; // Alamat lengkap
  prefecture: string; // Prefektur/Province
  city: string; // Kota
  postalCode: string; // Kode pos
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAddressData {
  name: string;
  phone: string;
  address: string;
  prefecture: string;
  city: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {
  id: string;
}

class AddressService {
  private collection = 'addresses';

  // Get all addresses for a user
  async getUserAddresses(userId: string): Promise<Address[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const addresses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Address[];
      
      // Sort in memory: default addresses first, then by creation date (newest first)
      return addresses.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } catch (error) {
      console.error('Error getting user addresses:', error);
      throw error;
    }
  }

  // Get a specific address by ID
  async getAddress(addressId: string): Promise<Address | null> {
    try {
      const docRef = doc(db, this.collection, addressId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as Address;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting address:', error);
      throw error;
    }
  }

  // Add a new address
  async addAddress(userId: string, addressData: CreateAddressData): Promise<string> {
    try {
      const batch = writeBatch(db);
      const now = new Date();

      // If this is set as default, update all other addresses to not be default
      if (addressData.isDefault) {
        const existingAddresses = await this.getUserAddresses(userId);
        existingAddresses.forEach(addr => {
          if (addr.isDefault) {
            const addrRef = doc(db, this.collection, addr.id);
            batch.update(addrRef, { isDefault: false, updatedAt: now });
          }
        });
      }

      // Add the new address
      const newAddressData = {
        ...addressData,
        userId,
        isDefault: addressData.isDefault || false,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = doc(collection(db, this.collection));
      batch.set(docRef, newAddressData);

      await batch.commit();
      return docRef.id;
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  }

  // Update an existing address
  async updateAddress(addressData: UpdateAddressData): Promise<void> {
    try {
      const { id, ...updateData } = addressData;
      const batch = writeBatch(db);
      const now = new Date();

      // If this is being set as default, update all other addresses for the same user
      if (updateData.isDefault) {
        const currentAddress = await this.getAddress(id);
        if (currentAddress) {
          const userAddresses = await this.getUserAddresses(currentAddress.userId);
          userAddresses.forEach(addr => {
            if (addr.id !== id && addr.isDefault) {
              const addrRef = doc(db, this.collection, addr.id);
              batch.update(addrRef, { isDefault: false, updatedAt: now });
            }
          });
        }
      }

      // Update the address
      const addressRef = doc(db, this.collection, id);
      batch.update(addressRef, {
        ...updateData,
        updatedAt: now,
      });

      await batch.commit();
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  }

  // Delete an address
  async deleteAddress(addressId: string): Promise<void> {
    try {
      const addressRef = doc(db, this.collection, addressId);
      await deleteDoc(addressRef);
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }

  // Set an address as default
  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const now = new Date();

      // Get all user addresses
      const userAddresses = await this.getUserAddresses(userId);

      // Update all addresses
      userAddresses.forEach(addr => {
        const addrRef = doc(db, this.collection, addr.id);
        batch.update(addrRef, {
          isDefault: addr.id === addressId,
          updatedAt: now,
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  }

  // Get default address for a user
  async getDefaultAddress(userId: string): Promise<Address | null> {
    try {
      const q = query(
        collection(db, this.collection),
        where('userId', '==', userId),
        where('isDefault', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.length > 0) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as Address;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting default address:', error);
      throw error;
    }
  }
}

export const addressService = new AddressService();
