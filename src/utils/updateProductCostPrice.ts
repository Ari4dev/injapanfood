import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const updateProductsWithCostPrice = async () => {
  try {
    console.log('Updating products with cost_price...');
    
    // Fetch all products
    const productsRef = collection(db, 'products');
    const productsSnapshot = await getDocs(productsRef);
    
    const updatePromises = [];
    
    for (const productDoc of productsSnapshot.docs) {
      const productData = productDoc.data();
      
      // If product doesn't have cost_price or it's null/undefined
      if (!productData.cost_price) {
        console.log(`Updating product: ${productData.name}`);
        
        // Set a default cost_price based on a percentage of selling price
        // You can adjust this logic based on your business needs
        const defaultCostPrice = Math.floor(productData.price * 0.7); // 70% of selling price
        
        const productRef = doc(db, 'products', productDoc.id);
        updatePromises.push(
          updateDoc(productRef, {
            cost_price: defaultCostPrice,
            updated_at: new Date().toISOString()
          })
        );
      }
    }
    
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`Updated ${updatePromises.length} products with cost_price`);
    } else {
      console.log('All products already have cost_price');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating products with cost_price:', error);
    return false;
  }
};
