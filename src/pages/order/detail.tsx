import React, { useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import styles from './detail.module.scss'

const steps = ['创建', '食材购买中', '制作中', '验收', '已完成']

const DetailPage: React.FC = () => {
  const { orders, role, advanceOrder, acceptOrder, tipOrder } = useAppStore()
  const [orderId, setOrderId] = useState('')
  useLoad((params) => setOrderId(params.id || ''))
  const order = orders.find((item) => item.id === orderId) || (orderId ? undefined : orders[0])
  if (!order) return <View className={styles.page}><View className={styles.empty}><Text className={styles.title}>订单不存在</Text><Text className={styles.items}>这笔订单可能已被删除，或暂时无法加载。</Text><Button className={styles.next} onClick={() => Taro.navigateBack()}>返回订单列表</Button></View></View>
  const current = steps.indexOf(order.status)
  const canAdvance = !order.sellerRole || role === order.sellerRole
  const canAccept = (!order.buyerRole || role === order.buyerRole) && order.status === '验收'
  const tip = () => { tipOrder(order.id, 6); Taro.showToast({ title: '谢谢你的心意', icon: 'success' }) }
  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <Text className={styles.status}>{order.status}</Text>
        <Text className={styles.heroSub}>{order.seller} 正在认真准备这份心意</Text>
      </View>
      <View className={styles.card}>
        <View className={styles.row}>
          <Text className={styles.title}>{order.title}</Text>
          <Text className={styles.id}>{order.id}</Text>
        </View>
        <Text className={styles.items}>{order.items}</Text>
        <View className={styles.timeline}>
          {steps.map((step, index) => (
            <View className={styles.step} key={step}>
              <View className={`${styles.dot} ${index <= current ? styles.dotActive : ''}`} />
              <Text className={index <= current ? styles.stepActive : ''}>{step}</Text>
              {index < steps.length - 1 && <View className={`${styles.connector} ${index < current ? styles.connectorActive : ''}`} />}
            </View>
          ))}
        </View>
      </View>
      <View className={styles.card}>
        <Text className={styles.section}>给这份认真一个回应</Text>
        {order.tipAmount ? <Text className={styles.thanks}>已打赏 ¥{order.tipAmount}，心意收到啦</Text> : (!order.buyerRole || role === order.buyerRole) && <Button className={styles.tip} onClick={tip}>打赏 ¥6 · 谢谢你</Button>}
        {canAccept && <Button className={styles.accept} onClick={() => { acceptOrder(order.id); Taro.showToast({ title: '订单完成', icon: 'success' }) }}>满意，完成订单</Button>}
        {canAdvance && order.status !== '已完成' && order.status !== '验收' && <Button className={styles.next} onClick={() => { advanceOrder(order.id); Taro.showToast({ title: '已推进', icon: 'success' }) }}>推进到下一阶段</Button>}
      </View>
    </View>
  )
}
export default DetailPage
