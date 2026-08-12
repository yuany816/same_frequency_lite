const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const inviteId = event && event.inviteId
    if (!inviteId) throw new Error('邀请信息不完整')
    const result = await db.collection('relationship_invites').where({ token: inviteId, status: 'pending' }).limit(1).get()
    const invite = result.data[0]
    if (!invite || invite.inviterOpenid === openid) throw new Error('邀请无效或已处理')
    await db.collection('relationship_invites').doc(invite._id).update({
      data: { status: 'rejected', rejectedBy: openid, rejectedAt: db.serverDate() }
    })
    let notified = true
    try {
      await cloud.openapi.subscribeMessage.send({
        touser: invite.inviterOpenid,
        templateId: process.env.INVITE_RESULT_TEMPLATE_ID,
        page: 'pages/onboarding/index',
        data: { thing1: { value: '情侣邀请被拒绝' }, thing2: { value: '对方暂时拒绝了你的情侣邀请' } }
      })
    } catch (notifyError) {
      notified = false
      console.warn('[rejectInvite] notification failed', notifyError)
    }
    return { code: 0, message: 'success', data: { notified } }
  } catch (err) {
    console.error('[rejectInvite]', err)
    return { code: -1, message: err.message || '拒绝邀请失败', data: null }
  }
}
