(() => viewer.eventGroups.map((g,i)=>({ i, id:g.eventId, segs:(g.segments||[]).length })).filter(o=>o.segs>1))()
