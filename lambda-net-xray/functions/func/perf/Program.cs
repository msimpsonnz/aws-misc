using System;
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;
using BenchmarkDotNet.Engines;
using BenchmarkDotNet.Jobs;
using Amazon.Lambda.Core;
using Amazon.Lambda.TestUtilities;
using func;

namespace perf
{
    [SimpleJob(RunStrategy.ColdStart, targetCount: 5)]
    public class LambdaPerf
    {
        private ILambdaContext context;
        private Function function;

        public LambdaPerf()
        {
            function = new Function();
            context = new TestLambdaContext();
        }

        [Benchmark]
        public string lambdaRes() => function.FunctionHandler("hello world", context);

        [Benchmark]
        public string lambdaResDelay() => function.FunctionHandler("hello world", context, true);
    }

    class Program
    {
        static void Main(string[] args)
        {
            var summary = BenchmarkRunner.Run<LambdaPerf>();
        }
    }
}
