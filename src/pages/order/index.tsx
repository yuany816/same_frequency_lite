import React, { useEffect, useMemo, useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore, OrderStatus } from '../../store/useAppStore'
import styles from './index.module.scss'

const statusColors: Record<OrderStatus, string> = { 创建: 'new', 食材购买中: 'buying', 制作中: 'cooking', 验收: 'check', 已完成: 'done' }

const OrderPage: React.FC = () => {
  const { orders, role, advanceOrder, linked, onboardingStatus } = useAppStore()
  const [filter, setFilter] = useState<'全部' | '我发起的' | '收到的'>('全部')
  useEffect(() => {
    if (onboardingStatus !== 'completed' || !linked) Taro.redirectTo({ url: '/pages/onboarding/index' })
  }, [linked, onboardingStatus])
  const filteredOrders = useMemo(() => {
    if (filter === '我发起的') return orders.filter((order) => order.buyer === '我')
    if (filter === '收到的') return orders.filter((order) => order.seller === '我')
    return orders
  }, [filter, orders])
  if (!linked) return <View />
  return (
    <View className={styles.page}>
      <View className={styles.head}><Text className={styles.title}>订单记录</Text><Text className={styles.sub}>每一份认真做的饭，都值得被记住</Text></View>
      <View className={styles.filter}>{(['全部', '我发起的', '收到的'] as const).map((item) => <Text key={item} className={filter === item ? styles.active : ''} onClick={() => setFilter(item)}>{item}</Text>)}</View>
      {filteredOrders.map((order) => (
        <View className={styles.card} key={order.id} onClick={() => Taro.navigateTo({ url: `/pages/order/detail?id=${order.id}` })}>
          <View className={styles.cardHead}><Text className={styles.orderId}>{order.id}</Text><Text className={`${styles.badge} ${styles[statusColors[order.status]]}`}>{order.status}</Text></View>
          <Text className={styles.orderTitle}>{order.title}</Text>
          <Text className={styles.items}>{order.items}</Text>
          <View className={styles.divider} />
          <View className={styles.cardFoot}><Text className={styles.time}>{order.createdAt}</Text><Text className={styles.detail}>查看详情 ›</Text></View>
          {order.status !== '已完成' && order.status !== '验收' && (!order.sellerRole || role === order.sellerRole) && <View className={styles.action} onClick={(event) => { event.stopPropagation(); advanceOrder(order.id); Taro.showToast({ title: '状态已更新', icon: 'success' }) }}><Text>推进到下一阶段</Text></View>}
        </View>
      ))}
      {!filteredOrders.length && <View className={styles.empty}><Text className={styles.emptyIcon}>☁</Text><Text>{filter === '全部' ? '还没有订单，去给对方点一份吧' : '这个分类暂时没有订单'}</Text></View>}
    </View>
  )
}

export default OrderPage
