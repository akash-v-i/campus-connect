import { api } from '../apiClient';
import { menuApi, ordersApi } from '../localStorage-api';
import { initializeSampleData } from '../sample-data';

function ensureCanteenData() {
  initializeSampleData();
}

function mapLocalMenuItem(m: any): MenuItem {
  return {
    id: m.id,
    name: m.name,
    price: m.price,
    category: (m.category?.toLowerCase() || 'snacks') as MenuItem['category'],
    available: m.available ?? true,
    prep_time: m.prepTime || 15,
    calories: m.calories || 250,
    veg: m.veg ?? true,
    popular: m.popular ?? false,
    image: m.image,
    description: m.description,
    created_at: m.createdAt || new Date().toISOString(),
    updated_at: m.createdAt || new Date().toISOString(),
  };
}

function mapLocalOrder(o: any, userId?: string): Order {
  return {
    id: o.id,
    user_id: o.studentId || userId || '',
    status: o.status === 'ready' ? 'ready' : o.status === 'picked' ? 'picked' : 'pending',
    total_amount: o.totalAmount,
    token_number: parseInt(o.id?.slice(-4), 36) % 1000 || Math.floor(Math.random() * 900) + 100,
    payment_method: 'Wallet',
    created_at: o.createdAt || new Date().toISOString(),
    updated_at: o.updatedAt || new Date().toISOString(),
    items: [{
      id: o.id + '-item',
      order_id: o.id,
      menu_item_id: o.itemId,
      quantity: o.qty,
      price: o.totalAmount / (o.qty || 1),
      created_at: o.createdAt,
    }],
    profiles: { full_name: o.studentName },
  };
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'breakfast' | 'lunch' | 'snacks' | 'beverages' | 'dinner';
  available: boolean;
  prep_time?: number;
  calories?: number;
  veg: boolean;
  popular?: boolean;
  image?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  created_at: string;
  menu_item?: MenuItem;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'preparing' | 'ready' | 'picked' | 'cancelled';
  total_amount: number;
  token_number?: number;
  payment_method?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  profiles?: { full_name: string | null };
}

// Mapper helpers
function mapCategoryToFrontend(cat: string): MenuItem['category'] {
  switch (cat) {
    case 'BEVERAGES': return 'beverages';
    case 'SNACKS': return 'snacks';
    case 'MEALS': return 'lunch';
    case 'DESSERTS': return 'dinner';
    default: return 'snacks';
  }
}

function mapCategoryToBackend(cat: MenuItem['category']): string {
  switch (cat) {
    case 'beverages': return 'BEVERAGES';
    case 'snacks': return 'SNACKS';
    case 'lunch': return 'MEALS';
    case 'breakfast': return 'SNACKS';
    case 'dinner': return 'DESSERTS';
    default: return 'SNACKS';
  }
}

function mapMenuItem(m: any): MenuItem {
  return {
    id: m.id,
    name: m.name,
    price: m.price,
    category: mapCategoryToFrontend(m.category),
    available: m.available,
    prep_time: 15,
    calories: 250,
    veg: true, // defaults for frontend thali/snacks
    popular: true,
    image: m.imageUrl,
    description: m.description,
    created_at: m.createdAt || new Date().toISOString(),
    updated_at: m.createdAt || new Date().toISOString(),
  };
}

function mapOrderStatusToFrontend(status: string): Order['status'] {
  switch (status) {
    case 'PENDING': return 'pending';
    case 'PREPARING': return 'preparing';
    case 'READY': return 'ready';
    case 'COMPLETED': return 'picked';
    case 'CANCELLED': return 'cancelled';
    default: return 'pending';
  }
}

function mapOrderStatusToBackend(status: Order['status']): string {
  switch (status) {
    case 'pending': return 'PENDING';
    case 'preparing': return 'PREPARING';
    case 'ready': return 'READY';
    case 'picked': return 'COMPLETED';
    case 'cancelled': return 'CANCELLED';
    default: return 'PENDING';
  }
}

function mapOrder(o: any): Order {
  const items = (o.items || []).map((item: any) => ({
    id: item.id,
    order_id: o.id,
    menu_item_id: item.menuItemId,
    quantity: item.quantity,
    price: item.price,
    created_at: o.orderDate || new Date().toISOString(),
    menu_item: {
      id: item.menuItemId,
      name: item.menuItemName,
      price: item.price,
      category: 'snacks',
      available: true,
      veg: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as MenuItem
  }));

  return {
    id: o.id,
    user_id: o.userId,
    status: mapOrderStatusToFrontend(o.status),
    total_amount: o.totalAmount,
    token_number: o.tokenNumber,
    payment_method: 'Wallet',
    created_at: o.orderDate || new Date().toISOString(),
    updated_at: o.orderDate || new Date().toISOString(),
    items,
    profiles: { full_name: o.userFullName }
  };
}

// Menu Items
export async function getMenuItems(filters?: { category?: string; available?: boolean }) {
  try {
    let path = '/menu';
    const params: string[] = [];
    if (filters?.category) {
      params.push(`category=${mapCategoryToBackend(filters.category as any)}`);
    }
    if (params.length > 0) {
      path += `?${params.join('&')}`;
    }
    const response: any = await api.get(path);
    const content = response.content || response;
    const items = (Array.isArray(content) ? content : []).map(mapMenuItem);
    if (items.length > 0) return items;
  } catch { /* fallback */ }

  ensureCanteenData();
  let items = (await menuApi.getAll()).map(mapLocalMenuItem);
  if (filters?.available) items = items.filter(i => i.available);
  if (filters?.category) items = items.filter(i => i.category === filters.category);
  return items;
}

export async function getMenuItemById(id: string) {
  const response = await api.get(`/menu/${id}`);
  return mapMenuItem(response);
}

export async function createMenuItem(item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const payload = {
      name: item.name,
      category: mapCategoryToBackend(item.category),
      price: item.price,
      available: item.available,
      description: item.description,
      imageUrl: item.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400'
    };
    const response = await api.post('/menu', payload);
    return mapMenuItem(response);
  } catch {
    ensureCanteenData();
    const created = await menuApi.create({
      name: item.name,
      price: item.price,
      available: item.available,
      category: item.category,
      prepTime: item.prep_time,
      calories: item.calories,
      veg: item.veg,
      popular: item.popular,
      image: item.image,
    });
    return mapLocalMenuItem(created);
  }
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>) {
  try {
    const payload: any = { ...updates };
    if (updates.category) payload.category = mapCategoryToBackend(updates.category);
    if (updates.image) payload.imageUrl = updates.image;
    const response = await api.put(`/menu/${id}`, payload);
    return mapMenuItem(response);
  } catch {
    const updated = await menuApi.update(id, {
      name: updates.name,
      price: updates.price,
      available: updates.available,
      category: updates.category,
      prepTime: updates.prep_time,
      calories: updates.calories,
      veg: updates.veg,
      popular: updates.popular,
      image: updates.image,
    });
    return mapLocalMenuItem(updated);
  }
}

export async function deleteMenuItem(id: string) {
  try { await api.delete(`/menu/${id}`); } catch { await menuApi.delete(id); }
}

// Orders
export async function getOrders(userId?: string, status?: Order['status']) {
  try {
    let path = '/orders';
    const params: string[] = [];
    if (userId) params.push(`userId=${userId}`);
    if (status) params.push(`status=${mapOrderStatusToBackend(status)}`);
    if (params.length > 0) {
      path += `?${params.join('&')}`;
    }
    const response: any = await api.get(path);
    const content = response.content || response;
    const orders = (Array.isArray(content) ? content : []).map(mapOrder);
    if (orders.length > 0 || !userId) return orders;
  } catch { /* fallback */ }

  ensureCanteenData();
  let orders = userId
    ? (await ordersApi.getUserOrders(userId)).map(o => mapLocalOrder(o, userId))
    : (await ordersApi.getAll()).map(o => mapLocalOrder(o));
  if (status) orders = orders.filter(o => o.status === status);
  return orders;
}

export async function getOrderById(id: string) {
  const response = await api.get(`/orders/${id}`);
  return mapOrder(response);
}

export async function createOrder(userId: string, items: { menu_item_id: string; quantity: number }[]) {
  try {
    const payload = {
      items: items.map(item => ({
        menuItemId: item.menu_item_id,
        quantity: item.quantity
      }))
    };
    const response = await api.post('/orders', payload);
    return mapOrder(response);
  } catch {
    ensureCanteenData();
    const createdOrders: Order[] = [];
    for (const item of items) {
      const order = await ordersApi.create({
        itemId: item.menu_item_id,
        qty: item.quantity,
        studentId: userId,
        studentName: 'Student',
      });
      createdOrders.push(mapLocalOrder(order, userId));
    }
    return createdOrders[0];
  }
}

export async function updateOrderStatus(id: string, status: Order['status']) {
  try {
    const response = await api.put(`/orders/${id}/status?status=${mapOrderStatusToBackend(status)}`);
    return mapOrder(response);
  } catch {
    if (status === 'picked' || status === 'ready') {
      const order = await ordersApi.markPicked(id);
      return mapLocalOrder(order);
    }
    throw new Error('Status update failed');
  }
}
