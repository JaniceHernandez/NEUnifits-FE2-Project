import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  ShoppingCart, 
  LogOut, 
  UserCircle, 
  Mars, 
  Venus, 
  FileSpreadsheet, 
  RotateCcw, 
  Edit3, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Info,
  Shirt,
  Tag,
  TrendingUp,
  Settings,
  Shield,
  UserPlus,
  Trash2,
  Ban,
  Check,
  Search,
  Plus,
  University,
  GraduationCap,
  School,
  Watch,
  Mail,
  Eye,
  EyeOff,
  Bell,
  Calendar,
  Filter,
  MoreVertical,
  ChevronRight,
  Package,
  Truck,
  Clock,
  X,
  Menu,
  ChevronLeft,
  Download,
  Settings2,
  Minus,
  LayoutGrid,
  List,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList 
} from 'recharts';
import { 
  Inventory, 
  User, 
  DEFAULT_DATA, 
  ALLOWED_DOMAIN, 
  INITIAL_SUPERADMIN_EMAILS, 
  INITIAL_ADMIN_EMAILS,
  Product,
  NEU_LOGO_URL,
  ManagedUser,
  Order,
  CartItem,
  AppNotification
} from './types';
import { cn } from './lib/utils';
import { auth, db, googleProvider } from './firebase';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection, 
  onSnapshot,
  query,
  where,
  getDocsFromServer
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    const state = (this as any).state;
    const props = (this as any).props;
    if (state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(state.error.message);
        if (parsed.error) {
          errorMessage = `Firestore Permission Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path}`;
        }
      } catch (e) {
        errorMessage = state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return props.children;
  }
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [isIframeMobile, setIsIframeMobile] = useState(false);
  const [isTopLevelMobile, setIsTopLevelMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isIframe = window.self !== window.top;
      setIsIframeMobile(isMobile && isIframe);
      setIsTopLevelMobile(isMobile && !isIframe);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [inventory, setInventory] = useState<Inventory>(DEFAULT_DATA);
  const [activeTab, setActiveTab] = useState<'inventory' | 'dashboard' | 'orders' | 'settings'>('inventory');

  // Set initial tab based on role when user logs in
  useEffect(() => {
    if (user) {
      if (user.role === 'superadmin' || user.role === 'admin') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('inventory');
      }
    }
  }, [user]);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<keyof Inventory>('college');
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'superadmin'>('admin');
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'approved' | 'ready' | 'completed' | 'cancelled'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [studentGenderFilter, setStudentGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [csvMode, setCsvMode] = useState<'append' | 'overwrite'>('append');
  const [showNotifications, setShowNotifications] = useState(false);
  const [orderViewMode, setOrderViewMode] = useState<'table' | 'cards'>(() => typeof window !== 'undefined' ? (window.innerWidth < 1024 ? 'cards' : 'table') : 'table');
  const [adminUserViewMode, setAdminUserViewMode] = useState<'table' | 'cards'>(() => typeof window !== 'undefined' ? (window.innerWidth < 1024 ? 'cards' : 'table') : 'table');
  const [studentUserViewMode, setStudentUserViewMode] = useState<'table' | 'cards'>(() => typeof window !== 'undefined' ? (window.innerWidth < 1024 ? 'cards' : 'table') : 'table');
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  
  const userNotifications = React.useMemo(() => {
    if (!auth.currentUser) return [];
    return notifications.filter(n => n.userId === auth.currentUser?.uid);
  }, [notifications]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInventoryMenuOpen, setIsInventoryMenuOpen] = useState(false);

  // Automatically collapse sidebar and adapt viewmodes when screen size transitions
  useEffect(() => {
    setIsSidebarCollapsed(windowWidth < 1024);
    if (windowWidth < 1024) {
      setOrderViewMode('cards');
      setAdminUserViewMode('cards');
      setStudentUserViewMode('cards');
    }
  }, [windowWidth]);

  const studentFilteredProducts = React.useMemo(() => {
    const productsObj = (inventory[activeCategory] || {}) as Record<string, Product>;
    if (studentGenderFilter === 'all') return productsObj;
    
    const filtered: Record<string, Product> = {};
    Object.entries(productsObj).forEach(([id, product]) => {
      const nameLower = product.name.toLowerCase();
      const isFemaleItem = nameLower.includes('female');
      const isMaleItem = nameLower.includes('male') && !isFemaleItem;
      
      if (studentGenderFilter === 'female') {
        if (isFemaleItem || (!isMaleItem && !isFemaleItem)) {
          filtered[id] = product;
        }
      } else if (studentGenderFilter === 'male') {
        if (isMaleItem || (!isMaleItem && !isFemaleItem)) {
          filtered[id] = product;
        }
      }
    });
    return filtered;
  }, [inventory, activeCategory, studentGenderFilter]);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [editingProduct, setEditingProduct] = useState<{ category: keyof Inventory, name: string, product: Product } | null>(null);

  const handleUpdateProduct = async (category: keyof Inventory, oldName: string, updatedProduct: Product) => {
    try {
      const oldProductId = `${category}_${oldName.replace(/\s+/g, '_').toLowerCase()}`;
      const newProductId = `${updatedProduct.category}_${updatedProduct.name.replace(/\s+/g, '_').toLowerCase()}`;

      if (oldName !== 'New Product' && oldProductId !== newProductId) {
        // Name or category changed, need to delete old and create new
        await deleteDoc(doc(db, 'inventory', oldProductId));
      }

      await setDoc(doc(db, 'inventory', newProductId), {
        ...updatedProduct
      });

      showToast(`Successfully ${oldName === 'New Product' ? 'added' : 'updated'} ${updatedProduct.name}`);
      setEditingProduct(null);
    } catch (error) {
      showToast("Error saving product", true);
    }
  };

  // Calculate most purchased products
  const productPurchaseData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    // Only count orders that are not cancelled
    orders.filter(o => o.status !== 'cancelled').forEach(order => {
      order.items.forEach(item => {
        counts[item.productName] = (counts[item.productName] || 0) + item.quantity;
      });
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 products
  }, [orders]);

  // Calculate current stock levels by product
  const stockLevelData = React.useMemo(() => {
    const stockMap: Record<string, number> = {};
    
    Object.values(inventory).forEach((categoryProducts: Record<string, Product>) => {
      Object.values(categoryProducts).forEach((product: Product) => {
        const totalStock = Object.values(product.sizes).reduce((sum: number, s: number) => sum + s, 0);
        stockMap[product.name] = (stockMap[product.name] || 0) + totalStock;
      });
    });

    return Object.entries(stockMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 most stocked items
  }, [inventory]);

  // Calculate order counts by status
  const orderCounts = React.useMemo(() => {
    const counts = {
      all: 0,
      pending: 0,
      approved: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    orders.forEach(o => {
      if (user) {
        const isStudent = user.role === 'student';
        const matchesStudent = o.studentEmail.toLowerCase() === user.email.toLowerCase();
        if (!isStudent || matchesStudent) {
          counts.all++;
          const statusKey = o.status as keyof typeof counts;
          if (statusKey in counts) {
            counts[statusKey]++;
          }
        }
      }
    });
    return counts;
  }, [orders, user]);

  // Filtered orders
  const filteredOrders = React.useMemo(() => {
    if (!user) return [];
    const isStudent = user.role === 'student';
    let result = orders
      .filter(o => !isStudent || o.studentEmail.toLowerCase() === user.email.toLowerCase())
      .filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter);

    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      result = result.filter(o => {
        const matchesName = o.studentName.toLowerCase().includes(q);
        const matchesEmail = o.studentEmail.toLowerCase().includes(q);
        const matchesItems = o.items.some(item => 
          item.productName.toLowerCase().includes(q) || 
          item.size.toLowerCase().includes(q)
        );
        const matchesAmount = o.totalAmount.toString().includes(q);
        const matchesStatus = o.status.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesItems || matchesAmount || matchesStatus;
      });
    }
    return result;
  }, [orders, user, orderStatusFilter, orderSearchQuery]);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState<{ message: string } | null>(null);
  const [pickupModal, setPickupModal] = useState<{
    isOpen: boolean;
    order: Order;
  } | null>(null);
  
  // Auth Form State
  const [isLoading, setIsLoading] = useState(false);

  // Handle redirect result on mount (crucial for mobile browsers where popups are blocked)
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        setIsLoading(true);
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const email = result.user.email?.toLowerCase() || '';
          const isAllowedEmail = email.endsWith(ALLOWED_DOMAIN) || email === "janice.marsep.17@gmail.com" || INITIAL_SUPERADMIN_EMAILS.includes(email);
          if (!isAllowedEmail) {
            setLoginError(`Access Denied! Only ${ALLOWED_DOMAIN} emails are allowed.`);
            await signOut(auth);
          } else {
            showToast("Successfully logged in!");
          }
        }
      } catch (error: any) {
        console.error("Redirect auth lookup error:", error);
        setLoginError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    checkRedirect();
  }, []);

  // Auth State Listener
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocsFromServer(query(collection(db, 'inventory'), where('category', '==', 'college')));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const email = firebaseUser.email?.toLowerCase() || '';
          const isAllowedEmail = email.endsWith(ALLOWED_DOMAIN) || email === "janice.marsep.17@gmail.com" || INITIAL_SUPERADMIN_EMAILS.includes(email);
          if (!isAllowedEmail) {
            setLoginError(`Access Denied! Only ${ALLOWED_DOMAIN} emails are allowed.`);
            await signOut(auth);
            setUser(null);
            return;
          }
          // Check managed_users first for roles/blocks
          const managedDoc = await getDoc(doc(db, 'managed_users', email));
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          let role: User['role'] = 'student';
          let blocked = false;

          if (managedDoc.exists()) {
            role = managedDoc.data().role;
            blocked = managedDoc.data().blocked;
          } else if (userDoc.exists()) {
            role = userDoc.data().role;
            blocked = userDoc.data().blocked;
          } else {
            // New user or first time login - default to student role by default
            const email = firebaseUser.email?.toLowerCase() || '';
            if (INITIAL_SUPERADMIN_EMAILS.includes(email)) {
              role = 'superadmin';
            } else if (INITIAL_ADMIN_EMAILS.includes(email)) {
              role = 'admin';
            } else {
              role = 'student';
            }
          }

          if (blocked) {
            setLoginError("Your account has been blocked. Please contact a super admin.");
            signOut(auth);
            return;
          }

          // Sync to users collection
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            email: firebaseUser.email?.toLowerCase() || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            role: role,
            blocked: false,
            picture: firebaseUser.photoURL || ''
          }, { merge: true });

          setUser({
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            picture: firebaseUser.photoURL || '',
            role: role
          });
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            handleFirestoreError(error, OperationType.GET, 'users/managed_users');
          } else {
            console.error("Auth State Firestore Error:", error);
          }
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load inventory from Firestore
  useEffect(() => {
    if (!user) {
      setInventory({ college: {}, highschool: {}, accessories: {} });
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const newInventory: Inventory = { college: {}, highschool: {}, accessories: {} };
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const category = data.category as keyof Inventory;
        if (newInventory[category]) {
          newInventory[category][data.name] = {
            name: data.name,
            category: data.category,
            sizes: data.sizes,
            prices: data.prices,
            imageUrl: data.imageUrl,
            hidden: data.hidden
          };
        }
      });
      setInventory(newInventory);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'inventory');
    });
    return () => unsubscribe();
  }, [user]);
  
  // Load notifications
  useEffect(() => {
    if (!user || !auth.currentUser?.uid) {
      setNotifications([]);
      return;
    }

    const currentUid = auth.currentUser.uid;
    const q = query(collection(db, 'notifications'), where('userId', '==', currentUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AppNotification)).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setNotifications(notifs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });
    return () => unsubscribe();
  }, [user, auth.currentUser?.uid]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    onConfirm: (value: string) => void;
  } | null>(null);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.endsWith(ALLOWED_DOMAIN)) {
      showToast(`Only ${ALLOWED_DOMAIN} emails are allowed.`, true);
      return;
    }
    
    try {
      // Use a dedicated 'managed_users' collection for pre-assigned roles.
      await setDoc(doc(db, 'managed_users', newAdminEmail.toLowerCase()), {
        email: newAdminEmail.toLowerCase(),
        role: newAdminRole,
        blocked: false,
        addedAt: new Date().toISOString()
      });
      
      setNewAdminEmail('');
      showToast(`Added ${newAdminEmail} as ${newAdminRole}`);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.WRITE, 'managed_users');
      } else {
        showToast(error.message, true);
      }
    }
  };

  const handleBlockUser = async (email: string, currentBlocked: boolean) => {
    if (email === user?.email) {
      showToast("You cannot block yourself", true);
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: currentBlocked ? "Unblock User" : "Block User",
      message: `Are you sure you want to ${currentBlocked ? 'unblock' : 'block'} ${email}?`,
      onConfirm: async () => {
        try {
          await setDoc(doc(db, 'managed_users', email), { blocked: !currentBlocked }, { merge: true });
          showToast(`${currentBlocked ? 'Unblocked' : 'Blocked'} ${email}`);
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            handleFirestoreError(error, OperationType.WRITE, `managed_users/${email}`);
          } else {
            showToast(error.message, true);
          }
        }
        setConfirmModal(null);
      }
    });
  };

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.productName === item.productName && i.size === item.size);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, item];
    });
    setSuccessOverlay({ message: "Item has been added to your shopping cart" });
  };

  const [globalSelectedSize, setGlobalSelectedSize] = useState<{productName: string, size: string} | null>(null);
  const [isInventoryControlsOpen, setIsInventoryControlsOpen] = useState(false);

  const updateCartQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      if (item) {
        const newQty = item.quantity + delta;
        if (newQty > 0) {
          newCart[index] = { ...item, quantity: newQty };
        } else {
          return prev.filter((_, i) => i !== index);
        }
      }
      return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  const fetchInventory = async () => {
    try {
      // Since we use onSnapshot, this force fetch will update the UI via the snapshot listener
      // or at least confirm the server state.
      await getDocsFromServer(collection(db, 'inventory'));
      showToast("Catalog synchronized");
    } catch (error: any) {
      showToast("Refresh failed: " + error.message, true);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || cart.length === 0) return;
    
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
      await setDoc(doc(collection(db, 'orders')), {
        studentEmail: user.email.toLowerCase(),
        studentName: user.name,
        studentUid: auth.currentUser?.uid,
        items: cart,
        totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      clearCart();
      setIsCartOpen(false);
      setSuccessOverlay({ message: "Order has been placed successfully!" });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.WRITE, 'orders');
      } else {
        showToast(error.message, true);
      }
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (email === user?.email) {
      showToast("You cannot delete yourself", true);
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: "Delete User Account",
      message: `Are you sure you want to permanently delete ${email}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          // Delete from managed_users
          await deleteDoc(doc(db, 'managed_users', email));
          
          // Also try to find and delete from users collection if possible
          // Note: users collection uses UID as key, so we'd need to query by email
          const userQuery = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
          const userSnap = await getDocsFromServer(userQuery);
          
          const deletePromises = userSnap.docs.map(d => deleteDoc(doc(db, 'users', d.id)));
          await Promise.all(deletePromises);

          showToast(`Successfully deleted ${email}`);
        } catch (error: any) {
          if (error.code === 'permission-denied') {
            handleFirestoreError(error, OperationType.DELETE, `users/${email}`);
          } else {
            showToast(error.message, true);
          }
        }
        setConfirmModal(null);
      }
    });
  };

  // Load managed users from Firestore
  useEffect(() => {
    if (!user || user.role !== 'superadmin') {
      setManagedUsers([]);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'managed_users'), (snapshot) => {
      const users: ManagedUser[] = snapshot.docs.map(doc => ({
        email: doc.data().email,
        role: doc.data().role,
        blocked: doc.data().blocked || false,
        addedAt: doc.data().addedAt || new Date().toISOString()
      }));
      setManagedUsers(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'managed_users');
    });
    return () => unsubscribe();
  }, [user]);

  // Load all registered users from Firestore
  useEffect(() => {
    if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) {
      setAllUsers([]);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users: User[] = snapshot.docs.map(doc => ({
        name: doc.data().name || 'Unknown',
        email: doc.data().email || '',
        picture: doc.data().picture || '',
        role: doc.data().role || 'student',
        blocked: doc.data().blocked || false
      }));
      setAllUsers(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return () => unsubscribe();
  }, [user]);

  // Load orders from Firestore
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    let q = query(collection(db, 'orders'));
    if (user.role === 'student') {
      q = query(collection(db, 'orders'), where('studentEmail', '==', user.email.toLowerCase()));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(ordersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });
    return () => unsubscribe();
  }, [user]);

  const showToast = (message: string, isError: boolean = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const handleGoogleAuth = async () => {
    setLoginError(null);
    setIsLoading(true);
    try {
      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isIframe = typeof window !== 'undefined' && window.self !== window.top;
      
      if (isMobile && !isIframe) {
        // Use redirect on mobile for seamless experience (popup blockers bypass)
        await signInWithRedirect(auth, googleProvider);
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        const email = result.user.email?.toLowerCase() || '';
        const isAllowedEmail = email.endsWith(ALLOWED_DOMAIN) || email === "janice.marsep.17@gmail.com" || INITIAL_SUPERADMIN_EMAILS.includes(email);
        if (!isAllowedEmail) {
          await signOut(auth);
          throw new Error(`Access Denied! Only ${ALLOWED_DOMAIN} emails are allowed.`);
        }
        showToast("Logged in with Google!");
      }
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        setLoginError("Sign-in provider is not enabled in your Firebase Console. Please go to Authentication > Sign-in method and enable the provider.");
      } else {
        setLoginError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrderPickupDate = async (order: Order, newDate: string) => {
    try {
      await setDoc(doc(db, 'orders', order.id), { 
        pickupDate: newDate,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      const studentUid = order.studentUid;
      if (studentUid) {
        const dateObj = new Date(newDate);
        const formattedDate = isNaN(dateObj.getTime()) ? newDate : dateObj.toLocaleDateString();
        
        await setDoc(doc(collection(db, 'notifications')), {
          userId: studentUid,
          title: "Pickup Date Updated",
          message: `The pickup date for your order #${order.id.slice(-6)} has been updated to ${formattedDate}.`,
          read: false,
          type: 'order_update',
          createdAt: new Date().toISOString()
        });
      }
      
      showToast("Pickup date updated successfully");
    } catch (error) {
      console.error("Error updating pickup date:", error);
      showToast("Failed to update pickup date", true);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('inventory');
    showToast("Logged out successfully");
  };

  const handleUpdateOrderStatus = async (order: Order, newStatus: Order['status'], pickupDate?: string) => {
    console.log('Updating order status:', { orderId: order.id, newStatus, pickupDate });
    try {
      const updateData: any = { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      
      // If reverting to pending, clear the pickup date
      if (newStatus === 'pending') {
        updateData.pickupDate = null;
      } else if (pickupDate) {
        updateData.pickupDate = pickupDate;
      }

      await setDoc(doc(db, 'orders', order.id), updateData, { merge: true });
      
      // Send notification to student
      const studentUid = order.studentUid;
      if (studentUid) {
        let title = "Order Update";
        let message = `Your order #${order.id.slice(-6)} status has been updated to ${newStatus}.`;
        
        if (newStatus === 'approved') {
          title = "Order Approved";
          message = `Your order #${order.id.slice(-6)} has been approved.`;
          if (pickupDate) {
            const dateObj = new Date(pickupDate);
            const formattedDate = isNaN(dateObj.getTime()) ? pickupDate : dateObj.toLocaleDateString();
            message += ` Pickup date: ${formattedDate}.`;
          }
        } else if (newStatus === 'ready') {
          title = "Order Ready for Pickup";
          message = `Your order #${order.id.slice(-6)} is now ready for pickup!`;
        } else if (newStatus === 'completed') {
          title = "Order Completed";
          message = `Your order #${order.id.slice(-6)} has been marked as completed. Thank you!`;
        }

        await setDoc(doc(collection(db, 'notifications')), {
          userId: studentUid,
          title,
          message,
          read: false,
          type: 'order_update',
          createdAt: new Date().toISOString()
        });
      }
      
      showToast(`Order status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.WRITE, `orders/${order.id}`);
      } else {
        showToast(error.message, true);
      }
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      if (data.length === 0) {
        showToast("Excel file is empty", true);
        return;
      }

      if (csvMode === 'overwrite') {
        const snapshot = await getDocsFromServer(collection(db, 'inventory'));
        for (const docRef of snapshot.docs) {
          await deleteDoc(doc(db, 'inventory', docRef.id));
        }
        // Clear local state immediately to avoid race conditions
        setInventory({ college: {}, highschool: {}, accessories: {} });
      }

      let updatedCount = 0;
      for (const row of data) {
        // Flexible column matching based on user requested structure
        const getVal = (keys: string[]) => {
          for (const key of keys) {
            const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
            if (foundKey) return row[foundKey];
          }
          return "";
        };

        let productName = getVal(['product_name', 'product', 'item']).toString().trim();
        let categoryRaw = getVal(['category', 'cat']).toString().toLowerCase().trim();
        let size = getVal(['size']).toString().trim();
        
        let qtyRaw = getVal(['stock_quantity', 'quantity', 'qty', 'stock']);
        let qty = parseInt(qtyRaw);
        if (isNaN(qty)) qty = 0;

        let priceRaw = getVal(['price', 'cost']);
        let price = parseFloat(priceRaw);
        if (isNaN(price)) price = 0;

        let status = getVal(['status']).toString().toLowerCase().trim();
        let imageUrlFromExcel = getVal(['image', 'url', 'image_url', 'photo']).toString().trim();

        if (!productName || !categoryRaw || !size) continue;

        let categoryKey: keyof Inventory | null = null;
        if (categoryRaw.includes('college')) categoryKey = 'college';
        else if (categoryRaw.includes('high') || categoryRaw.includes('school') || categoryRaw.includes('hs')) categoryKey = 'highschool';
        else if (categoryRaw.includes('accessories') || categoryRaw.includes('acc') || categoryRaw.includes('unifrom')) categoryKey = 'accessories';

        if (categoryKey) {
          const productId = `${categoryKey}_${productName.replace(/\s+/g, '_').toLowerCase()}`;
          const productDoc = await getDoc(doc(db, 'inventory', productId));
          
          let currentData = productDoc.exists() ? productDoc.data() : {
            name: productName,
            category: categoryKey,
            sizes: {},
            prices: {},
            imageUrl: "",
            hidden: false
          };

          const updatedSizes = { ...(currentData.sizes as any), [size]: qty };
          const updatedPrices = { ...(currentData.prices as any) };
          if (!isNaN(price) && price > 0) {
            updatedPrices[size] = price;
          }
          
          // Update image only if provided and valid
          let finalImageUrl = currentData.imageUrl;
          if (imageUrlFromExcel && (imageUrlFromExcel.startsWith('http') || imageUrlFromExcel.includes('//'))) {
            finalImageUrl = imageUrlFromExcel;
          }

          // Handle status
          const isHidden = status === 'hidden' || status === 'inactive';
          
          await setDoc(doc(db, 'inventory', productId), {
            ...currentData,
            sizes: updatedSizes,
            prices: updatedPrices,
            imageUrl: finalImageUrl,
            hidden: isHidden
          }, { merge: true });
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        showToast(`Successfully updated ${updatedCount} items!`);
      } else {
        showToast("No matching products found in Excel", true);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleReset = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Reset Inventory",
      message: "This will DELETE all current products and reset to default values. Continue?",
      onConfirm: async () => {
        try {
          // Clear existing inventory first to remove duplicates
          const snapshot = await getDocsFromServer(collection(db, 'inventory'));
          for (const docRef of snapshot.docs) {
            await deleteDoc(doc(db, 'inventory', docRef.id));
          }

          for (const [category, products] of Object.entries(DEFAULT_DATA)) {
            for (const [name, info] of Object.entries(products)) {
              const productId = `${category}_${name.replace(/\s+/g, '_').toLowerCase()}`;
              await setDoc(doc(db, 'inventory', productId), {
                name,
                category,
                ...(info as any)
              });
            }
          }
          showToast("Inventory cleared and reset to default");
        } catch (error) {
          showToast("Error resetting inventory", true);
        }
        setConfirmModal(null);
      }
    });
  };

  const handleUpdateImage = async (category: keyof Inventory, productName: string) => {
    const productId = `${category}_${productName.replace(/\s+/g, '_').toLowerCase()}`;
    const productDoc = await getDoc(doc(db, 'inventory', productId));
    
    if (productDoc.exists()) {
      const currentUrl = productDoc.data().imageUrl || "";
      
      setPromptModal({
        isOpen: true,
        title: "Update Image URL",
        message: `Enter new image URL for "${productName}":\n(Make sure it starts with http:// or https://)`,
        defaultValue: currentUrl,
        onConfirm: async (newUrl: string) => {
          const trimmedUrl = newUrl.trim();
          // Basic URL validation
          if (trimmedUrl !== "" && !trimmedUrl.startsWith('http')) {
            showToast("Invalid URL. It must start with http:// or https://", true);
            return;
          }

          try {
            await setDoc(doc(db, 'inventory', productId), {
              imageUrl: trimmedUrl || `https://picsum.photos/seed/${productName.replace(/\s+/g, '_')}/400/300`
            }, { merge: true });
            showToast(`Updated image for ${productName}`);
          } catch (error) {
            showToast("Error updating image", true);
          }
          setPromptModal(null);
        }
      });
    }
  };

  const handleDeleteAllInventory = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Clear All Inventory",
      message: "Are you sure you want to DELETE ALL products from the inventory? This action cannot be undone.",
      onConfirm: async () => {
        try {
          const snapshot = await getDocsFromServer(collection(db, 'inventory'));
          for (const docRef of snapshot.docs) {
            await deleteDoc(doc(db, 'inventory', docRef.id));
          }
          showToast("All inventory items deleted");
        } catch (error) {
          showToast("Error deleting inventory", true);
        }
        setConfirmModal(null);
      }
    });
  };

  const handleCleanDuplicates = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Merge Duplicates",
      message: "This will attempt to merge duplicate products (e.g. 'Pants' into 'Male Pants') within the same category. Continue?",
      onConfirm: async () => {
        try {
          const snapshot = await getDocsFromServer(collection(db, 'inventory'));
          const products = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          let mergedCount = 0;

          for (const p of products) {
            const name = p.name.toLowerCase().trim();
            const category = p.category;
            
            let targetName = "";
            if (name === 'pants') targetName = "Male Pants";
            else if (name === 'skirt') targetName = "Female Skirt";
            else if (name === 'blouse') targetName = "Female Blouse";
            else if (name === 'vest') targetName = "Male Vest";
            else if (name === 'polo' || name === 'polo shirt') targetName = "Male Polo";
            
            if (targetName) {
              const targetId = `${category}_${targetName.replace(/\s+/g, '_').toLowerCase()}`;
              const targetDoc = products.find(prod => prod.id === targetId);
              
              if (targetDoc && p.id !== targetId) {
                const mergedSizes = { ...targetDoc.sizes };
                Object.entries(p.sizes).forEach(([size, qty]) => {
                  mergedSizes[size] = (mergedSizes[size] || 0) + (qty as number);
                });
                
                const mergedPrices = { ...targetDoc.prices, ...p.prices };
                
                await setDoc(doc(db, 'inventory', targetId), {
                  sizes: mergedSizes,
                  prices: mergedPrices
                }, { merge: true });
                
                await deleteDoc(doc(db, 'inventory', p.id));
                mergedCount++;
              }
            }
          }
          showToast(`Merged ${mergedCount} duplicate entries`);
        } catch (error) {
          showToast("Error merging duplicates", true);
        }
        setConfirmModal(null);
      }
    });
  };

  const handleDeleteProduct = async (category: keyof Inventory, productName: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Product",
      message: `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      onConfirm: async () => {
        const productId = `${category}_${productName.replace(/\s+/g, '_').toLowerCase()}`;
        try {
          await deleteDoc(doc(db, 'inventory', productId));
          showToast(`Deleted ${productName}`);
        } catch (error) {
          showToast("Error deleting product", true);
        }
        setConfirmModal(null);
      }
    });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen bg-slate-50 font-sans">
        {/* Left Side: Landing / Info Section */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 bg-gradient-to-br from-brand-blue via-brand-blue to-brand-blue-dark text-slate-100 flex-col justify-between p-12 xl:p-16 relative overflow-hidden border-r border-brand-blue-dark/50">
          {/* Ambient decorative background patterns */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-orange/15 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none animate-pulse duration-10000" />
          <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-brand-orange/5 rounded-full blur-[120px] -ml-40 -mb-40 pointer-events-none" />
          
          {/* Header Branding */}
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center p-2 shrink-0 border border-brand-orange/40 shadow-md ring-2 ring-brand-orange/20 animate-fade-in">
              <img src={NEU_LOGO_URL} alt="NEU Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xl font-black tracking-widest text-white block font-display leading-none">NEUnifits</span>
              <span className="text-[9px] text-brand-orange font-bold uppercase tracking-[0.16em] block mt-1">New Era University</span>
            </div>
          </div>

          {/* Core Info Body */}
          <div className="my-auto max-w-lg space-y-8 relative z-10 my-12">
            <div className="space-y-4">
              <h2 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight font-display">
                Convenient for Students, <span className="text-brand-orange">Efficient for Staff</span>.
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed font-medium">
                Connect your official student or administrator account to easily order, customize sizes, track distribution, and manage inventory operations under one central framework.
              </p>
            </div>

            {/* Feature lists */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-4 p-5 rounded-2xl hover:bg-white/[0.04] transition-all duration-300 group border border-transparent hover:border-white/5">
                <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl group-hover:bg-brand-orange/20 transition-colors">
                  <Shirt size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Easy Uniform Catalog</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    Browse complete uniform lines across all departments with sizing specifications, high-res previews, and instant stock levels.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl hover:bg-white/[0.04] transition-all duration-300 group border border-transparent hover:border-white/5">
                <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl group-hover:bg-brand-orange/20 transition-colors">
                  <Calendar size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Scheduled Claim Dates</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    No more waiting in long queues. Receive scheduled designated pick-up dates configured immediately after status approval.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl hover:bg-white/[0.04] transition-all duration-300 group border border-transparent hover:border-white/5">
                <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl group-hover:bg-brand-orange/20 transition-colors">
                  <Bell size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">In-App Live Order Tracking</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    Track the lifecycle of your uniform orders status in real-time. Receive notifications as soon as uniforms are ready for collection.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer of left side */}
          <div className="text-xs text-slate-400 relative z-10 flex items-center justify-between border-t border-white/[0.08] pt-6">
            <span className="font-medium">&copy; 2026 New Era University</span>
            <div className="flex items-center gap-1.5">
              <Shield size={12} className="text-brand-orange" />
              <span className="text-[10px] uppercase font-black tracking-wider text-brand-orange">Authenticated Access</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Panel */}
        <div className="w-full lg:w-1/2 xl:w-5/12 bg-white flex flex-col justify-between p-8 sm:p-12 md:p-16 relative">
          {/* Subtle background design */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-brand-orange/5 rounded-full blur-3xl opacity-60 pointer-events-none" />
          
          {/* Small screen branding header (Only visible when Left side is hidden on md/sm screens) */}
          <div className="flex lg:hidden items-center justify-between mb-8 pb-4 border-b border-slate-100 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center p-1.5 border border-brand-orange/30 shadow-xs ring-2 ring-brand-orange/10">
                <img src={NEU_LOGO_URL} alt="NEU Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-base font-black text-brand-blue tracking-tight block font-display leading-none">NEUnifits</span>
                <span className="text-[8px] text-brand-orange font-bold uppercase tracking-[0.1em] block mt-1">New Era University</span>
              </div>
            </div>
            <div className="text-[9px] font-black tracking-widest text-white bg-brand-blue px-2.5 py-1 rounded-lg uppercase">
              Uniform system
            </div>
          </div>

          <div className="my-auto max-w-sm w-full mx-auto space-y-8 animate-fade-in">
            {/* Header Area */}
            <div className="space-y-3">
              {/* Desktop Only visual icon */}
              <div className="hidden lg:flex w-16 h-16 bg-slate-50 rounded-2xl items-center justify-center mb-6 border border-brand-orange/20 p-2.5 shadow-sm ring-4 ring-brand-orange/5">
                <img src={NEU_LOGO_URL} alt="NEU Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-3xl font-black text-brand-blue tracking-tight font-display">System Sign In</h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Log in securely using your official university credentials or authorized manager account.
              </p>
            </div>

            {/* Google Sign-in Section */}
            <div className="space-y-4">
              {isIframeMobile ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs font-semibold space-y-3 shadow-xs font-sans">
                  <div className="flex items-start gap-2.5">
                    <Smartphone size={18} className="text-amber-600 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <span className="font-black text-[10px] block uppercase tracking-wide text-amber-700">Mobile Iframe Detected</span>
                      <p className="leading-relaxed font-semibold mt-0.5 text-amber-800">
                        Google Sign-In is restricted inside native embeds / code iframes on mobile devices. Please open the system in a clean browser window to sign in successfully.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="w-full bg-brand-orange text-brand-blue font-black py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-orange/90 transition-all text-xs uppercase tracking-wider cursor-pointer shadow-sm"
                  >
                    <ExternalLink size={14} /> Open in New Tab
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                    className="w-full bg-brand-blue text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-brand-blue-light hover:shadow-lg hover:shadow-brand-blue/10 focus:ring-4 focus:ring-brand-blue/10 transition-all duration-300 disabled:opacity-50 shadow-md shadow-brand-blue/10 active:scale-[0.98] cursor-pointer"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 bg-white p-0.5 rounded-full shrink-0" alt="Google" />
                    <span className="text-xs uppercase tracking-wider font-extrabold text-white font-sans">
                      {isTopLevelMobile ? "Sign in via Redirect" : "Sign in with Google"}
                    </span>
                  </button>

                  <div className="pt-2 text-center text-[11px] text-slate-400">
                    <p>
                      Please use your official university account (<span className="font-extrabold text-slate-600">@neu.edu.ph</span>) to authenticate.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Login Errors */}
            {loginError && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-xs font-semibold flex items-start gap-3 shadow-sm"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block uppercase tracking-wide text-[10px]">Access Denied</span>
                  <span className="leading-relaxed font-medium">{loginError}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Area on right */}
          <div className="text-center pt-8 border-t border-slate-100 lg:hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              New Era University &copy; 2026
            </p>
          </div>
          <div className="hidden lg:flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 pt-8 border-t border-slate-100">
            <span>Security Compliant</span>
            <span>Version 2.4.0</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 w-full max-w-full">
      {/* Mobile Sidebar Backdrop Overlay */}
      {!isSidebarCollapsed && (
        <div 
          onClick={() => setIsSidebarCollapsed(true)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden transition-opacity cursor-pointer animate-fade-in"
          id="mobile-sidebar-backdrop"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-brand-blue text-white flex flex-col fixed inset-y-0 left-0 lg:sticky lg:top-0 h-screen overflow-y-auto transition-all duration-300 z-50 shrink-0 border-r border-brand-blue-dark/50 shadow-2xl shadow-brand-blue/20",
        isSidebarCollapsed 
          ? "-translate-x-full lg:translate-x-0 lg:w-[72px]" 
          : "translate-x-0 w-[240px]"
      )}>
        <div className={cn("flex items-center justify-between p-6 mb-4 border-b border-white/[0.06]", isSidebarCollapsed && "justify-center")}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center p-1.5 shrink-0 shadow-md ring-2 ring-brand-orange">
              <img src={NEU_LOGO_URL} alt="NEU Logo" className="w-full h-full object-contain" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-sm font-black tracking-widest text-white font-display leading-none font-sans">NEUnifits</h1>
                <span className="text-[8px] text-brand-orange font-bold uppercase tracking-[0.14em] block mt-1 whitespace-nowrap p-0">Uniform System</span>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (
            <button 
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1 px-1.5 text-slate-300 hover:text-white rounded border border-white/10 lg:hidden hover:bg-white/5 cursor-pointer flex items-center justify-center"
              title="Close Menu"
              id="close-sidebar-mobile-btn"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {user.role !== 'student' && (
            <SidebarNavItem 
              icon={<LayoutDashboard size={18} />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              isCollapsed={isSidebarCollapsed}
            />
          )}
          <SidebarNavItem 
            icon={<Boxes size={18} />} 
            label={user.role === 'student' ? "Shop" : "Inventory"} 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')}
            isCollapsed={isSidebarCollapsed}
          />
          <SidebarNavItem 
            icon={<ShoppingCart size={18} />} 
            label="Orders" 
            active={activeTab === 'orders'} 
            onClick={() => setActiveTab('orders')}
            isCollapsed={isSidebarCollapsed}
          />
          {(user.role === 'superadmin' || user.role === 'admin') && (
            <SidebarNavItem 
              icon={<Settings size={18} />} 
              label="Settings" 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')}
              isCollapsed={isSidebarCollapsed}
            />
          )}
        </nav>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-40 sticky top-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 px-1.5 text-slate-500 rounded hover:bg-slate-100 border border-slate-200 transition-all flex items-center justify-center cursor-pointer shadow-sm bg-white"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              id="sidebar-toggle-button"
            >
              {isSidebarCollapsed ? <Menu size={15} /> : <ChevronLeft size={15} />}
            </button>
            <h2 className="text-sm font-bold text-slate-800">
              {activeTab === 'inventory' ? (user.role === 'student' ? 'Uniform Shop' : 'Inventory') : activeTab === 'dashboard' ? 'Analytics' : activeTab === 'orders' ? 'Orders' : 'Settings'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pr-4 border-r border-slate-100 hidden sm:flex">
              <div className="text-right">
                <div className="font-bold text-[11px] text-slate-800 leading-none">{user.name}</div>
                <div className="text-[8px] text-slate-400 uppercase tracking-widest font-black mt-0.5">
                  {user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Administrator' : 'Student'}
                </div>
              </div>
              <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                {user.picture ? (
                  <img src={user.picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={14} className="text-slate-400 m-auto mt-1.5" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {user.role === 'student' && (
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={cn(
                      "p-2 text-slate-500 rounded hover:bg-slate-50 transition-all relative",
                      showNotifications && "bg-slate-100"
                    )}
                  >
                    <Bell size={16} />
                    {userNotifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black border border-white">
                        {userNotifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded shadow-2xl border border-slate-200 z-[100] overflow-hidden"
                      >
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                          <h3 className="font-bold text-[10px] text-slate-900 uppercase tracking-widest">Notifications</h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                          {userNotifications.length === 0 ? (
                            <div className="p-10 text-center text-slate-400">
                              <p className="text-[10px] font-bold uppercase tracking-widest">No notifications</p>
                            </div>
                          ) : (
                            userNotifications.map(notif => (
                              <div 
                                key={notif.id} 
                                className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/50' : ''}`}
                                onClick={async () => {
                                  setShowNotifications(false);
                                  setSelectedNotification({ ...notif, read: true });
                                  if (!notif.read) {
                                    await setDoc(doc(db, 'notifications', notif.id), { read: true }, { merge: true });
                                  }
                                }}
                              >
                                <div className="flex gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-bold text-slate-900 truncate">{notif.title}</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{notif.message}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 rounded transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">

        {/* Category Navigation for Inventory (Students Only) */}
        {activeTab === 'inventory' && user.role === 'student' && (
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
              {(['college', 'highschool', 'accessories'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 lg:px-6 py-2.5 lg:py-3.5 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-2 lg:gap-3 cursor-pointer flex-1 sm:flex-none",
                    activeCategory === cat
                      ? "bg-brand-blue text-white border-brand-blue shadow-md scale-[1.01]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-brand-orange/30 hover:bg-slate-50/50"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 lg:w-6 lg:h-6 rounded flex items-center justify-center transition-colors shrink-0",
                    activeCategory === cat ? "bg-brand-orange text-brand-blue font-black" : "bg-slate-100 text-slate-400"
                  )}>
                    {cat === 'college' ? <GraduationCap size={13} /> : cat === 'highschool' ? <School size={13} /> : <Watch size={13} />}
                  </div>
                  <span>{cat === 'highschool' ? 'High School' : cat === 'college' ? 'College' : 'Accessories'}</span>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-white border border-slate-200 text-brand-blue px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-3 hover:bg-slate-50 hover:border-brand-orange/40 transition-all shadow-sm group cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart size={16} className="text-slate-500 group-hover:text-brand-orange transition-colors" />
                {cart.length > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 w-4.5 h-4.5 bg-brand-orange text-brand-blue text-[9px] flex items-center justify-center rounded-full font-black shadow-xs ring-2 ring-white">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </div>
              Cart Checkout
            </button>
          </div>
        )}

        {/* Student Welcome Banner */}
        {user.role === 'student' && activeTab === 'inventory' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-brand-blue via-brand-blue-light to-brand-blue border border-brand-orange/30 rounded-3xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden shadow-xl shadow-brand-blue/15"
          >
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
                🎯 NEW ERA UNIVERSITY • EXCLUSIVE WEB STORE
              </span>
              <h3 className="text-2xl sm:text-3xl font-black mb-3 text-white tracking-tight font-display">Welcome to <span className="text-brand-orange">NEUnifits Portal</span></h3>
              <p className="text-slate-200 text-sm max-w-md font-medium leading-relaxed">Check the real-time availability of official uniforms and accessories. Select your sizes, add items to your cart, and secure your order directly.</p>
            </div>
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-orange/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-orange/5 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />
            <University className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-brand-orange/[0.08]" />
          </motion.div>
        )}

        {/* Admin Tools */}
        {(user.role === 'superadmin' || user.role === 'admin') && activeTab === 'inventory' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-5 mb-8 border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm">
                <Boxes size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 leading-tight">Inventory Management</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Control panel & configuration</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none relative">
                 <button 
                  onClick={() => setIsInventoryControlsOpen(!isInventoryControlsOpen)}
                  className={cn(
                    "w-full lg:w-auto px-5 py-2.5 rounded-lg border transition-all font-bold text-xs flex items-center justify-center gap-2 shadow-sm",
                    isInventoryControlsOpen 
                      ? "bg-slate-900 text-white border-slate-900" 
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                  )}
                >
                  <Settings2 size={16} />
                  <span>Inventory Controls</span>
                  <ChevronRight size={14} className={cn("transition-transform", isInventoryControlsOpen ? "rotate-90" : "")} />
                </button>
                
                <AnimatePresence>
                  {isInventoryControlsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-2xl border border-slate-200 py-3 z-[100] overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-slate-100 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Excel Operations</span>
                      </div>
                      
                      <div className="px-4 py-2 space-y-3">
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Import Mode</span>
                          <div className="flex bg-slate-100 rounded-md p-1 border border-slate-200">
                            <button
                              onClick={() => setCsvMode('append')}
                              className={cn(
                                "flex-1 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-widest transition-all",
                                csvMode === 'append' ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"
                              )}
                            >
                              Append
                            </button>
                            <button
                              onClick={() => setCsvMode('overwrite')}
                              className={cn(
                                "flex-1 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-widest transition-all",
                                csvMode === 'overwrite' ? "bg-rose-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                              )}
                            >
                              Overwrite
                            </button>
                          </div>
                        </div>

                        <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
                          <FileSpreadsheet size={16} className="text-slate-500" />
                          <span>Upload Excel Data</span>
                          <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
                        </label>

                        <button 
                          onClick={() => {
                            const exportData: any[] = [];
                            (Object.keys(inventory) as Array<keyof Inventory>).forEach(category => {
                              Object.values(inventory[category]).forEach((product: any) => {
                                const p = product as Product;
                                Object.keys(p.sizes).forEach(size => {
                                  exportData.push({
                                    category: category.charAt(0).toUpperCase() + category.slice(1),
                                    product_name: p.name,
                                    size: size,
                                    stock_quantity: p.sizes[size],
                                    price: p.prices[size],
                                    status: p.hidden ? 'hidden' : 'active',
                                    image: p.imageUrl
                                  });
                                });
                              });
                            });
                            const ws = XLSX.utils.json_to_sheet(exportData);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Inventory");
                            XLSX.writeFile(wb, `NEUnifits_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                        >
                          <Download size={16} className="text-slate-500" />
                          <span>Export Inventory</span>
                        </button>
                      </div>

                      <div className="px-4 py-2 border-t border-slate-100 mt-2 pt-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Maintenance</span>
                        <button 
                          onClick={async () => {
                            setIsInventoryControlsOpen(false);
                            showToast("Cleanup complete");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors mt-2"
                        >
                          <RotateCcw size={16} className="text-slate-400" />
                          <span>Clean Duplicates</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => setEditingProduct({ 
                  category: 'college', 
                  name: 'New Product', 
                  product: { name: '', category: 'college', sizes: {}, prices: {}, imageUrl: '', hidden: false } 
                })}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Product</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (user.role === 'superadmin' || user.role === 'admin') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {user.role === 'superadmin' && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Add New Administrator</h3>
                  <p className="text-sm text-slate-500">Grant administrative access to specific emails</p>
                </div>
              </div>

              <form onSubmit={handleAddAdmin} className="flex flex-col lg:flex-row gap-4 font-sans">
                <div className="flex-1 relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    placeholder="Enter email address (e.g. name@neu.edu.ph)"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <select 
                  className="px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all font-medium cursor-pointer"
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'superadmin')}
                >
                  <option value="admin">Administrator</option>
                  <option value="superadmin">Super Administrator</option>
                </select>
                <button 
                  type="submit"
                  className="bg-slate-900 text-white px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus size={18} /> Add User
                </button>
              </form>
            </div>
            )}

            <div className="space-y-12">
              {/* Admins Table */}
              {user.role === 'superadmin' && (
                <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-slate-200">
                <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Administrators</h3>
                    <p className="text-xs text-slate-500 mt-1">Manage system administrators and their roles</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shrink-0">
                        {managedUsers.filter(u => u.role !== 'student').length} Admins
                      </div>
                      <button 
                        onClick={() => {
                          const admins = managedUsers.filter(u => u.role !== 'student');
                          const ws = XLSX.utils.json_to_sheet(admins);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, "Admins");
                          XLSX.writeFile(wb, "NEUnifits_Admins.xlsx");
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all shrink-0 cursor-pointer"
                        title="Export Admins"
                      >
                        <Download size={18} />
                      </button>
                    </div>

                    {/* Admin list view layout toggle */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs shrink-0">
                      <button
                        onClick={() => setAdminUserViewMode('table')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none",
                          adminUserViewMode === 'table' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                        title="Table View"
                      >
                        <List size={14} />
                        <span className="font-sans font-bold">Table</span>
                      </button>
                      <button
                        onClick={() => setAdminUserViewMode('cards')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none",
                          adminUserViewMode === 'cards' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                        title="Card View"
                      >
                        <LayoutGrid size={14} />
                        <span className="font-sans font-bold">Card</span>
                      </button>
                    </div>
                  </div>
                </div>
                {adminUserViewMode === 'table' ? (
                  <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Email</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {managedUsers.filter(u => u.role !== 'student').map((mUser) => (
                        <tr key={mUser.email} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xs">
                                {mUser.email.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-700 text-sm">{mUser.email}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              mUser.role === 'superadmin' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                            )}>
                              {mUser.role}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", mUser.blocked ? "bg-red-500" : "bg-green-500")} />
                              <span className={cn("text-xs font-bold", mUser.blocked ? "text-red-500" : "text-green-500")}>
                                {mUser.blocked ? 'Blocked' : 'Active'}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleBlockUser(mUser.email, mUser.blocked)}
                                className={cn(
                                  "p-2 rounded-xl transition-all",
                                  mUser.blocked ? "bg-green-50 text-green-500 hover:bg-green-100" : "bg-amber-50 text-amber-500 hover:bg-amber-100"
                                )}
                                title={mUser.blocked ? "Unblock User" : "Block User"}
                              >
                                {mUser.blocked ? <Check size={16} /> : <Ban size={16} />}
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(mUser.email)}
                                className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                ) : (
                  /* Card View suitable for Mobile Phones */
                  <div className="p-6 bg-slate-50/50 font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {managedUsers.filter(u => u.role !== 'student').map((mUser) => (
                        <div key={mUser.email} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9D23]/40 transition-all flex flex-col justify-between gap-4 font-sans animate-fade-in">
                          <div className="flex items-start justify-between gap-3 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0">
                                {mUser.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-extrabold text-slate-800 text-xs truncate" title={mUser.email}>{mUser.email}</span>
                                <span className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider truncate">{mUser.role}</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className={cn("w-1.5 h-1.5 rounded-full", mUser.blocked ? "bg-red-500" : "bg-green-500")} />
                              <span className={cn("text-[9px] font-black uppercase tracking-widest", mUser.blocked ? "text-red-500" : "text-green-500")}>
                                {mUser.blocked ? 'Blocked' : 'Active'}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {/* Action Trigger Buttons */}
                              <button 
                                onClick={() => handleBlockUser(mUser.email, mUser.blocked)}
                                className={cn(
                                  "p-1.5 rounded transition-all cursor-pointer",
                                  mUser.blocked ? "bg-green-50 text-green-500 hover:bg-green-100" : "bg-amber-50 text-amber-500 hover:bg-amber-100"
                                )}
                                title={mUser.blocked ? "Unblock User" : "Block User"}
                              >
                                {mUser.blocked ? <Check size={14} /> : <Ban size={14} />}
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(mUser.email)}
                                className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-all cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Registered Students Table */}
              <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-slate-200">
                <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Registered Students</h3>
                    <p className="text-xs text-slate-500 mt-1">View all students registered in the system</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shrink-0">
                        {allUsers.filter(u => u.role === 'student').length} Students
                      </div>
                      <button 
                        onClick={() => {
                          const students = allUsers.filter(u => u.role === 'student');
                          const ws = XLSX.utils.json_to_sheet(students);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, "Students");
                          XLSX.writeFile(wb, "NEUnifits_Students.xlsx");
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all shrink-0 cursor-pointer"
                        title="Export Students"
                      >
                        <Download size={18} />
                      </button>
                    </div>

                    {/* Student List View Layout Switcher */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs shrink-0 font-sans">
                      <button
                        onClick={() => setStudentUserViewMode('table')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none",
                          studentUserViewMode === 'table' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                        title="Table View"
                      >
                        <List size={14} />
                        <span className="font-bold">Table</span>
                      </button>
                      <button
                        onClick={() => setStudentUserViewMode('cards')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none",
                          studentUserViewMode === 'cards' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                        title="Card View"
                      >
                        <LayoutGrid size={14} />
                        <span className="font-bold">Card</span>
                      </button>
                    </div>
                  </div>
                </div>
                {studentUserViewMode === 'table' ? (
                  <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Name</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        {user.role === 'superadmin' && (
                          <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {allUsers.filter(u => u.role === 'student').length === 0 ? (
                        <tr>
                          <td colSpan={user.role === 'superadmin' ? 4 : 3} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                            No registered students found
                          </td>
                        </tr>
                      ) : (
                        allUsers.filter(u => u.role === 'student').map((sUser) => (
                          <tr key={sUser.email} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-bold text-xs overflow-hidden">
                                  {sUser.picture ? (
                                    <img src={sUser.picture} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    sUser.name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <span className="font-bold text-slate-700 text-sm">{sUser.name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-slate-500 text-sm">{sUser.email}</span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", sUser.blocked ? "bg-red-500" : "bg-green-500")} />
                                <span className={cn("text-xs font-bold", sUser.blocked ? "text-red-500" : "text-green-500")}>
                                  {sUser.blocked ? 'Blocked' : 'Active'}
                                </span>
                              </div>
                            </td>
                            {user.role === 'superadmin' && (
                              <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => handleBlockUser(sUser.email, sUser.blocked || false)}
                                    className={cn(
                                      "p-2 rounded-xl transition-all",
                                      sUser.blocked ? "bg-green-50 text-green-500 hover:bg-green-100" : "bg-amber-50 text-amber-500 hover:bg-amber-100"
                                    )}
                                    title={sUser.blocked ? "Unblock Student" : "Block Student"}
                                  >
                                    {sUser.blocked ? <Check size={16} /> : <Ban size={16} />}
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                ) : (
                  /* Card View suitable for Mobile Phones */
                  <div className="p-6 bg-slate-50/50">
                    {allUsers.filter(u => u.role === 'student').length === 0 ? (
                      <div className="py-12 text-center text-slate-400 font-medium italic bg-white rounded-xl border border-dashed border-slate-200 text-xs">
                        No registered students found
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans animate-fade-in">
                        {allUsers.filter(u => u.role === 'student').map((sUser) => (
                          <div key={sUser.email} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9D23]/40 transition-all flex flex-col justify-between gap-4 font-sans animate-fade-in">
                            <div className="flex items-start justify-between gap-3 min-w-0">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0">
                                  {sUser.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  {sUser.displayName && (
                                    <span className="font-extrabold text-slate-800 text-xs truncate" title={sUser.displayName}>{sUser.displayName}</span>
                                  )}
                                  <span className="text-[10px] text-slate-400 font-semibold truncate" title={sUser.email}>{sUser.email}</span>
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                              <div className="flex items-center gap-1.5 shrink-0">
                                <div className={cn("w-1.5 h-1.5 rounded-full", sUser.blocked ? "bg-red-500" : "bg-green-500")} />
                                <span className={cn("text-[9px] font-black uppercase tracking-widest", sUser.blocked ? "text-red-500" : "text-green-500")}>
                                  {sUser.blocked ? 'Blocked' : 'Active'}
                                </span>
                              </div>

                              {user.role === 'superadmin' && (
                                <div className="flex justify-end gap-2 shrink-0">
                                  <button 
                                    onClick={() => handleBlockUser(sUser.email, sUser.blocked || false)}
                                    className={cn(
                                      "p-1.5 bg-amber-50 text-amber-500 hover:bg-amber-100 border border-amber-100 rounded transition-all cursor-pointer",
                                      sUser.blocked ? "bg-green-50 text-green-500 hover:bg-green-100 border-green-100" : "bg-amber-50 text-amber-500 hover:bg-amber-100 border-amber-100"
                                    )}
                                    title={sUser.blocked ? "Unblock Student" : "Block Student"}
                                  >
                                    {sUser.blocked ? <Check size={14} /> : <Ban size={14} />}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
        <AnimatePresence>
          {isCartOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCartOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                      <ShoppingCart size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Shopping Cart</h3>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                        <ShoppingCart size={40} strokeWidth={1.5} />
                      </div>
                      <p className="font-medium text-sm">Your cart is currently empty</p>
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col gap-4 group hover:border-slate-300 transition-all shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-sm">{item.productName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">Size {item.size}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFromCart(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateCartQuantity(idx, -1)}
                              className="w-7 h-7 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors shadow-xs"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-bold text-slate-900 w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(idx, 1)}
                              className="w-7 h-7 bg-slate-900 text-white rounded flex items-center justify-center hover:bg-slate-800 transition-colors shadow-xs"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <div className="text-sm font-bold text-slate-900">
                            ₱{item.quantity * item.price}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-6 border-t border-slate-200 bg-white space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Grand Total</span>
                      <span className="text-2xl font-bold text-slate-900">₱{cart.reduce((sum, i) => sum + (i.price * i.quantity), 0)}</span>
                    </div>
                    <button 
                      onClick={handlePlaceOrder}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-lg font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      Place Checkout Request
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {successOverlay && (
            <SuccessOverlay 
              message={successOverlay.message} 
              onClose={() => setSuccessOverlay(null)} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={cn(
                "fixed bottom-8 left-1/2 -translate-x-1/2 z-[600] px-6 py-4 rounded-lg flex items-center gap-3 shadow-xl border",
                toast.isError 
                  ? "bg-white border-red-100 text-red-600 shadow-red-500/10" 
                  : "bg-white border-green-100 text-green-600 shadow-green-500/10"
              )}
            >
              {toast.isError ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
              <span className="font-bold text-sm">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <ConfirmationModal 
          isOpen={!!confirmModal}
          title={confirmModal?.title || ""}
          message={confirmModal?.message || ""}
          onConfirm={confirmModal?.onConfirm || (() => {})}
          onCancel={() => setConfirmModal(null)}
        />

        <PromptModal
          isOpen={!!promptModal}
          title={promptModal?.title || ""}
          message={promptModal?.message || ""}
          defaultValue={promptModal?.defaultValue || ""}
          onConfirm={promptModal?.onConfirm || (() => {})}
          onCancel={() => setPromptModal(null)}
        />

        {selectedNotification && (
          <NotificationDetailModal
            notification={selectedNotification}
            onClose={() => setSelectedNotification(null)}
          />
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-12">
            {(user.role === 'superadmin' || user.role === 'admin') ? (
              <AdminInventoryTable 
                inventory={inventory}
                onEdit={(category, name, product) => setEditingProduct({ category, name, product })}
                onDelete={handleDeleteProduct}
                onToggleVisibility={async (category, name, hidden) => {
                  const productId = `${category}_${name.replace(/\s+/g, '_').toLowerCase()}`;
                  await setDoc(doc(db, 'inventory', productId), { hidden: !hidden }, { merge: true });
                }}
                onRefresh={fetchInventory}
              />
            ) : (
              <div className="space-y-6">
                {/* Dynamic Female and Male Selector Card/Pills */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fit Filter</span>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      {(['all', 'male', 'female'] as const).map((gender) => (
                        <button
                          key={gender}
                          onClick={() => setStudentGenderFilter(gender)}
                          className={cn(
                            "px-4 py-1.5 rounded-md text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer",
                            studentGenderFilter === gender
                              ? "bg-white text-slate-900 shadow-sm border border-slate-100"
                              : "text-slate-500 hover:text-slate-900"
                          )}
                          id={`student-gender-btn-${gender}`}
                        >
                          {gender === 'all' ? 'All Fits' : gender === 'male' ? 'Male' : 'Female'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {Object.keys(studentFilteredProducts).length} items found
                  </div>
                </div>

                <InventorySection 
                  title={`${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Uniforms`} 
                  icon={<Shirt className="text-slate-900" size={32} />} 
                  products={studentFilteredProducts} 
                  category={activeCategory}
                  isAdmin={false}
                  onUpdateImage={handleUpdateImage}
                  onDeleteProduct={handleDeleteProduct}
                  onShowToast={showToast}
                  onAddToCart={addToCart}
                  onRefresh={fetchInventory}
                  selectedSizeState={[globalSelectedSize, setGlobalSelectedSize]}
                />
              </div>
            )}
          </div>
        )}

        {editingProduct && (
          <EditProductModal 
            category={editingProduct.category}
            product={editingProduct.product}
            onClose={() => setEditingProduct(null)}
            onSave={(updatedProduct) => handleUpdateProduct(editingProduct.category, editingProduct.name, updatedProduct)}
          />
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8 font-sans">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard 
                icon={<Boxes className="text-blue-500" size={32} />} 
                value={Object.keys(inventory.college).length + Object.keys(inventory.highschool).length + Object.keys(inventory.accessories).length} 
                label="Total Products" 
              />
              <StatCard 
                icon={<CheckCircle2 className="text-green-500" size={32} />} 
                value={calculateTotalInStock(inventory)} 
                label="In Stock Items" 
              />
              <StatCard 
                icon={<Tag className="text-purple-500" size={32} />} 
                value={calculateTotalVariants(inventory)} 
                label="Size Variants" 
              />
              <StatCard 
                icon={<TrendingUp className="text-orange-500" size={32} />} 
                value={calculateLowStock(inventory)} 
                label="Low Stock (< 10)" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 sm:mb-8">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">Most Purchased Products</h3>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Top 8 Best Sellers</div>
                </div>
                <div className="h-[250px] md:h-[300px] lg:h-[340px] w-full flex items-center justify-center">
                  {productPurchaseData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productPurchaseData} layout="vertical" margin={{ left: 5, right: 35, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={windowWidth < 1024 ? 85 : 130} 
                          tickFormatter={(val) => val.length > (windowWidth < 1024 ? 11 : 18) ? val.slice(0, (windowWidth < 1024 ? 9 : 16)) + '...' : val}
                          tick={{ fontSize: windowWidth < 1024 ? 10 : 12, fontWeight: 600, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        />
                        <Bar dataKey="value" fill="#121358" radius={[0, 4, 4, 0]} barSize={20}>
                          <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#121358' }} offset={10} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center">
                      <TrendingUp size={40} className="mx-auto mb-3 text-slate-200" />
                      <p className="text-sm font-bold text-slate-400">No purchase data available yet</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 sm:mb-8">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">Stock Levels by Product</h3>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Current Inventory</div>
                </div>
                <div className="h-[250px] md:h-[300px] lg:h-[340px] w-full flex items-center justify-center">
                  {stockLevelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stockLevelData} layout="vertical" margin={{ left: 5, right: 35, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={windowWidth < 1024 ? 85 : 130} 
                          tickFormatter={(val) => val.length > (windowWidth < 1024 ? 11 : 18) ? val.slice(0, (windowWidth < 1024 ? 9 : 16)) + '...' : val}
                          tick={{ fontSize: windowWidth < 1024 ? 10 : 12, fontWeight: 600, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        />
                        <Bar dataKey="value" fill="#FF9D23" radius={[0, 4, 4, 0]} barSize={20}>
                          <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#FF9D23' }} offset={10} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center">
                      <Package size={40} className="mx-auto mb-3 text-slate-200" />
                      <p className="text-sm font-bold text-slate-400">No stock data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50/35">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Order Management</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Filter, track, and manage student orders</p>
                </div>
                
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full xl:w-auto">
                  {/* Search Bar */}
                  <div className="relative flex-1 lg:w-64 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text"
                      placeholder="Search name, items, status..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
                    />
                    {orderSearchQuery && (
                      <button
                        onClick={() => setOrderSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        title="Clear Search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown status filter: Visible ONLY on mobile (smaller than lg) */}
                  <div className="block lg:hidden w-full">
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 cursor-pointer"
                    >
                      {(['all', 'pending', 'approved', 'ready', 'completed', 'cancelled'] as const).map((status) => (
                        <option key={status} value={status}>
                          {status.toUpperCase()} ({orderCounts[status]})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hyperlink-style Filter Tabs: Visible on lg and larger screens */}
                  <div className="hidden lg:flex flex-wrap items-center gap-3 pb-2 lg:pb-0">
                    {(['all', 'pending', 'approved', 'ready', 'completed', 'cancelled'] as const).map((status) => {
                      const isActive = orderStatusFilter === status;
                      const count = orderCounts[status];
                      
                      return (
                        <button
                          key={status}
                          onClick={() => setOrderStatusFilter(status)}
                          className={cn(
                            "text-xs font-semibold pb-1 border-b-2 px-1 transition-all uppercase tracking-wider flex items-center gap-1.5 focus:outline-none cursor-pointer",
                            isActive 
                              ? "text-blue-600 border-blue-600 font-extrabold" 
                              : "text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-300"
                          )}
                          id={`order-tab-filter-${status}`}
                        >
                          <span>{status}</span>
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.2 rounded-full font-bold",
                            isActive 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-slate-100 text-slate-500"
                          )}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Layout View Toggle Selector (Table vs Cards suitable for mobile) */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs shrink-0 self-stretch lg:self-auto justify-center">
                    <button
                      onClick={() => setOrderViewMode('table')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none flex-1 lg:flex-none justify-center",
                        orderViewMode === 'table' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      )}
                      title="Table View"
                    >
                      <List size={14} />
                      <span className="font-bold">Table</span>
                    </button>
                    <button
                      onClick={() => setOrderViewMode('cards')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none flex-1 lg:flex-none justify-center",
                        orderViewMode === 'cards' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      )}
                      title="Card View"
                    >
                      <LayoutGrid size={14} />
                      <span className="font-bold">Card</span>
                    </button>
                  </div>
                </div>
              </div>
              {orderViewMode === 'table' ? (
                <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Package Details</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financials</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline & Status</th>
                      {(user.role === 'admin' || user.role === 'superadmin') && (
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{order.studentName}</span>
                            <span className="text-[10px] text-slate-400">{order.studentEmail}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-700">{item.productName}</span>
                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1 rounded uppercase">SZ:{item.size}</span>
                                <span className="text-[9px] text-slate-400 font-bold">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black text-slate-900 tracking-tight">₱{order.totalAmount}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest w-fit px-2 py-0.5 rounded border",
                              order.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-200" :
                              order.status === 'approved' ? "bg-blue-50 text-blue-600 border-blue-200" :
                              order.status === 'ready' ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                              order.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                              "bg-rose-50 text-rose-600 border-rose-200"
                            )}>
                              {order.status}
                            </span>
                            {order.pickupDate ? (
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                                <Calendar size={10} className="text-blue-500" />
                                {new Date(order.pickupDate).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-[9px] text-slate-300 font-medium italic">Pending Schedule</span>
                            )}
                          </div>
                        </td>
                        {(user.role === 'admin' || user.role === 'superadmin') ? (
                          <td className="px-6 py-4 text-right">
                            <select
                                value={order.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value as Order['status'];
                                  if (newStatus === order.status) return;

                                  if (newStatus === 'approved') {
                                    setPromptModal({
                                      isOpen: true,
                                      title: "Schedule Pickup",
                                      message: "Estimated availability date:",
                                      defaultValue: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                                      onConfirm: (date) => {
                                        if (date) handleUpdateOrderStatus(order, 'approved', date);
                                        setPromptModal(null);
                                      }
                                    });
                                  } else {
                                    handleUpdateOrderStatus(order, newStatus, order.pickupDate || undefined);
                                  }
                                }}
                                className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white border border-slate-200 rounded outline-none transition-all hover:border-slate-900 cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="ready">Ready</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        ) : (
                          <td className="px-6 py-4 text-right">
                            {order.status === 'pending' && (
                              <button 
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Cancel Order",
                                    message: "Are you sure you want to cancel your order request?",
                                    onConfirm: () => {
                                      handleUpdateOrderStatus(order, 'cancelled');
                                      setConfirmModal(null);
                                    }
                                  });
                                }}
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 underline underline-offset-4"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                          No order records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Card View suitable for Mobile Phones */
              <div className="p-4 bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9D23]/40 transition-all flex flex-col justify-between gap-4 animate-fade-in font-sans">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-extrabold text-slate-800 leading-tight">{order.studentName}</span>
                            <span className="text-[9px] text-slate-400 font-medium mt-0.5">{order.studentEmail}</span>
                          </div>
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shrink-0",
                            order.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-200" :
                            order.status === 'approved' ? "bg-blue-50 text-blue-600 border-blue-200" :
                            order.status === 'ready' ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                            order.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                            "bg-rose-50 text-rose-600 border-rose-200"
                          )}>
                            {order.status}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                          <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block font-sans">Items Summary</span>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                              <span className="truncate pr-2">{item.productName}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1 py-0.2 rounded uppercase font-sans">SZ:{item.size}</span>
                                <span className="text-slate-400 text-[10px]">x{item.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                        <div className="flex flex-col font-sans">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
                          <span className="text-xs font-black text-slate-900">₱{order.totalAmount}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {order.pickupDate ? (
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-100/50 font-sans">
                              <Calendar size={10} className="text-blue-500" />
                              {new Date(order.pickupDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-450 font-semibold italic flex items-center font-sans">No date</span>
                          )}

                          {(user.role === 'admin' || user.role === 'superadmin') ? (
                            <select
                              value={order.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as Order['status'];
                                if (newStatus === order.status) return;

                                if (newStatus === 'approved') {
                                  setPromptModal({
                                    isOpen: true,
                                    title: "Schedule Pickup",
                                    message: "Estimated availability date:",
                                    defaultValue: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                                    onConfirm: (date) => {
                                      if (date) handleUpdateOrderStatus(order, 'approved', date);
                                      setPromptModal(null);
                                    }
                                  });
                                } else {
                                  handleUpdateOrderStatus(order, newStatus, order.pickupDate || undefined);
                                }
                              }}
                              className="text-[9px] font-black uppercase tracking-widest px-1.5 py-1 bg-white border border-slate-200 rounded outline-none transition-all hover:border-slate-800 cursor-pointer text-slate-800 font-sans select-xs"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="ready">Ready</option>
                              <option value="completed font-sans">Completed</option>
                              <option value="cancelled font-sans">Cancelled</option>
                            </select>
                          ) : (
                            order.status === 'pending' && (
                              <button 
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Cancel Order",
                                    message: "Are you sure you want to cancel your order request?",
                                    onConfirm: () => {
                                      handleUpdateOrderStatus(order, 'cancelled');
                                      setConfirmModal(null);
                                    }
                                  });
                                }}
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50/50 px-2 py-1 rounded hover:bg-red-50 transition-all cursor-pointer shrink-0 font-sans"
                              >
                                Cancel
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredOrders.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 font-medium italic bg-white rounded-xl border border-dashed border-slate-200 w-full text-xs font-sans">
                      No order records found
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </main>
    </div>
  </div>
);
}

function AdminInventoryTable({ inventory, onEdit, onDelete, onToggleVisibility, onRefresh }: { 
  inventory: Inventory;
  onEdit: (category: keyof Inventory, name: string, product: Product) => void;
  onDelete: (category: keyof Inventory, name: string) => void;
  onToggleVisibility: (category: keyof Inventory, name: string, hidden: boolean) => void;
  onRefresh?: () => void;
}) {
  const allProducts = [
    ...Object.entries(inventory.college).map(([name, p]) => ({ ...p, name, category: 'college' as keyof Inventory })),
    ...Object.entries(inventory.highschool).map(([name, p]) => ({ ...p, name, category: 'highschool' as keyof Inventory })),
    ...Object.entries(inventory.accessories).map(([name, p]) => ({ ...p, name, category: 'accessories' as keyof Inventory }))
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [expandedSizes, setExpandedSizes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const filteredProducts = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    
    // Gender matches
    const nameLower = p.name.toLowerCase();
    const isFemaleItem = nameLower.includes('female');
    const isMaleItem = nameLower.includes('male') && !isFemaleItem;
    
    let matchesGender = true;
    if (filterGender === 'female') {
      matchesGender = isFemaleItem || (!isMaleItem && !isFemaleItem);
    } else if (filterGender === 'male') {
      matchesGender = isMaleItem || (!isMaleItem && !isFemaleItem);
    }
    
    return matchesSearch && matchesCategory && matchesGender;
  });

  const toggleSizes = (id: string) => {
    setExpandedSizes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
          <button 
            onClick={onRefresh}
            className="p-2 bg-white border border-slate-200 rounded text-slate-500 hover:text-slate-900 transition-all shadow-sm flex items-center gap-2 text-xs font-bold shrink-0 cursor-pointer"
            title="Refresh Catalog"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <div className="relative flex-1 lg:w-64 min-w-[150px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
          </div>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Categories</option>
            <option value="college">College</option>
            <option value="highschool">High School</option>
            <option value="accessories">Accessories</option>
          </select>
          <select 
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value as 'all' | 'male' | 'female')}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            id="ad-inv-gen-select"
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest self-start sm:self-auto">{filteredProducts.length} Items Listed</div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs shrink-0 w-full sm:w-auto justify-center">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none flex-1 sm:flex-none justify-center",
                viewMode === 'table' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
              title="Table View"
            >
              <List size={14} />
              <span className="font-bold">Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none flex-1 sm:flex-none justify-center",
                viewMode === 'cards' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
              title="Card View"
            >
              <LayoutGrid size={14} />
              <span className="font-bold">Card</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing & Stock</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const productId = `${product.category}_${product.name}`;
                const isExpanded = expandedSizes.includes(productId);
                const sizes = Object.entries(product.sizes);
                
                return (
                  <React.Fragment key={productId}>
                    <tr className={cn(
                      "hover:bg-slate-50/50 transition-colors",
                      product.hidden && "bg-slate-50/30 opacity-75"
                    )}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded border border-slate-100 flex items-center justify-center shrink-0">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <Shirt size={16} className="text-slate-300" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{product.name}</h4>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SKU: {product.name.slice(0, 3).toUpperCase()}-{product.category.slice(0, 1).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase tracking-widest">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-800">{sizes.length} Variants</span>
                            <button 
                              onClick={() => toggleSizes(productId)}
                              className="text-[9px] font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                            >
                              {isExpanded ? 'Hide Details' : 'View Variants'}
                            </button>
                          </div>
                          <div className="h-6 w-px bg-slate-100" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-800">
                              {sizes.reduce((acc, [_, q]) => acc + (q as number), 0)} Total Units
                            </span>
                            <span className="text-[9px] font-medium text-slate-400">In Inventory</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", product.hidden ? "bg-amber-500" : "bg-emerald-500")} />
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", product.hidden ? "text-amber-500" : "text-emerald-500")}>
                            {product.hidden ? 'Hidden' : 'Active'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => onToggleVisibility(product.category, product.name, !!product.hidden)}
                            className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-colors"
                            title={product.hidden ? "Make Visible" : "Hide Product"}
                          >
                            {product.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button 
                            onClick={() => onEdit(product.category, product.name, product)}
                            className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-900 transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => onDelete(product.category, product.name)}
                            className="p-2 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={5} className="px-6 py-0">
                          <div className="py-4 border-t border-slate-100/50 grid grid-cols-2 lg:grid-cols-6 gap-3 font-sans">
                            {sizes.map(([size, qty]) => (
                              <div key={size} className="bg-white p-2.5 rounded border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-black text-slate-400 uppercase">{size}</span>
                                  <span className="text-[10px] font-bold text-slate-900">₱{product.prices[size]}</span>
                                </div>
                                <div className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded text-center whitespace-nowrap",
                                  (qty as number) === 0 ? "bg-red-50 text-red-600" : (qty as number) < 10 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                                )}>
                                  {qty} Units
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Boxes size={40} className="mx-auto mb-4 text-slate-200" />
                    <p className="text-sm font-bold text-slate-400">No matching products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        ) : (
          /* Card View suitable for Mobile Phones */
          <div className="p-4 bg-slate-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
              {filteredProducts.map((product) => {
                const productId = `${product.category}_${product.name}`;
                const isExpanded = expandedSizes.includes(productId);
                const sizes = Object.entries(product.sizes);
                const totalUnits = sizes.reduce((acc, [_, q]) => acc + (q as number), 0);
                
                return (
                  <div key={productId} className={cn(
                    "bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#FF9D23]/40 transition-all flex flex-col justify-between gap-4 animate-fade-in font-sans",
                    product.hidden && "bg-slate-50/30 opacity-80"
                  )}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-slate-50 rounded border border-slate-100 flex items-center justify-center shrink-0">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <Shirt size={16} className="text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block truncate">SKU: {product.name.slice(0, 3).toUpperCase()}-{product.category.slice(0, 1).toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-black uppercase tracking-wider">
                            {product.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className={cn("w-1.5 h-1.5 rounded-full", product.hidden ? "bg-amber-500" : "bg-emerald-500")} />
                            <span className={cn("text-[8px] font-black uppercase tracking-widest", product.hidden ? "text-amber-500" : "text-emerald-500")}>
                              {product.hidden ? 'Hidden' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs text-slate-700">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-sans">Variants</span>
                          <span className="font-extrabold text-slate-800">{sizes.length} Sizes</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div className="flex flex-col">
                          <span className="text-[8px] text-slate-405 font-bold uppercase tracking-wider font-sans">Total Stock</span>
                          <span className="font-extrabold text-slate-800">{totalUnits} Units</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div className="flex flex-col items-end">
                          <button
                            onClick={() => toggleSizes(productId)}
                            className="text-[9px] font-black text-blue-600 hover:text-blue-700 underline focus:outline-none cursor-pointer"
                          >
                            {isExpanded ? 'Hide info' : 'Sizes & prices'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg grid grid-cols-2 gap-2 animate-fade-in font-sans">
                          {sizes.map(([size, qty]) => (
                            <div key={size} className="bg-white p-2 rounded border border-slate-200 flex flex-col justify-between min-h-[44px]">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400">{size}</span>
                                <span className="text-[9px] font-extrabold text-[#FF9D23]">₱{product.prices[size]}</span>
                              </div>
                              <span className={cn(
                                "text-[8px] font-bold block text-center rounded mt-1.5 py-0.2",
                                (qty as number) === 0 ? "bg-red-50 text-red-600" : (qty as number) < 10 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                              )}>
                                {qty} units
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-medium italic">SKU actions</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => onToggleVisibility(product.category, product.name, !!product.hidden)}
                          className="p-1.5 hover:bg-slate-105 rounded text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                          title={product.hidden ? "Make Visible" : "Hide Product"}
                        >
                          {product.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button 
                          onClick={() => onEdit(product.category, product.name, product)}
                          className="p-1.5 hover:bg-slate-105 rounded text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          onClick={() => onDelete(product.category, product.name)}
                          className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <Boxes size={36} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-xs font-bold text-slate-400 font-sans">No matching products found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EditProductModal({ category, product, onClose, onSave }: { 
  category: keyof Inventory; 
  product: Product; 
  onClose: () => void; 
  onSave: (updated: Product) => void; 
}) {
  const [formData, setFormData] = useState<Product>({ ...product });
  const [newSize, setNewSize] = useState('');
  const [newQty, setNewQty] = useState(0);
  const [newPrice, setNewPrice] = useState(0);

  const handleAddSize = () => {
    if (!newSize) return;
    setFormData(prev => ({
      ...prev,
      sizes: { ...prev.sizes, [newSize]: newQty },
      prices: { ...prev.prices, [newSize]: newPrice }
    }));
    setNewSize('');
    setNewQty(0);
    setNewPrice(0);
  };

  const handleRemoveSize = (size: string) => {
    const newSizes = { ...formData.sizes };
    const newPrices = { ...formData.prices };
    delete newSizes[size];
    delete newPrices[size];
    setFormData(prev => ({ ...prev, sizes: newSizes, prices: newPrices }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white border border-slate-200 rounded text-slate-900 shadow-sm">
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Manage Product</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{category} Category</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Title</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300"
                placeholder="Name of the product"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Classification</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as keyof Inventory }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="college">College Department</option>
                <option value="highschool">High School Department</option>
                <option value="accessories">General Accessories</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-0.5">Asset Reference URL</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={formData.imageUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300"
                placeholder="https://..."
              />
              {formData.imageUrl && (
                <div className="w-10 h-10 rounded border border-slate-200 overflow-hidden shrink-0 bg-slate-50">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variants & Specifics</label>
            </div>
            
            <div className="bg-slate-50 rounded p-4 border border-slate-100 mb-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase px-1">Size</span>
                  <input 
                    type="text" 
                    placeholder="e.g. XL" 
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-[10px] font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase px-1">Initial Qty</span>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={newQty}
                    onChange={(e) => setNewQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-[10px] font-bold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase px-1">Price per Unit</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-[10px] font-bold focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleAddSize}
                    className="w-full h-[34px] bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Plus size={14} /> Add Pattern
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(formData.sizes).map(([size, qty]) => (
                <div key={size} className="flex items-center gap-4 bg-white p-3 rounded border border-slate-200 transition-all hover:border-slate-300">
                  <div className="flex flex-col min-w-[50px] border-r border-slate-100 pr-4">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Marker</span>
                    <span className="text-xs font-black text-slate-800">{size}</span>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] font-black text-slate-400 uppercase w-12 text-right">Inventory</span>
                      <div className="flex items-center bg-slate-100 rounded border border-slate-200 overflow-hidden">
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, sizes: { ...prev.sizes, [size]: Math.max(0, (qty as number) - 1) } }))}
                          className="px-2 py-1 hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                          <Minus size={10} />
                        </button>
                        <input 
                          type="number"
                          value={qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setFormData(prev => ({ ...prev, sizes: { ...prev.sizes, [size]: val } }));
                          }}
                          className="w-10 text-center text-[11px] font-black text-slate-800 bg-transparent focus:outline-none"
                        />
                        <button 
                          onClick={() => setFormData(prev => ({ ...prev, sizes: { ...prev.sizes, [size]: (qty as number) + 1 } }))}
                          className="px-2 py-1 hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[8px] font-black text-slate-400 uppercase w-12 text-right">Costing</span>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        <span className="text-slate-400 font-bold text-[10px]">₱</span>
                        <input 
                          type="number"
                          value={formData.prices[size]}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setFormData(prev => ({ ...prev, prices: { ...prev.prices, [size]: val } }));
                          }}
                          className="w-16 font-bold text-[11px] text-slate-800 bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRemoveSize(size)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors hover:bg-rose-50 rounded"
                    title="Remove Variant"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {Object.keys(formData.sizes).length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No variants defined yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-bold text-slate-500 hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-6 py-2 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
          >
            Update Catalog Record
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SidebarNavItem({ icon, label, active, onClick, isCollapsed }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; isCollapsed?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all font-extrabold text-xs uppercase tracking-wider",
        active 
          ? "bg-gradient-to-r from-brand-orange to-brand-orange-dark text-brand-blue shadow-md shadow-brand-orange/20" 
          : "text-slate-300 hover:bg-white/5 hover:text-white",
        isCollapsed && "justify-center px-0"
      )}
      title={isCollapsed ? label : ""}
    >
      <div className={cn("shrink-0", isCollapsed && "scale-105")}>{icon}</div>
      {!isCollapsed && <span>{label}</span>}
    </div>
  );
}

function InventorySection({ title, icon, products, category, isAdmin, onUpdateImage, onDeleteProduct, onShowToast, onAddToCart, onRefresh, selectedSizeState }: { 
  title: string; 
  icon: React.ReactNode; 
  products: { [name: string]: Product }; 
  category: keyof Inventory;
  isAdmin: boolean;
  onUpdateImage: (category: keyof Inventory, name: string) => void;
  onDeleteProduct: (category: keyof Inventory, name: string) => void;
  onShowToast: (message: string, isError?: boolean) => void;
  onAddToCart: (item: CartItem) => void;
  onRefresh?: () => void;
  selectedSizeState: [{productName: string, size: string} | null, (val: {productName: string, size: string} | null) => void];
}) {
  const [globalSelectedSize, setGlobalSelectedSize] = selectedSizeState;
  
  return (
    <div>
      <div className="flex items-center gap-4 mb-7 mt-4">
        {icon}
        <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
        {Object.entries(products).map(([name, info]) => {
          if (info.hidden && !isAdmin) return null;
          return (
            <ProductCard 
              key={name} 
              name={name} 
              info={info} 
              category={category}
              isAdmin={isAdmin}
              onUpdateImage={onUpdateImage}
              onDeleteProduct={onDeleteProduct}
              onShowToast={onShowToast}
              onAddToCart={onAddToCart}
              selectedSize={globalSelectedSize?.productName === name ? globalSelectedSize.size : null}
              onSelectSize={(size) => setGlobalSelectedSize({productName: name, size})}
            />
          );
        })}
      </div>
    </div>
  );
}

interface ProductCardProps {
  key?: string;
  name: string;
  info: Product;
  category: keyof Inventory;
  isAdmin: boolean;
  onUpdateImage: (category: keyof Inventory, name: string) => void;
  onDeleteProduct: (category: keyof Inventory, name: string) => void;
  onShowToast: (message: string, isError?: boolean) => void;
  onAddToCart: (item: CartItem) => void;
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
}

function ProductCard({ name, info, category, isAdmin, onUpdateImage, onDeleteProduct, onShowToast, onAddToCart, selectedSize, onSelectSize }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasStock = Object.values(info.sizes).some(qty => qty > 0);
  const isTooLong = name.length > 30;
  const displayName = isTooLong && !isExpanded ? name.slice(0, 27) + '...' : name;

  const handleAddToCart = () => {
    if (!selectedSize) {
      onShowToast("Please select a size first", true);
      return;
    }
    onAddToCart({
      productName: name,
      category,
      size: selectedSize,
      price: info.prices[selectedSize],
      quantity: 1
    });
  };

  const handleToggleVisibility = async () => {
    const productId = `${category}_${name.replace(/\s+/g, '_').toLowerCase()}`;
    try {
      await setDoc(doc(db, 'inventory', productId), {
        hidden: !info.hidden
      }, { merge: true });
      onShowToast(`${name} is now ${!info.hidden ? 'hidden' : 'visible'}`);
    } catch (error) {
      onShowToast("Error updating visibility", true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-lg overflow-hidden shadow-sm border transition-all hover:border-slate-300 relative flex flex-col h-full",
        info.hidden ? "bg-slate-50 opacity-70" : "border-slate-200"
      )}
    >
      {info.hidden && (
        <div className="absolute top-0 left-0 right-0 bg-slate-800 text-white text-[9px] font-bold uppercase tracking-widest text-center py-1 z-20">
          Archived / Hidden
        </div>
      )}
      <div className="h-[220px] bg-slate-50 relative overflow-hidden flex items-center justify-center p-6 shrink-0 transition-colors group-hover:bg-slate-100">
        {info.imageUrl ? (
          <img 
            src={info.imageUrl} 
            alt={name} 
            className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300 text-xs font-medium border-2 border-dashed border-slate-200 m-4 rounded-lg">
            No Image Preview
          </div>
        )}
        <div className={cn(
          "absolute top-4 right-4 px-3 py-1 rounded text-[9px] font-bold shadow-sm border uppercase tracking-wider",
          hasStock ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
        )}>
          {hasStock ? 'Available' : 'Sold Out'}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="text-lg font-bold text-slate-900 mb-2 flex justify-between items-start">
          <div className="flex-1">
            <span className="leading-tight">{displayName}</span>
            {isTooLong && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-2 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 pt-1">
            {isAdmin && (
              <>
                <button 
                  onClick={handleToggleVisibility}
                  className={cn(
                    "transition-transform hover:scale-110",
                    info.hidden ? "text-amber-500" : "text-slate-400"
                  )}
                  title={info.hidden ? "Show Product" : "Hide Product"}
                >
                  {info.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button 
                  onClick={() => onUpdateImage(category, name)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="Update Image"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => onDeleteProduct(category, name)}
                  className="text-slate-400 hover:text-rose-600 transition-colors"
                  title="Delete Product"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="space-y-2 flex-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Size</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(info.sizes).map(([size, qty]) => (
              <button
                key={size}
                disabled={qty === 0}
                onClick={() => onSelectSize(size)}
                className={cn(
                  "py-2 rounded-lg text-xs font-bold transition-all border",
                  qty === 0 
                    ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" 
                    : selectedSize === size
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                )}
              >
                {size}
                <div className="text-[8px] opacity-60 font-medium">₱{info.prices[size]}</div>
              </button>
            ))}
          </div>
        </div>
        
        {!isAdmin && (
          <button 
            disabled={!hasStock}
            onClick={handleAddToCart}
            className={cn(
              "w-full mt-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2",
              hasStock 
                ? "bg-slate-900 text-white hover:bg-slate-800 shadow-sm" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            <ShoppingCart size={18} /> {hasStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function SuccessOverlay({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -20, x: 20 }}
      className="fixed top-8 right-8 z-[500] bg-white rounded-lg p-4 shadow-xl border border-slate-200 flex items-center gap-4 min-w-[300px]"
    >
      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
        <Check size={20} className="text-emerald-600" strokeWidth={3} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-800 leading-tight">{message}</p>
      </div>
      <button 
        onClick={onClose}
        className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmationModalProps) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-xl p-8 max-w-sm w-full shadow-2xl border border-slate-200"
        >
          <div className="w-16 h-16 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 mb-6 mx-auto">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 text-center mb-2">{title}</h3>
          <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed">{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-lg font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className="flex-1 py-3 rounded-lg font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface NotificationDetailModalProps {
  notification: AppNotification;
  onClose: () => void;
}

function NotificationDetailModal({ notification, onClose }: NotificationDetailModalProps) {
  const formattedDate = React.useMemo(() => {
    if (!notification.createdAt) return "";
    try {
      const date = new Date(notification.createdAt);
      return date.toLocaleDateString("en-US", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return notification.createdAt;
    }
  }, [notification.createdAt]);

  const getIconClassAndElem = () => {
    const titleLower = notification.title?.toLowerCase() || '';
    if (titleLower.includes('approved')) {
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-500",
        icon: <CheckCircle2 size={32} />
      };
    } else if (titleLower.includes('ready')) {
      return {
        bg: "bg-blue-50",
        text: "text-blue-500",
        icon: <Bell size={32} />
      };
    } else if (titleLower.includes('completed')) {
      return {
        bg: "bg-teal-50",
        text: "text-teal-500",
        icon: <Check size={32} />
      };
    } else if (titleLower.includes('cancelled')) {
      return {
        bg: "bg-red-50",
        text: "text-red-500",
        icon: <XCircle size={32} />
      };
    }
    // Default system notification or other update
    return {
      bg: "bg-slate-50",
      text: "text-slate-600",
      icon: <Info size={32} />
    };
  };

  const styling = getIconClassAndElem();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
        id="notification-modal-overlay"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl border border-slate-200 relative overflow-hidden"
          id="notification-modal-content"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            title="Close dialog"
            id="notification-modal-close-btn"
          >
            <X size={16} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 ${styling.bg} ${styling.text} rounded-full flex items-center justify-center mb-6 shadow-sm`}>
              {styling.icon}
            </div>

            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Uniform Notification
            </span>

            <h3 className="text-xl font-extrabold text-slate-800 leading-snug mb-4">
              {notification.title}
            </h3>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 w-full mb-6">
              <p className="text-slate-600 text-sm leading-relaxed text-left font-medium">
                {notification.message}
              </p>
            </div>

            {formattedDate && (
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-8 bg-slate-100/50 py-1.5 px-3 rounded-full">
                <Calendar size={13} className="text-slate-400" />
                <span className="font-semibold">{formattedDate}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer shadow-md shadow-slate-950/10"
              id="notification-modal-action-btn"
            >
              Acknowledge Notification
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PromptModal({ isOpen, title, message, defaultValue, onConfirm, onCancel }: {
  isOpen: boolean;
  title: string;
  message: string;
  defaultValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) setValue(defaultValue);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-xl p-8 max-w-sm w-full shadow-2xl border border-slate-200"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-6 mx-auto">
            <Edit3 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 text-center mb-2">{title}</h3>
          <p className="text-slate-500 text-center text-sm mb-6 whitespace-pre-line leading-relaxed">{message}</p>
          
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all mb-8"
            placeholder="Enter value..."
            autoFocus
          />

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-lg font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(value)}
              className="flex-1 py-3 rounded-lg font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all"
            >
              Update
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-5 hover:border-blue-200 transition-colors animate-fade-in"
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center shadow-inner shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight truncate">{value}</h3>
        <p className="text-[9px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider truncate">{label}</p>
      </div>
    </motion.div>
  );
}

function calculateTotalInStock(inventory: Inventory) {
  let count = 0;
  [inventory.college, inventory.highschool, inventory.accessories].forEach(section => {
    Object.values(section).forEach(product => {
      Object.values(product.sizes).forEach(qty => {
        if (qty > 0) count++;
      });
    });
  });
  return count;
}

function calculateTotalVariants(inventory: Inventory) {
  let count = 0;
  [inventory.college, inventory.highschool, inventory.accessories].forEach(section => {
    Object.values(section).forEach(product => {
      count += Object.keys(product.sizes).length;
    });
  });
  return count;
}

function calculateLowStock(inventory: Inventory) {
  let count = 0;
  [inventory.college, inventory.highschool, inventory.accessories].forEach(section => {
    Object.values(section).forEach(product => {
      Object.values(product.sizes).forEach(qty => {
        if (qty > 0 && qty < 10) count++;
      });
    });
  });
  return count;
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
