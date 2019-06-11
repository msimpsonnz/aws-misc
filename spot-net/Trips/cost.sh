#!/usr/bin/env bash

aws ce get-cost-and-usage \
    --time-period Start=2019-06-11,End=2019-06-11 \
    --granularity HOURLY \
    --metrics "BlendedCost" "UnblendedCost" "UsageQuantity" \
    --filter file://filters.json