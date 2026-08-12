import React, { useEffect, useState } from 'react'
import { Button, Image, Input, Text, View } from '@tarojs/components'
import Taro, { useLoad, useShareAppMessage } from '@tarojs/taro'
import { useAppStore } from '../../store/useAppStore'
import styles from './index.module.scss'
import { uploadImage } from '../../services/upload'
import { callFunction } from '../../services/cloud'

type Stage = 'auth' | 'profile' | 'connect' | 'waiting' | 'accept'

const OnboardingPage: React.FC = () => {
  const { onboardingStatus, authorized, role, nickname, avatarUrl, inviteId, setProfile, confirmRole, startInvite, setInviteId, completeLink } = useAppStore()
  const [stage, setStage] = useState<Stage>('profile')
  const [selectedRole, setSelectedRole] = useState<'男方' | '女方' | null>(role)
  const [name, setName] = useState(authorized ? (nickname || '') : '')
  const [avatar, setAvatar] = useState(authorized ? (avatarUrl || '') : '')
  const [incomingInvite, setIncomingInvite] = useState(false)
  const [incomingInviteId, setIncomingInviteId] = useState('')
  const [inviteResult, setInviteResult] = useState<'accepted' | 'rejected' | ''>('')

  useLoad((params) => {
    if (params.stage === 'connect') setStage('connect')
    if (params.inviteId) {
      setIncomingInvite(true)
      setIncomingInviteId(params.inviteId)
      setStage(authorized ? 'accept' : 'profile')
    }
  })

  useEffect(() => {
    if (onboardingStatus === 'waiting_confirmation') setStage('waiting')
  }, [onboardingStatus])

  useEffect(() => {
    if (stage !== 'waiting' || !inviteId || Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) return
    const timer = setInterval(() => {
      callFunction<{ status: string }>('getInviteStatus', { inviteId }).then((data) => {
        if (data?.status === 'accepted') setInviteResult('accepted')
        if (data?.status === 'rejected') setInviteResult('rejected')
      }).catch(() => {})
    }, 3000)
    return () => clearInterval(timer)
  }, [stage, inviteId])

  useEffect(() => {
    if (stage !== 'connect' || Taro.getEnv() !== Taro.ENV_TYPE.WEAPP || inviteId || !role) return
    callFunction<{ inviteId: string }>('createInvite', { role, inviterName: nickname }).then(({ inviteId: nextInviteId }) => {
      setInviteId(nextInviteId)
    }).catch((error) => Taro.showToast({ title: error.message || '邀请创建失败', icon: 'none' }))
  }, [stage, inviteId, role, setInviteId])

  useShareAppMessage(() => {
    const nextInviteId = inviteId || `rel-${Date.now()}`
    startInvite()
    return {
      title: '和我一起经营我们的小日子',
      path: `/pages/invite/index?inviteId=${nextInviteId}&inviterName=${encodeURIComponent(nickname || '你的另一半')}&inviterAvatar=${encodeURIComponent(avatarUrl || '')}`
    }
  })

  const saveWechatProfile = async (nextName: string, nextAvatar: string) => {
    setName(nextName)
    setAvatar(nextAvatar)
    setProfile({ nickname: nextName, avatarUrl: nextAvatar })
    try {
      await callFunction('updateUserProfile', { nickname: nextName, avatarUrl: nextAvatar })
    } catch {
      Taro.showToast({ title: '微信资料已获取，云端保存将在稍后重试', icon: 'none' })
    }
  }

  const chooseWechatAvatar = async (event: any) => {
    const nextAvatar = event?.detail?.avatarUrl
    if (nextAvatar) {
      if (!name.trim()) {
        setAvatar(nextAvatar)
        Taro.showToast({ title: '请先填写微信昵称', icon: 'none' })
        return
      }
      await saveWechatProfile(name.trim(), nextAvatar)
      return
    }
    Taro.showToast({ title: '未获取到微信头像，请重试', icon: 'none' })
  }

  const fillWechatNickname = (event: any) => {
    const nextName = event?.detail?.value || ''
    setName(nextName)
    if (nextName) setProfile({ nickname: nextName })
  }

  const chooseAvatar = async () => {
    try {
      const result = await Taro.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'] })
      setAvatar(await uploadImage(result.tempFilePaths[0], 'avatars'))
      Taro.showToast({ title: '头像已添加', icon: 'success' })
    } catch {}
  }

  const saveProfile = () => {
    if (!selectedRole) return Taro.showToast({ title: '请选择你的身份', icon: 'none' })
    if (!name.trim()) return Taro.showToast({ title: '请填写昵称', icon: 'none' })
    confirmRole(selectedRole)
    setProfile({ nickname: name.trim(), avatarUrl: avatar })
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      callFunction('updateUserProfile', { nickname: name.trim(), avatarUrl: avatar, genderRole: selectedRole })
        .catch(() => Taro.showToast({ title: '个人信息暂存本地，云端同步失败', icon: 'none' }))
    }
    setStage(incomingInvite ? 'accept' : 'connect')
  }

  const simulatePartner = async () => {
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP && incomingInvite) {
      try {
        const result = await callFunction<{ relationshipId: string }>('acceptInvite', { inviteId: incomingInviteId || inviteId, role })
        useAppStore.getState().hydrate({ relationshipId: result.relationshipId })
      } catch (error: any) {
        return Taro.showToast({ title: error.message || '邀请已失效', icon: 'none' })
      }
    }
    completeLink('小满')
    Taro.redirectTo({ url: '/pages/onboarding/success' })
  }

  return <View className={styles.page}>
    <View className={styles.top}><Text className={styles.brand}>TWO OF US</Text><Text className={styles.step}>{stage === 'profile' || stage === 'auth' ? '1 / 2' : '2 / 2'}</Text></View>
    <View className={styles.progress}><View className={styles.progressFill} style={{ width: stage === 'profile' || stage === 'auth' ? '50%' : '100%' }} /></View>

    {stage === 'profile' && <View className={styles.content}><Text className={styles.kicker}>YOUR PROFILE</Text><Text className={styles.title}>先设置，<Text className={styles.accent}>个人信息</Text></Text><Text className={styles.sub}>使用微信官方头像昵称填写能力完善你的资料</Text>{Taro.getEnv() === Taro.ENV_TYPE.WEAPP ? <Button className={styles.avatarPicker} openType='chooseAvatar' onChooseAvatar={chooseWechatAvatar}>{avatar ? <Image className={styles.avatarImage} src={avatar} mode='aspectFill' /> : <Text className={styles.avatarPlaceholder}>{name.slice(0, 1) || '我'}</Text>}<Text className={styles.camera}>＋</Text></Button> : <View className={styles.avatarPicker} onClick={chooseAvatar}>{avatar ? <Image className={styles.avatarImage} src={avatar} mode='aspectFill' /> : <Text className={styles.avatarPlaceholder}>{name.slice(0, 1) || '我'}</Text>}<Text className={styles.camera}>＋</Text></View>}<Text className={styles.label}>昵称</Text><Input className={styles.input} type='nickname' maxlength={20} value={name} placeholder='点击填写微信昵称' onInput={fillWechatNickname} /><Text className={styles.label}>你的身份</Text><View className={styles.roleOptions}><View className={`${styles.roleCardSmall} ${selectedRole === '男方' ? styles.selected : ''}`} onClick={() => setSelectedRole('男方')}><Text>男方</Text></View><View className={`${styles.roleCardSmall} ${selectedRole === '女方' ? styles.selected : ''}`} onClick={() => setSelectedRole('女方')}><Text>女方</Text></View></View><Button className={styles.primary} onClick={saveProfile}>保存并继续</Button><Text className={styles.privacy}>头像和昵称由微信官方组件填写，仅用于你们的情侣资料</Text></View>}

    {stage === 'connect' && <View className={styles.content}><Text className={styles.kicker}>CONNECT TOGETHER</Text><Text className={styles.title}>分享给 TA，<Text className={styles.accent}>完成建联</Text></Text><Text className={styles.sub}>点击分享按钮，把这张微信邀请卡发给你的另一半</Text><View className={styles.connectVisual}><View className={styles.connectAvatar}>{name.slice(0, 1)}</View><View className={styles.dashed} /><View className={`${styles.connectAvatar} ${styles.partnerAvatar}`}>?</View></View><Button className={styles.primary} openType='share'>微信分享给另一半</Button><Text className={styles.shareHint}>分享成功后，邀请会进入等待确认状态</Text><Text className={styles.skip} onClick={simulatePartner}>演示：模拟对方接受分享</Text></View>}

    {stage === 'accept' && <View className={styles.content}><Text className={styles.kicker}>YOU ARE INVITED</Text><Text className={styles.title}>有人邀请你，<Text className={styles.accent}>成为情侣</Text></Text><Text className={styles.sub}>确认接受后，你们将共享菜单、订单、纪念日和情侣热度</Text><View className={styles.inviteCard}><View className={styles.connectAvatar}>小</View><Text className={styles.inviteHeart}>♥</Text><View className={`${styles.connectAvatar} ${styles.partnerAvatar}`}>{name.slice(0, 1)}</View><Text className={styles.inviteText}>小满邀请你建立情侣关系</Text></View><Button className={styles.primary} onClick={simulatePartner}>接受邀请并完成绑定</Button><Text className={styles.skip} onClick={() => Taro.reLaunch({ url: '/pages/onboarding/index' })}>暂不接受</Text></View>}

    {stage === 'waiting' && <View className={styles.content}><Text className={styles.kicker}>INVITATION STATUS</Text><Text className={styles.title}>{inviteResult === 'accepted' ? 'TA 已同意，' : inviteResult === 'rejected' ? 'TA 暂时拒绝了，' : '邀请已发出，'}<Text className={styles.accent}>{inviteResult ? '收到反馈' : '等 TA 接受'}</Text></Text><Text className={styles.sub}>{inviteResult === 'accepted' ? '你们已经可以开始使用情侣功能' : inviteResult === 'rejected' ? '你可以稍后重新发起邀请' : '对方打开独立邀请页后，可以选择同意或拒绝'}</Text><View className={styles.waitingVisual}><Text className={styles.waitingHeart}>{inviteResult === 'rejected' ? '×' : inviteResult === 'accepted' ? '♥' : '…'}</Text></View><Text className={styles.expire}>{inviteResult ? '微信通知已发送给你' : '邀请链接有效 · 等待对方处理'}</Text>{inviteResult === 'accepted' ? <Button className={styles.primary} onClick={() => Taro.redirectTo({ url: '/pages/onboarding/success' })}>进入绑定成功页</Button> : <Button className={styles.secondary} openType='share'>再次分享邀请</Button>}</View>}
  </View>
}

export default OnboardingPage
