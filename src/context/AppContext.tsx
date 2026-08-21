import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  getDocs,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import * as XLSX from 'xlsx';
import { db, auth } from '../firebase';
import { 
  User, 
  Inventory, 
  Product, 
  Order, 
  CartItem, 
  AppNotification 
} from '../types';

export interface PromptModalState {
  isOpen: boolean;
  title: string;
  message: string;
  defaultValue: string;
  onConfirm: (val: string) => void;
}

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface AppContextType {
  // Auth & User
  user: User | null;
  authLoading: boolean;
  loginError: string | null;
  handleGoogleLogin: () => Promise<void>;
  handleSignOut: () => Promise<void>;

  // Data
  inventory: Inventory;
  orders: Order[];
  notifications: AppNotification[];
  managedUsers: User[];
  
  // Cart
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateCartQuantity: (index: number, delta: number) => void;
  clearCart: () => void;
  handleStudentCheckout: () => Promise<void>;

  // Inventory actions
  activeCategory: keyof Inventory;
  setActiveCategory: (cat: keyof Inventory) => void;
  studentGenderFilter: 'all' | 'male' | 'female';
  setStudentGenderFilter: (filter: 'all' | 'male' | 'female') => void;
  globalSelectedSize: { productName: string; size: string } | null;
  setGlobalSelectedSize: (val: { productName: string; size: string } | null) => void;
  editingProduct: { category: keyof Inventory; name: string; product: Product } | null;
  setEditingProduct: (p: { category: keyof Inventory; name: string; product: Product } | null) => void;
  csvMode: 'append' | 'overwrite';
  setCsvMode: (mode: 'append' | 'overwrite') => void;
  isInventoryControlsOpen: boolean;
  setIsInventoryControlsOpen: (open: boolean) => void;
  fetchInventory: () => Promise<void>;
  handleUpdateProduct: (category: keyof Inventory, originalName: string, updatedProduct: Product) => Promise<void>;
  handleDeleteProduct: (category: keyof Inventory, name: string) => Promise<void>;
  handleUpdateImage: (category: keyof Inventory, name: string) => void;
  handleExcelUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;

  // Order actions
  orderStatusFilter: 'all' | Order['status'];
  setOrderStatusFilter: (status: 'all' | Order['status']) => void;
  orderSearchQuery: string;
  setOrderSearchQuery: (query: string) => void;
  orderViewMode: 'table' | 'cards';
  setOrderViewMode: (mode: 'table' | 'cards') => void;
  handleUpdateOrderStatus: (order: Order, newStatus: Order['status'], pickupDate?: string) => Promise<void>;

  // User Management actions (Admin/Superadmin)
  adminUserViewMode: 'table' | 'cards';
  setAdminUserViewMode: (mode: 'table' | 'cards') => void;
  newAdminEmail: string;
  setNewAdminEmail: (email: string) => void;
  newAdminRole: 'admin' | 'superadmin';
  setNewAdminRole: (role: 'admin' | 'superadmin') => void;
  handleAddAdmin: (e: React.FormEvent) => Promise<void>;
  handleBlockUser: (email: string, currentlyBlocked?: boolean) => Promise<void>;
  handleUpdateUserRole: (email: string, newRole: 'student' | 'admin' | 'superadmin') => Promise<void>;

  // Notifications
  unreadCount: number;
  selectedNotification: AppNotification | null;
  setSelectedNotification: (n: AppNotification | null) => void;
  handleMarkNotificationAsRead: (id: string) => Promise<void>;
  handleClearAllNotifications: () => Promise<void>;

  // Modals & UI Feedback
  promptModal: PromptModalState | null;
  setPromptModal: (modal: PromptModalState | null) => void;
  confirmModal: ConfirmModalState | null;
  setConfirmModal: (modal: ConfirmModalState | null) => void;
  selectedInvoiceOrder: Order | null;
  setSelectedInvoiceOrder: (order: Order | null) => void;
  assignPickupOrder: Order | null;
  setAssignPickupOrder: (order: Order | null) => void;
  toastMessage: string | null;
  showToast: (message: string, isError?: boolean) => void;
  successMessage: string | null;
  showSuccessModal: (msg: string) => void;
  closeSuccessModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Core Data
  const [inventory, setInventory] = useState<Inventory>({
    college: {},
    highschool: {},
    accessories: {}
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [managedUsers, setManagedUsers] = useState<User[]>([]);

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('neunifits_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Store in LocalStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem('neunifits_cart', JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  // UI / View State
  const [activeCategory, setActiveCategory] = useState<keyof Inventory>('college');
  const [studentGenderFilter, setStudentGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [globalSelectedSize, setGlobalSelectedSize] = useState<{ productName: string; size: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<{ category: keyof Inventory; name: string; product: Product } | null>(null);
  const [csvMode, setCsvMode] = useState<'append' | 'overwrite'>('append');
  const [isInventoryControlsOpen, setIsInventoryControlsOpen] = useState(false);

  // Orders Filter / Search
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | Order['status']>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderViewMode, setOrderViewMode] = useState<'table' | 'cards'>('table');

  // Admin Management View
  const [adminUserViewMode, setAdminUserViewMode] = useState<'table' | 'cards'>('table');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'superadmin'>('admin');

  // Modals & Feedback
  const [promptModal, setPromptModal] = useState<PromptModalState | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [assignPickupOrder, setAssignPickupOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string, isError = false) => {
    setToastMessage(isError ? `⚠️ ${message}` : message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  const showSuccessModal = useCallback((msg: string) => {
    setSuccessMessage(msg);
  }, []);

  const closeSuccessModal = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  // Sync Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const email = firebaseUser.email.toLowerCase();
        
        // Ensure user is allowed: validate NEU domain or authorized admin account
        const isNeuEmail = email.endsWith('@neu.edu.ph') || 
                           email.endsWith('.neu.edu.ph') || 
                           email === 'janice.marsep.17@gmail.com' || 
                           email.includes('admin');
        
        if (!isNeuEmail) {
          await fbSignOut(auth);
          setUser(null);
          setLoginError("Access Restricted: Only @neu.edu.ph email accounts are permitted to sign in.");
          setAuthLoading(false);
          return;
        }

        try {
          const userDocRef = doc(db, 'users', email);
          const userDoc = await getDoc(userDocRef);

          let role: 'student' | 'admin' | 'superadmin' = 'student';
          let blocked = false;

          const isInitialAdmin = email.includes('admin') || 
                                 email === 'admin@neu.edu.ph' || 
                                 email === 'janice.marsep.17@gmail.com' || 
                                 email === 'mariaantonette.espinosa@neu.edu.ph' || 
                                 email === 'alyssabernadette.tuliao@neu.edu.ph' || 
                                 email === 'janice.hernandez@neu.edu.ph';

          if (isInitialAdmin) {
            role = 'superadmin';
          }

          if (userDoc.exists()) {
            const data = userDoc.data();
            role = data.role || (isInitialAdmin ? 'superadmin' : 'student');
            blocked = !!data.blocked;
          } else {
            await setDoc(userDocRef, {
              email,
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || email.split('@')[0],
              role,
              blocked: false,
              createdAt: new Date().toISOString()
            }, { merge: true });
          }

          if (blocked) {
            await fbSignOut(auth);
            setUser(null);
            setLoginError("Your account has been deactivated. Please contact the administrator.");
            setAuthLoading(false);
            return;
          }

          setUser({
            uid: firebaseUser.uid,
            email,
            role,
            displayName: firebaseUser.displayName || email.split('@')[0],
            photoURL: firebaseUser.photoURL || undefined,
            blocked: false
          });
          setLoginError(null);
        } catch (err) {
          console.error("Error fetching user profile:", err);
          const isInitialAdmin = email.includes('admin') || 
                                 email === 'admin@neu.edu.ph' || 
                                 email === 'janice.marsep.17@gmail.com' || 
                                 email === 'mariaantonette.espinosa@neu.edu.ph' || 
                                 email === 'alyssabernadette.tuliao@neu.edu.ph' || 
                                 email === 'janice.hernandez@neu.edu.ph';
          setUser({
            uid: firebaseUser.uid,
            email,
            role: isInitialAdmin ? 'superadmin' : 'student',
            displayName: firebaseUser.displayName || email.split('@')[0],
            photoURL: firebaseUser.photoURL || undefined
          });
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google Sign In Handler
  const handleGoogleLogin = async () => {
    try {
      setLoginError(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Sign in failed:", err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setLoginError(err.message || "Failed to sign in. Please try again.");
      }
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setCart([]);
      localStorage.removeItem('neunifits_cart');
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // Realtime Inventory Listener
  const fetchInventory = useCallback(async () => {
    try {
      const q = collection(db, 'inventory');
      const querySnapshot = await getDocs(q);
      const newInv: Inventory = { college: {}, highschool: {}, accessories: {} };

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        const cat = (data.category || 'college') as keyof Inventory;
        if (newInv[cat]) {
          newInv[cat][data.name] = data;
        }
      });
      setInventory(newInv);
    } catch (err) {
      console.error("Error reading inventory:", err);
    }
  }, []);

  useEffect(() => {
    const q = collection(db, 'inventory');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newInv: Inventory = { college: {}, highschool: {}, accessories: {} };
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        const cat = (data.category || 'college') as keyof Inventory;
        if (newInv[cat]) {
          newInv[cat][data.name] = data;
        }
      });
      setInventory(newInv);
    }, (error) => {
      console.error("Inventory snapshot error:", error);
    });

    return () => unsubscribe();
  }, []);

  // Realtime Orders Listener
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    let q = query(collection(db, 'orders'));
    if (user.role === 'student') {
      q = query(collection(db, 'orders'), where('studentEmail', '==', user.email));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderList: Order[] = [];
      snapshot.forEach((docSnap) => {
        orderList.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      orderList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(orderList);
    }, (error) => {
      console.error("Orders snapshot error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Realtime Notifications Listener
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'), 
      where('userEmail', '==', user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        notifs.push({ id: docSnap.id, ...docSnap.data() } as AppNotification);
      });
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(notifs);
    }, (error) => {
      console.error("Notifications snapshot error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Realtime Users Listener (for Superadmin/Admin)
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      setManagedUsers([]);
      return;
    }

    const q = collection(db, 'users');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList: User[] = [];
      snapshot.forEach((docSnap) => {
        usersList.push({ email: docSnap.id, ...docSnap.data() } as User);
      });
      setManagedUsers(usersList);
    }, (error) => {
      console.error("Users snapshot error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Cart operations
  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        i => i.productName === item.productName && i.size === item.size && i.category === item.category
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
    showToast(`Added ${item.productName} (${item.size}) to cart`);
  }, [showToast]);

  const removeFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
    showToast("Item removed from cart");
  }, [showToast]);

  const updateCartQuantity = useCallback((index: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, idx) => idx !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem('neunifits_cart');
  }, []);

  // Student Checkout
  const handleStudentCheckout = async () => {
    if (!user || cart.length === 0) return;

    try {
      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newOrderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const orderData: Omit<Order, 'id'> = {
        studentEmail: user.email,
        studentName: user.displayName || user.email.split('@')[0],
        studentUid: user.uid || user.email,
        items: [...cart],
        totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'orders', newOrderId), orderData);

      // Create confirmation notification
      await setDoc(doc(collection(db, 'notifications')), {
        userEmail: user.email,
        title: "Order Placed Successfully",
        message: `Your uniform order #${newOrderId} totaling ₱${totalAmount.toLocaleString()} has been submitted. Our team will review and approve it shortly.`,
        createdAt: new Date().toISOString(),
        read: false
      });

      clearCart();
      setIsCartOpen(false);
      showSuccessModal(`Order #${newOrderId} placed successfully! You can track its status in the Orders section.`);
    } catch (err: any) {
      console.error("Order submission error:", err);
      showToast("Failed to place order. Please try again.", true);
    }
  };

  // Inventory actions
  const handleUpdateProduct = async (category: keyof Inventory, originalName: string, updatedProduct: Product) => {
    try {
      const oldDocId = `${category}_${originalName.replace(/\s+/g, '_').toLowerCase()}`;
      const newDocId = `${updatedProduct.category}_${updatedProduct.name.replace(/\s+/g, '_').toLowerCase()}`;

      if (oldDocId !== newDocId) {
        await deleteDoc(doc(db, 'inventory', oldDocId));
      }

      await setDoc(doc(db, 'inventory', newDocId), updatedProduct);
      setEditingProduct(null);
      showToast(`Product "${updatedProduct.name}" saved successfully`);
    } catch (err: any) {
      console.error("Error saving product:", err);
      showToast("Failed to save product", true);
    }
  };

  const handleDeleteProduct = async (category: keyof Inventory, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Product",
      message: `Are you sure you want to permanently delete "${name}" from ${category} inventory?`,
      onConfirm: async () => {
        try {
          const docId = `${category}_${name.replace(/\s+/g, '_').toLowerCase()}`;
          await deleteDoc(doc(db, 'inventory', docId));
          showToast(`Product "${name}" deleted`);
        } catch (err) {
          console.error("Error deleting product:", err);
          showToast("Failed to delete product", true);
        }
      }
    });
  };

  const handleUpdateImage = (category: keyof Inventory, name: string) => {
    const currentProduct = inventory[category][name];
    setPromptModal({
      isOpen: true,
      title: "Update Image URL",
      message: `Enter direct image URL for "${name}":`,
      defaultValue: currentProduct?.imageUrl || "",
      onConfirm: async (newUrl) => {
        if (!newUrl) return;
        try {
          const docId = `${category}_${name.replace(/\s+/g, '_').toLowerCase()}`;
          await setDoc(doc(db, 'inventory', docId), { imageUrl: newUrl }, { merge: true });
          showToast("Product image updated");
        } catch (err) {
          showToast("Failed to update image", true);
        }
      }
    });
  };

  // Excel / CSV upload with Overwrite and Append modes
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          showToast("The uploaded file contains no rows.", true);
          return;
        }

        if (csvMode === 'overwrite') {
          const snapshot = await getDocs(collection(db, 'inventory'));
          const deletes = snapshot.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deletes);
        }

        const consolidated: { [key: string]: Product } = {};

        data.forEach((row: any) => {
          const rawCat = (row.category || row.Category || 'college').toString().toLowerCase().trim();
          let cat: keyof Inventory = 'college';
          if (rawCat.includes('high') || rawCat.includes('hs') || rawCat.includes('school')) cat = 'highschool';
          else if (rawCat.includes('access') || rawCat.includes('patch') || rawCat.includes('pin') || rawCat.includes('tie')) cat = 'accessories';

          const name = (row.product_name || row.name || row.Name || row['Product Name'] || 'Uniform Item').toString().trim();
          const size = (row.size || row.Size || 'Standard').toString().trim();
          const qty = parseInt(row.stock_quantity || row.quantity || row.qty || row.Stock || 0) || 0;
          const price = parseFloat(row.price || row.Price || 0) || 0;
          const status = (row.status || row.Status || 'active').toString().toLowerCase();
          const imageUrl = (row.image || row.imageUrl || row.Image || '').toString().trim();

          const key = `${cat}_${name.replace(/\s+/g, '_').toLowerCase()}`;

          if (!consolidated[key]) {
            consolidated[key] = {
              name,
              category: cat,
              sizes: { [size]: qty },
              prices: { [size]: price },
              imageUrl: imageUrl || '',
              hidden: status === 'hidden'
            };
          } else {
            consolidated[key].sizes[size] = qty;
            consolidated[key].prices[size] = price;
            if (imageUrl && !consolidated[key].imageUrl) {
              consolidated[key].imageUrl = imageUrl;
            }
          }
        });

        const uploads = Object.entries(consolidated).map(([docId, prod]) => {
          return setDoc(doc(db, 'inventory', docId), prod, { merge: true });
        });

        await Promise.all(uploads);
        setIsInventoryControlsOpen(false);
        showSuccessModal(`Successfully imported ${Object.keys(consolidated).length} products in ${csvMode} mode!`);
      } catch (err: any) {
        console.error("Excel import error:", err);
        showToast(`Failed to parse file: ${err.message || 'Invalid format'}`, true);
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    e.target.value = '';
  };

  // Order status update
  const handleUpdateOrderStatus = async (order: Order, newStatus: Order['status'], pickupDate?: string) => {
    try {
      const updates: Partial<Order> = { status: newStatus };
      if (pickupDate) {
        updates.pickupDate = pickupDate;
      }

      await setDoc(doc(db, 'orders', order.id), updates, { merge: true });

      // Create In-App Notification for Student
      let notificationTitle = `Order ${newStatus.toUpperCase()}`;
      let notificationMessage = `Your order #${order.id} status has been updated to "${newStatus}".`;

      if (newStatus === 'approved') {
        notificationTitle = "🎉 Order Approved";
        notificationMessage = pickupDate 
          ? `Your uniform order #${order.id} has been approved! Estimated pickup schedule is set for ${new Date(pickupDate).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`
          : `Your uniform order #${order.id} has been approved. You will be notified once it is ready for collection.`;
      } else if (newStatus === 'ready') {
        notificationTitle = "📦 Ready for Pickup!";
        notificationMessage = `Great news! Your uniform order #${order.id} is prepared and ready for claiming at the NEU Uniform Center. Please present your student ID.`;
      } else if (newStatus === 'completed') {
        notificationTitle = "✅ Order Claimed & Completed";
        notificationMessage = `Order #${order.id} has been marked as claimed. Thank you for using NEUnifits!`;
      } else if (newStatus === 'cancelled') {
        notificationTitle = "❌ Order Cancelled";
        notificationMessage = `Order #${order.id} has been cancelled.`;
      }

      await setDoc(doc(collection(db, 'notifications')), {
        userEmail: order.studentEmail,
        title: notificationTitle,
        message: notificationMessage,
        createdAt: new Date().toISOString(),
        read: false
      });

      showToast(`Order #${order.id} marked as ${newStatus}`);
    } catch (err) {
      console.error("Error updating order:", err);
      showToast("Failed to update order status", true);
    }
  };

  // Admin user management
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;

    if (!email.endsWith('@neu.edu.ph') && !email.endsWith('.neu.edu.ph')) {
      showToast("All admin accounts must use an official @neu.edu.ph email address", true);
      return;
    }

    try {
      await setDoc(doc(db, 'users', email), {
        email,
        displayName: email.split('@')[0],
        role: newAdminRole,
        blocked: false,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setNewAdminEmail('');
      showSuccessModal(`Administrator account ${email} (${newAdminRole}) configured successfully.`);
    } catch (err: any) {
      console.error("Error adding admin:", err);
      showToast("Failed to create admin user", true);
    }
  };

  const handleBlockUser = async (email: string, currentlyBlocked?: boolean) => {
    try {
      await setDoc(doc(db, 'users', email), {
        blocked: !currentlyBlocked
      }, { merge: true });
      showToast(`User ${email} ${!currentlyBlocked ? 'blocked' : 'unblocked'}`);
    } catch (err) {
      showToast("Failed to update user status", true);
    }
  };

  const handleUpdateUserRole = async (email: string, newRole: 'student' | 'admin' | 'superadmin') => {
    try {
      await setDoc(doc(db, 'users', email), {
        role: newRole
      }, { merge: true });
      showToast(`User role updated to ${newRole}`);
    } catch (err) {
      showToast("Failed to update role", true);
    }
  };

  // Notification actions
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const handleMarkNotificationAsRead = async (id: string) => {
    try {
      await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
    } catch (err) {
      console.error("Error marking notification:", err);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const unreads = notifications.filter(n => !n.read);
      await Promise.all(unreads.map(n => setDoc(doc(db, 'notifications', n.id), { read: true }, { merge: true })));
      showToast("All notifications marked as read");
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      authLoading,
      loginError,
      handleGoogleLogin,
      handleSignOut,
      inventory,
      orders,
      notifications,
      managedUsers,
      cart,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      handleStudentCheckout,
      activeCategory,
      setActiveCategory,
      studentGenderFilter,
      setStudentGenderFilter,
      globalSelectedSize,
      setGlobalSelectedSize,
      editingProduct,
      setEditingProduct,
      csvMode,
      setCsvMode,
      isInventoryControlsOpen,
      setIsInventoryControlsOpen,
      fetchInventory,
      handleUpdateProduct,
      handleDeleteProduct,
      handleUpdateImage,
      handleExcelUpload,
      orderStatusFilter,
      setOrderStatusFilter,
      orderSearchQuery,
      setOrderSearchQuery,
      orderViewMode,
      setOrderViewMode,
      handleUpdateOrderStatus,
      adminUserViewMode,
      setAdminUserViewMode,
      newAdminEmail,
      setNewAdminEmail,
      newAdminRole,
      setNewAdminRole,
      handleAddAdmin,
      handleBlockUser,
      handleUpdateUserRole,
      unreadCount,
      selectedNotification,
      setSelectedNotification,
      handleMarkNotificationAsRead,
      handleClearAllNotifications,
      promptModal,
      setPromptModal,
      confirmModal,
      setConfirmModal,
      selectedInvoiceOrder,
      setSelectedInvoiceOrder,
      assignPickupOrder,
      setAssignPickupOrder,
      toastMessage,
      showToast,
      successMessage,
      showSuccessModal,
      closeSuccessModal
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
