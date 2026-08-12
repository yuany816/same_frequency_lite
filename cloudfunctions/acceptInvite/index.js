const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const token = event && event.inviteId
    if (!token) throw new Error('邀请信息不完整')
    const inviteResult = await db.collection('relationship_invites').where({ token, status: 'pending' }).limit(1).get()
    const invite = inviteResult.data[0]
    if (!invite || invite.inviterOpenid === openid) throw new Error('邀请无效或已失效')
    const role = invite.inviterRole === '男方' ? '女方' : '男方'
    const active = await db.collection('relationships').where({ memberOpenids: openid, status: 'active' }).limit(1).get()
    if (active.data.length) throw new Error('你已经有情侣关系')
    const created = await db.collection('relationships').add({
      data: {
        memberOpenids: [invite.inviterOpenid, openid],
        roles: { [invite.inviterOpenid]: invite.inviterRole, [openid]: role },
        status: 'active',
        linkedAt: db.serverDate(),
        createTime: db.serverDate()
      }
    })
    await db.collection('relationship_invites').doc(invite._id).update({
      data: { status: 'accepted', acceptedBy: openid, acceptedAt: db.serverDate(), relationshipId: created._id }
    })
    let notified = true
    try {
      await cloud.openapi.subscribeMessage.send({
        touser: invite.inviterOpenid,
        templateId: process.env.INVITE_RESULT_TEMPLATE_ID,
        page: 'pages/onboarding/index',
        data: { thing1: { value: '情侣邀请已同意' }, thing2: { value: '对方已同意你的情侣邀请，可以开始你们的小日子了' } }
      })
    } catch (notifyError) {
      notified = false
      console.warn('[acceptInvite] notification failed', notifyError)
    }
    return { code: 0, message: 'success', data: { relationshipId: created._id, role, inviterName: invite.inviterName || '你的另一半', notified } }
  } catch (err) {
    console.error('[acceptInvite]', err)
    return { code: -1, message: err.message || '接受邀请失败', data: null }
  }
}
