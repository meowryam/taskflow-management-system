/*
  TaskFlow Management System
  Application query examples for SQL Server (not an installation script).
  Replace parameter values with parameters from the application layer.
*/

USE TaskFlowDB;
GO

/* 1. Create a team member */
INSERT INTO dbo.Users (FullName, Email, RoleName, AvatarInitials)
VALUES (N'New Member', N'new.member@example.com', N'Team Member', N'NM');
GO

/* 2. Create a project */
DECLARE @ProjectCreatorId INT = 1;
INSERT INTO dbo.Projects (ProjectName, Description, Deadline, Status, CreatedByUserId)
VALUES (N'Website Launch', N'Prepare the product website for launch.', '2026-08-15', N'Planned', @ProjectCreatorId);
GO

/* 3. Create a task. Project and assigned member are mandatory. */
DECLARE @ProjectId INT = 1;
DECLARE @AssignedUserId INT = 3;
DECLARE @TaskCreatorId INT = 2;

INSERT INTO dbo.Tasks
    (ProjectId, Title, Description, AssignedUserId, DueDate, Priority, Status, CreatedByUserId, CompletedAt)
VALUES
    (@ProjectId, N'Create landing page', N'Build the responsive landing page.', @AssignedUserId,
     '2026-08-10', N'High', N'Todo', @TaskCreatorId, NULL);
GO

/* 4. Move a task between Kanban columns */
DECLARE @TaskToMoveId INT = 1;
DECLARE @NewStatus NVARCHAR(20) = N'Review';

UPDATE dbo.Tasks
SET
    Status = @NewStatus,
    CompletedAt = CASE WHEN @NewStatus = N'Done' THEN SYSUTCDATETIME() ELSE NULL END,
    UpdatedAt = SYSUTCDATETIME()
WHERE TaskId = @TaskToMoveId;
GO

/* 5. Update task priority */
UPDATE dbo.Tasks
SET Priority = N'High', UpdatedAt = SYSUTCDATETIME()
WHERE TaskId = 1;
GO

/* 6. Search + combined filters + due-date sorting */
DECLARE @SearchText NVARCHAR(200) = NULL;       -- e.g. N'landing'
DECLARE @FilterProjectId INT = NULL;            -- e.g. 1
DECLARE @FilterStatus NVARCHAR(20) = NULL;      -- e.g. N'Todo'
DECLARE @FilterPriority NVARCHAR(10) = NULL;    -- e.g. N'High'
DECLARE @FilterMemberId INT = NULL;             -- e.g. 3

SELECT *
FROM dbo.vw_TaskDetails
WHERE (@SearchText IS NULL OR Title LIKE N'%' + @SearchText + N'%')
  AND (@FilterProjectId IS NULL OR ProjectId = @FilterProjectId)
  AND (@FilterStatus IS NULL OR Status = @FilterStatus)
  AND (@FilterPriority IS NULL OR Priority = @FilterPriority)
  AND (@FilterMemberId IS NULL OR AssignedUserId = @FilterMemberId)
ORDER BY
    CASE WHEN DueDate IS NULL THEN 1 ELSE 0 END,
    DueDate ASC;
GO

/* 7. Kanban board data */
SELECT *
FROM dbo.vw_TaskDetails
ORDER BY
    CASE Status
        WHEN N'Todo' THEN 1
        WHEN N'In Progress' THEN 2
        WHEN N'Review' THEN 3
        WHEN N'Done' THEN 4
    END,
    DueDate;
GO

/* 8. Dashboard/report summary */
SELECT * FROM dbo.vw_ReportSummary;
GO

/* 9. Member workload and assigned task counts */
SELECT *
FROM dbo.vw_MemberWorkload
ORDER BY OpenTasks DESC, FullName;
GO

/* 10. Latest activity log entries */
SELECT TOP (100)
    a.ActivityLogId,
    a.EntityType,
    a.EntityId,
    a.ActionType,
    a.ActionDetail,
    a.OccurredAt,
    u.FullName AS PerformedBy
FROM dbo.ActivityLogs AS a
INNER JOIN dbo.Users AS u ON u.UserId = a.UserId
ORDER BY a.OccurredAt DESC, a.ActivityLogId DESC;
GO

/* 11. Log an application action */
INSERT INTO dbo.ActivityLogs
    (UserId, EntityType, EntityId, ActionType, ActionDetail)
VALUES
    (2, N'Task', 1, N'Status Changed', N'Task status changed from Todo to In Progress.');
GO

/* 12. Safe project deletion check */
DECLARE @ProjectToDeleteId INT = 1;

IF EXISTS (SELECT 1 FROM dbo.Tasks WHERE ProjectId = @ProjectToDeleteId)
BEGIN
    THROW 50001, 'Project cannot be deleted while related tasks exist.', 1;
END;
ELSE
BEGIN
    DELETE FROM dbo.Projects WHERE ProjectId = @ProjectToDeleteId;
END;
GO

/* 13. Safe member deletion check */
DECLARE @MemberToDeleteId INT = 3;

IF EXISTS (SELECT 1 FROM dbo.Tasks WHERE AssignedUserId = @MemberToDeleteId)
BEGIN
    THROW 50002, 'Member cannot be deleted while tasks are assigned.', 1;
END;
ELSE
BEGIN
    DELETE FROM dbo.Users WHERE UserId = @MemberToDeleteId;
END;
GO
