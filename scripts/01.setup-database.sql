/*
  TaskFlow Management System
  Complete SQL Server setup: database, tables, constraints, indexes, and views.
  This script is safe to rerun against an existing TaskFlowDB installation.
*/

IF DB_ID(N'TaskFlowDB') IS NULL
BEGIN
    CREATE DATABASE TaskFlowDB;
END;
GO

USE TaskFlowDB;
GO

/* Core tables and constraints. */

/* Users / team members */
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        UserId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
        FullName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(255) NOT NULL CONSTRAINT UQ_Users_Email UNIQUE,
        RoleName NVARCHAR(20) NOT NULL,
        AvatarInitials NVARCHAR(5) NOT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT CK_Users_RoleName CHECK (RoleName IN (N'Admin', N'Manager', N'Team Member')),
        CONSTRAINT CK_Users_FullName_NotBlank CHECK (LEN(LTRIM(RTRIM(FullName))) > 0),
        CONSTRAINT CK_Users_Email_NotBlank CHECK (LEN(LTRIM(RTRIM(Email))) > 0),
        CONSTRAINT CK_Users_AvatarInitials_NotBlank CHECK (LEN(LTRIM(RTRIM(AvatarInitials))) > 0)
    );
END;
GO

/* Projects */
IF OBJECT_ID(N'dbo.Projects', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Projects
    (
        ProjectId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Projects PRIMARY KEY,
        ProjectName NVARCHAR(150) NOT NULL,
        Description NVARCHAR(1000) NULL,
        Deadline DATE NULL,
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Projects_Status DEFAULT (N'Planned'),
        CreatedByUserId INT NOT NULL,
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Projects_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Projects_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT CK_Projects_Status_NotBlank CHECK (LEN(LTRIM(RTRIM(Status))) > 0),
        CONSTRAINT CK_Projects_ProjectName_NotBlank CHECK (LEN(LTRIM(RTRIM(ProjectName))) > 0),
        CONSTRAINT FK_Projects_CreatedByUser FOREIGN KEY (CreatedByUserId)
            REFERENCES dbo.Users(UserId) ON DELETE NO ACTION
    );
END;
GO

/* Tasks */
IF OBJECT_ID(N'dbo.Tasks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tasks
    (
        TaskId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Tasks PRIMARY KEY,
        ProjectId INT NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Description NVARCHAR(2000) NULL,
        AssignedUserId INT NOT NULL,
        DueDate DATE NULL,
        Priority NVARCHAR(10) NOT NULL CONSTRAINT DF_Tasks_Priority DEFAULT (N'Medium'),
        Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Tasks_Status DEFAULT (N'Todo'),
        CreatedByUserId INT NOT NULL,
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Tasks_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Tasks_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CompletedAt DATETIME2(0) NULL,
        CONSTRAINT CK_Tasks_Title_NotBlank CHECK (LEN(LTRIM(RTRIM(Title))) > 0),
        CONSTRAINT CK_Tasks_Priority_NotBlank CHECK (LEN(LTRIM(RTRIM(Priority))) > 0),
        CONSTRAINT CK_Tasks_Status CHECK (Status IN (N'Todo', N'In Progress', N'Review', N'Done')),
        CONSTRAINT CK_Tasks_CompletedAt CHECK
        (
            (Status = N'Done' AND CompletedAt IS NOT NULL)
            OR (Status <> N'Done' AND CompletedAt IS NULL)
        ),
        CONSTRAINT FK_Tasks_Project FOREIGN KEY (ProjectId)
            REFERENCES dbo.Projects(ProjectId) ON DELETE NO ACTION,
        CONSTRAINT FK_Tasks_AssignedUser FOREIGN KEY (AssignedUserId)
            REFERENCES dbo.Users(UserId) ON DELETE NO ACTION,
        CONSTRAINT FK_Tasks_CreatedByUser FOREIGN KEY (CreatedByUserId)
            REFERENCES dbo.Users(UserId) ON DELETE NO ACTION
    );
END;
GO

/* Activity history intentionally keeps EntityId polymorphic; UserId is relational. */
IF OBJECT_ID(N'dbo.ActivityLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ActivityLogs
    (
        ActivityLogId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ActivityLogs PRIMARY KEY,
        UserId INT NOT NULL,
        EntityType NVARCHAR(20) NOT NULL,
        EntityId INT NOT NULL,
        ActionType NVARCHAR(30) NOT NULL,
        ActionDetail NVARCHAR(1000) NOT NULL,
        OccurredAt DATETIME2(0) NOT NULL CONSTRAINT DF_ActivityLogs_OccurredAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT CK_ActivityLogs_EntityType CHECK (EntityType IN (N'Project', N'Task', N'Member')),
        CONSTRAINT CK_ActivityLogs_ActionType CHECK
        (
            ActionType IN (N'Created', N'Updated', N'Deleted', N'Assigned',
                           N'Status Changed', N'Priority Changed', N'Completed')
        ),
        CONSTRAINT CK_ActivityLogs_ActionDetail_NotBlank CHECK (LEN(LTRIM(RTRIM(ActionDetail))) > 0),
        CONSTRAINT FK_ActivityLogs_User FOREIGN KEY (UserId)
            REFERENCES dbo.Users(UserId) ON DELETE NO ACTION
    );
END;
GO

/* Indexes support the documented board, filters, reports, workload, and activity feed. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Projects_Status' AND object_id = OBJECT_ID(N'dbo.Projects'))
    CREATE INDEX IX_Projects_Status ON dbo.Projects(Status);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Projects_Deadline' AND object_id = OBJECT_ID(N'dbo.Projects'))
    CREATE INDEX IX_Projects_Deadline ON dbo.Projects(Deadline);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Tasks_Project_Status' AND object_id = OBJECT_ID(N'dbo.Tasks'))
    CREATE INDEX IX_Tasks_Project_Status ON dbo.Tasks(ProjectId, Status) INCLUDE (AssignedUserId, Priority, DueDate);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Tasks_AssignedUser' AND object_id = OBJECT_ID(N'dbo.Tasks'))
    CREATE INDEX IX_Tasks_AssignedUser ON dbo.Tasks(AssignedUserId, Status) INCLUDE (DueDate);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Tasks_Status_Priority_DueDate' AND object_id = OBJECT_ID(N'dbo.Tasks'))
    CREATE INDEX IX_Tasks_Status_Priority_DueDate ON dbo.Tasks(Status, Priority, DueDate);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ActivityLogs_OccurredAt' AND object_id = OBJECT_ID(N'dbo.ActivityLogs'))
    CREATE INDEX IX_ActivityLogs_OccurredAt ON dbo.ActivityLogs(OccurredAt DESC, ActivityLogId DESC)
        INCLUDE (UserId, EntityType, EntityId, ActionType);
GO

/* Read-only views keep derived reporting values synchronized with live data. */
CREATE OR ALTER VIEW dbo.vw_TaskDetails
AS
SELECT t.TaskId, t.Title, t.Description, t.ProjectId, p.ProjectName,
       t.AssignedUserId, u.FullName AS AssignedMember, u.Email AS AssignedMemberEmail,
       t.Priority, t.Status, t.DueDate,
       CAST(CASE WHEN t.Status <> N'Done' AND t.DueDate IS NOT NULL
                      AND t.DueDate < CONVERT(date, SYSUTCDATETIME())
                 THEN 1 ELSE 0 END AS bit) AS IsOverdue,
       t.CreatedByUserId, t.CreatedAt, t.UpdatedAt, t.CompletedAt
FROM dbo.Tasks AS t
JOIN dbo.Projects AS p ON p.ProjectId = t.ProjectId
JOIN dbo.Users AS u ON u.UserId = t.AssignedUserId;
GO

CREATE OR ALTER VIEW dbo.vw_MemberWorkload
AS
SELECT u.UserId, u.FullName, u.Email, u.RoleName, u.IsActive,
       COUNT(t.TaskId) AS TotalAssignedTasks,
       SUM(CASE WHEN t.Status = N'Done' THEN 1 ELSE 0 END) AS CompletedTasks,
       SUM(CASE WHEN t.Status <> N'Done' THEN 1 ELSE 0 END) AS OpenTasks,
       SUM(CASE WHEN t.Status <> N'Done' AND t.DueDate IS NOT NULL
                     AND t.DueDate < CONVERT(date, SYSUTCDATETIME()) THEN 1 ELSE 0 END) AS OverdueTasks
FROM dbo.Users AS u
LEFT JOIN dbo.Tasks AS t ON t.AssignedUserId = u.UserId
GROUP BY u.UserId, u.FullName, u.Email, u.RoleName, u.IsActive;
GO

/* A single aggregate pass is cheaper and clearer than repeated scalar subqueries. */
CREATE OR ALTER VIEW dbo.vw_ReportSummary
AS
SELECT p.TotalProjects, t.TotalTasks, t.CompletedTasks, t.PendingTasks,
       t.OverdueTasks, t.HighPriorityTasks,
       CAST(CASE WHEN t.TotalTasks = 0 THEN 0
                 ELSE 100.0 * t.CompletedTasks / t.TotalTasks END AS DECIMAL(5,2)) AS CompletionPercentage
FROM (SELECT COUNT_BIG(*) AS TotalProjects FROM dbo.Projects) AS p
CROSS JOIN
(
    SELECT COUNT_BIG(*) AS TotalTasks,
           COUNT_BIG(CASE WHEN Status = N'Done' THEN 1 END) AS CompletedTasks,
           COUNT_BIG(CASE WHEN Status <> N'Done' THEN 1 END) AS PendingTasks,
           COUNT_BIG(CASE WHEN Status <> N'Done' AND DueDate IS NOT NULL
                               AND DueDate < CONVERT(date, SYSUTCDATETIME()) THEN 1 END) AS OverdueTasks,
           COUNT_BIG(CASE WHEN Priority = N'High' THEN 1 END) AS HighPriorityTasks
    FROM dbo.Tasks
) AS t;
GO
