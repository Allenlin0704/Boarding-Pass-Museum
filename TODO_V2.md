# BoardingPassMuseum V2 / Long-term TODO

最后更新：2026-08-30

---

# 🔥 今晚必须完成

- [yes] 三级角色系统
      user / administrator / superadministrator

- [yes] 管理员申请
      用户申请成为 administrator
      SA 审核申请

- [yes] SA 管理管理员
      批准 / 拒绝 / 撤销管理员

- [yes] 投稿自动分配审核管理员
      新投稿自动分配给待审核数量最少的普通管理员

- [yes] Admin Pending 权限
      普通管理员只能看到 reviewer_id = 自己的 pending

- [yes] Admin Approve 权限
      普通管理员只能批准自己负责的 pending
      SA 可以批准任何展品

- [yes] Admin Reject 权限
      普通管理员只能拒绝自己负责的 pending
      SA 可以拒绝任何展品
      必须填写拒绝原因

- [yes] 🔥 我的投稿
      显示自己的全部投稿
      pending / approved / rejected
      显示拒绝原因
      状态与服务器数据库同步

- [yes] 🔥 管理员审核分配完善
      确认新投稿自动进入管理员工作池
      确认 Admin 只能处理自己的投稿
      确认 SA 不参与普通投稿自动分配
      确认 SA 可以接管任何展品

- [ ] 🔥 SA 工作台
      查看全部投稿
      查看全部 pending
      查看全部 approved
      查看全部 rejected
      查看审核管理员
      SA 可直接审核任何展品
      SA 可覆盖普通管理员审核结果

- [x] 🔥 最终权限测试
      USER
      ADMIN
      SA
      分别测试所有越权情况



---



# 🟡 V2 后续

## 审核系统

- [ ] 审核历史记录
- [ ] 记录每次审核人
- [ ] 记录审核时间
- [ ] 记录审核前后状态
- [ ] Admin 审核统计
- [ ] SA 审核统计
- [ ] Admin 工作量统计
- [ ] SA 强制重新分配审核
- [ ] 审核搜索 / 筛选

## 我的投稿

- [ ] 投稿状态卡片优化
- [ ] 审核时间
- [ ] 审核人
- [ ] 拒绝原因展示优化
- [ ] 投稿修改后重新提交（以后再决定）

## 展品

- [ ] 展品纠错
- [ ] Admin 编辑展品
- [ ] SA 编辑展品
- [ ] 展品编辑历史
- [ ] 更强的展品搜索
- [ ] 航司筛选
- [ ] 机场筛选
- [ ] 年份筛选
- [ ] 航班号搜索


## 社区

- [ ] 举报帖子
- [ ] SA 举报管理
- [x] 敏感词过滤
- [x] 社区置顶
- [x] 社区公告
- [ ] 举报记录

---

# 🔵 正式上线后再做

- [yes] 用户等级
- [ ] 用户徽章
- [ ] 飞行次数统计
- [ ] 航司收藏
- [ ] 机场收藏
- [ ] 飞行地图
- [ ] 年度飞行报告
- [ ] 展品排行榜
- [ ] 航司统计
- [ ] 机场统计
- [ ] 通知系统
- [ ] PWA
- [ ] 多语言
- [ ] API
- [x] 移动端进一步优化

---

# ❌ 明确不做

- [x] 社区帖子申诉
- [x] 帖子被 SA 下架后的申诉流程
- [x] 重复开发已经完成的系统公告
- [x] 重复开发管理员申请


---

# Product extensions / 多语言 (2026-09-27)

## In progress / completed

- [ ] English and Traditional Chinese localization across public pages and interactions
- [ ] Keep user-submitted stories, posts, and comments in their original language

## Next product ideas

- [ ] Expand ticket types beyond boarding passes and rail tickets; define the supported metadata and privacy rules for each type before implementation
- [ ] Build a journey timeline grouped by trip date and city, with links between an arrival and the next departure
- [ ] Link related exhibits using explainable signals: same flight number, route, date, airport, operator, or journey
- [ ] Add a related-exhibits section to exhibit detail pages, with links to each record
- [ ] Consider collection maps and city/airport visit statistics after the core timeline data is reliable

Implementation order: finish language QA first; then agree on ticket categories and fields; next add the timeline and exhibit relationships using existing exhibit data where possible.
