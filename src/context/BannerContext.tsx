import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  linkType?: 'category' | 'product' | 'none';
  linkId?: string;
  createdAt?: any;
}

interface BannerContextType {
  banners: Banner[];
  addBanner: (imageUrl: string, title: string, linkType?: string, linkId?: string) => Promise<void>;
  updateBanner: (id: string, imageUrl: string, title: string, linkType?: string, linkId?: string) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  loading: boolean;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export const useBanners = () => {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('useBanners must be used within BannerProvider');
  }
  return context;
};

interface BannerProviderProps {
  children: ReactNode;
}

export const BannerProvider: React.FC<BannerProviderProps> = ({ children }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: any;

    // 🔥 REAL-TIME FIRESTORE SYNC
    console.log('🔄 Setting up Banner listener...');
    const q = query(collection(db, 'banners')); // Temporarily remove orderBy to check if it's the cause
    const unsub = onSnapshot(q, 
      (snapshot) => {
        if (!isMounted) return;
        console.log(`✅ Banner Snapshot received: ${snapshot.docs.length} banners found`);
        const bannerList: Banner[] = snapshot.docs.map(docItem => {
          const data = docItem.data();
          return {
            id: docItem.id,
            imageUrl: data.imageUrl,
            title: data.title || 'Banner',
            linkType: data.linkType || 'none',
            linkId: data.linkId || '',
            createdAt: data.createdAt,
          };
        });
        
        // Manual sort by createdAt if available
        bannerList.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setBanners(bannerList);
        setLoading(false);
        clearTimeout(timeoutId);
      },
      (error) => {
        console.error('❌ Firestore Banner listener error:', error);
        if (!isMounted) return;
        setLoading(false);
        clearTimeout(timeoutId);
      }
    );

    // 🔥 FALLBACK TIMEOUT
    timeoutId = setTimeout(() => {
      if (!isMounted) return;
      console.warn("⚠️ BannerContext timeout - forcing loading false");
      setLoading(false);
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsub();
    };
  }, []);

  const addBanner = async (imageUrl: string, title: string, linkType: string = 'none', linkId: string = '') => {
    console.log('📤 Adding banner to Firestore:', { imageUrl, title });
    if (!imageUrl || !imageUrl.trim()) {
      Alert.alert('Error', 'Please enter image URL');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'banners'), {
        imageUrl: imageUrl.trim(),
        title: title || 'New Banner',
        linkType,
        linkId,
        createdAt: serverTimestamp(),
      });
      console.log('✅ Banner added with ID:', docRef.id);
      Alert.alert('Success', 'Banner added successfully');
    } catch (error: any) {
      console.error('❌ Error adding banner:', error);
      Alert.alert('Error', 'Failed to add banner');
    }
  };

  const updateBanner = async (id: string, imageUrl: string, title: string, linkType: string = 'none', linkId: string = '') => {
    if (!imageUrl.trim()) {
      Alert.alert('Error', 'Please enter image URL');
      return;
    }
    try {
      await updateDoc(doc(db, 'banners', id), {
        imageUrl,
        title: title || 'Banner',
        linkType,
        linkId,
        updatedAt: serverTimestamp(),
      });
      Alert.alert('Success', 'Banner updated successfully');
    } catch (error: any) {
      console.error('Error updating banner:', error);
      Alert.alert('Error', 'Failed to update banner');
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'banners', id));
      Alert.alert('Success', 'Banner deleted successfully');
    } catch (error: any) {
      console.error('Error deleting banner:', error);
      Alert.alert('Error', 'Failed to delete banner');
    }
  };

  return (
    <BannerContext.Provider value={{ banners, addBanner, updateBanner, deleteBanner, loading }}>
      {children}
    </BannerContext.Provider>
  );
};
