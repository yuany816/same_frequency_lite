import React, { useEffect } from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import styles from './index.module.scss'

const CookingPage: React.FC = () => {
  const { partnerName, orders, linked } = useAppStore()
  useEffect(() => {
    if (!linked) Taro.redirectTo({ url: '/pages/onboarding/index' })
  }, [linked])
  if (!linked) return <View />
  return <View className={styles.page}><View className={styles.head}><Text className={styles.kicker}>A LITTLE KITCHEN FOR TWO</Text><Text className={styles.title}>给 {partnerName} 做饭</Text><Text className={styles.sub}>今天想吃什么？或者，想为 TA 做点什么？</Text></View><View className={styles.actions}><View className={styles.actionCard} onClick={() => Taro.navigateTo({ url: '/pages/dish/index' })}><View className={styles.icon}>♡</View><Text className={styles.actionTitle}>点菜给 TA</Text><Text className={styles.actionDesc}>从菜单里挑一份想吃的</Text><Text className={styles.actionLink}>去点菜 →</Text></View><View className={`${styles.actionCard} ${styles.warm}`} onClick={() => Taro.navigateTo({ url: '/pages/menu/index' })}><View className={styles.icon}>✦</View><Text className={styles.actionTitle}>为 TA 做菜单</Text><Text className={styles.actionDesc}>把拿手菜写进你们的菜单</Text><Text className={styles.actionLink}>管理菜单 →</Text></View></View><View className={styles.recent}><View className={styles.recentHead}><Text className={styles.section}>厨房里的最近动态</Text><Text className={styles.link} onClick={() => Taro.navigateTo({ url: '/pages/order/index' })}>全部订单 ›</Text></View>{orders.slice(0, 2).map((order) => <View className={styles.order} key={order.id} onClick={() => Taro.navigateTo({ url: `/pages/order/detail?id=${order.id}` })}><View className={styles.dot}>✦</View><View className={styles.orderMain}><Text className={styles.orderTitle}>{order.title}</Text><Text className={styles.orderSub}>{order.status} · {order.createdAt}</Text></View><Text className={styles.orderArrow}>›</Text></View>)}</View></View>
}
export default CookingPage
