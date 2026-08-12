import React from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import styles from './success.module.scss'

const SuccessPage: React.FC = () => {
  const partnerName = useAppStore((state) => state.partnerName)
  return <View className={styles.page}><View className={styles.badge}>♡</View><Text className={styles.title}>你们已经连在一起了</Text><Text className={styles.sub}>从今天开始，把每一顿饭都变成你们的小小纪念</Text><View className={styles.couple}><View className={styles.avatar}>我</View><View className={styles.line} /><View className={`${styles.avatar} ${styles.partner}`}>{partnerName.slice(0, 1)}</View></View><Button className={styles.button} onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>进入你们的首页</Button></View>
}
export default SuccessPage
