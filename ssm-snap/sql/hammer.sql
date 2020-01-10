SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
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

----

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
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

ALTER DATABASE [SnapDMS] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE [SnapDMS];

END

---

USE [master]
GO

/****** Object:  StoredProcedure [dbo].[UpdateTickets]    Script Date: 1/9/2020 10:31:58 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
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



