/*
  Development-only reset script.
  WARNING: This permanently deletes TaskFlowDB and all of its data.
*/

USE master;
GO

IF DB_ID(N'TaskFlowDB') IS NOT NULL
BEGIN
    ALTER DATABASE TaskFlowDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE TaskFlowDB;
END;
GO
