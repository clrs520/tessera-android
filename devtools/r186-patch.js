// R186 · 批量删除：只加方法，不动单事件那条链的形状（单删仍是 {event,targets}）。
const fs = require('fs');
const p = 'TDashcamStudio/src/script.js';
let s = fs.readFileSync(p, 'utf8');
const must = (needle) => { if (!s.includes(needle)) throw new Error('anchor missing: ' + needle.slice(0, 60)); };

const SELECTION = `    /**
     * R186 · 批量删除（A 案：抽屉顶栏「选择」）。选择态只做三件事：点卡勾选、全选、删掉勾中的。
     * 单条删除那条链（openDeleteConfirm → confirmDeleteEvent → undo/flush）一个字段都没改形状，
     * 批量只是给同一个 confirmDeleteEvent 多塞了一个 \`items\` —— 少一条并行的删除路径，就少一处
     * 以后只修一半的地方。
     */
    setSelectionMode(on) {
        const want = !!on;
        if (this.selectionMode === want) return;
        this.selectionMode = want;
        if (!want) this.selection.clear();
        this.dom.sidebar?.classList.toggle('select-mode', want);
        const t = i18n[this.currentLanguage];
        if (this.dom.drawerSelectBtn) this.dom.drawerSelectBtn.textContent = want ? t.selectCancel : t.selectMode;
        if (this.dom.selectAllBtn) { this.dom.selectAllBtn.hidden = !want; this.dom.selectAllBtn.textContent = t.selectAll; }
        if (this.dom.batchDeleteBtn) this.dom.batchDeleteBtn.hidden = !want;
        // 卡片要换成「点=勾选」的那一套 onclick（见 VideoListComponent 的卡片构建），所以整表重建一次。
        this.videoListComponent?.render(this.lastFilteredEvents || []);
        this.updateSelectionUI();
        haptic('light');
    }

    toggleSelectAll() {
        const t = i18n[this.currentLanguage];
        const selectable = (this.lastFilteredEvents || []).filter((e) => this.eventDeleteTargets(e));
        const all = selectable.length && selectable.every((e) => this.selection.has(e.eventId));
        this.selection.clear();
        if (!all) selectable.forEach((e) => this.selection.add(e.eventId));
        for (const card of (this.dom.fileList?.querySelectorAll('.video-card') || [])) {
            const on = this.selection.has(card.dataset.eventId);
            card.classList.toggle('picked', on);
            card.setAttribute('aria-selected', String(on));
        }
        if (!selectable.length) this.showToast(t.deleteSharedDir, 'error', 4000);
        this.updateSelectionUI();
        haptic('light');
    }

    toggleEventSelection(eventId) {
        const t = i18n[this.currentLanguage];
        const ev = (this.lastFilteredEvents || []).find((e) => e.eventId === eventId);
        if (!ev) return;
        if (!this.eventDeleteTargets(ev)) {
            // 循环录像没有自己的文件夹 —— 与左滑/长按菜单同一条规则，说同一句话，不是静默不动。
            this.showToast(t.deleteSharedDir, 'error', 4000);
            return;
        }
        if (this.selection.has(eventId)) this.selection.delete(eventId);
        else this.selection.add(eventId);
        // 只改这一张卡：整表重排会把滚动位置和正在加载的缩略图一起丢掉。
        const card = this.dom.fileList?.querySelector(\`.video-card[data-event-id="\${CSS.escape(eventId)}"]\`);
        if (card) {
            card.classList.toggle('picked', this.selection.has(eventId));
            card.setAttribute('aria-selected', String(this.selection.has(eventId)));
        }
        haptic('light');
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        const t = i18n[this.currentLanguage];
        const n = this.selection.size;
        const title = this.dom.sidebar?.querySelector('.header-page-name');
        if (title) title.textContent = this.selectionMode ? t.selectedCount.replace('{n}', n) : (t.tabClips || title.textContent);
        if (this.dom.batchDeleteBtn) {
            this.dom.batchDeleteBtn.disabled = n === 0;
            this.dom.batchDeleteBtn.textContent = n ? t.deleteSelected.replace('{n}', n) : t.deleteConfirmOk;
        }
    }

    openBatchDeleteConfirm() {
        const t = i18n[this.currentLanguage];
        const list = this.lastFilteredEvents || [];
        const items = [...this.selection]
            .map((id) => list.find((e) => e.eventId === id))
            .filter(Boolean)
            .map((event) => ({ event, targets: this.eventDeleteTargets(event) }))
            .filter((item) => item.targets && item.targets.length);
        if (!items.length) return;

        const dom = this.deleteDom || (this.deleteDom = {
            modal: document.getElementById('deleteConfirmModal'),
            title: document.getElementById('deleteConfirmTitle'),
            summary: document.getElementById('deleteConfirmSummary'),
            list: document.getElementById('deleteConfirmList'),
            warn: document.getElementById('deleteConfirmWarn'),
            cancel: document.getElementById('deleteCancelBtn'),
            ok: document.getElementById('deleteConfirmBtn'),
        });
        if (!dom.modal) return;

        const targets = [...new Set(items.flatMap((item) => item.targets))];
        this.pendingDelete = { items, targets };
        dom.title.textContent = t.deleteBatchTitle.replace('{n}', items.length);
        dom.summary.textContent = t.deleteBatchSummary
            .replace('{events}', items.length).replace('{files}', targets.length);
        dom.warn.textContent = t.deleteConfirmWarn;
        dom.cancel.textContent = t.deleteConfirmCancel;
        dom.ok.textContent = t.deleteConfirmOk;

        dom.list.textContent = '';
        items.slice(0, 10).forEach((item) => {
            const when = this.videoListComponent?.parseTimestamp(item.event.startTime);
            const label = when && !isNaN(when.getTime())
                ? this.videoListComponent.formatCardTime(when)
                : item.event.startTime.replace('_', ' ');
            const type = this.videoListComponent?.getEventTypeLabel(item.event.eventType) || '';
            const li = document.createElement('li');
            li.textContent = \`\${type} \${label}\`.trim();
            dom.list.appendChild(li);
        });
        if (items.length > 10) {
            const li = document.createElement('li');
            li.textContent = t.deleteConfirmMore.replace('{n}', items.length - 10);
            dom.list.appendChild(li);
        }

        dom.modal.style.display = 'flex';
        dom.modal.classList.add('show');
        this.syncBackLayers?.();
    }

`;

must('    openDeleteConfirm(event) {');
s = s.replace('    openDeleteConfirm(event) {', SELECTION + '    openDeleteConfirm(event) {');

// ① confirmDeleteEvent：认 items（单删时 items 就是一条）
const oldConfirmHead = `        // R98: nothing is unlinked yet. The card leaves now, the files leave when the undo bar below
        // expires, and 撤销 puts the row back with the clips untouched — the only undo a filesystem
        // with no trash can honestly offer. If the app dies inside the window the files survive and
        // the next scan shows the card again, which is the safe direction to be wrong in.
        const paths = new Set(job.targets);
        // R185: 先记锚再动数据 —— 删完跳回开头是因为 render() 清空容器后 scrollTop 被夹到 0。
        const listAnchor = this.captureListAnchor(new Set([job.event.eventId]));
        const index = this.eventGroups.findIndex(each => each.eventId === job.event.eventId);
        const removedFiles = this.allFiles.filter(file => paths.has(file.path));
        this.allFiles = this.allFiles.filter(file => !paths.has(file.path));
        const kept = this.eventAfterDelete(job.event, paths);
        this.eventGroups = this.eventGroups
            .map(each => each.eventId === job.event.eventId ? kept : each)
            .filter(Boolean);
        this.filterAndRender({ anchor: listAnchor });
        if (!this.currentEvent) this.showPlayerEmptyState();
        this.armDeleteUndo({ event: job.event, targets: job.targets, removedFiles, index });`;
const newConfirmTail = `        // R98: nothing is unlinked yet. The card leaves now, the files leave when the undo bar below
        // expires, and 撤销 puts the row back with the clips untouched — the only undo a filesystem
        // with no trash can honestly offer. If the app dies inside the window the files survive and
        // the next scan shows the card again, which is the safe direction to be wrong in.
        // R186: 批量走的是同一条链，只是 \`items\` 多于一条；单删时它恰好只有一条。
        const items = (job.items && job.items.length) ? job.items : [{ event: job.event, targets: job.targets }];
        const paths = new Set(job.targets || items.flatMap((item) => item.targets));
        const ids = new Set(items.map((item) => item.event.eventId));
        // R185: 先记锚再动数据 —— 删完跳回开头是因为 render() 清空容器后 scrollTop 被夹到 0。
        const listAnchor = this.captureListAnchor(ids);
        const removedFiles = this.allFiles.filter(file => paths.has(file.path));
        this.allFiles = this.allFiles.filter(file => !paths.has(file.path));
        const removedItems = [];
        for (const item of items) {
            const index = this.eventGroups.findIndex(each => each.eventId === item.event.eventId);
            removedItems.push({
                event: item.event,
                targets: item.targets,
                removedFiles: removedFiles.filter(file => item.targets.includes(file.path)),
                index,
            });
            const kept = this.eventAfterDelete(item.event, new Set(item.targets));
            this.eventGroups = this.eventGroups.map(each => each.eventId === item.event.eventId ? kept : each);
        }
        this.eventGroups = this.eventGroups.filter(Boolean);
        this.filterAndRender({ anchor: listAnchor });
        if (!this.currentEvent) this.showPlayerEmptyState();
        this.armDeleteUndo({ items: removedItems, targets: [...paths] });`;
must(oldConfirmHead);
s = s.replace(oldConfirmHead, newConfirmTail);

// ② 播放中的事件判断：单删时用 job.event，批量时看 ids（同一段代码上面已算好，这里只改引用）
const oldPlaying = `        if (this.currentEvent?.eventId === job.event.eventId) {`;
must(oldPlaying);
s = s.replace(oldPlaying, `        if (this.currentEvent && (job.items ? items.some((item) => item.event.eventId === this.currentEvent.eventId) : this.currentEvent.eventId === job.event.eventId)) {`);

// ③ armDeleteUndo：items 也要带上 folderPath（restoreDeletedEvent 用它判「这还是不是同一份列表」）
const oldArm = `        job.folderPath = this.lastScannedPath;`;
must(oldArm);
s = s.replace(oldArm, `        job.folderPath = this.lastScannedPath;\n        for (const item of (job.items || [])) item.folderPath = job.folderPath;`);

// ④ flush：逐个还原/遗忘
const oldFlush = `        if (!this.restoreDeletedEvent(job, gone)) {
            // A dead id costs nothing to keep and everything to find later: the star row, the resume
            // position and the 「只看收藏」 filter would all keep naming a clip that is gone.
            this.forgetDeletedEvent(job.event.eventId);
        }`;
must(oldFlush);
s = s.replace(oldFlush, `        for (const item of (job.items || [job])) {
            if (!this.restoreDeletedEvent(item, gone)) {
                // A dead id costs nothing to keep and everything to find later: the star row, the resume
                // position and the 「只看收藏」 filter would all keep naming a clip that is gone.
                this.forgetDeletedEvent(item.event.eventId);
            }
        }`);

// ⑤ undo：逐个放回
const oldUndo = `        this.restoreDeletedEvent(job, new Set());`;
must(oldUndo);
s = s.replace(oldUndo, `        for (const item of (job.items || [job])) this.restoreDeletedEvent(item, new Set());`);

fs.writeFileSync(p, s);
console.log('batch delete wired');
