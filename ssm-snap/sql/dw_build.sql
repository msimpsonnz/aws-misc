USE [master]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE DATABASE dw
ON
( NAME = dw,
    FILENAME = 'M:\MSSQL\DATA\dw.mdf',
    SIZE = 1024MB,
    FILEGROWTH = 64MB )
LOG ON
( NAME = dw_log,
    FILENAME = 'L:\MSSQL\DATA\dw_log.ldf',
    SIZE = 1024MB,
	FILEGROWTH = 64MB ) ;
GO

CREATE DATABASE dw_test
ON
( NAME = dw_test,
    FILENAME = 'M:\MSSQL\DATA\dw_test.mdf',
    SIZE = 1024MB,
    FILEGROWTH = 64MB )
LOG ON
( NAME = dw_log,
    FILENAME = 'L:\MSSQL\DATA\dw_test_log.ldf',
    SIZE = 1024MB,
	FILEGROWTH = 64MB ) ;
GO

USE [dw]
GO

CREATE TABLE [dbo].[order_line](
	[ol_o_id] [int] NOT NULL,
	[ol_d_id] [tinyint] NOT NULL,
	[ol_w_id] [int] NOT NULL,
	[ol_number] [tinyint] NOT NULL,
	[ol_i_id] [int] NULL,
	[ol_delivery_d] [datetime] NULL,
	[ol_amount] [smallmoney] NULL,
	[ol_supply_w_id] [int] NULL,
	[ol_quantity] [smallint] NULL,
	[ol_dist_info] [char](24) NULL
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[order_line] SET (LOCK_ESCALATION = DISABLE)
GO

---
INSERT INTO [dbo].[order_line]
  ([ol_o_id], [ol_d_id], [ol_w_id],[ol_number], [ol_delivery_d])
VALUES
  (0,
  0,
  0,
  0,
  '1/1/1979'
);
GO

CREATE PROCEDURE [dbo].[UpdateTickets]
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

CREATE DATABASE SnapDMS
    ON (FILENAME = 'D:\MSSQL\Data\tpcc_log.ldf'),   
    (FILENAME = 'E:\MSSQL\Data\tpcc.mdf')   
    FOR ATTACH;

DECLARE @lastmodifieddate DATETIME=null    
SET @lastmodifieddate = (SELECT MAX([dw].[dbo].[order_line].ol_delivery_d) FROM [dw].[dbo].[order_line])

INSERT INTO [dw].[dbo].[order_line]
SELECT [ol_o_id]
      ,[ol_d_id]
      ,[ol_w_id]
      ,[ol_number]
      ,[ol_i_id]
      ,[ol_delivery_d]
      ,[ol_amount]
      ,[ol_supply_w_id]
      ,[ol_quantity]
      ,[ol_dist_info]
FROM [SnapDMS].[dbo].[order_line]
WHERE [ol_delivery_d] > @lastmodifieddate

END
GO

CREATE PROCEDURE [dbo].[DropTable]
AS
BEGIN

ALTER DATABASE [SnapDMS] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE [SnapDMS];

END
GO


CREATE PROCEDURE [dbo].[LoadTestDW]
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

DECLARE @lastmodifieddate DATETIME=null    
SET @lastmodifieddate = (SELECT MAX([dw_test].[dbo].[order_line].ol_delivery_d) FROM [dw_test].[dbo].[order_line])

INSERT INTO [dw_test].[dbo].[order_line]
SELECT [ol_o_id]
      ,[ol_d_id]
      ,[ol_w_id]
      ,[ol_number]
      ,[ol_i_id]
      ,[ol_delivery_d]
      ,[ol_amount]
      ,[ol_supply_w_id]
      ,[ol_quantity]
      ,[ol_dist_info]
FROM [dw].[dbo].[order_line]
WHERE [ol_delivery_d] > @lastmodifieddate

END
GO

USE [dw_test]
GO

CREATE TABLE [dbo].[order_line](
	[ol_o_id] [int] NOT NULL,
	[ol_d_id] [tinyint] NOT NULL,
	[ol_w_id] [int] NOT NULL,
	[ol_number] [tinyint] NOT NULL,
	[ol_i_id] [int] NULL,
	[ol_delivery_d] [datetime] NULL,
	[ol_amount] [smallmoney] NULL,
	[ol_supply_w_id] [int] NULL,
	[ol_quantity] [smallint] NULL,
	[ol_dist_info] [char](24) NULL
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[order_line] SET (LOCK_ESCALATION = DISABLE)
GO

---
INSERT INTO [dbo].[order_line]
  ([ol_o_id], [ol_d_id], [ol_w_id],[ol_number], [ol_delivery_d])
VALUES
  (0,
  0,
  0,
  0,
  '1/1/1900'
);
GO