aws kinesis put-records \
    --stream-name streamInput \
    --records Data=blob1,PartitionKey=partitionkey1 Data=blob2,PartitionKey=partitionkey2


    aws kinesis put-record \
    --stream-name streamInput \
    --data sampledatarecord \
    --partition-key samplepartitionkey