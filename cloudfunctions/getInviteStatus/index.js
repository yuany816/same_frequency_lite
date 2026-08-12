const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const inviteId = event && event.inviteId
    const result = await db.collection('relationship_invites').where({ token: inviteId, inviterOpenid: openid }).limit(1).get()
    const invite = result.data[0]
    return { code: 0, message: 'success', data: invite ? { status: invite.status } : null }
  } catch (err) {
    console.error('[getInviteStatus]', err)
    return { code: -1, message: err.message || '读取邀请状态失败', data: null }
  }
}
