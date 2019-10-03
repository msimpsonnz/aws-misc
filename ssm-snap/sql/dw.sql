SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[ticket_purchase_hist](
	[sporting_event_ticket_id] [bigint] NOT NULL,
	[purchased_by_id] [int] NOT NULL,
	[transaction_date_time] [datetime] NOT NULL,
	[transferred_from_id] [int] NULL,
	[purchase_price] [smallmoney] NOT NULL)
GO

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
    ON (FILENAME = 'D:\MSSQL\Data\dms_sample.mdf'),   
    (FILENAME = 'D:\MSSQL\Data\dms_sample_Log.ldf')   
    FOR ATTACH;

DECLARE @lastmodifieddate DATETIME=null    
SET @lastmodifieddate = (SELECT MAX([dw].[dbo].[ticket_purchase_hist].transaction_date_time) FROM [dw].[dbo].[ticket_purchase_hist])

INSERT INTO [dw].[dbo].[ticket_purchase_hist]
SELECT [sporting_event_ticket_id]
      ,[purchased_by_id]
      ,[transaction_date_time]
      ,[transferred_from_id]
      ,[purchase_price]
FROM [SnapDMS].[dbo].[ticket_purchase_hist]
WHERE [transaction_date_time] > @lastmodifieddate

ALTER DATABASE [SnapDMS] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE [SnapDMS];

END
