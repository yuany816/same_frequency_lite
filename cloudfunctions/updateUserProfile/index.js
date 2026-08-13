const cloud = require('wx-server-sdk')
const crypto = require('crypto')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { nickname, avatarUrl, genderRole, authorizationSource } = event || {}
    if (!openid) throw new Error('微信登录态无效')
    if (!nickname || nickname.trim().length > 20) throw new Error('昵称不合法')
    const users = await db.collection('users').where({ _openid: openid }).limit(1).get()
    const nextNickname = nickname.trim()
    const nextAvatarUrl = avatarUrl || ''
    const isAuthorized = Boolean(nextNickname && nextAvatarUrl)
    const data = {
      nickname: nextNickname,
      avatarUrl: nextAvatarUrl,
      genderRole: genderRole || null,
      authorized: isAuthorized,
      authorizedAt: isAuthorized ? db.serverDate() : null,
      updateTime: db.serverDate()
    }
    if (users.data.length) {
      await db.collection('users').doc(users.data[0]._id).update({ data })
    } else {
      await db.collection('users').add({ data: { ...data, createTime: db.serverDate() } })
    }
    if (isAuthorized) {
      await db.collection('user_authorizations').add({
        data: {
          _openid: openid,
          action: 'profile_authorization',
          status: 'authorized',
          source: authorizationSource || 'profile_page',
          avatarUrl: nextAvatarUrl,
          nicknameHash: crypto.createHash('sha256').update(nextNickname).digest('hex'),
          completedAt: db.serverDate(),
          createTime: db.serverDate()
        }
      })
    }
    return { code: 0, message: 'success', data: null }
  } catch (err) {
    console.error('[updateUserProfile]', err)
    return { code: -1, message: err.message || '保存个人信息失败', data: null }
  }
}
