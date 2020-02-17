import { metricScope, Unit } from "aws-embedded-metrics";

export const handler = async (event): Promise<any> => {
  if (event.log === "true") {
    await myFunc();
  } else {
    console.log("testing CWL with Lambda VPC");
  }
  return {
    statusCode: 200,
    body: "hello"
  };
};

const myFunc = metricScope(metrics => async () => {
  metrics.putDimensions({ Service: "Aggregator" });
  metrics.putMetric("ProcessingLatency", 100, Unit.Milliseconds);
  metrics.setProperty("RequestId", "422b1569-16f6-4a03-b8f0-fe3fd9b100f8");
  await metrics.flush();
});
