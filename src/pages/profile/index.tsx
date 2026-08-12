import React from 'react'
import { Image, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import styles from './index.module.scss'
import { callFunction } from '../../services/cloud'

const ProfilePage: React.FC = () => {
  const { partnerName, role, nickname, avatarUrl, authorized, linkedAt, orders, setProfile, dissolveRelationship } = useAppStore()
  const daysTogether = linkedAt ? Math.max(1, Math.floor((Date.now() - new Date(linkedAt).getTime()) / 86400000) + 1) : 1
  const completedOrders = orders.filter((order) => order.status === '已完成').length
  const totalTips = orders.reduce((sum, order) => sum + order.tipAmount, 0)
  const authorize = async () => {
    if (Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) {
      setProfile({ nickname: '今天也要开心' })
      return Taro.showToast({ title: '已使用演示身份', icon: 'success' })
    }
    Taro.navigateTo({ url: '/pages/onboarding/index' })
  }
  const editNickname = () => {
    Taro.showModal({ title: '修改昵称', editable: true, placeholderText: nickname, content: nickname, confirmColor: '#e76f51' }).then(({ confirm, content }) => {
      const nextName = (content || '').trim()
      if (confirm && nextName) {
        setProfile({ nickname: nextName })
        callFunction('updateUserProfile', { nickname: nextName, avatarUrl, genderRole: role }).catch(() => {
          Taro.showToast({ title: '昵称已修改，但云端同步失败', icon: 'none' })
        })
      }
    })
  }
  const handleDissolve = () => {
    Taro.showModal({ title: '解除情侣关系', content: '解除后将无法继续创建新订单，确定继续吗？', confirmColor: '#e76f51' }).then(({ confirm }) => {
      if (confirm) {
        dissolveRelationship()
        Taro.redirectTo({ url: '/pages/onboarding/index' })
      }
    })
  }
  return <View className={styles.page}>
    <View className={styles.profile} onClick={authorized ? editNickname : authorize}>{avatarUrl ? <Image className={styles.avatarImage} src={avatarUrl} mode='aspectFill' /> : <View className={styles.avatar}>{nickname.slice(0, 1)}</View>}<View className={styles.profileMain}><Text className={styles.name}>{nickname}</Text><Text className={styles.role}>{authorized ? `${role || '未确认身份'} · 和 ${partnerName} 建联中` : '去个人信息页填写微信头像和昵称'}</Text></View><Text className={styles.chevron}>›</Text></View>
    <View className={styles.stats}><View><Text className={styles.number}>{daysTogether}</Text><Text>相伴天数</Text></View><View><Text className={styles.number}>{completedOrders}</Text><Text>完成订单</Text></View><View><Text className={styles.number}>¥{totalTips}</Text><Text>累计打赏</Text></View></View>
    <View className={styles.group}><View className={styles.item} onClick={authorized ? editNickname : authorize}><Text className={styles.itemIcon}>◎</Text><Text>个人信息</Text><Text className={styles.itemValue}>{authorized ? '已授权' : '去授权'}</Text><Text className={styles.chevron}>›</Text></View><View className={styles.item} onClick={() => Taro.navigateTo({ url: '/pages/anniversary/index' })}><Text className={styles.itemIcon}>♡</Text><Text>纪念日</Text><Text className={styles.chevron}>›</Text></View><View className={styles.item} onClick={() => Taro.navigateTo({ url: '/pages/onboarding/index?stage=connect' })}><Text className={styles.itemIcon}>♧</Text><Text>邀请另一半</Text><Text className={styles.chevron}>›</Text></View><View className={styles.item} onClick={() => Taro.showActionSheet({ itemList: ['解除情侣关系'] }).then(({ tapIndex }) => tapIndex === 0 && handleDissolve())}><Text className={styles.itemIcon}>⚙</Text><Text>关系设置</Text><Text className={styles.chevron}>›</Text></View><View className={styles.item} onClick={() => Taro.showModal({ title: '帮助与反馈', content: '遇到问题可以通过情侣关系页重新绑定，订单和纪念日都只对关系双方可见。', showCancel: false })}><Text className={styles.itemIcon}>?</Text><Text>帮助与反馈</Text><Text className={styles.chevron}>›</Text></View></View>
    <Text className={styles.version}>两个人的厨房 · v1.0.0</Text>
  </View>
}
export default ProfilePage
