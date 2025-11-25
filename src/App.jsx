import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Coffee, CupSoda, IceCream, Trash2, ClipboardCopy, Plus, User, Check, Cloud, Users, Receipt, List, AlertTriangle, X, ShoppingCart, ChevronDown } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';

// --- Firebase 設定與初始化 ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyACfG6-FYMCyfLg2U1RsCz6aNszmoVKgxg",
  authDomain: "officedrink-cde31.firebaseapp.com",
  projectId: "officedrink-cde31",
  storageBucket: "officedrink-cde31.firebasestorage.app",
  messagingSenderId: "394889389572",
  appId: "1:394889389572:web:62948d66440ca8eba73751",
  measurementId: "G-Q48E0Y61W8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-office-orders'; 

// --- 各店家專屬加料設定 ---
const SHOP_TOPPINGS = {
  dezheng: [
    { name: "珍珠", price: 10 },
    { name: "焙烏龍茶凍", price: 10 },
    { name: "芝士奶蓋", price: 15 }
  ],
  lan50: [
    { name: "波霸", price: 10 },
    { name: "珍珠", price: 10 },
    { name: "椰果", price: 10 },
    { name: "燕麥", price: 10 },
    { name: "布丁", price: 10 },
    { name: "冰淇淋", price: 10 }
  ],
  milksha: [
    { name: "珍珠", price: 10 },
    { name: "綠茶凍", price: 10 },
    { name: "仙草凍", price: 10 },
    { name: "雙色小芋圓", price: 15 }
  ]
};

// --- 菜單資料庫 ---
const MENU_DATA = {
  dezheng: {
    name: "得正 Oolong Tea",
    themeColor: "bg-blue-900",
    textColor: "text-blue-900",
    categories: [
      {
        title: "Original Tea (原茶)",
        items: [
          { name: "紅茶", priceM: 25, priceL: 30 },
          { name: "綠茶", priceM: 25, priceL: 30 },
          { name: "春烏龍", priceM: 30, priceL: 35, recommend: true },
          { name: "輕烏龍", priceM: 30, priceL: 35, recommend: true },
          { name: "焙烏龍", priceM: 30, priceL: 35, recommend: true },
        ]
      },
      {
        title: "Classic Milk Tea (奶茶)",
        items: [
          { name: "奶茶", priceM: 45, priceL: 50 },
          { name: "焙烏龍奶茶", priceM: 45, priceL: 50, recommend: true },
          { name: "珍珠奶茶", priceM: 55, priceL: 60 },
          { name: "黃金珍珠奶綠", priceM: 55, priceL: 60, recommend: true },
          { name: "烘吉奶茶", priceM: 50, priceL: null }, 
        ]
      },
      {
        title: "Fresh Milk (鮮奶)",
        items: [
          { name: "紅茶鮮奶", priceM: 55, priceL: 65, recommend: true },
          { name: "輕烏龍鮮奶", priceM: 55, priceL: 65, recommend: true },
          { name: "焙烏龍鮮奶", priceM: 55, priceL: 65 },
          { name: "烘吉鮮奶", priceM: 70, priceL: null },
        ]
      },
      {
        title: "Double Fruit (水果)",
        items: [
          { name: "檸檬春烏龍", priceM: 55, priceL: 65, recommend: true },
          { name: "香橙春烏龍", priceM: 60, priceL: 70, recommend: true },
          { name: "甘蔗春烏龍", priceM: 60, priceL: 70, recommend: true },
          { name: "青梅春烏龍", priceM: 50, priceL: 60 },
          { name: "優酪春烏龍", priceM: 55, priceL: 65 },
        ]
      },
      {
        title: "Cheese Milk Foam (芝士奶蓋)",
        items: [
          { name: "芝士奶蓋春烏龍", priceM: 50, priceL: 60, recommend: true },
          { name: "芝士奶蓋焙烏龍", priceM: 50, priceL: 60, recommend: true },
          { name: "芝士奶蓋阿華田", priceM: 55, priceL: 65 },
          { name: "芝士奶蓋烘吉茶", priceM: 55, priceL: 65 },
        ]
      }
    ]
  },
  lan50: {
    name: "50嵐",
    themeColor: "bg-yellow-500",
    textColor: "text-yellow-600",
    categories: [
      {
        title: "找好茶 (純茶)",
        items: [
          { name: "茉莉綠茶", priceM: 30, priceL: 35 },
          { name: "阿薩姆紅茶", priceM: 30, priceL: 35 },
          { name: "四季春青茶", priceM: 30, priceL: 35, recommend: true },
          { name: "黃金烏龍", priceM: 30, priceL: 35, recommend: true },
        ]
      },
      {
        title: "找口感 (加料)",
        items: [
          { name: "1號 (四季春+珍波椰)", priceM: 35, priceL: 45, recommend: true },
          { name: "波霸紅茶/綠茶", priceM: 35, priceL: 45 },
          { name: "燕麥紅茶/綠茶", priceM: 35, priceL: 45 },
          { name: "微檸檬紅/青", priceM: 35, priceL: 45 },
        ]
      },
      {
        title: "找奶茶 (奶精)",
        items: [
          { name: "奶茶", priceM: 40, priceL: 55 },
          { name: "奶綠", priceM: 40, priceL: 55 },
          { name: "烏龍奶", priceM: 40, priceL: 55 },
          { name: "珍珠奶茶", priceM: 40, priceL: 55, recommend: true },
          { name: "波霸奶茶", priceM: 40, priceL: 55, recommend: true },
          { name: "燕麥奶茶", priceM: 40, priceL: 55 },
        ]
      },
      {
        title: "找拿鐵 (鮮奶)",
        items: [
          { name: "紅茶拿鐵", priceM: 50, priceL: 65, recommend: true },
          { name: "綠茶拿鐵", priceM: 50, priceL: 65 },
          { name: "烏龍拿鐵", priceM: 50, priceL: 65 },
          { name: "珍珠紅茶拿鐵", priceM: 50, priceL: 65 },
          { name: "波霸紅茶拿鐵", priceM: 50, priceL: 65 },
          { name: "燕麥紅茶拿鐵", priceM: 50, priceL: 65 },
        ]
      },
      {
        title: "找新鮮 (果汁/特調)",
        items: [
          { name: "8冰綠", priceM: 40, priceL: 55, recommend: true },
          { name: "檸檬綠", priceM: 40, priceL: 55 },
          { name: "梅の綠", priceM: 40, priceL: 55 },
          { name: "旺來紅", priceM: 40, priceL: 55 },
          { name: "鮮柚綠", priceM: 50, priceL: 65, recommend: true },
          { name: "葡萄柚多多", priceM: 55, priceL: 75 },
        ]
      }
    ]
  },
  milksha: {
    name: "迷客夏 Milksha",
    themeColor: "bg-green-700",
    textColor: "text-green-800",
    categories: [
      {
        title: "暢銷推薦 (Top Hits)",
        items: [
          { name: "珍珠紅茶拿鐵", priceM: 60, priceL: 70, recommend: true },
          { name: "芋頭鮮奶", priceM: 65, priceL: 85, recommend: true },
          { name: "柳丁綠茶", priceM: null, priceL: 65, recommend: true },
          { name: "焙香決明大麥", priceM: null, priceL: 35 },
        ]
      },
      {
        title: "愛茶的牛 (茶拿鐵)",
        items: [
          { name: "娜杯紅茶拿鐵", priceM: 55, priceL: 65 },
          { name: "伯爵紅茶拿鐵", priceM: 50, priceL: 60, recommend: true },
          { name: "大正紅茶拿鐵", priceM: 50, priceL: 60, recommend: true },
          { name: "琥珀烏龍拿鐵", priceM: 50, priceL: 60 },
          { name: "茉香綠茶拿鐵", priceM: 50, priceL: 60 },
        ]
      },
      {
        title: "醇濃綠光鮮奶 (鮮奶系列)",
        items: [
          { name: "手炒黑糖鮮奶", priceM: 65, priceL: 85, recommend: true },
          { name: "嫩仙草凍奶", priceM: 65, priceL: 85 },
          { name: "法芙娜可可鮮奶", priceM: 80, priceL: 100 },
        ]
      },
      {
        title: "鮮調果茶 (Fruit Tea)",
        items: [
          { name: "熟釀青梅綠", priceM: null, priceL: 60 },
          { name: "白甘蔗青茶", priceM: null, priceL: 70 },
          { name: "香柚綠茶", priceM: null, priceL: 60 },
          { name: "冰萃柳丁", priceM: null, priceL: 65 },
        ]
      },
      {
        title: "純茶 (Pure Tea)",
        items: [
          { name: "娜杯紅茶", priceM: null, priceL: 40 },
          { name: "大正紅茶", priceM: null, priceL: 35 },
          { name: "原片初露青茶", priceM: null, priceL: 35 },
          { name: "茉莉原淬綠茶", priceM: null, priceL: 35 },
          { name: "琥珀高峰烏龍", priceM: null, priceL: 35 },
        ]
      }
    ]
  }
};

const SUGAR_OPTIONS = ["正常糖", "少糖", "半糖", "微糖", "二分糖", "一分糖", "無糖"];
const ICE_OPTIONS = ["正常冰", "少冰", "微冰", "去冰", "溫", "熱"];

const App = () => {
  const [user, setUser] = useState(null);
  const [currentShop, setCurrentShop] = useState('dezheng');
  const [cart, setCart] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const cartRef = useRef(null); 
  
  const [confirmDialog, setConfirmDialog] = useState(null);

  const [orderForm, setOrderForm] = useState({
    userName: '',
    size: 'L',
    sugar: '微糖',
    ice: '少冰',
    toppings: [] // Stores array of topping objects {name, price}
  });

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'office_drink_orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => b.timestamp - a.timestamp);
      setCart(items);
    }, (error) => {
      console.error("Error fetching orders:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const openModal = (drink) => {
    setSelectedDrink(drink);
    let defaultSize = 'L';
    if (drink.priceL === null && drink.priceM !== null) defaultSize = 'M';
    if (drink.priceM === null && drink.priceL !== null) defaultSize = 'L';

    const lastUser = localStorage.getItem('lastOrderUser') || '';

    setOrderForm(prev => ({
      ...prev,
      userName: lastUser,
      size: defaultSize,
      sugar: '微糖',
      ice: '少冰',
      toppings: []
    }));
    setModalOpen(true);
  };

  const toggleTopping = (toppingObj) => {
    setOrderForm(prev => {
      const exists = prev.toppings.find(t => t.name === toppingObj.name);
      if (exists) {
        return { ...prev, toppings: prev.toppings.filter(t => t.name !== toppingObj.name) };
      } else {
        return { ...prev, toppings: [...prev.toppings, toppingObj] };
      }
    });
  };

  const addToCart = async () => {
    if (!orderForm.userName.trim()) {
      setConfirmDialog({
        title: "提示",
        message: "請輸入點餐人姓名！",
        onConfirm: () => setConfirmDialog(null),
        isAlert: true
      });
      return;
    }
    if (!user) return;

    const basePrice = orderForm.size === 'M' ? selectedDrink.priceM : selectedDrink.priceL;
    const toppingPrice = orderForm.toppings.reduce((sum, t) => sum + t.price, 0);
    const finalPrice = basePrice + toppingPrice;

    const newItem = {
      shop: MENU_DATA[currentShop].name,
      shopId: currentShop,
      drinkName: selectedDrink.name,
      ...orderForm,
      price: finalPrice,
      timestamp: Date.now(),
      creatorId: user.uid
    };

    localStorage.setItem('lastOrderUser', orderForm.userName);

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'office_drink_orders'), newItem);
      setModalOpen(false);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const removeFromCart = (docId) => {
    setConfirmDialog({
      title: "刪除確認",
      message: "確定要刪除這杯飲料嗎？",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'office_drink_orders', docId));
          setConfirmDialog(null);
        } catch (e) {
          console.error("Error removing document: ", e);
        }
      }
    });
  };

  const clearAllOrders = () => {
    if (cart.length === 0) return;
    
    setConfirmDialog({
      title: "危險操作警告",
      message: "確定要清空「全部」訂單嗎？這將會刪除所有人的點餐紀錄，且無法復原！",
      isDanger: true,
      onConfirm: async () => {
        try {
          const deletePromises = cart.map(item => 
            deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'office_drink_orders', item.id))
          );
          await Promise.all(deletePromises);
          setConfirmDialog(null);
        } catch (e) {
          console.error("Error clearing all orders: ", e);
        }
      }
    });
  };

  const scrollToCart = () => {
    if (cartRef.current) {
      cartRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);

  const userStats = useMemo(() => {
    const stats = {};
    cart.forEach(item => {
      const name = item.userName;
      if (!stats[name]) {
        stats[name] = { count: 0, price: 0, items: [] };
      }
      stats[name].count += 1;
      stats[name].price += item.price;
      stats[name].items.push(item);
    });
    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.price - a.price);
  }, [cart]);

  // 修改：增加備援的複製機制
  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // 確保 textarea 不會被看到且在視窗內
    textArea.style.position = "fixed";
    textArea.style.left = "0";
    textArea.style.top = "0";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
         setConfirmDialog({
            title: "已複製",
            message: "統計資料已成功複製到剪貼簿！(相容模式)",
            onConfirm: () => setConfirmDialog(null),
            isAlert: true
        });
      } else {
        throw new Error("Fallback copy failed");
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      setConfirmDialog({
            title: "複製失敗",
            message: "非常抱歉，瀏覽器安全限制太嚴格，請直接手動選取文字複製，或是截圖分享。",
            onConfirm: () => setConfirmDialog(null),
            isAlert: true
      });
    }

    document.body.removeChild(textArea);
  };

  const copyOrder = () => {
    if (cart.length === 0) return;

    try {
        let text = `📋 辦公室飲料團購統計\n\n`;
        
        if (viewMode === 'list') {
            const groupedByShop = {};
            cart.forEach(item => {
            if (!groupedByShop[item.shop]) groupedByShop[item.shop] = [];
            groupedByShop[item.shop].push(item);
            });

            Object.keys(groupedByShop).forEach(shopName => {
            text += `【${shopName}】\n`;
            groupedByShop[shopName].forEach(item => {
                const toppings = item.toppings || [];
                const toppingText = toppings.length > 0 
                    ? `+${toppings.map(t => typeof t === 'string' ? t : t.name).join(',')}` 
                    : '';
                
                text += `- ${item.userName}: ${item.drinkName} (${item.size}/${item.sugar}/${item.ice}${toppingText}) $${item.price}\n`;
            });
            text += '\n';
            });
        } else {
            text += `【個人費用統計】\n`;
            userStats.forEach(stat => {
                text += `${stat.name}: ${stat.count}杯 $${stat.price}\n`;
            });
            text += `\n`;
        }

        text += `------------------\n`;
        text += `總杯數: ${cart.length} 杯\n`;
        text += `總金額: $${totalAmount}`;

        // 嘗試使用現代 API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                setConfirmDialog({
                    title: "已複製",
                    message: "統計資料已複製到剪貼簿！",
                    onConfirm: () => setConfirmDialog(null),
                    isAlert: true
                });
            }).catch(err => {
                console.warn("Clipboard API failed, trying fallback...", err);
                fallbackCopyTextToClipboard(text);
            });
        } else {
            // 如果瀏覽器不支援現代 API，直接用備援方案
            fallbackCopyTextToClipboard(text);
        }

    } catch (e) {
        console.error("Copy Logic Error:", e);
        alert("產生文字時發生錯誤，可能是舊資料格式不相容。");
    }
  };

  const currentTheme = MENU_DATA[currentShop].themeColor;
  const currentTextTheme = MENU_DATA[currentShop].textColor;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20 md:pb-0 relative">
      
      {/* Header */}
      <header className={`${currentTheme} text-white p-4 shadow-md transition-colors duration-500 sticky top-0 z-20`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CupSoda /> 辦公室點餐神器
          </h1>
          <div className="flex items-center gap-2 text-sm bg-black/20 px-3 py-1 rounded-full">
            {user ? <Cloud size={14} className="text-green-300" /> : <span className="animate-pulse">●</span>}
            <span className="hidden sm:inline">{user ? '已連線' : '連線中...'}</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 p-4">
        
        {/* Left Side: Menu */}
        <div className="flex-1">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {Object.keys(MENU_DATA).map(key => (
              <button
                key={key}
                onClick={() => setCurrentShop(key)}
                className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all shadow-sm border-b-4
                  ${currentShop === key 
                    ? `${MENU_DATA[key].themeColor} border-opacity-50 text-white border-black/20` 
                    : 'bg-white text-gray-500 border-transparent hover:bg-gray-100'}`}
              >
                {MENU_DATA[key].name}
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {MENU_DATA[currentShop].categories.map((category, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className={`text-xl font-bold mb-4 pb-2 border-b ${currentTextTheme} border-opacity-20`}>
                  {category.title}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {category.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => openModal(item)}
                      className="flex flex-col p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all text-left bg-gray-50 hover:bg-white group"
                    >
                      <div className="flex justify-between w-full mb-1">
                        <span className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </span>
                        {item.recommend && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full h-fit">推</span>}
                      </div>
                      <div className="text-sm text-gray-500 mt-auto">
                        {item.priceM !== null && <span className="mr-2">M ${item.priceM}</span>}
                        {item.priceL !== null && <span>L ${item.priceL}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Cart & Stats */}
        <div ref={cartRef} className="md:w-96 shrink-0 scroll-mt-24">
          <div className="bg-white rounded-2xl shadow-lg sticky top-24 overflow-hidden border border-gray-200 flex flex-col h-auto md:max-h-[calc(100vh-8rem)]">
            
            <div className="p-3 bg-gray-800 text-white font-bold flex justify-between items-center shrink-0">
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <List size={16} /> 明細
                </button>
                <button 
                    onClick={() => setViewMode('stats')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-all ${viewMode === 'stats' ? 'bg-white text-gray-900 shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Receipt size={16} /> 統計
                </button>
              </div>
              <span className="bg-gray-700 px-2 py-1 rounded text-xs">{cart.length} 杯</span>
            </div>
            
            <div className="flex-1 p-2 space-y-2 min-h-[150px] bg-gray-50 md:overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Coffee className="mx-auto w-12 h-12 mb-2 opacity-20" />
                  <p>目前還沒有人點餐</p>
                </div>
              ) : viewMode === 'list' ? (
                cart.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-100 relative group hover:shadow-sm transition-all animate-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-start">
                      <div className="pr-6">
                        <div className="flex items-baseline gap-2">
                           <span className={`text-xs font-bold px-1.5 rounded text-white
                             ${item.shopId === 'dezheng' ? 'bg-blue-800' : item.shopId === 'milksha' ? 'bg-green-600' : 'bg-yellow-500'}`}>
                             {item.shop.substring(0, 2)}
                           </span>
                           <span className="font-bold text-gray-800">{item.userName}</span>
                        </div>
                        <div className="font-medium text-blue-900 mt-1">{item.drinkName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {item.size} · {item.sugar} · {item.ice}
                          {item.toppings && item.toppings.length > 0 && (
                            <div className="text-orange-600">
                                +{item.toppings.map(t => typeof t === 'string' ? t : t.name).join(',')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800">${item.price}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                 <div className="space-y-3">
                    {userStats.map((stat) => (
                        <div key={stat.name} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                                <div className="font-bold text-lg flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">
                                        {stat.name.charAt(0)}
                                    </div>
                                    {stat.name}
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">${stat.price}</div>
                                    <div className="text-xs text-gray-500">{stat.count} 杯</div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                                {stat.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between">
                                        <span>• {item.drinkName}</span>
                                        <span>${item.price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] shrink-0 z-10 relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 font-bold">總金額 (共 {cart.length} 杯)</span>
                <span className="text-3xl font-extrabold text-blue-600">${totalAmount}</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                    onClick={clearAllOrders}
                    disabled={cart.length === 0}
                    className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed flex items-center justify-center border border-red-100"
                    title="清空全部訂單"
                >
                    <Trash2 size={20} />
                </button>

                <button 
                    onClick={copyOrder}
                    disabled={cart.length === 0}
                    className="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md active:scale-95"
                >
                    <ClipboardCopy size={20} />
                    {viewMode === 'list' ? '複製訂單明細' : '複製統計金額'}
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {cart.length > 0 && (
        <button
          onClick={scrollToCart}
          className="md:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl z-40 flex items-center gap-2 animate-in slide-in-from-bottom-5 hover:bg-blue-700 active:scale-95 transition-all"
        >
          <ShoppingCart size={24} />
          <span className="font-bold bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">
            {cart.length}
          </span>
        </button>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 text-center">
             <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmDialog.isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {confirmDialog.isDanger ? <AlertTriangle size={24} /> : (confirmDialog.isAlert ? <Check size={24} /> : <AlertTriangle size={24} />)}
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
             <p className="text-gray-500 mb-6">{confirmDialog.message}</p>
             <div className="flex gap-3">
               {!confirmDialog.isAlert && (
                 <button 
                   onClick={() => setConfirmDialog(null)}
                   className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50"
                 >
                   取消
                 </button>
               )}
               <button 
                 onClick={confirmDialog.onConfirm}
                 className={`flex-1 py-2.5 rounded-xl font-bold text-white shadow-md
                   ${confirmDialog.isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
               >
                 {confirmDialog.isAlert ? '好' : '確定'}
               </button>
             </div>
          </div>
        </div>
      )}

      {modalOpen && selectedDrink && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            
            <div className={`${currentTheme} p-4 text-white flex justify-between items-start`}>
              <div>
                <h3 className="text-xl font-bold">{selectedDrink.name}</h3>
                <p className="text-white/80 text-sm mt-1">{MENU_DATA[currentShop].name}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <User size={16} /> 點餐人姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="例如: 小明"
                  value={orderForm.userName}
                  onChange={(e) => setOrderForm({...orderForm, userName: e.target.value})}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors bg-gray-50"
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">尺寸</label>
                <div className="flex gap-3">
                  {['M', 'L'].map(size => {
                    const price = size === 'M' ? selectedDrink.priceM : selectedDrink.priceL;
                    const disabled = price === null;
                    return (
                      <button
                        key={size}
                        disabled={disabled}
                        onClick={() => setOrderForm({...orderForm, size})}
                        className={`flex-1 py-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center
                          ${disabled ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed' : 
                            orderForm.size === size 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                      >
                        <span className="font-bold text-lg">{size === 'M' ? '中杯' : '大杯'}</span>
                        {!disabled && <span className="text-sm">${price}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">甜度</label>
                  <div className="grid grid-cols-1 gap-2">
                    {SUGAR_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setOrderForm({...orderForm, sugar: opt})}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all text-left border
                          ${orderForm.sugar === opt 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">冰塊</label>
                  <div className="grid grid-cols-1 gap-2">
                    {ICE_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setOrderForm({...orderForm, ice: opt})}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all text-left border
                          ${orderForm.ice === opt 
                            ? 'bg-blue-400 text-white border-blue-400 shadow-md' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">加料 (複選)</label>
                <div className="grid grid-cols-2 gap-2">
                  {SHOP_TOPPINGS[currentShop].map(topping => (
                    <button
                      key={topping.name}
                      onClick={() => toggleTopping(topping)}
                      className={`py-2 px-3 rounded-lg text-sm transition-all border flex justify-between items-center
                        ${orderForm.toppings.find(t => t.name === topping.name)
                          ? 'bg-orange-50 border-orange-500 text-orange-700' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span>{topping.name} (+${topping.price})</span>
                      {orderForm.toppings.find(t => t.name === topping.name) && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button 
                onClick={() => setModalOpen(false)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={addToCart}
                className="flex-[2] py-3 rounded-xl font-bold text-white bg-gray-800 hover:bg-gray-900 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                確認點餐
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default App;