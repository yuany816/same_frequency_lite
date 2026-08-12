import React, { useEffect, useMemo, useState } from 'react'
import { Button, Image, ScrollView, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import styles from './index.module.scss'
import { callFunction } from '../../services/cloud'

const DishPage: React.FC = () => {
  const { categories, activeCategory, setActiveCategory, dishes, cart, role, linked, addToCart, removeFromCart, createOrder } = useAppStore()
  const [cartVisible, setCartVisible] = useState(false)
  const partnerDishes = useMemo(() => dishes.filter((dish) => role && dish.ownerRole !== role), [dishes, role])
  const visibleDishes = useMemo(() => activeCategory === '今日推荐' ? partnerDishes : partnerDishes.filter((dish) => dish.category === activeCategory), [activeCategory, partnerDishes])
  const cartItems = dishes.filter((dish) => cart[dish.id] && role && dish.ownerRole !== role)
  const cartCount = cartItems.reduce((total, dish) => total + cart[dish.id], 0)
  useEffect(() => {
    if (!linked) Taro.redirectTo({ url: '/pages/onboarding/index' })
  }, [linked])
  if (!linked) return <View />

  const submitOrder = () => {
    if (!cartCount) return
    createOrder()
    setCartVisible(false)
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      callFunction('sendOrderNotification', { relationshipId: useAppStore.getState().relationshipId, orderTitle: '新的晚餐订单' })
        .catch(() => Taro.showToast({ title: '订单已创建，但通知发送失败', icon: 'none' }))
    }
    Taro.showToast({ title: '下单成功', icon: 'success' })
  }

  return <View className={styles.page}>
    <View className={styles.head}><Text className={styles.title}>点菜给 TA</Text><Text className={styles.sub}>挑一份想吃的，剩下的交给小满</Text></View>
    <View className={styles.content}>
      <ScrollView className={styles.categories} scrollY>
        {categories.map((category) => <View className={`${styles.category} ${activeCategory === category ? styles.categoryActive : ''}`} key={category} onClick={() => setActiveCategory(category)}><Text>{category}</Text></View>)}
      </ScrollView>
      <ScrollView className={styles.dishes} scrollY>
        {visibleDishes.map((dish) => <View className={styles.dish} key={dish.id}><Image className={styles.image} src={dish.image} mode='aspectFill' /><View className={styles.dishMain}><Text className={styles.name}>{dish.name}</Text><Text className={styles.desc}>{dish.description}</Text><View className={styles.meta}><Text>{dish.prepMinutes} 分钟</Text><Text>建议打赏 ¥{dish.tipSuggestedAmount}</Text></View><View className={styles.dishBottom}><Text className={styles.price}>想吃就点</Text><View className={styles.stepper}>{cart[dish.id] && <Text className={styles.minus} onClick={() => removeFromCart(dish.id)}>−</Text>}{cart[dish.id] && <Text className={styles.quantity}>{cart[dish.id]}</Text>}<Text className={styles.add} onClick={() => addToCart(dish.id)}>＋</Text></View></View></View></View>)}
        {!visibleDishes.length && <View className={styles.empty}><Text className={styles.emptyIcon}>♡</Text><Text>TA 还没有发布这个分类的菜</Text></View>}
      </ScrollView>
    </View>
    <View className={styles.cartBar} onClick={() => cartCount && setCartVisible(true)}><View className={`${styles.cartIcon} ${cartCount ? styles.cartIconActive : ''}`}>🛒{cartCount > 0 && <Text className={styles.count}>{cartCount}</Text>}</View><View className={styles.cartSummary}><Text className={styles.cartTitle}>{cartCount ? `${cartCount} 份菜品已选` : '点菜篮还是空的'}</Text><Text className={styles.cartHint}>{cartCount ? '点击查看明细并下单' : '选一份喜欢的给 TA'}</Text></View><Text className={styles.cartArrow}>›</Text></View>
    {cartVisible && <View className={styles.mask} onClick={() => setCartVisible(false)}><View className={styles.cartPanel} onClick={(event) => event.stopPropagation()}><View className={styles.panelHead}><Text className={styles.panelTitle}>点菜篮</Text><Text className={styles.clear} onClick={() => setCartVisible(false)}>收起</Text></View>{cartItems.map((dish) => <View className={styles.cartItem} key={dish.id}><Image className={styles.cartImage} src={dish.image} mode='aspectFill' /><View className={styles.cartInfo}><Text className={styles.cartName}>{dish.name}</Text><Text className={styles.cartTip}>建议打赏 ¥{dish.tipSuggestedAmount}</Text></View><View className={styles.stepper}><Text className={styles.minus} onClick={() => removeFromCart(dish.id)}>−</Text><Text className={styles.quantity}>{cart[dish.id]}</Text><Text className={styles.add} onClick={() => addToCart(dish.id)}>＋</Text></View></View>)}<Button className={styles.submit} onClick={submitOrder}>确认下单</Button></View></View>}
  </View>
}

export default DishPage
