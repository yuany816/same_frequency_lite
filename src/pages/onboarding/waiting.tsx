import React from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import styles from './waiting.module.scss'

const WaitingPage: React.FC = () => {
  const completeLink = useAppStore((state) => state.completeLink)
  const confirm = () => { completeLink('小满'); Taro.redirectTo({ url: '/pages/onboarding/success' }) }
  return <View className={styles.page}><Text className={styles.kicker}>INVITATION CREATED</Text><Text className={styles.title}>等 TA 来，<Text className={styles.accent}>和你连在一起</Text></Text><Text className={styles.sub}>把邀请码发给你的另一半，TA 输入后即可完成绑定</Text><View className={styles.code}>8 2 6 1 4 8</View><Text className={styles.expire}>邀请码 24 小时内有效</Text><Button className={styles.copy} onClick={() => Taro.showToast({ title: '邀请码已复制', icon: 'success' })}>复制邀请码</Button><Text className={styles.demo} onClick={confirm}>演示：模拟对方已确认</Text></View>
}
export default WaitingPage
