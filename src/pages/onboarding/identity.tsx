import React, { useState } from 'react'
import { Button, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import styles from './identity.module.scss'

const IdentityPage: React.FC = () => {
  const [selected, setSelected] = useState<'男方' | '女方' | null>(null)
  const confirmRole = useAppStore((state) => state.confirmRole)
  const submit = () => {
    if (!selected) return Taro.showToast({ title: '请先选择身份', icon: 'none' })
    confirmRole(selected)
    Taro.redirectTo({ url: '/pages/onboarding/index?stage=connect' })
  }
  return <View className={styles.page}><View className={styles.progress}><View className={styles.progressActive} /></View><Text className={styles.kicker}>STEP 1 / 2</Text><Text className={styles.title}>先告诉我们，<Text className={styles.accent}>你是谁</Text></Text><Text className={styles.sub}>这个身份只用于你们之间的称呼和关系展示</Text><View className={styles.options}><View className={`${styles.option} ${selected === '男方' ? styles.selected : ''}`} onClick={() => setSelected('男方')}><Text className={styles.symbol}>♂</Text><Text className={styles.optionTitle}>男方</Text><Text className={styles.optionSub}>我想为 TA 做饭</Text></View><View className={`${styles.option} ${selected === '女方' ? styles.selected : ''}`} onClick={() => setSelected('女方')}><Text className={styles.symbol}>♀</Text><Text className={styles.optionTitle}>女方</Text><Text className={styles.optionSub}>我想为 TA 做饭</Text></View></View><Button className={styles.button} onClick={submit}>确认身份</Button></View>
}
export default IdentityPage
