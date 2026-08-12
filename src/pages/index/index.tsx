import React, { useEffect } from 'react'
import { Image, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import styles from './index.module.scss'

const Index: React.FC = () => {
  const { linked, onboardingStatus, partnerName, linkedAt, nickname, avatarUrl, authorized } = useAppStore()
  const daysTogether = linkedAt ? Math.max(1, Math.floor((Date.now() - new Date(linkedAt).getTime()) / 86400000) + 1) : 1

  useEffect(() => {
    if (onboardingStatus !== 'completed' || !linked) Taro.redirectTo({ url: '/pages/onboarding/index' })
  }, [linked, onboardingStatus])

  if (!linked) return <View />

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View>
          <Text className={styles.eyebrow}>OUR LITTLE KITCHEN</Text>
          <Text className={styles.title}>你好，{authorized && nickname ? nickname : '欢迎回来'}，今天想为 TA 做点什么？</Text>
        </View>
        {avatarUrl ? <Image className={styles.avatar} src={avatarUrl} mode='aspectFill' /> : <View className={styles.avatar}>{authorized && nickname ? nickname.slice(0, 1) : '我'}</View>}
      </View>

      <View className={styles.connection}>
        <View className={styles.heart}>♡</View>
        <View><Text className={styles.connectionLabel}>你和 {partnerName} 已经连在一起</Text><Text className={styles.connectionSub}>一起相伴的第 {daysTogether} 天</Text></View>
      </View>

      <Text className={styles.sectionTitle}>你们的生活</Text>
      <View className={styles.anniversaryFeature} onClick={() => Taro.navigateTo({ url: '/pages/cooking/index' })}><View className={styles.anniversaryIcon}>⌂</View><View><Text className={styles.anniversaryTitle}>给我做饭</Text><Text className={styles.anniversaryDesc}>把想吃的告诉 TA，也为 TA 做一顿饭</Text></View><Text className={styles.arrow}>›</Text></View>
      <View className={styles.anniversaryFeature} onClick={() => Taro.navigateTo({ url: '/pages/anniversary/index' })}><View className={styles.anniversaryIcon}>♡</View><View><Text className={styles.anniversaryTitle}>纪念日</Text><Text className={styles.anniversaryDesc}>把重要的日子记下来，提前准备惊喜</Text></View><Text className={styles.arrow}>›</Text></View>
      <View className={styles.anniversaryFeature} onClick={() => Taro.navigateTo({ url: '/pages/checkin/index' })}><View className={styles.anniversaryIcon}>⌖</View><View><Text className={styles.anniversaryTitle}>问问 TA 在哪里</Text><Text className={styles.anniversaryDesc}>TA 同意后，只共享一次当前定位</Text></View><Text className={styles.arrow}>›</Text></View>
    </View>
  )
}

export default Index
