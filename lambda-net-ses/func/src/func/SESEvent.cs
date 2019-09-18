using System;
using System.Collections.Generic;

namespace func
{

    public class SESEvent
    {
        public List<SESRecord> Records { get; set; }
    }

    public class Header
    {
        public string name { get; set; }
        public string value { get; set; }
    }

    public class CommonHeaders
    {
        public string returnPath { get; set; }
        public List<string> from { get; set; }
        public string date { get; set; }
        public List<string> to { get; set; }
        public string messageId { get; set; }
        public string subject { get; set; }
    }

    public class Mail
    {
        public DateTime timestamp { get; set; }
        public string source { get; set; }
        public string messageId { get; set; }
        public List<string> destination { get; set; }
        public bool headersTruncated { get; set; }
        public List<Header> headers { get; set; }
        public CommonHeaders commonHeaders { get; set; }
    }

    public class SpamVerdict
    {
        public string status { get; set; }
    }

    public class VirusVerdict
    {
        public string status { get; set; }
    }

    public class SpfVerdict
    {
        public string status { get; set; }
    }

    public class DkimVerdict
    {
        public string status { get; set; }
    }

    public class DmarcVerdict
    {
        public string status { get; set; }
    }

    public class Action
    {
        public string type { get; set; }
        public string functionArn { get; set; }
        public string invocationType { get; set; }
    }

    public class Receipt
    {
        public DateTime timestamp { get; set; }
        public int processingTimeMillis { get; set; }
        public List<string> recipients { get; set; }
        public SpamVerdict spamVerdict { get; set; }
        public VirusVerdict virusVerdict { get; set; }
        public SpfVerdict spfVerdict { get; set; }
        public DkimVerdict dkimVerdict { get; set; }
        public DmarcVerdict dmarcVerdict { get; set; }
        public Action action { get; set; }
    }

    public class SES
    {
        public Mail mail { get; set; }
        public Receipt receipt { get; set; }
    }

    public class SESRecord
    {
        public string eventSource { get; set; }
        public string eventVersion { get; set; }
        public SES ses { get; set; }
    }


}