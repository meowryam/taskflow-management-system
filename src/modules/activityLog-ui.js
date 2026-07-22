/**
 * activityLog-ui.js — Activity Log presentation layer
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

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .al-card {
        background: var(--card-bg, #fff);
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        padding: 20px 24px;
        margin-bottom: 20px;
      }
      .al-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }
      .al-header h2 { margin: 0; font-size: 1.5rem; }
      .al-count { color: var(--color-gray-500, #7d7256); font-size: 14px; }
      .al-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px;
      }
      .al-filters label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
        color: var(--color-gray-500, #7d7256);
        min-width: 140px;
      }
      .al-filters input,
      .al-filters select {
        padding: 7px 10px;
        border: 1px solid var(--color-gray-200, #e6dcc0);
        border-radius: 6px;
        font-size: 13px;
        font-family: inherit;
      }
      .al-filters__search { flex: 1; min-width: 200px; }
      .al-clear-btn {
        align-self: flex-end;
        padding: 7px 14px;
        border: 1px solid var(--color-gray-200, #e6dcc0);
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        font-size: 13px;
      }
      .al-feed { display: flex; flex-direction: column; gap: 10px; }
      .al-entry {
        display: grid;
        grid-template-columns: 150px 120px 130px 1fr;
        gap: 12px;
        align-items: start;
        padding: 12px 0;
        border-bottom: 1px solid var(--color-gray-200, #e6dcc0);
      }
      .al-entry:last-child { border-bottom: none; }
      .al-time { font-size: 13px; color: var(--color-gray-500, #7d7256); }
      .al-actor { font-size: 13px; font-weight: 600; }
      .al-badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      }
      .al-badge--Created { background: #d4edda; color: #155724; }
      .al-badge--Updated { background: #e8ecd7; color: #4f5c29; }
      .al-badge--Deleted { background: #f8d7da; color: #721c24; }
      .al-badge--Assigned { background: #d1ecf1; color: #0c5460; }
      .al-badge--StatusChanged { background: #cce5ff; color: #004085; }
      .al-badge--PriorityChanged { background: #fff3cd; color: #856404; }
      .al-badge--Completed { background: #d4edda; color: #155724; }
      .al-detail { font-size: 14px; color: var(--color-gray-800, #2c2820); }
      .al-empty {
        text-align: center;
        color: var(--color-gray-400, #a89b78);
        padding: 40px 0;
      }
      .al-dashboard-feed { display: flex; flex-direction: column; gap: 10px; }
      .al-dashboard-item {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        font-size: 13px;
      }
      .al-dashboard-item__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--color-primary, #6b7a3a);
        margin-top: 5px;
        flex-shrink: 0;
      }
      .al-dashboard-item__text { flex: 1; line-height: 1.4; }
      .al-dashboard-item__time {
        font-size: 11px;
        color: var(--color-gray-400, #a89b78);
        margin-top: 2px;
      }
      .al-view-all {
        margin-top: 8px;
        font-size: 13px;
        color: var(--color-primary, #6b7a3a);
        text-decoration: none;
        font-weight: 600;
      }
      .al-view-all:hover { text-decoration: underline; }
      @media (max-width: 768px) {
        .al-entry { grid-template-columns: 1fr; gap: 4px; }
      }
    `;
    document.head.appendChild(style);
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

  function badgeClass(actionType) {
    return 'al-badge al-badge--' + actionType.replace(/\s+/g, '');
  }

  function renderFeedHtml(entries, compact) {
    if (!entries.length) {
      return '<p class="al-empty">No activity entries found.</p>';
    }

    if (compact) {
      return entries.map(function (entry) {
        return (
          '<div class="al-dashboard-item">' +
            '<span class="al-dashboard-item__dot" aria-hidden="true"></span>' +
            '<div class="al-dashboard-item__text">' +
              '<div>' + escapeHtml(entry.actionDetail) + '</div>' +
              '<div class="al-dashboard-item__time">' +
                escapeHtml(entry.userName) + ' · ' + formatRelativeTime(entry.occurredAt) +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }

    return entries.map(function (entry) {
      return (
        '<article class="al-entry">' +
          '<time class="al-time" datetime="' + escapeHtml(entry.occurredAt) + '">' +
            escapeHtml(formatTimestamp(entry.occurredAt)) +
          '</time>' +
          '<div class="al-actor">' + escapeHtml(entry.userName || 'System') + '</div>' +
          '<span class="' + badgeClass(entry.actionType) + '">' + escapeHtml(entry.actionType) + '</span>' +
          '<p class="al-detail">' + escapeHtml(entry.actionDetail) + '</p>' +
        '</article>'
      );
    }).join('');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

  function renderPage(container) {
    const entries = getFilteredEntries();
    container.innerHTML =
      '<div class="al-card">' +
        '<div class="al-header">' +
          '<h2>Activity Log</h2>' +
          '<span class="al-count">' + entries.length + ' entries</span>' +
        '</div>' +
        '<div class="al-filters">' +
          '<label>Entity Type' +
            '<select id="alFilterEntity">' +
              buildFilterOptions(['all'].concat(ActivityLog.ENTITY_TYPES), filters.entityType) +
            '</select>' +
          '</label>' +
          '<label>Action Type' +
            '<select id="alFilterAction">' +
              buildFilterOptions(['all'].concat(ActivityLog.ACTION_TYPES), filters.actionType) +
            '</select>' +
          '</label>' +
          '<label class="al-filters__search">Search' +
            '<input type="search" id="alFilterSearch" placeholder="Search details or user..." value="' +
              escapeHtml(filters.search) + '" />' +
          '</label>' +
          '<button type="button" class="al-clear-btn" id="alClearFilters">Clear</button>' +
        '</div>' +
        '<div class="al-feed" id="alFeed">' + renderFeedHtml(entries, false) + '</div>' +
      '</div>';

    const entitySelect = container.querySelector('#alFilterEntity');
    const actionSelect = container.querySelector('#alFilterAction');
    const searchInput = container.querySelector('#alFilterSearch');
    const clearBtn = container.querySelector('#alClearFilters');

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
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        filters = { entityType: 'all', actionType: 'all', search: '' };
        renderPage(container);
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
        renderFeedHtml(entries, true) +
      '</div>' +
      '<a href="#" class="al-view-all" id="alViewAllLink">View all activity</a>';

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
