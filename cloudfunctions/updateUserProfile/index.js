const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { nickname, avatarUrl, genderRole } = event || {}
    if (!openid) throw new Error('微信登录态无效')
    if (!nickname || nickname.trim().length > 20) throw new Error('昵称不合法')
    const users = await db.collection('users').where({ _openid: openid }).limit(1).get()
    const data = { nickname: nickname.trim(), avatarUrl: avatarUrl || '', genderRole: genderRole || null, updateTime: db.serverDate() }
    if (users.data.length) {
      await db.collection('users').doc(users.data[0]._id).update({ data })
    } else {
      await db.collection('users').add({ data: { ...data, createTime: db.serverDate() } })
    }
    return { code: 0, message: 'success', data: null }
  } catch (err) {
    console.error('[updateUserProfile]', err)
    return { code: -1, message: err.message || '保存个人信息失败', data: null }
  }
}
