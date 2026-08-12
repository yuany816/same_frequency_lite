const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const openid = cloud.getWXContext().OPENID
    if (!openid) throw new Error('微信登录态无效，请重新登录')
    const relationships = await db.collection('relationships').where({ memberOpenids: openid, status: 'active' }).limit(1).get()
    let users = await db.collection('users').where({ _openid: openid }).limit(1).get()
    if (!users.data.length) {
      await db.collection('users').add({
        data: {
          nickname: '',
          avatarUrl: '',
          genderRole: null,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      users = await db.collection('users').where({ _openid: openid }).limit(1).get()
    }
    const user = users.data[0] || {}
    return {
      code: 0,
      message: 'success',
      data: {
        openid,
        relationshipId: relationships.data[0] ? relationships.data[0]._id : '',
        nickname: user.nickname || '',
        avatarUrl: user.avatarUrl || '',
        role: user.genderRole || null,
        authorized: Boolean(user.nickname || user.avatarUrl)
      }
    }
  } catch (err) {
    console.error('[login]', err)
    return { code: -1, message: err.message || '登录失败', data: null }
  }
}
