import React from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import styles from './connect.module.scss'

const ConnectPage: React.FC = () => {
  const role = useAppStore((state) => state.role)
  const startInvite = useAppStore((state) => state.startInvite)
  const join = () => { useAppStore.getState().completeLink('小满'); Taro.redirectTo({ url: '/pages/onboarding/success' }) }
  const invite = () => { startInvite(); Taro.redirectTo({ url: '/pages/onboarding/waiting' }) }
  return <View className={styles.page}><View className={styles.progress}><View className={styles.progressActive} /></View><Text className={styles.kicker}>STEP 2 / 2</Text><Text className={styles.title}>把另一半，<Text className={styles.accent}>连进来</Text></Text><Text className={styles.sub}>你是{role || '男方'}，邀请 TA 和你一起经营这份小日子</Text><View className={styles.illustration}><Text className={styles.heart}>♡</Text><View className={styles.dashed} /><Text className={styles.heart}>♡</Text></View><Button className={styles.primary} onClick={invite}>发起绑定，生成邀请码</Button><Button className={styles.secondary} onClick={join}>我有邀请码，输入绑定</Button><Text className={styles.demo} onClick={join}>演示：模拟对方确认</Text></View>
}
export default ConnectPage
