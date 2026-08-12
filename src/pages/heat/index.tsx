import React, { useEffect } from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import styles from './index.module.scss'

const HeatPage: React.FC = () => {
  const { linked, heatScore, partnerName } = useAppStore()
  useEffect(() => {
    if (!linked) Taro.redirectTo({ url: '/pages/onboarding/index' })
  }, [linked])
  if (!linked) return <View />
  return <View className={styles.page}><View className={styles.head}><Text className={styles.kicker}>LOVE TEMPERATURE</Text><Text className={styles.title}>你们的情侣热度</Text><Text className={styles.sub}>每一次认真互动，都会让这段关系更有温度</Text></View><View className={styles.scoreCard}><View className={styles.ring}><Text className={styles.score}>{heatScore}</Text><Text className={styles.unit}>分</Text></View><Text className={styles.status}>{heatScore >= 80 ? '今天也很甜' : '正在慢慢升温'}</Text><Text className={styles.partner}>你和 {partnerName}</Text><View className={styles.track}><View className={styles.fill} style={{ width: `${heatScore}%` }} /></View></View><Text className={styles.section}>这样可以增加热度</Text><View className={styles.items}><View className={styles.item} onClick={() => Taro.navigateTo({ url: '/pages/cooking/index' })}><Text className={styles.itemIcon}>⌂</Text><View><Text className={styles.itemTitle}>一起做饭</Text><Text className={styles.itemDesc}>创建菜单、点菜和下单</Text></View><Text className={styles.points}>去做饭 ›</Text></View><View className={styles.item} onClick={() => Taro.navigateTo({ url: '/pages/anniversary/index' })}><Text className={styles.itemIcon}>♡</Text><View><Text className={styles.itemTitle}>记住重要日子</Text><Text className={styles.itemDesc}>创建一个属于你们的纪念日</Text></View><Text className={styles.points}>去创建 ›</Text></View><View className={styles.item} onClick={() => Taro.navigateTo({ url: '/pages/order/index' })}><Text className={styles.itemIcon}>✦</Text><View><Text className={styles.itemTitle}>给对方一个回应</Text><Text className={styles.itemDesc}>验收订单、打赏和认真反馈</Text></View><Text className={styles.points}>去看看 ›</Text></View></View></View>
}
export default HeatPage
