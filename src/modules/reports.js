(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────────────── */
  function safeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function getToday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getWeekStart() {
    var now = new Date();
    var day = now.getDay();
    var diff = now.getDate() - day + (day === 0 ? -6 : 1);
    var monday = new Date(now.getFullYear(), now.getMonth(), diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  function daysBetween(a, b) {
    return Math.ceil((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
  }

  function getStatusClass(status) {
    var map = {
      'done': 'status--done',
      'in progress': 'status--in-progress',
      'in-progress': 'status--in-progress',
      'review': 'status--review',
      'todo': 'status--todo'
    };
    return map[(status || '').toLowerCase()] || 'status--todo';
  }

  function getPriorityClass(priority) {
    var map = { 'high': 'priority--high', 'medium': 'priority--medium', 'low': 'priority--low' };
    return map[(priority || '').toLowerCase()] || 'priority--low';
  }

  function getProjectStatusClass(status) {
    var map = { 'active': 'pm-badge--active', 'completed': 'pm-badge--completed', 'on hold': 'pm-badge--onhold', 'planned': 'pm-badge--onhold' };
    return map[(status || '').toLowerCase()] || 'pm-badge--active';
  }

  function getPriorityLabelBadge(priority) {
    return '<span class="priority-badge ' + getPriorityClass(priority) + '">' + safeHtml(priority) + '</span>';
  }

  function getStatusLabelBadge(status) {
    return '<span class="status-badge ' + getStatusClass(status) + '">' + safeHtml(status) + '</span>';
  }

  function getProjectName(projectId, projectMap) {
    var p = projectMap[String(projectId)];
    return p ? p.name : 'Unknown Project';
  }

  function getMemberName(memberId, memberMap) {
    var m = memberMap[String(memberId)];
    return m ? m.name : 'Unassigned';
  }

  function getMemberInitials(memberId, memberMap) {
    var m = memberMap[String(memberId)];
    return m ? (m.initials || m.name.substring(0, 2).toUpperCase()) : '--';
  }

  /* ── Data Loader ─────────────────────────────────────────── */
  function loadAllData() {
    var store = globalThis.DataStore;
    if (!store) return { tasks: [], projects: [], members: [] };

    var tasks = store.getTasks();
    var projects = store.getProjects();
    var members = store.getMembers();

    var projectMap = {};
    projects.forEach(function (p) { projectMap[String(p.id)] = p; });

    var memberMap = {};
    members.forEach(function (m) { memberMap[String(m.id)] = m; });

    return { tasks: tasks, projects: projects, members: members, projectMap: projectMap, memberMap: memberMap };
  }

  /* ═══════════════════════════════════════════════════════════
     ANALYTICS ENGINE
     ═══════════════════════════════════════════════════════════ */

  function calcStats(data) {
    var tasks = data.tasks;
    var totalTasks = tasks.length;
    var completed = tasks.filter(function (t) { return (t.status || '').toLowerCase() === 'done'; }).length;
    var pending = tasks.filter(function (t) { return (t.status || '').toLowerCase() === 'todo'; }).length;
    var overdue = calcOverdueCount(tasks);
    var highPriority = tasks.filter(function (t) { return (t.priority || '').toLowerCase() === 'high'; }).length;
    var completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
    var activeProjects = data.projects.filter(function (p) { return (p.status || '').toLowerCase() === 'active'; }).length;
    var activeMembers = data.members.length;

    return {
      totalProjects: data.projects.length,
      activeProjects: activeProjects,
      totalTasks: totalTasks,
      completedTasks: completed,
      pendingTasks: pending,
      overdueTasks: overdue,
      highPriorityTasks: highPriority,
      completionRate: completionRate,
      activeMembers: activeMembers,
      inProgressTasks: tasks.filter(function (t) {
        var s = (t.status || '').toLowerCase();
        return s === 'in progress' || s === 'in-progress';
      }).length,
      reviewTasks: tasks.filter(function (t) { return (t.status || '').toLowerCase() === 'review'; }).length
    };
  }

  function calcOverdueCount(tasks) {
    var today = getToday();
    return tasks.filter(function (t) {
      var s = (t.status || '').toLowerCase();
      if (s === 'done') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < today;
    }).length;
  }

  function calcTaskStatusDistribution(tasks) {
    var counts = { Done: 0, 'In Progress': 0, Review: 0, Todo: 0 };
    tasks.forEach(function (t) {
      var s = t.status || 'Todo';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }

  function calcPriorityDistribution(tasks) {
    var counts = { High: 0, Medium: 0, Low: 0 };
    tasks.forEach(function (t) {
      var p = t.priority || 'Medium';
      counts[p] = (counts[p] || 0) + 1;
    });
    return counts;
  }

  function calcTasksPerProject(tasks, projects, projectMap) {
    var result = projects.map(function (p) {
      return {
        id: p.id,
        name: p.name || 'Untitled',
        count: tasks.filter(function (t) { return String(t.projectId) === String(p.id); }).length
      };
    });
    result.sort(function (a, b) { return b.count - a.count; });
    return result.slice(0, 10);
  }

  function calcMemberWorkload(tasks, members) {
    return members.map(function (m) {
      var memberTasks = tasks.filter(function (t) { return String(t.assignedUserId) === String(m.id); });
      var completed = memberTasks.filter(function (t) { return (t.status || '').toLowerCase() === 'done'; }).length;
      var pending = memberTasks.length - completed;
      var total = memberTasks.length;
      var completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      var workloadLevel;
      if (total >= 8) workloadLevel = 'overloaded';
      else if (total >= 5) workloadLevel = 'busy';
      else if (total >= 2) workloadLevel = 'balanced';
      else workloadLevel = 'light';

      return {
        id: m.id,
        name: m.name || 'Unknown',
        role: m.role || 'Member',
        initials: m.initials || m.name.substring(0, 2).toUpperCase(),
        email: m.email,
        totalTasks: total,
        completed: completed,
        pendingTasks: pending,
        completionRate: completionRate,
        workloadLevel: workloadLevel
      };
    }).sort(function (a, b) { return b.totalTasks - a.totalTasks; });
  }

  function calcCompletionTrend(tasks) {
    var weeks = [];
    var now = new Date();
    for (var i = 5; i >= 0; i--) {
      var weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - (i * 7));
      var weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(23, 59, 59, 999);

      var count = tasks.filter(function (t) {
        if ((t.status || '').toLowerCase() !== 'done') return false;
        if (!t.createdAt) return false;
        var d = new Date(t.createdAt);
        return d >= weekStart && d <= weekEnd;
      }).length;

      var startDate = weekStart.getDate();
      var monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][weekStart.getMonth()];
      weeks.push({ label: monthShort + ' ' + startDate, count: count });
    }
    return weeks;
  }

  function calcProjectProgress(projects, tasks) {
    return projects.map(function (p) {
      var projTasks = tasks.filter(function (t) { return String(t.projectId) === String(p.id); });
      var doneCount = projTasks.filter(function (t) { return (t.status || '').toLowerCase() === 'done'; }).length;
      var pendingCount = projTasks.filter(function (t) { return (t.status || '').toLowerCase() === 'todo'; }).length;
      var progressCount = projTasks.filter(function (t) {
        var s = (t.status || '').toLowerCase();
        return s === 'in progress' || s === 'in-progress';
      }).length;
      var reviewCount = projTasks.filter(function (t) { return (t.status || '').toLowerCase() === 'review'; }).length;
      var overdueCount = projTasks.filter(function (t) {
        var s = (t.status || '').toLowerCase();
        if (s === 'done') return false;
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < getToday();
      }).length;
      var completionRate = projTasks.length > 0 ? Math.round((doneCount / projTasks.length) * 100) : 0;
      var highCount = projTasks.filter(function (t) { return (t.priority || '').toLowerCase() === 'high'; }).length;
      var medCount = projTasks.filter(function (t) { return (t.priority || '').toLowerCase() === 'medium'; }).length;
      var lowCount = projTasks.filter(function (t) { return (t.priority || '').toLowerCase() === 'low'; }).length;

      return {
        id: p.id,
        name: p.name || 'Untitled',
        status: p.status || 'Active',
        deadline: p.deadline || null,
        totalTasks: projTasks.length,
        completed: doneCount,
        pending: pendingCount,
        inProgress: progressCount,
        review: reviewCount,
        overdue: overdueCount,
        completionRate: completionRate,
        priorityDist: { high: highCount, medium: medCount, low: lowCount }
      };
    });
  }

  function calcOverdueTasks(tasks, projectMap, memberMap) {
    var today = getToday();
    return tasks.filter(function (t) {
      var s = (t.status || '').toLowerCase();
      if (s === 'done') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < today;
    }).map(function (t) {
      return {
        id: t.id,
        title: t.title || 'Untitled',
        project: getProjectName(t.projectId, projectMap),
        member: getMemberName(t.assignedUserId, memberMap),
        priority: t.priority || 'Medium',
        dueDate: t.dueDate,
        daysOverdue: daysBetween(t.dueDate, today),
        status: t.status || 'Todo'
      };
    }).sort(function (a, b) { return b.daysOverdue - a.daysOverdue; });
  }

  function calcUpcomingDeadlines(tasks, projectMap, memberMap) {
    var today = getToday();
    return tasks.filter(function (t) {
      var s = (t.status || '').toLowerCase();
      if (s === 'done') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) >= today;
    }).map(function (t) {
      return {
        id: t.id,
        title: t.title || 'Untitled',
        project: getProjectName(t.projectId, projectMap),
        member: getMemberName(t.assignedUserId, memberMap),
        priority: t.priority || 'Medium',
        dueDate: t.dueDate,
        daysRemaining: daysBetween(today, t.dueDate),
        status: t.status || 'Todo'
      };
    }).sort(function (a, b) { return a.daysRemaining - b.daysRemaining; }).slice(0, 8);
  }

  function calcTeamPerformance(tasks, projects, members) {
    return calcMemberWorkload(tasks, members);
  }

  function calcProjectHealth(projects, tasks) {
    return projects.map(function (p) {
      var projTasks = tasks.filter(function (t) { return String(t.projectId) === String(p.id); });
      var done = projTasks.filter(function (t) { return (t.status || '').toLowerCase() === 'done'; }).length;
      var pending = projTasks.filter(function (t) { return (t.status || '').toLowerCase() === 'todo'; }).length;
      var inProgress = projTasks.filter(function (t) {
        var s = (t.status || '').toLowerCase();
        return s === 'in progress' || s === 'in-progress';
      }).length;
      var review = projTasks.filter(function (t) { return (t.status || '').toLowerCase() === 'review'; }).length;
      var overdue = projTasks.filter(function (t) {
        if ((t.status || '').toLowerCase() === 'done') return false;
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < getToday();
      }).length;
      var highPri = projTasks.filter(function (t) { return (t.priority || '').toLowerCase() === 'high'; }).length;
      var total = projTasks.length;
      var completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

      // Health score: 100-based
      var healthScore = 100;
      if (overdue > 3) healthScore -= 30;
      else if (overdue > 1) healthScore -= 15;
      else if (overdue > 0) healthScore -= 5;
      if (total > 0 && completionRate < 25) healthScore -= 25;
      else if (total > 0 && completionRate < 50) healthScore -= 10;
      if (highPri > 0 && total > 0 && completionRate < 50) healthScore -= 10;
      healthScore = Math.max(0, Math.min(100, healthScore));

      // Risk level
      var riskLevel;
      if (overdue >= 5 || (total > 0 && completionRate < 20)) riskLevel = 'critical';
      else if (overdue >= 3 || (total > 0 && completionRate < 40)) riskLevel = 'high';
      else if (overdue >= 1 || (total > 0 && completionRate < 60)) riskLevel = 'medium';
      else riskLevel = 'low';

      // Health ring color
      var healthColor;
      if (healthScore >= 80) healthColor = 'green';
      else if (healthScore >= 50) healthColor = 'amber';
      else healthColor = 'red';

      return {
        id: p.id,
        name: p.name || 'Untitled',
        status: p.status || 'Active',
        deadline: p.deadline || null,
        total: total,
        done: done,
        pending: pending,
        inProgress: inProgress,
        review: review,
        overdue: overdue,
        highPriority: highPri,
        completionRate: completionRate,
        healthScore: healthScore,
        riskLevel: riskLevel,
        healthColor: healthColor,
        priorityDist: {
          high: highPri,
          medium: projTasks.filter(function (t) { return (t.priority || '').toLowerCase() === 'medium'; }).length,
          low: projTasks.filter(function (t) { return (t.priority || '').toLowerCase() === 'low'; }).length
        }
      };
    }).sort(function (a, b) { return a.riskLevel === 'critical' || a.riskLevel === 'high' ? -1 : b.completionRate - a.completionRate; });
  }

  function calcDeliveryAnalytics(tasks) {
    var today = getToday();
    var weekStart = getWeekStart();
    var monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    var completedToday = tasks.filter(function (t) {
      if ((t.status || '').toLowerCase() !== 'done') return false;
      if (!t.createdAt) return false;
      var d = new Date(t.createdAt);
      return d >= today;
    }).length;

    var completedThisWeek = tasks.filter(function (t) {
      if ((t.status || '').toLowerCase() !== 'done') return false;
      if (!t.createdAt) return false;
      var d = new Date(t.createdAt);
      return d >= weekStart;
    }).length;

    var completedThisMonth = tasks.filter(function (t) {
      if ((t.status || '').toLowerCase() !== 'done') return false;
      if (!t.createdAt) return false;
      var d = new Date(t.createdAt);
      return d >= monthStart;
    }).length;

    var overdueCount = calcOverdueCount(tasks);
    var upcomingCount = tasks.filter(function (t) {
      if ((t.status || '').toLowerCase() === 'done') return false;
      if (!t.dueDate) return false;
      var d = daysBetween(today, t.dueDate);
      return d >= 0 && d <= 7;
    }).length;

    var totalCompleted = tasks.filter(function (t) { return (t.status || '').toLowerCase() === 'done'; }).length;
    var deliveryRate = tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0;

    return {
      completedToday: completedToday,
      completedThisWeek: completedThisWeek,
      completedThisMonth: completedThisMonth,
      overdueCount: overdueCount,
      upcomingCount: upcomingCount,
      totalCompleted: totalCompleted,
      deliveryRate: deliveryRate
    };
  }

  function generateExecutiveSnapshot(data, stats) {
    var tasks = data.tasks;
    var projects = data.projects;
    var members = data.members;
    var projectMap = data.projectMap;
    var memberMap = data.memberMap;

    var totalTasks = tasks.length;
    var completed = stats.completedTasks;
    var overdue = stats.overdueTasks;

    var workload = calcMemberWorkload(tasks, members);
    var highestWorkload = workload[0];
    var lowestWorkload = workload.length > 0 ? workload[workload.length - 1] : null;

    var projectProgress = calcProjectProgress(projects, tasks);
    var lowestProj = null;
    var lowestRate = 101;
    var closestProj = null;
    var closestRate = -1;
    projectProgress.forEach(function (p) {
      if (p.totalTasks > 0) {
        if (p.completionRate < lowestRate) { lowestRate = p.completionRate; lowestProj = p; }
        if (p.completionRate < 100 && p.completionRate > closestRate) { closestRate = p.completionRate; closestProj = p; }
      }
    });

    var mostDelayed = null;
    var maxDelay = 0;
    projectProgress.forEach(function (p) {
      if (p.overdue > maxDelay) { maxDelay = p.overdue; mostDelayed = p; }
    });

    var avgProjectCompletion = projects.length > 0
      ? Math.round(projectProgress.reduce(function (s, p) { return s + p.completionRate; }, 0) / projects.length)
      : 0;

    var overallHealth;
    if (overdue === 0 && avgProjectCompletion >= 75) overallHealth = { label: 'Excellent', level: 'good' };
    else if (overdue <= 2 && avgProjectCompletion >= 50) overallHealth = { label: 'Good', level: 'good' };
    else if (overdue <= 5) overallHealth = { label: 'Needs Attention', level: 'warning' };
    else overallHealth = { label: 'Critical', level: 'critical' };

    return {
      activeProjects: projects.filter(function (p) { return (p.status || '').toLowerCase() === 'active'; }).length,
      totalProjects: projects.length,
      totalTasks: totalTasks,
      completed: completed,
      overdue: overdue,
      pendingRatio: totalTasks > 0 ? Math.round((stats.pendingTasks / totalTasks) * 100) : 0,
      completionRatio: totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0,
      overdueRatio: totalTasks > 0 ? Math.round((overdue / totalTasks) * 100) : 0,
      highPriorityRatio: totalTasks > 0 ? Math.round((stats.highPriorityTasks / totalTasks) * 100) : 0,
      avgProjectCompletion: avgProjectCompletion,
      highestWorkload: highestWorkload,
      lowestWorkload: lowestWorkload,
      highestCompleter: workload.length > 0
        ? workload.slice().sort(function (a, b) { return b.completionRate - a.completionRate; })[0]
        : null,
      lowestProject: lowestProj,
      closestProject: closestProj,
      mostDelayed: mostDelayed,
      overallHealth: overallHealth,
      avgTasksPerMember: members.length > 0 ? Math.round(totalTasks / members.length * 10) / 10 : 0,
      avgTasksPerProject: projects.length > 0 ? Math.round(totalTasks / projects.length * 10) / 10 : 0,
      tasksDueToday: tasks.filter(function (t) {
        if ((t.status || '').toLowerCase() === 'done') return false;
        if (!t.dueDate) return false;
        return daysBetween(getToday(), t.dueDate) === 0;
      }).length,
      tasksDueThisWeek: tasks.filter(function (t) {
        if ((t.status || '').toLowerCase() === 'done') return false;
        if (!t.dueDate) return false;
        var d = daysBetween(getToday(), t.dueDate);
        return d >= 0 && d <= 7;
      }).length,
      projectsAtRisk: projectProgress.filter(function (p) {
        return p.completionRate < 50 && p.totalTasks > 0;
      }).length,
      healthyProjects: projectProgress.filter(function (p) {
        return p.completionRate >= 75 && p.totalTasks > 0;
      }).length,
      projectsNoActivity: projectProgress.filter(function (p) {
        return p.totalTasks === 0;
      }).length,
      projectsAllDone: projectProgress.filter(function (p) {
        return p.totalTasks > 0 && p.completionRate === 100;
      }).length
    };
  }

  function generateSmartInsights(data, stats, snapshot) {
    var insights = [];

    if (snapshot.highestWorkload && snapshot.highestWorkload.totalTasks > 0) {
      insights.push({
        icon: 'workload',
        iconBg: '#fef3cd',
        iconColor: '#92400e',
        text: '<strong>' + safeHtml(snapshot.highestWorkload.name) + '</strong> currently has the highest workload with <strong>' + snapshot.highestWorkload.totalTasks + ' tasks</strong> assigned.'
      });
    }

    if (snapshot.lowestWorkload && snapshot.lowestWorkload.totalTasks < 2 && snapshot.highestWorkload && snapshot.highestWorkload.totalTasks > 3) {
      insights.push({
        icon: 'balance',
        iconBg: '#dbeafe',
        iconColor: '#1e40af',
        text: '<strong>' + safeHtml(snapshot.lowestWorkload.name) + '</strong> has the lightest workload. Consider redistributing tasks for better balance.'
      });
    }

    if (snapshot.highestCompleter && snapshot.highestCompleter.completionRate > 0) {
      insights.push({
        icon: 'star',
        iconBg: '#d1fae5',
        iconColor: '#065f46',
        text: '<strong>' + safeHtml(snapshot.highestCompleter.name) + '</strong> is the most productive member with <strong>' + snapshot.highestCompleter.completionRate + '% completion rate</strong>.'
      });
    }

    if (snapshot.closestProject && snapshot.closestProject.totalTasks > 0) {
      insights.push({
        icon: 'target',
        iconBg: '#ede9fe',
        iconColor: '#5b21b6',
        text: '<strong>' + safeHtml(snapshot.closestProject.name) + '</strong> is closest to completion at <strong>' + snapshot.closestProject.completionRate + '%</strong>.'
      });
    }

    if (snapshot.mostDelayed && snapshot.mostDelayed.overdue > 0) {
      insights.push({
        icon: 'alert',
        iconBg: '#fee2e2',
        iconColor: '#dc2626',
        text: '<strong>' + safeHtml(snapshot.mostDelayed.name) + '</strong> is the most delayed project with <strong>' + snapshot.mostDelayed.overdue + ' overdue tasks</strong>.'
      });
    }

    if (snapshot.lowestProject && snapshot.lowestProject.totalTasks > 0) {
      insights.push({
        icon: 'flag',
        iconBg: '#fef3cd',
        iconColor: '#92400e',
        text: '<strong>' + safeHtml(snapshot.lowestProject.name) + '</strong> has the lowest completion rate at <strong>' + snapshot.lowestProject.completionRate + '%</strong>.'
      });
    }

    if (snapshot.avgProjectCompletion >= 0) {
      var healthColor = snapshot.avgProjectCompletion >= 70 ? 'green' : snapshot.avgProjectCompletion >= 45 ? 'amber' : 'red';
      insights.push({
        icon: 'chart',
        iconBg: healthColor === 'green' ? '#d1fae5' : healthColor === 'amber' ? '#fef3cd' : '#fee2e2',
        iconColor: healthColor === 'green' ? '#065f46' : healthColor === 'amber' ? '#92400e' : '#dc2626',
        text: 'Average project completion is <strong>' + snapshot.avgProjectCompletion + '%</strong>. Overall project health is <strong>' + snapshot.overallHealth.label + '</strong>.'
      });
    }

    if (snapshot.tasksDueThisWeek > 0) {
      insights.push({
        icon: 'calendar',
        iconBg: '#dbeafe',
        iconColor: '#1e40af',
        text: '<strong>' + snapshot.tasksDueThisWeek + ' task' + (snapshot.tasksDueThisWeek !== 1 ? 's' : '') + '</strong> due this week. ' + (snapshot.tasksDueToday > 0 ? '<strong>' + snapshot.tasksDueToday + '</strong> due today.' : '')
      });
    }

    if (snapshot.projectsAtRisk > 0) {
      insights.push({
        icon: 'warning',
        iconBg: '#fef3cd',
        iconColor: '#92400e',
        text: '<strong>' + snapshot.projectsAtRisk + ' project' + (snapshot.projectsAtRisk !== 1 ? 's' : '') + '</strong> at risk (&lt;50% completion). Requires immediate attention.'
      });
    }

    if (snapshot.healthyProjects > 0) {
      insights.push({
        icon: 'check',
        iconBg: '#d1fae5',
        iconColor: '#065f46',
        text: '<strong>' + snapshot.healthyProjects + ' healthy project' + (snapshot.healthyProjects !== 1 ? 's' : '') + '</strong> with 75%+ completion rate. Great progress!'
      });
    }

    if (snapshot.highPriorityRatio > 30) {
      insights.push({
        icon: 'priority',
        iconBg: '#fee2e2',
        iconColor: '#dc2626',
        text: '<strong>' + snapshot.highPriorityRatio + '%</strong> of tasks are high priority. Review prioritization if this seems excessive.'
      });
    }

    return insights;
  }

  /* ═══════════════════════════════════════════════════════════
     STATE / FILTERS
     ═══════════════════════════════════════════════════════════ */
  var state = {
    filterSearch: '',
    filterProject: '',
    filterMember: '',
    filterPriority: '',
    filterStatus: '',
    filterDateFrom: '',
    filterDateTo: '',
    sortBy: 'default'
  };

  function applyFilters(viewData) {
    var tasks = viewData.tasks;
    var f = state;

    if (f.filterSearch) {
      var q = f.filterSearch.toLowerCase();
      tasks = tasks.filter(function (t) {
        return (t.title || '').toLowerCase().indexOf(q) !== -1;
      });
    }
    if (f.filterProject) {
      tasks = tasks.filter(function (t) { return String(t.projectId) === f.filterProject; });
    }
    if (f.filterMember) {
      tasks = tasks.filter(function (t) { return String(t.assignedUserId) === f.filterMember; });
    }
    if (f.filterPriority) {
      tasks = tasks.filter(function (t) { return (t.priority || '').toLowerCase() === f.filterPriority.toLowerCase(); });
    }
    if (f.filterStatus) {
      tasks = tasks.filter(function (t) { return (t.status || '').toLowerCase() === f.filterStatus.toLowerCase(); });
    }
    if (f.filterDateFrom) {
      var from = new Date(f.filterDateFrom);
      from.setHours(0, 0, 0, 0);
      tasks = tasks.filter(function (t) {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) >= from;
      });
    }
    if (f.filterDateTo) {
      var to = new Date(f.filterDateTo);
      to.setHours(23, 59, 59, 999);
      tasks = tasks.filter(function (t) {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) <= to;
      });
    }

    if (f.sortBy !== 'default') {
      tasks = tasks.slice();
      var sortMap = {
        'newest': function (a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); },
        'oldest': function (a, b) { return new Date(a.createdAt || 0) - new Date(b.createdAt || 0); },
        'alpha': function (a, b) { return (a.title || '').localeCompare(b.title || ''); },
        'completion': function (a, b) {
          var aDone = (a.status || '').toLowerCase() === 'done' ? 1 : 0;
          var bDone = (b.status || '').toLowerCase() === 'done' ? 1 : 0;
          return bDone - aDone;
        },
        'priority': function (a, b) {
          var pOrder = { high: 3, medium: 2, low: 1 };
          return (pOrder[(b.priority || '').toLowerCase()] || 0) - (pOrder[(a.priority || '').toLowerCase()] || 0);
        },
        'duedate': function (a, b) {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        },
        'project': function (a, b, pm) {
          var pnA = pm[String(a.projectId)] ? pm[String(a.projectId)].name : '';
          var pnB = pm[String(b.projectId)] ? pm[String(b.projectId)].name : '';
          return pnA.localeCompare(pnB);
        },
        'member': function (a, b, pm, mm) {
          var mA = mm[String(a.assignedUserId)] ? mm[String(a.assignedUserId)].name : '';
          var mB = mm[String(b.assignedUserId)] ? mm[String(b.assignedUserId)].name : '';
          return mA.localeCompare(mB);
        }
      };
      var fn = sortMap[f.sortBy];
      if (fn) {
        var pm = viewData.projectMap;
        var mm = viewData.memberMap;
        tasks.sort(function (a, b) { return fn(a, b, pm, mm); });
      }
    }

    return tasks;
  }

  function populateFilterDropdowns(data) {
    var projectSelect = document.getElementById('rptFilterProject');
    var memberSelect = document.getElementById('rptFilterMember');
    if (!projectSelect && !memberSelect) return;

    if (projectSelect) {
      var opts = '<option value="">All Projects</option>';
      data.projects.forEach(function (p) {
        opts += '<option value="' + p.id + '">' + safeHtml(p.name || 'Untitled') + '</option>';
      });
      if (projectSelect.innerHTML !== opts) projectSelect.innerHTML = opts;
    }

    if (memberSelect) {
      var mOpts = '<option value="">All Members</option>';
      data.members.forEach(function (m) {
        mOpts += '<option value="' + m.id + '">' + safeHtml(m.name || 'Unknown') + '</option>';
      });
      if (memberSelect.innerHTML !== mOpts) memberSelect.innerHTML = mOpts;
    }
  }

  /* ═══════════════════════════════════════════════════════════
     UI RENDERING
     ═══════════════════════════════════════════════════════════ */

  function renderCurrentDate() {
    var el = document.getElementById('rptCurrentDate');
    if (!el) return;
    var now = new Date();
    el.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  function renderLastUpdated() {
    var el = document.getElementById('rptLastUpdated');
    if (!el) return;
    var now = new Date();
    el.textContent = 'Last updated: ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function renderStats(stats) {
    var ids = {
      'rptTotalProjects': stats.totalProjects,
      'rptTotalTasks': stats.totalTasks,
      'rptCompletedTasks': stats.completedTasks,
      'rptPendingTasks': stats.pendingTasks,
      'rptOverdueTasks': stats.overdueTasks,
      'rptHighPriority': stats.highPriorityTasks,
      'rptCompletionRate': stats.completionRate + '%',
      'rptActiveMembers': stats.activeMembers
    };

    Object.keys(ids).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        var val = ids[id];
        if (el.textContent !== String(val)) {
          el.textContent = val;
          el.style.animation = 'none';
          el.offsetHeight;
          el.style.animation = 'countUp 0.45s cubic-bezier(0.16,1,0.3,1) both';
        }
      }
    });

    var trendEls = document.querySelectorAll('.reports__stats .stat-card__trend');
  }

  function renderStatusDonut(stats) {
    var wrap = document.getElementById('rptStatusDonut');
    if (!wrap) return;

    var total = stats.totalTasks || 1;
    var segments = [
      { label: 'Todo', value: stats.pendingTasks, color: '#F6D868' },
      { label: 'In Progress', value: stats.inProgressTasks, color: '#F3B7DA' },
      { label: 'Review', value: stats.reviewTasks, color: '#B6CAED' },
      { label: 'Done', value: stats.completedTasks, color: '#9AAA63' }
    ];

    var circum = 2 * Math.PI * 15;
    var cum = 0;
    var circlesHtml = '';
    var legendHtml = '';
    segments.forEach(function (seg, i) {
      var pct = Math.round((seg.value / total) * 100);
      var dashLen = (pct / 100) * circum;
      var offset = cum;
      var animDelay = (i * 0.15) + 's';
      circlesHtml += '<circle cx="18" cy="18" r="15" fill="none" stroke="' + seg.color + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + dashLen + ' ' + circum + '" stroke-dashoffset="' + offset + '" style="transition: all 0.8s cubic-bezier(0.16,1,0.3,1) ' + animDelay + '"/>';
      cum += dashLen;
      legendHtml += '<div class="reports__donut-legend-item"><span class="reports__donut-legend-dot" style="background:' + seg.color + '"></span>' + seg.label + '<span class="reports__donut-legend-count">' + seg.value + '</span></div>';
    });

    wrap.innerHTML =
      '<div class="reports__donut-svg-wrap">' +
      '<svg class="reports__donut-svg" viewBox="0 0 36 36">' +
      '<circle cx="18" cy="18" r="15" fill="none" stroke="rgba(154,170,99,0.06)" stroke-width="4"/>' +
      circlesHtml +
      '</svg>' +
      '<div class="reports__donut-center"><span class="reports__donut-center-value">' + total + '</span><span class="reports__donut-center-label">total</span></div>' +
      '</div>' +
      '<div class="reports__donut-legend">' + legendHtml + '</div>';
  }

  function renderPriorityDonut(data) {
    var wrap = document.getElementById('rptPriorityDonut');
    if (!wrap) return;

    var dist = calcPriorityDistribution(data.tasks);
    var total = data.tasks.length || 1;
    var segs = [
      { label: 'High', value: dist.High, color: '#ef4444' },
      { label: 'Medium', value: dist.Medium, color: '#f59e0b' },
      { label: 'Low', value: dist.Low, color: '#22c55e' }
    ];

    var circum = 2 * Math.PI * 15;
    var cum = 0;
    var circlesHtml = '';
    var legendHtml = '';
    segs.forEach(function (seg, i) {
      var pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
      if (pct === 0 && seg.value === 0) { cum += 0; return; }
      var dashLen = Math.max(0.5, (pct / 100) * circum);
      circlesHtml += '<circle cx="18" cy="18" r="15" fill="none" stroke="' + seg.color + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + dashLen + ' ' + circum + '" stroke-dashoffset="' + cum + '" style="transition: all 0.8s cubic-bezier(0.16,1,0.3,1) ' + (i * 0.15) + 's"/>';
      cum += dashLen;
      legendHtml += '<div class="reports__donut-legend-item"><span class="reports__donut-legend-dot" style="background:' + seg.color + '"></span>' + seg.label + ' <span class="reports__donut-legend-count">' + seg.value + '</span></div>';
    });

    wrap.innerHTML =
      '<div class="reports__donut-svg-wrap">' +
      '<svg class="reports__donut-svg" viewBox="0 0 36 36">' +
      '<circle cx="18" cy="18" r="15" fill="none" stroke="rgba(154,170,99,0.06)" stroke-width="4"/>' +
      circlesHtml +
      '</svg>' +
      '<div class="reports__donut-center"><span class="reports__donut-center-value">' + total + '</span><span class="reports__donut-center-label">tasks</span></div>' +
      '</div>' +
      '<div class="reports__donut-legend">' + legendHtml + '</div>';
  }

  function renderTasksPerProject(data) {
    var wrap = document.getElementById('rptTasksPerProject');
    if (!wrap) return;

    var tpp = calcTasksPerProject(data.tasks, data.projects, data.projectMap);

    if (tpp.length === 0) {
      wrap.innerHTML = '<div class="reports__hbar-empty">No project data available</div>';
      return;
    }

    var maxVal = Math.max.apply(null, tpp.map(function (i) { return i.count; }).concat(1));
    var colors = ['#9AAA63', '#B6CAED', '#F3B7DA', '#F6D868', '#c4b5fd', '#fdba74', '#86efac', '#fca5a5', '#67e8f9', '#d8b4fe'];

    var html = '<div class="reports__hbar">';
    tpp.forEach(function (item, i) {
      var pct = Math.round((item.count / maxVal) * 100);
      var color = colors[i % colors.length];
      html += '<div class="reports__hbar-item">' +
        '<span class="reports__hbar-label" title="' + safeHtml(item.name) + '">' + safeHtml(item.name.length > 18 ? item.name.substring(0, 16) + '...' : item.name) + '</span>' +
        '<div class="reports__hbar-track"><div class="reports__hbar-fill" style="width:' + pct + '%;background:' + color + ';transition-delay:' + (i * 0.08) + 's"></div></div>' +
        '<span class="reports__hbar-value">' + item.count + '</span>' +
        '</div>';
    });
    html += '</div>';
    wrap.innerHTML = html;
  }

  function renderMemberWorkload(data) {
    var wrap = document.getElementById('rptMemberWorkload');
    if (!wrap) return;

    var workload = calcMemberWorkload(data.tasks, data.members);

    if (workload.length === 0) {
      wrap.innerHTML = '<div class="reports__hbar-empty">No team members available</div>';
      return;
    }

    var maxVal = Math.max.apply(null, workload.map(function (w) { return w.totalTasks; }).concat(1));
    var colors = ['#9AAA63', '#B6CAED', '#F3B7DA', '#F6D868', '#c4b5fd', '#fdba74', '#86efac', '#fca5a5'];

    var html = '<div class="reports__hbar">';
    workload.forEach(function (w, i) {
      var pct = Math.round((w.totalTasks / maxVal) * 100);
      var color = colors[i % colors.length];
      html += '<div class="reports__hbar-item">' +
        '<span class="reports__hbar-label" title="' + safeHtml(w.name) + '">' + safeHtml(w.name.length > 18 ? w.name.substring(0, 16) + '...' : w.name) + '</span>' +
        '<div class="reports__hbar-track"><div class="reports__hbar-fill" style="width:' + pct + '%;background:' + color + ';transition-delay:' + (i * 0.08) + 's"></div></div>' +
        '<span class="reports__hbar-value">' + w.totalTasks + '</span>' +
        '</div>';
    });
    html += '</div>';

    var overCount = workload.filter(function (w) { return w.workloadLevel === 'overloaded'; }).length;
    var busyCount = workload.filter(function (w) { return w.workloadLevel === 'busy'; }).length;
    var balancedCount = workload.filter(function (w) { return w.workloadLevel === 'balanced'; }).length;
    var lightCount = workload.filter(function (w) { return w.workloadLevel === 'light'; }).length;
    var avg = workload.length > 0 ? Math.round(workload.reduce(function (s, w) { return s + w.totalTasks; }, 0) / workload.length * 10) / 10 : 0;

    html += '<div class="rpt-workload-summary">';
    if (overCount > 0) html += '<span class="rpt-workload-tag rpt-workload-tag--over"><span class="rpt-workload-tag-count">' + overCount + '</span> Overloaded</span>';
    if (busyCount > 0) html += '<span class="rpt-workload-tag rpt-workload-tag--busy"><span class="rpt-workload-tag-count">' + busyCount + '</span> Busy</span>';
    if (balancedCount > 0) html += '<span class="rpt-workload-tag rpt-workload-tag--balanced"><span class="rpt-workload-tag-count">' + balancedCount + '</span> Balanced</span>';
    if (lightCount > 0) html += '<span class="rpt-workload-tag rpt-workload-tag--under"><span class="rpt-workload-tag-count">' + lightCount + '</span> Light</span>';
    html += '<span class="rpt-workload-tag" style="background:rgba(154,170,99,0.06);color:#7a8a4a;">Avg <span class="rpt-workload-tag-count">' + avg + '</span> tasks/member</span>';
    html += '</div>';

    wrap.innerHTML = html;
  }

  function renderCompletionTrend(data) {
    var wrap = document.getElementById('rptCompletionTrend');
    if (!wrap) return;

    var trend = calcCompletionTrend(data.tasks);
    var maxVal = Math.max.apply(null, trend.map(function (t) { return t.count; }).concat(1));

    var html = '<div class="reports__trend-chart" style="height:150px;">';
    trend.forEach(function (t, i) {
      var h = Math.max(8, Math.round((t.count / maxVal) * 100));
      html += '<div class="reports__trend-bar-group">' +
        '<span class="reports__trend-value">' + t.count + '</span>' +
        '<div class="reports__trend-bar" style="height:' + h + '%;transition-delay:' + (i * 0.1) + 's" title="' + t.count + ' completed"></div>' +
        '<span class="reports__trend-label">' + t.label + '</span>' +
        '</div>';
    });
    html += '</div>';
    wrap.innerHTML = html;
  }

  function renderProjectProgressChart(data) {
    var wrap = document.getElementById('rptProjectProgressChart');
    if (!wrap) return;

    var progress = calcProjectProgress(data.projects, data.tasks).filter(function (p) { return p.totalTasks > 0; });

    if (progress.length === 0) {
      wrap.innerHTML = '<div class="reports__hbar-empty">No active projects with tasks</div>';
      return;
    }

    var colors = ['#9AAA63', '#B6CAED', '#F3B7DA', '#F6D868', '#c4b5fd', '#fdba74', '#86efac', '#fca5a5', '#67e8f9', '#d8b4fe'];

    var html = '<div class="reports__hbar">';
    progress.forEach(function (p, i) {
      var color = colors[i % colors.length];
      var pctColor = p.completionRate >= 75 ? '#22c55e' : p.completionRate >= 40 ? '#f59e0b' : '#ef4444';
      html += '<div class="reports__hbar-item">' +
        '<span class="reports__hbar-label" title="' + safeHtml(p.name) + '">' + safeHtml(p.name.length > 18 ? p.name.substring(0, 16) + '...' : p.name) + '</span>' +
        '<div class="reports__hbar-track"><div class="reports__hbar-fill" style="width:' + p.completionRate + '%;background:' + pctColor + ';transition-delay:' + (i * 0.08) + 's"></div></div>' +
        '<span class="reports__hbar-value" style="color:' + pctColor + '">' + p.completionRate + '%</span>' +
        '</div>';
    });
    html += '</div>';
    wrap.innerHTML = html;
  }

  function renderProjectTable(data) {
    var wrap = document.getElementById('rptProjectTableBody');
    var badge = document.getElementById('rptProjectTableBadge');
    if (!wrap) return;

    var progress = calcProjectHealth(data.projects, data.tasks);

    if (badge) badge.textContent = progress.length + ' project' + (progress.length !== 1 ? 's' : '');

    if (progress.length === 0) {
      wrap.innerHTML = '<tr><td colspan="11" style="text-align:center;color:rgba(44,40,32,0.35);padding:40px 12px;">No projects found</td></tr>';
      return;
    }

    var html = '';
    progress.forEach(function (p, i) {
      var delay = (i * 0.05) + 's';
      var pctColor = p.completionRate >= 75 ? '#22c55e' : p.completionRate >= 40 ? '#f59e0b' : '#ef4444';
      var maxPri = Math.max(p.priorityDist.high, p.priorityDist.medium, p.priorityDist.low, 1);
      var highH = Math.round((p.priorityDist.high / maxPri) * 100);
      var medH = Math.round((p.priorityDist.medium / maxPri) * 100);
      var lowH = Math.round((p.priorityDist.low / maxPri) * 100);
      var riskClass = (p.riskLevel === 'critical' || p.riskLevel === 'high') ? ' rpt-row--at-risk' : '';
      var healthRingClass = p.healthColor === 'green' ? 'rpt-health-score-ring--green' : p.healthColor === 'amber' ? 'rpt-health-score-ring--amber' : 'rpt-health-score-ring--red';

      html += '<tr class="' + riskClass + '" style="animation:slideLeftFade 0.4s cubic-bezier(0.16,1,0.3,1) ' + delay + ' both">' +
        '<td><span class="reports__table-name">' + safeHtml(p.name) + '</span></td>' +
        '<td><span class="pm-badge ' + getProjectStatusClass(p.status) + '">' + safeHtml(p.status) + '</span></td>' +
        '<td><span class="rpt-risk-badge rpt-risk-badge--' + p.riskLevel + '">' + p.riskLevel + '</span></td>' +
        '<td>' +
        '<div class="rpt-health-score"><span class="rpt-health-score-ring ' + healthRingClass + '">' + p.healthScore + '</span></div>' +
        '</td>' +
        '<td>' +
        '<div class="reports__mini-progress">' +
        '<div class="reports__mini-progress-bar"><div class="reports__mini-progress-fill" style="width:' + p.completionRate + '%;background:' + pctColor + ';transition-delay:' + delay + '"></div></div>' +
        '<span class="reports__mini-progress-pct" style="color:' + pctColor + '">' + p.completionRate + '%</span>' +
        '</div>' +
        '</td>' +
        '<td>' + p.total + '</td>' +
        '<td style="color:#22c55e;font-weight:600;">' + p.done + '</td>' +
        '<td style="color:#f59e0b;font-weight:600;">' + p.pending + '</td>' +
        '<td style="color:#ef4444;font-weight:600;">' + p.overdue + '</td>' +
        '<td>' +
        '<div class="reports__priority-mini" title="H:' + p.priorityDist.high + ' M:' + p.priorityDist.medium + ' L:' + p.priorityDist.low + '">' +
        '<div class="reports__priority-mini-bar" style="height:' + highH + '%;background:#ef4444;"></div>' +
        '<div class="reports__priority-mini-bar" style="height:' + medH + '%;background:#f59e0b;"></div>' +
        '<div class="reports__priority-mini-bar" style="height:' + lowH + '%;background:#22c55e;"></div>' +
        '</div>' +
        '</td>' +
        '<td>' + (p.deadline ? safeHtml(p.deadline) : '<span class="no-date">—</span>') + '</td>' +
        '</tr>';
    });
    wrap.innerHTML = html;
  }

  function renderTeamPerformance(data) {
    var wrap = document.getElementById('rptTeamPerformance');
    var badge = document.getElementById('rptTeamBadge');
    if (!wrap) return;

    var team = calcMemberWorkload(data.tasks, data.members);

    // Calculate overdue per member
    var today = getToday();
    team.forEach(function (m) {
      m.overdue = data.tasks.filter(function (t) {
        if (String(t.assignedUserId) !== String(m.id)) return false;
        if ((t.status || '').toLowerCase() === 'done') return false;
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < today;
      }).length;
      // Efficiency: completion rate weighted by task count
      m.efficiency = m.totalTasks > 0 ? Math.round((m.completed / m.totalTasks) * 100) : 0;
    });

    if (badge) badge.textContent = team.length + ' member' + (team.length !== 1 ? 's' : '');

    if (team.length === 0) {
      wrap.innerHTML = '<div class="reports__hbar-empty" style="grid-column:1/-1;">No team members available</div>';
      return;
    }

    var avColors = [
      'background:linear-gradient(135deg,#9AAA63,#b8c88a)',
      'background:linear-gradient(135deg,#B6CAED,#cedcf3)',
      'background:linear-gradient(135deg,#F3B7DA,#f8cfe7)',
      'background:linear-gradient(135deg,#F6D868,#f9e494)',
      'background:linear-gradient(135deg,#c4b5fd,#ddd6fe)',
      'background:linear-gradient(135deg,#fdba74,#fed7aa)'
    ];

    var html = '';
    team.forEach(function (m, i) {
      var delay = (i * 0.06) + 's';
      var wlClass = 'reports__workload-badge--' + m.workloadLevel;
      var wlLabel = m.workloadLevel.charAt(0).toUpperCase() + m.workloadLevel.slice(1);
      var pctColor = m.efficiency >= 75 ? '#22c55e' : m.efficiency >= 40 ? '#f59e0b' : '#ef4444';
      var riskDot = m.overdue > 3 ? '#ef4444' : m.overdue > 0 ? '#f59e0b' : '#22c55e';

      html += '<div class="reports__team-card" style="animation-delay:' + delay + '">' +
        '<div class="reports__team-avatar" style="' + avColors[i % avColors.length] + '">' + safeHtml(m.initials) + '</div>' +
        '<div class="reports__team-info">' +
        '<div class="reports__team-name" title="' + safeHtml(m.name) + '">' + safeHtml(m.name) + '</div>' +
        '<div class="reports__team-role">' + safeHtml(m.role) + '</div>' +
        '</div>' +
        '<div class="reports__team-stats">' +
        '<div class="reports__team-stat"><span class="reports__team-stat-value">' + m.totalTasks + '</span><span class="reports__team-stat-label">Assigned</span></div>' +
        '<div class="reports__team-stat"><span class="reports__team-stat-value" style="color:#22c55e">' + m.completed + '</span><span class="reports__team-stat-label">Done</span></div>' +
        '<div class="reports__team-stat"><span class="reports__team-stat-value" style="color:#f59e0b">' + m.pendingTasks + '</span><span class="reports__team-stat-label">Pending</span></div>' +
        '<div class="reports__team-stat"><span class="reports__team-stat-value" style="color:' + riskDot + '">' + m.overdue + '</span><span class="reports__team-stat-label">Overdue</span></div>' +
        '</div>' +
        '<div class="reports__team-pct" style="color:' + pctColor + '">' + m.efficiency + '%</div>' +
        '<span class="reports__workload-badge ' + wlClass + '">' + wlLabel + '</span>' +
        '</div>';
    });
    wrap.innerHTML = html;
  }

  function renderUpcomingDeadlines(data) {
    var wrap = document.getElementById('rptUpcomingDeadlines');
    if (!wrap) return;

    var deadlines = calcUpcomingDeadlines(data.tasks, data.projectMap, data.memberMap);

    if (deadlines.length === 0) {
      wrap.innerHTML = '<div class="widget-empty"><div class="widget-empty__icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg></div><span class="widget-empty__text">All caught up! No upcoming deadlines.</span></div>';
      return;
    }

    var html = '<div class="deadline-list">';
    deadlines.forEach(function (d) {
      var urgency = d.daysRemaining <= 1 ? 'urgent' : d.daysRemaining <= 3 ? 'soon' : 'normal';
      var countdownText = d.daysRemaining <= 0 ? 'Today' : d.daysRemaining + ' day' + (d.daysRemaining !== 1 ? 's' : '');

      var iconSvg;
      if (urgency === 'urgent') {
        iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>';
      } else if (urgency === 'soon') {
        iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
      } else {
        iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/></svg>';
      }

      html += '<div class="deadline-item">' +
        '<div class="deadline-item__icon deadline-item__icon--' + urgency + '">' + iconSvg + '</div>' +
        '<div class="deadline-item__info">' +
        '<div class="deadline-item__name">' + getPriorityLabelBadge(d.priority) + ' ' + safeHtml(d.title) + '</div>' +
        '<div class="deadline-item__date">' + safeHtml(d.project) + ' · ' + safeHtml(d.member) + '</div>' +
        '</div>' +
        '<span class="deadline-item__countdown deadline-item__countdown--' + urgency + '">' + countdownText + '</span>' +
        '</div>';
    });
    html += '</div>';
    wrap.innerHTML = html;
  }

  function renderOverdueTasks(data) {
    var wrap = document.getElementById('rptOverdueBody');
    var badge = document.getElementById('rptOverdueBadge');
    if (!wrap) return;

    var overdue = calcOverdueTasks(data.tasks, data.projectMap, data.memberMap);

    if (badge) badge.textContent = overdue.length + ' overdue';

    if (overdue.length === 0) {
      wrap.innerHTML = '<tr><td colspan="7" style="text-align:center;color:rgba(44,40,32,0.35);padding:40px 12px;">No overdue tasks. Everything is on track!</td></tr>';
      return;
    }

    var html = '';
    overdue.forEach(function (t, i) {
      var delay = (i * 0.04) + 's';
      var urgencyColor = t.daysOverdue > 7 ? '#dc2626' : t.daysOverdue > 3 ? '#f97316' : '#f59e0b';
      html += '<tr style="animation:slideLeftFade 0.35s cubic-bezier(0.16,1,0.3,1) ' + delay + ' both">' +
        '<td><span class="reports__table-name">' + safeHtml(t.title) + '</span></td>' +
        '<td>' + safeHtml(t.project) + '</td>' +
        '<td>' + safeHtml(t.member) + '</td>' +
        '<td>' + getPriorityLabelBadge(t.priority) + '</td>' +
        '<td>' + safeHtml(t.dueDate) + '</td>' +
        '<td style="color:' + urgencyColor + ';font-weight:700;">' + t.daysOverdue + ' day' + (t.daysOverdue !== 1 ? 's' : '') + '</td>' +
        '<td>' + getStatusLabelBadge(t.status) + '</td>' +
        '</tr>';
    });
    wrap.innerHTML = html;
  }

  function renderExecutiveSnapshot(data, stats, snapshot) {
    var wrap = document.getElementById('rptExecContent');
    var healthEl = document.getElementById('rptExecHealth');
    if (!wrap) return;

    var items = [
      { value: snapshot.activeProjects, label: 'Active Projects' },
      { value: snapshot.totalTasks, label: 'Total Tasks' },
      { value: snapshot.completed, label: 'Completed' },
      { value: snapshot.overdue, label: 'Overdue' }
    ];

    var html = '';
    items.forEach(function (item) {
      html += '<div class="reports__exec-stat">' +
        '<div class="reports__exec-stat-value">' + item.value + '</div>' +
        '<div class="reports__exec-stat-label">' + item.label + '</div>' +
        '</div>';
    });
    wrap.innerHTML = html;

    if (healthEl) {
      healthEl.innerHTML = '<span class="reports__exec-health-dot reports__exec-health-dot--' + snapshot.overallHealth.level + '"></span>Overall Project Health: <strong>' + snapshot.overallHealth.label + '</strong>';
    }

    var summaryText = generateExecutiveSummaryText(data, stats, snapshot);
    var summaryEl = document.getElementById('rptExecSummary');
    if (summaryEl) {
      summaryEl.textContent = summaryText;
    }
  }

  function generateExecutiveSummaryText(data, stats, snapshot) {
    var parts = [
      snapshot.activeProjects + ' Active Projects',
      snapshot.totalTasks + ' Total Tasks',
      snapshot.completed + ' Completed',
      snapshot.overdue + ' Overdue'
    ];
    var text = 'TaskFlow Summary: ' + parts.join(' · ');

    if (snapshot.highestWorkload && snapshot.highestWorkload.totalTasks > 0) {
      text += '. ' + snapshot.highestWorkload.name + ' currently has the highest workload.';
    }
    if (snapshot.lowestProject && snapshot.lowestProject.totalTasks > 0) {
      text += ' ' + snapshot.lowestProject.name + ' has the lowest completion rate.';
    }
    text += ' Overall project health: ' + snapshot.overallHealth.label + '.';
    return text;
  }

  function renderSmartInsights(data, stats, snapshot) {
    var wrap = document.getElementById('rptSmartInsights');
    if (!wrap) return;

    var insights = generateSmartInsights(data, stats, snapshot);

    if (insights.length === 0) {
      wrap.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:rgba(44,40,32,0.35);padding:24px;">No insights available yet. Add more tasks and projects to generate insights.</div>';
      return;
    }

    var icons = {
      'workload': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M12 12v.01"/></svg>',
      'balance': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>',
      'star': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      'target': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
      'alert': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      'flag': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
      'chart': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>',
      'calendar': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      'warning': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      'check': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      'priority': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>'
    };

    var html = '';
    insights.forEach(function (ins, i) {
      html += '<div class="reports__insight-card" style="animation-delay:' + (i * 0.06) + 's">' +
        '<div class="reports__insight-icon" style="background:' + ins.iconBg + ';color:' + ins.iconColor + '">' + (icons[ins.icon] || '') + '</div>' +
        '<div class="reports__insight-text">' + ins.text + '</div>' +
        '</div>';
    });
    wrap.innerHTML = html;
  }

  function renderDeliveryAnalytics(data) {
    var wrap = document.getElementById('rptDeliveryRow');
    if (!wrap) return;
    var dl = calcDeliveryAnalytics(data.tasks);

    var cards = [
      { id: 'rptDeliveryToday', icon: 'today', value: dl.completedToday, label: 'Completed Today' },
      { id: 'rptDeliveryWeek', icon: 'week', value: dl.completedThisWeek, label: 'Completed This Week' },
      { id: 'rptDeliveryMonth', icon: 'month', value: dl.completedThisMonth, label: 'Completed This Month' },
      { id: 'rptDeliveryOverdue', icon: 'overdue', value: dl.overdueCount, label: 'Tasks Overdue' }
    ];

    var icons = {
      today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      week: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>',
      month: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
      overdue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>'
    };

    var html = '';
    cards.forEach(function (c, i) {
      html += '<div class="rpt-delivery-card" style="animation-delay:' + (i * 0.08) + 's">' +
        '<div class="rpt-delivery-icon rpt-delivery-icon--' + c.icon + '">' + (icons[c.icon] || '') + '</div>' +
        '<div class="rpt-delivery-info">' +
        '<div class="rpt-delivery-value" id="' + c.id + '">' + c.value + '</div>' +
        '<div class="rpt-delivery-label">' + c.label + '</div>' +
        '</div></div>';
    });
    if (wrap.innerHTML !== html) wrap.innerHTML = html;
  }

  function renderRiskAnalysis(data) {
    var wrap = document.getElementById('rptRiskGrid');
    if (!wrap) return;

    var health = calcProjectHealth(data.projects, data.tasks);
    var workload = calcMemberWorkload(data.tasks, data.members);

    var atRiskProjects = health.filter(function (h) { return h.riskLevel === 'critical' || h.riskLevel === 'high'; });
    var overloadedMembers = workload.filter(function (w) { return w.workloadLevel === 'overloaded'; });
    var noActivityProjects = health.filter(function (h) { return h.total === 0; });

    var cards = [
      {
        title: 'Projects at Risk',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>',
        iconColor: '#ef4444',
        iconBg: 'rgba(239,68,68,0.06)',
        count: atRiskProjects.length,
        desc: 'Critical or high-risk projects',
        items: atRiskProjects.slice(0, 5),
        itemDot: '#ef4444',
        itemBadgeClass: 'rpt-risk-badge--critical'
      },
      {
        title: 'Overloaded Members',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
        iconColor: '#f59e0b',
        iconBg: 'rgba(245,158,11,0.06)',
        count: overloadedMembers.length,
        desc: 'Members with 8+ assigned tasks',
        items: overloadedMembers.slice(0, 5),
        itemDot: '#f59e0b',
        itemBadgeClass: 'rpt-risk-badge--high'
      },
      {
        title: 'No Activity',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>',
        iconColor: '#9ca3af',
        iconBg: 'rgba(156,163,175,0.06)',
        count: noActivityProjects.length,
        desc: 'Projects without tasks',
        items: noActivityProjects.slice(0, 5),
        itemDot: '#9ca3af',
        itemBadgeClass: 'rpt-risk-badge--low'
      }
    ];

    var html = '';
    cards.forEach(function (c, i) {
      var delay = (i * 0.08) + 's';
      html += '<div class="rpt-risk-card" style="animation-delay:' + delay + '">' +
        '<div class="rpt-risk-card-header">' +
        '<span class="rpt-risk-card-title" style="color:' + c.iconColor + '">' + c.icon + safeHtml(c.title) + '</span>' +
        '</div>' +
        '<div class="rpt-risk-card-count" style="color:' + c.iconColor + '">' + c.count + '</div>' +
        '<div class="rpt-risk-card-desc">' + c.desc + '</div>';

      if (c.items.length > 0) {
        html += '<div class="rpt-risk-card-list">';
        c.items.forEach(function (item) {
          var name = item.name || 'Unknown';
          var badgeText = item.riskLevel ? item.riskLevel.toUpperCase() : (item.totalTasks + ' tasks');
          html += '<div class="rpt-risk-item">' +
            '<span class="rpt-risk-item-dot" style="background:' + c.itemDot + '"></span>' +
            '<span class="rpt-risk-item-name" title="' + safeHtml(name) + '">' + safeHtml(name) + '</span>' +
            '<span class="rpt-risk-item-badge ' + c.itemBadgeClass + '">' + badgeText + '</span>' +
            '</div>';
        });
        html += '</div>';
      }

      html += '</div>';
    });
    wrap.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════════════════
     EXPORT FEATURES
     ═══════════════════════════════════════════════════════════ */

  function exportCSV(data, stats, snapshot) {
    var progress = calcProjectProgress(data.projects, data.tasks);
    var headers = ['Project', 'Status', 'Completion %', 'Total Tasks', 'Completed', 'Pending', 'Overdue', 'High Priority', 'Medium Priority', 'Low Priority', 'Deadline'];
    var rows = [headers.join(',')];

    progress.forEach(function (p) {
      rows.push([
        '"' + (p.name || '').replace(/"/g, '""') + '"',
        p.status,
        p.completionRate,
        p.totalTasks,
        p.completed,
        p.pending,
        p.overdue,
        p.priorityDist.high,
        p.priorityDist.medium,
        p.priorityDist.low,
        p.deadline || ''
      ].join(','));
    });

    rows.push('');
    rows.push('Team Performance');
    rows.push(['Member', 'Role', 'Assigned Tasks', 'Completed', 'Pending', 'Completion %', 'Workload'].join(','));
    var team = calcTeamPerformance(data.tasks, data.projects, data.members);
    team.forEach(function (m) {
      rows.push([
        '"' + (m.name || '').replace(/"/g, '""') + '"',
        m.role,
        m.totalTasks,
        m.completed,
        m.pendingTasks,
        m.completionRate,
        m.workloadLevel
      ].join(','));
    });

    var blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'taskflow-report-' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printReport() {
    window.print();
  }

  function exportPDF() {
    // Use browser print dialog (Save as PDF)
    printReport();
  }

  /* ═══════════════════════════════════════════════════════════
     FILTER HANDLERS
     ═══════════════════════════════════════════════════════════ */

  function setupFilterListeners() {
    var filterIds = [
      'rptFilterSearch', 'rptFilterProject', 'rptFilterMember',
      'rptFilterPriority', 'rptFilterStatus', 'rptFilterSort',
      'rptFilterDateFrom', 'rptFilterDateTo'
    ];

    filterIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        updateState();
        refresh();
      });
      el.addEventListener('change', function () {
        updateState();
        refresh();
      });
    });

    var clearBtn = document.getElementById('rptClearFilters');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        clearFilters();
      });
    }

    // Export buttons
    var pdfBtn = document.getElementById('rptExportPDF');
    var csvBtn = document.getElementById('rptExportCSV');
    var printBtn = document.getElementById('rptPrint');
    var refreshBtn = document.getElementById('rptRefresh');

    if (pdfBtn) pdfBtn.addEventListener('click', function () { exportCurrentPDF(); });
    if (csvBtn) csvBtn.addEventListener('click', function () { exportCurrentCSV(); });
    if (printBtn) printBtn.addEventListener('click', function () { printReport(); });
    if (refreshBtn) refreshBtn.addEventListener('click', function () { refresh(); });
  }

  function updateState() {
    state.filterSearch = (document.getElementById('rptFilterSearch') || {}).value || '';
    state.filterProject = (document.getElementById('rptFilterProject') || {}).value || '';
    state.filterMember = (document.getElementById('rptFilterMember') || {}).value || '';
    state.filterPriority = (document.getElementById('rptFilterPriority') || {}).value || '';
    state.filterStatus = (document.getElementById('rptFilterStatus') || {}).value || '';
    state.filterDateFrom = (document.getElementById('rptFilterDateFrom') || {}).value || '';
    state.filterDateTo = (document.getElementById('rptFilterDateTo') || {}).value || '';
    state.sortBy = (document.getElementById('rptFilterSort') || {}).value || 'default';
  }

  function clearFilters() {
    var ids = ['rptFilterSearch', 'rptFilterProject', 'rptFilterMember', 'rptFilterPriority', 'rptFilterStatus', 'rptFilterSort', 'rptFilterDateFrom', 'rptFilterDateTo'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    state = {
      filterSearch: '', filterProject: '', filterMember: '', filterPriority: '',
      filterStatus: '', filterDateFrom: '', filterDateTo: '', sortBy: 'default'
    };
    refresh();
  }

  function exportCurrentPDF() {
    exportPDF();
  }

  function exportCurrentCSV() {
    var data = loadAllData();
    var stats = calcStats(data);
    var snapshot = generateExecutiveSnapshot(data, stats);
    exportCSV(data, stats, snapshot);
  }

  /* ═══════════════════════════════════════════════════════════
     EMPTY STATE / HIDDEN SECTIONS
     ═══════════════════════════════════════════════════════════ */

  function showEmptyState() {
    var sections = [
      'rptStatsSection', 'rptChartsSection', 'rptExecSection',
      'rptInsightsSection', 'rptProjectTableSection',
      'rptTeamSection', 'rptDeadlinesSection', 'rptOverdueSection',
      'rptDeliverySection', 'rptRiskSection'
    ];
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    var empty = document.getElementById('rptEmptyState');
    if (empty) empty.style.display = '';
    var filters = document.getElementById('rptFilters');
    if (filters) filters.style.display = 'none';
  }

  function hideEmptyState() {
    var sections = [
      'rptStatsSection', 'rptChartsSection', 'rptExecSection',
      'rptInsightsSection', 'rptProjectTableSection',
      'rptTeamSection', 'rptDeadlinesSection', 'rptOverdueSection'
    ];
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = '';
    });
    var empty = document.getElementById('rptEmptyState');
    if (empty) empty.style.display = 'none';
    var filters = document.getElementById('rptFilters');
    if (filters) filters.style.display = '';
  }

  /* ═══════════════════════════════════════════════════════════
     CORE REFRESH
     ═══════════════════════════════════════════════════════════ */

  function refresh() {
    var store = globalThis.DataStore;
    if (!store) return;

    var data = loadAllData();
    updateState();

    if (data.tasks.length === 0 && data.projects.length === 0) {
      showEmptyState();
      renderCurrentDate();
      renderLastUpdated();
      populateFilterDropdowns(data);
      return;
    }

    hideEmptyState();
    renderCurrentDate();
    renderLastUpdated();
    populateFilterDropdowns(data);

    // Apply filters to get a filtered view for stats
    var filteredData = { tasks: applyFilters(data), projects: data.projects, members: data.members, projectMap: data.projectMap, memberMap: data.memberMap };

    // Stats are calculated on filtered tasks for the table views,
    // but overall stats and executive snapshot should use all data
    var stats = calcStats(data);
    var snapshot = generateExecutiveSnapshot(data, stats);

    renderStats(stats);
    renderStatusDonut(stats);
    renderPriorityDonut(data);
    renderTasksPerProject(data);
    renderMemberWorkload(data);
    renderCompletionTrend(data);
    renderProjectTable(filteredData);
    renderTeamPerformance(data);
    renderUpcomingDeadlines(data);
    renderOverdueTasks(data);
    renderExecutiveSnapshot(data, stats, snapshot);
    renderSmartInsights(data, stats, snapshot);
    renderProjectProgressChart(data);
    renderDeliveryAnalytics(data);
    renderRiskAnalysis(data);
  }

  /* ═══════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════ */

  var initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;
    setupFilterListeners();
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('taskflow:tasks-changed', refresh);
  document.addEventListener('taskflow:projects-changed', refresh);
  document.addEventListener('taskflow:members-changed', refresh);

  window.ReportsModule = { refresh: refresh, init: init };
})();
