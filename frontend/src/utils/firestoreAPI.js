import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  deleteDoc, query, where, orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

// Helper to get user's collection reference
const userCol = (uid, col) => collection(db, 'users', uid, col);
const userDoc = (uid, col, id) => doc(db, 'users', uid, col, id);

// ─── CUSTOMERS ───────────────────────────────────────────────
export const customerAPI = {
  getAll: async (uid) => {
    const snap = await getDocs(query(userCol(uid, 'customers'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  search: async (uid, queryStr) => {
    const snap = await getDocs(userCol(uid, 'customers'));
    const q = queryStr.toLowerCase();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.name?.toLowerCase().includes(q) || c.mobile?.includes(q));
  },
  getById: async (uid, id) => {
    const snap = await getDoc(userDoc(uid, 'customers', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },
  create: async (uid, data) => {
    // Generate customer ID
    const snap = await getDocs(userCol(uid, 'customers'));
    const count = snap.size + 1;
    const customerId = `CUST-${String(count).padStart(5, '0')}`;
    const ref = await addDoc(userCol(uid, 'customers'), {
      ...data,
      customerId,
      createdAt: new Date().toISOString()
    });
    return { id: ref.id, customerId };
  },
  update: async (uid, id, data) => {
    await updateDoc(userDoc(uid, 'customers', id), data);
  },
  delete: async (uid, id) => {
    await deleteDoc(userDoc(uid, 'customers', id));
  },
  getHistory: async (uid, customerId) => {
    const snap = await getDocs(query(userCol(uid, 'bills'), where('customerId', '==', customerId), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getBirthdays: async (uid) => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const snap = await getDocs(userCol(uid, 'customers'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.dob && c.dob.endsWith(`-${mm}-${dd}`));
  }
};

// ─── ITEMS ───────────────────────────────────────────────────
export const itemAPI = {
  getAll: async (uid) => {
    const [itemsSnap, catsSnap] = await Promise.all([
      getDocs(userCol(uid, 'items')),
      getDocs(userCol(uid, 'categories'))
    ]);
    const cats = {};
    catsSnap.docs.forEach(d => { cats[d.id] = d.data().name; });
    return itemsSnap.docs.map(d => ({
      id: d.id, ...d.data(),
      categoryName: cats[d.data().categoryId] || ''
    }));
  },
  getActive: async (uid) => {
    const all = await itemAPI.getAll(uid);
    return all.filter(i => i.isActive);
  },
  create: async (uid, data) => {
    await addDoc(userCol(uid, 'items'), { ...data, createdAt: new Date().toISOString() });
  },
  update: async (uid, id, data) => {
    await updateDoc(userDoc(uid, 'items', id), data);
  },
  delete: async (uid, id) => {
    await deleteDoc(userDoc(uid, 'items', id));
  },
  toggleStatus: async (uid, id, current) => {
    await updateDoc(userDoc(uid, 'items', id), { isActive: !current });
  },
  getCategories: async (uid) => {
    const snap = await getDocs(userCol(uid, 'categories'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  createCategory: async (uid, name) => {
    await addDoc(userCol(uid, 'categories'), { name });
  },
  deleteCategory: async (uid, id) => {
    await deleteDoc(userDoc(uid, 'categories', id));
  }
};

// ─── BILLS ───────────────────────────────────────────────────
export const billAPI = {
  getAll: async (uid) => {
    const snap = await getDocs(query(userCol(uid, 'bills'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  getById: async (uid, id) => {
    const snap = await getDoc(userDoc(uid, 'bills', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },
  create: async (uid, data) => {
    const snap = await getDocs(userCol(uid, 'bills'));
    const count = snap.size + 1;
    const billNumber = `BILL-${String(count).padStart(5, '0')}`;
    const ref = await addDoc(userCol(uid, 'bills'), {
      ...data,
      billNumber,
      createdAt: new Date().toISOString()
    });
    return { id: ref.id, billNumber };
  },
  update: async (uid, id, data) => {
    await updateDoc(userDoc(uid, 'bills', id), data);
  },
  delete: async (uid, id) => {
    await deleteDoc(userDoc(uid, 'bills', id));
  }
};

// ─── REPORTS ─────────────────────────────────────────────────
export const reportAPI = {
  getDashboard: async (uid) => {
    const today = new Date().toLocaleDateString('en-CA');
    const mm = String(new Date().getMonth() + 1).padStart(2, '0');
    const yyyy = String(new Date().getFullYear());

    const [billsSnap, customersSnap, itemsSnap] = await Promise.all([
      getDocs(userCol(uid, 'bills')),
      getDocs(userCol(uid, 'customers')),
      getDocs(query(userCol(uid, 'items'), where('isActive', '==', true)))
    ]);

    const bills = billsSnap.docs.map(d => d.data());
    const todayBills = bills.filter(b => b.createdAt?.split('T')[0] === today);
    const monthBills = bills.filter(b => {
      const d = b.createdAt?.split('T')[0] || '';
      return d.startsWith(`${yyyy}-${mm}`);
    });

    return {
      today_bills: todayBills.length,
      today_revenue: todayBills.reduce((s, b) => s + (b.finalAmount || 0), 0),
      month_revenue: monthBills.reduce((s, b) => s + (b.finalAmount || 0), 0),
      total_customers: customersSnap.size,
      active_items: itemsSnap.size
    };
  },

  getDailyRevenue: async (uid, date) => {
    const target = date || new Date().toLocaleDateString('en-CA');
    const snap = await getDocs(userCol(uid, 'bills'));
    const bills = snap.docs.map(d => d.data()).filter(b => b.createdAt?.split('T')[0] === target);
    const total = bills.reduce((s, b) => s + (b.finalAmount || 0), 0);
    return {
      total_bills: bills.length,
      total_revenue: total,
      avg_bill_amount: bills.length ? total / bills.length : 0
    };
  },

  getMonthlyRevenue: async (uid, month, year) => {
    const mm = String(month).padStart(2, '0');
    const yyyy = String(year);
    const snap = await getDocs(userCol(uid, 'bills'));
    const bills = snap.docs.map(d => d.data()).filter(b => {
      const d = b.createdAt?.split('T')[0] || '';
      return d.startsWith(`${yyyy}-${mm}`);
    });
    const total = bills.reduce((s, b) => s + (b.finalAmount || 0), 0);
    return {
      total_bills: bills.length,
      total_revenue: total,
      avg_bill_amount: bills.length ? total / bills.length : 0
    };
  },

  getTopItems: async (uid) => {
    const snap = await getDocs(userCol(uid, 'bills'));
    const counts = {};
    snap.docs.forEach(d => {
      const bill = d.data();
      (bill.items || []).forEach(item => {
        if (!counts[item.name]) counts[item.name] = { item_name: item.name, times_sold: 0, total_quantity: 0, total_revenue: 0 };
        counts[item.name].times_sold += 1;
        counts[item.name].total_quantity += item.quantity;
        counts[item.name].total_revenue += item.price * item.quantity;
      });
    });
    return Object.values(counts).sort((a, b) => b.times_sold - a.times_sold);
  },

  getRepeatCustomers: async (uid) => {
    const [billsSnap, customersSnap] = await Promise.all([
      getDocs(userCol(uid, 'bills')),
      getDocs(userCol(uid, 'customers'))
    ]);
    const customers = {};
    customersSnap.docs.forEach(d => { customers[d.id] = { id: d.id, ...d.data(), visit_count: 0, total_spent: 0, last_visit: null }; });
    billsSnap.docs.forEach(d => {
      const b = d.data();
      if (customers[b.customerId]) {
        customers[b.customerId].visit_count += 1;
        customers[b.customerId].total_spent += b.finalAmount || 0;
        if (!customers[b.customerId].last_visit || b.createdAt > customers[b.customerId].last_visit) {
          customers[b.customerId].last_visit = b.createdAt;
        }
      }
    });
    return Object.values(customers).filter(c => c.visit_count > 1).sort((a, b) => b.visit_count - a.visit_count);
  }
};
