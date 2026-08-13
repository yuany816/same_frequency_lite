const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const validStatuses = new Set(['prompted', 'confirmed', 'declined', 'cancelled', 'failed'])

exports.main = async (event) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { status, source, errorCode } = event || {}
    if (!openid) throw new Error('微信登录态无效')
    if (!validStatuses.has(status)) throw new Error('授权状态无效')
    const data = {
        _openid: openid,
        action: 'profile_authorization',
        status,
        source: source || 'home_bottom_sheet',
        errorCode: errorCode || '',
        createTime: db.serverDate()
    }
    if (status === 'prompted') data.promptedAt = db.serverDate()
    if (status === 'confirmed') data.confirmedAt = db.serverDate()
    await db.collection('user_authorizations').add({ data })
    return { code: 0, message: 'success', data: null }
  } catch (err) {
    console.error('[recordProfileAuthorization]', err)
    return { code: -1, message: err.message || '授权记录保存失败', data: null }
  }
}
