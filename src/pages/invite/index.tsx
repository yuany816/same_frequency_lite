import React, { useState } from 'react'
import { Button, Image, Input, Text, View } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import { callFunction } from '../../services/cloud'
import styles from './index.module.scss'

type InviteResult = 'accepted' | 'rejected' | ''

const InvitePage: React.FC = () => {
  const { authorized, nickname, avatarUrl, role, setProfile, completeLink } = useAppStore()
  const [inviteId, setInviteId] = useState('')
  const [inviterName, setInviterName] = useState('你的另一半')
  const [inviterAvatar, setInviterAvatar] = useState('')
  const [result, setResult] = useState<InviteResult>('')
  const [loading, setLoading] = useState(false)

  useLoad((params) => {
    setInviteId(params.inviteId || '')
    setInviterName(params.inviterName ? decodeURIComponent(params.inviterName) : '你的另一半')
    setInviterAvatar(params.inviterAvatar ? decodeURIComponent(params.inviterAvatar) : '')
  })

  const applyProfile = async (userInfo?: { nickName?: string; avatarUrl?: string }) => {
    const nextName = userInfo?.nickName || ''
    const nextAvatar = userInfo?.avatarUrl || ''
    if (!nextName) throw new Error('微信未返回昵称')
    setProfile({ nickname: nextName, avatarUrl: nextAvatar })
    try {
      await callFunction('updateUserProfile', { nickname: nextName, avatarUrl: nextAvatar })
    } catch {
      Taro.showToast({ title: '微信资料已获取，云端保存将在稍后重试', icon: 'none' })
    }
  }

  const chooseAvatar = (event: any) => applyProfile({ nickName: nickname || '微信用户', avatarUrl: event.detail.avatarUrl })
  const fillNickname = (event: any) => {
    const nextName = event.detail.value
    setProfile({ nickname: nextName })
  }

  const handleAccept = async () => {
    setLoading(true)
    try {
      const data = await callFunction<{ relationshipId: string; role: '男方' | '女方'; inviterName?: string }>('acceptInvite', { inviteId })
      useAppStore.getState().hydrate({ relationshipId: data.relationshipId })
      useAppStore.getState().confirmRole(data.role)
      completeLink(data.inviterName || inviterName)
      setResult('accepted')
    } catch (error: any) {
      Taro.showToast({ title: error.message || '邀请已失效', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      await callFunction('rejectInvite', { inviteId })
      setResult('rejected')
    } catch (error: any) {
      Taro.showToast({ title: error.message || '操作失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  if (result) return <View className={styles.page}><View className={styles.result}><Text className={styles.resultIcon}>{result === 'accepted' ? '♥' : '×'}</Text><Text className={styles.resultTitle}>{result === 'accepted' ? '你们已经连在一起了' : '已拒绝这次邀请'}</Text><Text className={styles.resultText}>{result === 'accepted' ? '现在可以一起使用菜单、订单和纪念日功能了' : '邀请方会收到你的反馈，你可以关闭此页面'}</Text>{result === 'accepted' && <Button className={styles.primary} onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>进入你们的首页</Button>}</View></View>

  return <View className={styles.page}>
    <Text className={styles.brand}>TWO OF US</Text>
    <View className={styles.hero}>
      <Text className={styles.kicker}>YOU ARE INVITED</Text>
      <Text className={styles.title}>有人邀请你，成为情侣</Text>
      <Text className={styles.sub}>同意后，你们将共享菜单、订单、纪念日和情侣热度</Text>
    </View>
    <View className={styles.card}><View className={styles.avatar}>{inviterAvatar ? <Image className={styles.avatar} src={inviterAvatar} mode='aspectFill' /> : inviterName.slice(0, 1)}</View><Text className={styles.heart}>♥</Text><View className={`${styles.avatar} ${styles.receiver}`}>{avatarUrl ? <Image className={styles.avatar} src={avatarUrl} mode='aspectFill' /> : nickname.slice(0, 1) || '我'}</View><Text className={styles.inviteText}>{inviterName} 邀请你建立情侣关系</Text></View>
    {!authorized && <><Input className={styles.input} type='nickname' value={nickname} placeholder='点击填写微信昵称' onInput={fillNickname} />{Taro.getEnv() === Taro.ENV_TYPE.WEAPP ? <Button className={styles.primary} openType='chooseAvatar' onChooseAvatar={chooseAvatar}>选择微信头像并继续</Button> : <Button className={styles.primary} onClick={() => applyProfile({ nickName: nickname || '微信用户', avatarUrl })}>使用演示资料并继续</Button>}<Text className={styles.authHint}>请填写微信昵称并选择头像后处理邀请</Text></>}
    {authorized && <><Button className={styles.primary} disabled={loading} onClick={handleAccept}>{loading ? '处理中...' : '同意，成为情侣'}</Button><Button className={styles.reject} disabled={loading} onClick={handleReject}>拒绝邀请</Button><Text className={styles.privacy}>你的昵称和头像将使用微信资料，拒绝后邀请方会收到微信通知</Text></>}
  </View>
}

export default InvitePage
