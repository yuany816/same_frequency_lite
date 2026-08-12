import { create } from 'zustand'

export type OrderStatus = '创建' | '食材购买中' | '制作中' | '验收' | '已完成'

export interface Dish {
  id: string
  name: string
  category: string
  description: string
  ingredients: string
  ownerRole: '男方' | '女方'
  image: string
  prepMinutes: number
  tipSuggestedAmount: number
}

export interface Order {
  id: string
  title: string
  buyer: string
  seller: string
  items: string
  status: OrderStatus
  createdAt: string
  tipAmount: number
  buyerRole?: '男方' | '女方'
  sellerRole?: '男方' | '女方'
}

export interface Anniversary {
  id: string
  title: string
  date: string
  note: string
  createdBy: '男方' | '女方'
  reminderDays: number
}

export interface CheckInRequest {
  id: string
  requesterName: string
  recipientName: string
  status: 'pending' | 'shared' | 'declined'
  latitude?: number
  longitude?: number
  address?: string
  sharedAt?: string
}

const foodImage = 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=warm%20home%20cooked%20pasta%20with%20tomato%20sauce%20on%20a%20ceramic%20plate%2C%20natural%20window%20light%2C%20cozy%20couple%20dinner%2C%20realistic%20food%20photography&image_size=square_hd'
const soupImage = 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=clear%20chicken%20soup%20with%20corn%20and%20carrot%20in%20a%20white%20bowl%2C%20warm%20kitchen%20light%2C%20realistic%20food%20photography&image_size=square_hd'
const dessertImage = 'https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=delicate%20strawberry%20cream%20dessert%20in%20a%20glass%2C%20soft%20pink%20background%2C%20realistic%20food%20photography&image_size=square_hd'

interface AppState {
  linked: boolean
  onboardingStatus: 'pending_role' | 'pending_relationship' | 'waiting_confirmation' | 'completed'
  role: '男方' | '女方' | null
  partnerName: string
  nickname: string
  avatarUrl: string
  authorized: boolean
  inviteId: string
  relationshipId: string
  linkedAt: string
  partnerOpenid: string
  heatScore: number
  categories: string[]
  activeCategory: string
  dishes: Dish[]
  cart: Record<string, number>
  orders: Order[]
  anniversaries: Anniversary[]
  checkInRequest: CheckInRequest | null
  setActiveCategory: (category: string) => void
  addToCart: (dishId: string) => void
  removeFromCart: (dishId: string) => void
  createOrder: () => void
  advanceOrder: (id: string) => void
  acceptOrder: (id: string) => void
  tipOrder: (id: string, amount: number) => void
  confirmRole: (role: '男方' | '女方') => void
  startInvite: (inviteId?: string) => void
  setInviteId: (inviteId: string) => void
  completeLink: (partnerName?: string) => void
  addDish: (dish: Omit<Dish, 'id' | 'ownerRole'>) => void
  addAnniversary: (anniversary: Omit<Anniversary, 'id' | 'createdBy'>) => void
  removeAnniversary: (id: string) => void
  increaseHeat: (amount: number) => void
  dissolveRelationship: () => void
  setProfile: (profile: { nickname: string; avatarUrl?: string }) => void
  requestCheckIn: () => void
  shareLocation: (location?: { latitude: number; longitude: number; address?: string }) => void
  declineCheckIn: () => void
  hydrate: (snapshot: Partial<PersistedAppState>) => void
}

export interface PersistedAppState {
  linked: boolean
  onboardingStatus: AppState['onboardingStatus']
  role: AppState['role']
  partnerName: string
  nickname: string
  avatarUrl: string
  authorized: boolean
  inviteId: string
  relationshipId: string
  linkedAt: string
  partnerOpenid: string
  heatScore: number
  categories: string[]
  activeCategory: string
  dishes: Dish[]
  cart: Record<string, number>
  orders: Order[]
  anniversaries: Anniversary[]
  checkInRequest: CheckInRequest | null
}

export function serializeAppState(state: AppState): PersistedAppState {
  return {
    linked: state.linked,
    onboardingStatus: state.onboardingStatus,
    role: state.role,
    partnerName: state.partnerName,
    nickname: state.nickname,
    avatarUrl: state.avatarUrl,
    authorized: state.authorized,
    inviteId: state.inviteId,
    relationshipId: state.relationshipId,
    linkedAt: state.linkedAt,
    partnerOpenid: state.partnerOpenid,
    heatScore: state.heatScore,
    categories: state.categories,
    activeCategory: state.activeCategory,
    dishes: state.dishes,
    cart: state.cart,
    orders: state.orders,
    anniversaries: state.anniversaries,
    checkInRequest: state.checkInRequest
  }
}

const statusFlow: OrderStatus[] = ['创建', '食材购买中', '制作中', '验收', '已完成']

export const useAppStore = create<AppState>((set) => ({
  linked: false,
  onboardingStatus: 'pending_role',
  role: null,
  partnerName: '小满',
  nickname: '今天也要开心',
  avatarUrl: '',
  authorized: false,
  inviteId: '',
  relationshipId: '',
  linkedAt: '',
  partnerOpenid: '',
  heatScore: 60,
  categories: ['今日推荐', '家常菜', '汤与主食', '甜点'],
  activeCategory: '今日推荐',
  dishes: [
    { id: 'd1', name: '番茄奶油意面', category: '今日推荐', description: '酸甜番茄遇上顺滑奶油，撒一把罗勒，专治想吃点好的晚上。', ingredients: '意面、番茄、淡奶油、罗勒、黑胡椒', ownerRole: '女方', image: foodImage, prepMinutes: 25, tipSuggestedAmount: 6 },
    { id: 'd2', name: '玉米鸡汤', category: '汤与主食', description: '小火慢炖的清甜鸡汤，喝完胃里和心里都暖暖的。', ingredients: '鸡腿、玉米、胡萝卜、姜、葱', ownerRole: '女方', image: soupImage, prepMinutes: 45, tipSuggestedAmount: 8 },
    { id: 'd3', name: '草莓奶油杯', category: '甜点', description: '新鲜草莓、轻盈奶油和脆脆饼干的三层小惊喜。', ingredients: '草莓、淡奶油、消化饼干、糖粉', ownerRole: '女方', image: dessertImage, prepMinutes: 15, tipSuggestedAmount: 5 },
    { id: 'd4', name: '香煎鸡腿排', category: '家常菜', description: '外皮焦香、肉汁饱满，适合认真吃一顿晚餐。', ingredients: '鸡腿、蒜、迷迭香、黑胡椒、黄油', ownerRole: '男方', image: foodImage, prepMinutes: 30, tipSuggestedAmount: 6 }
  ],
  cart: {},
  orders: [
    { id: 'CO-2408', title: '周末的晚餐', buyer: '我', seller: '小满', items: '番茄奶油意面 × 1', status: '制作中', createdAt: '今天 17:20', tipAmount: 0, buyerRole: '男方', sellerRole: '女方' }
  ],
  anniversaries: [
    { id: 'ann-1', title: '第一次见面', date: '2026-09-20', note: '去我们第一次见面的咖啡店', createdBy: '男方', reminderDays: 5 }
  ],
  checkInRequest: null,
  setActiveCategory: (category) => set({ activeCategory: category }),
  addToCart: (dishId) => set((state) => {
    const dish = state.dishes.find((item) => item.id === dishId)
    if (!dish || (state.role && dish.ownerRole === state.role)) return state
    const isFirstDish = !state.cart[dishId]
    return { cart: { ...state.cart, [dishId]: (state.cart[dishId] || 0) + 1 }, heatScore: isFirstDish ? Math.min(100, state.heatScore + 1) : state.heatScore }
  }),
  removeFromCart: (dishId) => set((state) => {
    const next = { ...state.cart }
    if (next[dishId] > 1) next[dishId] -= 1
    else delete next[dishId]
    return { cart: next }
  }),
  createOrder: () => set((state) => {
    const cartItems = state.dishes.filter((dish) => state.cart[dish.id] && dish.ownerRole !== state.role)
    if (!cartItems.length) return state
    const order: Order = {
      id: `CO-${Math.floor(Math.random() * 9000 + 1000)}`,
      title: '给小满的晚餐',
      buyer: '我',
      seller: state.partnerName,
      items: cartItems.map((dish) => `${dish.name} × ${state.cart[dish.id]}`).join('、'),
      status: '创建',
      createdAt: '刚刚',
      tipAmount: 0
      ,buyerRole: state.role || undefined
      ,sellerRole: cartItems[0]?.ownerRole
    }
    return { orders: [order, ...state.orders], cart: {}, heatScore: Math.min(100, state.heatScore + 5) }
  }),
  advanceOrder: (id) => set((state) => ({
    orders: state.orders.map((order) => {
      if (order.id !== id) return order
      if (order.sellerRole && state.role !== order.sellerRole) return order
      const next = statusFlow[Math.min(statusFlow.indexOf(order.status) + 1, statusFlow.length - 1)]
      return { ...order, status: next }
    })
  })),
  acceptOrder: (id) => set((state) => ({ orders: state.orders.map((order) => order.id === id && (!order.buyerRole || state.role === order.buyerRole) && order.status === '验收' ? { ...order, status: '已完成' } : order) })),
  tipOrder: (id, amount) => set((state) => {
    const order = state.orders.find((item) => item.id === id)
    if (!order || order.tipAmount > 0 || (order.buyerRole && state.role !== order.buyerRole) || amount <= 0 || amount > 200) return state
    return { orders: state.orders.map((item) => item.id === id ? { ...item, tipAmount: amount } : item), heatScore: Math.min(100, state.heatScore + 5) }
  }),
  confirmRole: (role) => set({ role, onboardingStatus: 'pending_relationship' }),
  startInvite: (inviteId) => set({ onboardingStatus: 'waiting_confirmation', inviteId: inviteId || `rel-${Date.now()}` }),
  setInviteId: (inviteId) => set({ inviteId }),
  completeLink: (partnerName = '小满') => set((state) => ({ linked: true, onboardingStatus: 'completed', partnerName, relationshipId: state.relationshipId || `rel-${Date.now()}`, linkedAt: state.linkedAt || new Date().toISOString() })),
  addDish: (dish) => set((state) => {
    if (!state.role) return state
    return { dishes: [...state.dishes, { ...dish, ownerRole: state.role, id: `d-${Date.now()}` }], heatScore: Math.min(100, state.heatScore + 3) }
  }),
  addAnniversary: (anniversary) => set((state) => {
    if (!state.role) return state
    return { anniversaries: [...state.anniversaries, { ...anniversary, id: `ann-${Date.now()}`, createdBy: state.role }], heatScore: Math.min(100, state.heatScore + 3) }
  }),
  removeAnniversary: (id) => set((state) => ({ anniversaries: state.anniversaries.filter((item) => item.id !== id) })),
  increaseHeat: (amount) => set((state) => ({ heatScore: Math.min(100, Math.max(0, state.heatScore + amount)) })),
  dissolveRelationship: () => set({ linked: false, onboardingStatus: 'pending_relationship' }),
  setProfile: ({ nickname, avatarUrl }) => set((state) => ({ nickname: nickname || state.nickname, avatarUrl: avatarUrl || state.avatarUrl, authorized: true }))
  ,
  requestCheckIn: () => set((state) => ({
    checkInRequest: {
      id: `check-${Date.now()}`,
      requesterName: state.nickname || '我',
      recipientName: state.partnerName,
      status: 'pending'
    },
    heatScore: Math.min(100, state.heatScore + 1)
  })),
  shareLocation: (location) => set((state) => ({
    checkInRequest: state.checkInRequest ? {
      ...state.checkInRequest,
      status: 'shared',
      latitude: location?.latitude || 31.2304,
      longitude: location?.longitude || 121.4737,
      address: location?.address || '当前定位已共享',
      sharedAt: '刚刚'
    } : null,
    heatScore: Math.min(100, state.heatScore + 2)
  })),
  declineCheckIn: () => set((state) => ({
    checkInRequest: state.checkInRequest ? { ...state.checkInRequest, status: 'declined' } : null
  })),
  hydrate: (snapshot) => set((state) => ({
    ...state,
    ...snapshot,
    relationshipId: snapshot.relationshipId || state.relationshipId,
    linkedAt: snapshot.linkedAt || state.linkedAt,
    partnerOpenid: snapshot.partnerOpenid || state.partnerOpenid,
    categories: snapshot.categories || state.categories,
    dishes: snapshot.dishes || state.dishes,
    orders: snapshot.orders || state.orders,
    anniversaries: snapshot.anniversaries || state.anniversaries,
    cart: snapshot.cart || {},
    checkInRequest: snapshot.checkInRequest || state.checkInRequest
  }))
}))
