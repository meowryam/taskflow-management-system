/**
 * activityLog-ui.js — Activity Log presentation layer
 *
 * v2: Aligned with the Dashboard design system. The full-page view now
 * uses a .widget-card glass shell, design tokens, per-action SVG icons,
 * token-aligned action colours, and date grouping (Today / Yesterday /
 * older). The dashboard Recent Activity feed items are colour-coded per
 * action. Added a "Clear activity log" action backed by a styled
 * confirmation dialog (ActivityLog.clearAll() lives in the logic layer).
 */

const ActivityLogUI = (function () {
  'use strict';

  const STYLE_ID = 'activity-log-module-styles';
  let mounted = false;
  let filters = {
    entityType: 'all',
    actionType: 'all',
    search: ''
  };

  // Per-action SVG icons (stroke: currentColor, inherit accent colour).
  const ACTION_ICONS = {
    Created: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    Updated: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
    Deleted: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
    Assigned: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>',
    'Status Changed': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    'Priority Changed': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    Completed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
  };
  const DEFAULT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/></svg>';

  function actionKey(actionType) {
    return String(actionType || '').replace(/\s+/g, '');
  }

  function iconFor(actionType) {
    return ACTION_ICONS[actionType] || DEFAULT_ICON;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .al-view {
        display: flex;
        flex-direction: column;
        gap: 24px;
        animation: slideUpFade 0.5s cubic-bezier(0.16,1,0.3,1) both;
      }
      .al-header__actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .al-filters {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 12px;
        margin-bottom: 18px;
      }
      .al-filters .pm-form-row { margin-bottom: 0; }
      .al-filters__search { flex: 1; min-width: 200px; }

      .al-feed { display: flex; flex-direction: column; gap: 20px; }
      .al-group { display: flex; flex-direction: column; gap: 8px; }
      .al-group__label {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: rgba(44,40,32,0.4);
        padding-bottom: 4px;
      }

      /* Per-action accent tokens (shared by icon, badge and dot) */
      .al-acc--Created         { --al-accent:#5f6e35; --al-accent-bg:rgba(154,170,99,0.16); }
      .al-acc--Updated         { --al-accent:#4a6fa5; --al-accent-bg:rgba(182,202,237,0.28); }
      .al-acc--Deleted         { --al-accent:#a8452f; --al-accent-bg:rgba(168,69,47,0.12); }
      .al-acc--Assigned        { --al-accent:#b8699a; --al-accent-bg:rgba(243,183,218,0.24); }
      .al-acc--StatusChanged   { --al-accent:#6d28d9; --al-accent-bg:rgba(124,58,237,0.12); }
      .al-acc--PriorityChanged { --al-accent:#8a6d1f; --al-accent-bg:rgba(246,216,104,0.30); }
      .al-acc--Completed       { --al-accent:#16a34a; --al-accent-bg:rgba(34,197,94,0.14); }

      .al-entry {
        --al-accent:#7a8a4a;
        --al-accent-bg:rgba(154,170,99,0.14);
        display: flex;
        gap: 14px;
        align-items: flex-start;
        padding: 12px;
        border-radius: 14px;
        transition: background 0.25s ease;
      }
      .al-entry:hover { background: rgba(154,170,99,0.05); }
      .al-entry__icon {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        border-radius: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--al-accent-bg);
        color: var(--al-accent);
      }
      .al-entry__icon svg { width: 18px; height: 18px; }
      .al-entry__body { flex: 1; min-width: 0; }
      .al-entry__top {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-bottom: 3px;
      }
      .al-actor {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--color-gray-800, #2c2820);
      }
      .al-badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 50px;
        font-size: 0.66rem;
        font-weight: 600;
        white-space: nowrap;
        background: var(--al-accent-bg);
        color: var(--al-accent);
      }
      .al-time {
        margin-left: auto;
        font-size: 0.72rem;
        color: rgba(44,40,32,0.4);
        white-space: nowrap;
      }
      .al-detail {
        margin: 0;
        font-size: 0.85rem;
        color: rgba(44,40,32,0.6);
        line-height: 1.45;
        overflow-wrap: break-word;
      }

      /* Dashboard Recent Activity feed */
      .al-dashboard-feed { display: flex; flex-direction: column; gap: 12px; }
      .al-dashboard-item {
        --al-accent:#7a8a4a;
        display: flex;
        gap: 10px;
        align-items: flex-start;
        font-size: 0.82rem;
      }
      .al-dashboard-item__dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--al-accent);
        margin-top: 5px;
        flex-shrink: 0;
      }
      .al-dashboard-item__text { flex: 1; min-width: 0; line-height: 1.4; color: var(--color-gray-800, #2c2820); }
      .al-dashboard-item__time {
        font-size: 0.7rem;
        color: rgba(44,40,32,0.4);
        margin-top: 2px;
      }
      .al-view-all {
        display: inline-block;
        margin-top: 12px;
        font-size: 0.78rem;
        color: var(--color-primary-dark, #7a8a4a);
        text-decoration: none;
        font-weight: 600;
      }
      .al-view-all:hover { text-decoration: underline; }

      /* Styled clear-log confirmation dialog */
      .al-dialog-overlay {
        position: fixed;
        inset: 0;
        background: rgba(26,23,18,0.45);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        z-index: 2000;
        animation: alDialogFade 0.2s ease;
      }
      .al-dialog {
        background: rgba(255,255,255,0.9);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255,255,255,0.6);
        border-radius: 20px;
        padding: 26px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.22);
        animation: alDialogIn 0.25s cubic-bezier(0.16,1,0.3,1);
      }
      .al-dialog__title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--color-gray-900, #1a1712);
        margin: 0 0 10px;
      }
      .al-dialog__msg {
        font-size: 0.88rem;
        color: var(--color-gray-600, #5c5340);
        line-height: 1.5;
        margin: 0 0 20px;
      }
      .al-dialog__actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      @keyframes alDialogFade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes alDialogIn {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      @media (max-width: 768px) {
        .al-filters__search { flex: 1 1 100%; }
        .al-time { margin-left: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatTimestamp(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatTimeOnly(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function formatRelativeTime(iso) {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return minutes + 'm ago';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.floor(hours / 24);
    return days + 'd ago';
  }

  // Returns a day-group label: "Today", "Yesterday", or a formatted date.
  function dateGroupLabel(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Earlier';
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const now = new Date();
    const dayMs = 86400000;
    const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / dayMs);
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function renderEntryHtml(entry) {
    const acc = actionKey(entry.actionType);
    return (
      '<article class="al-entry al-acc--' + acc + '">' +
        '<div class="al-entry__icon" aria-hidden="true">' + iconFor(entry.actionType) + '</div>' +
        '<div class="al-entry__body">' +
          '<div class="al-entry__top">' +
            '<span class="al-actor">' + escapeHtml(entry.userName || 'System') + '</span>' +
            '<span class="al-badge">' + escapeHtml(entry.actionType) + '</span>' +
            '<time class="al-time" datetime="' + escapeHtml(entry.occurredAt) + '">' +
              escapeHtml(formatTimeOnly(entry.occurredAt)) +
            '</time>' +
          '</div>' +
          '<p class="al-detail">' + escapeHtml(entry.actionDetail) + '</p>' +
        '</div>' +
      '</article>'
    );
  }

  // Full-page feed: grouped by date, or an empty state.
  function renderPageFeed(entries) {
    if (!entries.length) {
      const filtered = filters.entityType !== 'all' || filters.actionType !== 'all' || filters.search !== '';
      const text = filtered ? 'No entries match your filters' : 'No activity yet';
      return (
        '<div class="widget-empty">' +
          '<div class="widget-empty__icon">' +
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' +
          '</div>' +
          '<span class="widget-empty__text">' + text + '</span>' +
        '</div>'
      );
    }

    // Entries arrive newest-first from getAll(); bucket them in order.
    const groups = [];
    const index = {};
    entries.forEach(function (entry) {
      const label = dateGroupLabel(entry.occurredAt);
      if (!(label in index)) {
        index[label] = groups.length;
        groups.push({ label: label, items: [] });
      }
      groups[index[label]].items.push(entry);
    });

    return groups.map(function (group) {
      return (
        '<div class="al-group">' +
          '<div class="al-group__label">' + escapeHtml(group.label) + '</div>' +
          group.items.map(renderEntryHtml).join('') +
        '</div>'
      );
    }).join('');
  }

  // Dashboard compact feed items.
  function renderCompactFeed(entries) {
    if (!entries.length) {
      return '<div class="widget-empty"><span class="widget-empty__text">No activity yet</span></div>';
    }
    return entries.map(function (entry) {
      return (
        '<div class="al-dashboard-item al-acc--' + actionKey(entry.actionType) + '">' +
          '<span class="al-dashboard-item__dot" aria-hidden="true"></span>' +
          '<div class="al-dashboard-item__text">' +
            '<div>' + escapeHtml(entry.actionDetail) + '</div>' +
            '<div class="al-dashboard-item__time">' +
              escapeHtml(entry.userName || 'System') + ' · ' + formatRelativeTime(entry.occurredAt) +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function buildFilterOptions(values, selected) {
    return values.map(function (value) {
      const label = value === 'all' ? 'All' : value;
      const isSelected = value === selected ? ' selected' : '';
      return '<option value="' + escapeHtml(value) + '"' + isSelected + '>' + escapeHtml(label) + '</option>';
    }).join('');
  }

  function getFilteredEntries() {
    if (typeof ActivityLog === 'undefined') return [];
    return ActivityLog.getAll({
      entityType: filters.entityType,
      actionType: filters.actionType,
      search: filters.search
    });
  }

  function canClearLog() {
    // Anyone who can reach this page (view_activity_log) may clear it;
    // the destructive action is guarded by a confirmation dialog.
    return window.Permissions && window.TaskFlowSession
      ? window.Permissions.check(window.TaskFlowSession.role, 'view_activity_log')
      : true;
  }

  function renderPage(container) {
    const entries = getFilteredEntries();
    const showClear = canClearLog();

    container.innerHTML =
      '<div class="al-view">' +
        '<div class="widget-card">' +
          '<div class="widget-card__header">' +
            '<div class="widget-card__title">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>' +
              'Activity Log' +
            '</div>' +
            '<div class="al-header__actions">' +
              '<span class="widget-card__badge">' + entries.length + ' ' + (entries.length === 1 ? 'entry' : 'entries') + '</span>' +
              (showClear ? '<button type="button" class="pm-btn pm-btn--danger pm-btn--small" id="alClearLog">Clear log</button>' : '') +
            '</div>' +
          '</div>' +
          '<div class="widget-card__body">' +
            '<div class="al-filters">' +
              '<div class="pm-form-row">' +
                '<label for="alFilterEntity">Entity Type</label>' +
                '<select id="alFilterEntity">' +
                  buildFilterOptions(['all'].concat(ActivityLog.ENTITY_TYPES), filters.entityType) +
                '</select>' +
              '</div>' +
              '<div class="pm-form-row">' +
                '<label for="alFilterAction">Action Type</label>' +
                '<select id="alFilterAction">' +
                  buildFilterOptions(['all'].concat(ActivityLog.ACTION_TYPES), filters.actionType) +
                '</select>' +
              '</div>' +
              '<div class="pm-form-row al-filters__search">' +
                '<label for="alFilterSearch">Search</label>' +
                '<input type="search" id="alFilterSearch" placeholder="Search details or user..." value="' +
                  escapeHtml(filters.search) + '" />' +
              '</div>' +
              '<button type="button" class="pm-btn pm-btn--secondary" id="alClearFilters">Clear filters</button>' +
            '</div>' +
            '<div class="al-feed" id="alFeed">' + renderPageFeed(entries) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    const entitySelect = container.querySelector('#alFilterEntity');
    const actionSelect = container.querySelector('#alFilterAction');
    const searchInput = container.querySelector('#alFilterSearch');
    const clearFiltersBtn = container.querySelector('#alClearFilters');
    const clearLogBtn = container.querySelector('#alClearLog');

    if (entitySelect) {
      entitySelect.addEventListener('change', function () {
        filters.entityType = entitySelect.value;
        renderPage(container);
      });
    }
    if (actionSelect) {
      actionSelect.addEventListener('change', function () {
        filters.actionType = actionSelect.value;
        renderPage(container);
      });
    }
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        filters.search = searchInput.value.trim();
        renderPage(container);
      });
    }
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', function () {
        filters = { entityType: 'all', actionType: 'all', search: '' };
        renderPage(container);
      });
    }
    if (clearLogBtn) {
      clearLogBtn.addEventListener('click', openClearDialog);
    }
  }

  /* ---------- Styled clear-log confirmation dialog ---------- */

  let dialogKeyHandler = null;

  function closeClearDialog() {
    const overlay = document.getElementById('al-clear-dialog');
    if (overlay) overlay.remove();
    if (dialogKeyHandler) {
      document.removeEventListener('keydown', dialogKeyHandler);
      dialogKeyHandler = null;
    }
  }

  function openClearDialog() {
    if (typeof ActivityLog === 'undefined') return;
    closeClearDialog();

    const overlay = document.createElement('div');
    overlay.className = 'al-dialog-overlay';
    overlay.id = 'al-clear-dialog';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="al-dialog">' +
        '<h3 class="al-dialog__title">Clear activity log?</h3>' +
        '<p class="al-dialog__msg">This permanently removes all activity entries. This action cannot be undone.</p>' +
        '<div class="al-dialog__actions">' +
          '<button type="button" class="pm-btn pm-btn--secondary" id="alDialogCancel">Cancel</button>' +
          '<button type="button" class="pm-btn pm-btn--danger" id="alDialogConfirm">Clear log</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeClearDialog();
    });

    dialogKeyHandler = function (e) {
      if (e.key === 'Escape') closeClearDialog();
    };
    document.addEventListener('keydown', dialogKeyHandler);

    const cancelBtn = document.getElementById('alDialogCancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeClearDialog);

    const confirmBtn = document.getElementById('alDialogConfirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        ActivityLog.clearAll();
        closeClearDialog();
        // clearAll dispatches on window; refresh both surfaces directly
        // since this module listens on document.
        refreshMountedPage();
        renderDashboardFeed();
      });
    }
  }

  function mount(container) {
    if (!container || typeof ActivityLog === 'undefined') return;
    injectStyles();
    mounted = true;
    renderPage(container);
  }

  function refreshMountedPage() {
    if (!mounted) return;
    const container = document.getElementById('activity-log-section');
    if (container) renderPage(container);
  }

  function renderDashboardFeed() {
    if (typeof ActivityLog === 'undefined') return;
    injectStyles();

    const panelBody = document.querySelector('.panel--activity .panel__body');
    if (!panelBody) return;

    panelBody.classList.remove('panel__body--placeholder');
    const entries = ActivityLog.getRecent(5);
    panelBody.innerHTML =
      '<div class="al-dashboard-feed">' +
        renderCompactFeed(entries) +
      '</div>' +
      '<a href="#" class="al-view-all" id="alViewAllLink">View all activity</a>';

    const badge = document.getElementById('activityCount');
    if (badge) {
      const total = ActivityLog.getAll().length;
      badge.textContent = total + ' update' + (total === 1 ? '' : 's');
    }

    const viewAllLink = panelBody.querySelector('#alViewAllLink');
    if (viewAllLink) {
      viewAllLink.addEventListener('click', function (event) {
        event.preventDefault();
        const navItem = document.getElementById('nav-activity-log');
        if (navItem) navItem.click();
      });
    }
  }

  if (typeof document !== 'undefined' && typeof ActivityLog !== 'undefined') {
    document.addEventListener(ActivityLog.ACTIVITY_CHANGED_EVENT, function () {
      refreshMountedPage();
    });
  }

  return {
    mount,
    renderDashboardFeed,
    refreshMountedPage
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.ActivityLogUI = ActivityLogUI;
}
