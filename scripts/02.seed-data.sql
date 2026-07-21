/*
  TaskFlow Management System
  Optional, repeatable sample dataset for development and manual testing.
*/

USE TaskFlowDB;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = N'admin@taskflow.local')
    INSERT INTO dbo.Users (FullName, Email, RoleName, AvatarInitials)
    VALUES (N'TaskFlow Admin', N'admin@taskflow.local', N'Admin', N'TA');

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = N'manager@taskflow.local')
    INSERT INTO dbo.Users (FullName, Email, RoleName, AvatarInitials)
    VALUES (N'Project Manager', N'manager@taskflow.local', N'Manager', N'PM');

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = N'member@taskflow.local')
    INSERT INTO dbo.Users (FullName, Email, RoleName, AvatarInitials)
    VALUES (N'Team Member', N'member@taskflow.local', N'Team Member', N'TM');
GO

DECLARE @AdminId INT = (SELECT UserId FROM dbo.Users WHERE Email = N'admin@taskflow.local');
DECLARE @ManagerId INT = (SELECT UserId FROM dbo.Users WHERE Email = N'manager@taskflow.local');
DECLARE @MemberId INT = (SELECT UserId FROM dbo.Users WHERE Email = N'member@taskflow.local');

IF NOT EXISTS (SELECT 1 FROM dbo.Projects WHERE ProjectName = N'TaskFlow Sprint')
BEGIN
    INSERT INTO dbo.Projects
        (ProjectName, Description, Deadline, Status, CreatedByUserId)
    VALUES
        (N'TaskFlow Sprint', N'Build and integrate the TaskFlow management system.', DATEADD(day, 7, CONVERT(date, SYSUTCDATETIME())), N'Active', @ManagerId);
END;

DECLARE @ProjectId INT = (SELECT TOP (1) ProjectId FROM dbo.Projects WHERE ProjectName = N'TaskFlow Sprint' ORDER BY ProjectId);

IF NOT EXISTS (SELECT 1 FROM dbo.Tasks WHERE ProjectId = @ProjectId AND Title = N'Create project module')
BEGIN
    INSERT INTO dbo.Tasks
        (ProjectId, Title, Description, AssignedUserId, DueDate, Priority, Status, CreatedByUserId, CompletedAt)
    VALUES
        (@ProjectId, N'Create project module', N'Implement project create, edit, delete, and list behavior.', @MemberId, DATEADD(day, 2, CONVERT(date, SYSUTCDATETIME())), N'High', N'In Progress', @ManagerId, NULL),
        (@ProjectId, N'Prepare manual test cases', N'Write test cases for the integrated TaskFlow product.', @MemberId, DATEADD(day, 5, CONVERT(date, SYSUTCDATETIME())), N'Medium', N'Todo', @ManagerId, NULL),
        (@ProjectId, N'Initialize application layout', N'Create the initial application structure and dashboard shell.', @AdminId, DATEADD(day, -1, CONVERT(date, SYSUTCDATETIME())), N'Low', N'Done', @AdminId, SYSUTCDATETIME());
END;
GO

DECLARE @AdminId2 INT = (SELECT UserId FROM dbo.Users WHERE Email = N'admin@taskflow.local');
DECLARE @ManagerId2 INT = (SELECT UserId FROM dbo.Users WHERE Email = N'manager@taskflow.local');
DECLARE @MemberId2 INT = (SELECT UserId FROM dbo.Users WHERE Email = N'member@taskflow.local');
DECLARE @ProjectId2 INT = (SELECT TOP (1) ProjectId FROM dbo.Projects WHERE ProjectName = N'TaskFlow Sprint' ORDER BY ProjectId);
DECLARE @TaskId2 INT = (SELECT TOP (1) TaskId FROM dbo.Tasks WHERE ProjectId = @ProjectId2 AND Title = N'Create project module' ORDER BY TaskId);

IF NOT EXISTS
(
    SELECT 1
    FROM dbo.ActivityLogs
    WHERE EntityType = N'Project' AND EntityId = @ProjectId2 AND ActionType = N'Created'
)
BEGIN
    INSERT INTO dbo.ActivityLogs (UserId, EntityType, EntityId, ActionType, ActionDetail)
    VALUES
        (@ManagerId2, N'Project', @ProjectId2, N'Created', N'Project "TaskFlow Sprint" was created.'),
        (@ManagerId2, N'Task', @TaskId2, N'Created', N'Task "Create project module" was created.'),
        (@ManagerId2, N'Task', @TaskId2, N'Assigned', N'Task "Create project module" was assigned to Team Member.');
END;
GO
