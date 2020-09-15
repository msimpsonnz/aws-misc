import sys
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.dynamicframe import DynamicFrame
from awsglue.job import Job
from pyspark.ml.feature import StringIndexer

glueContext = GlueContext(SparkContext.getOrCreate())
spark = glueContext.spark_session
args = getResolvedOptions(sys.argv, ['s3_bucket'])
s3_bucket = args['s3_bucket']
print(s3_bucket)

input_dir = f's3://{s3_bucket}/2020/'
print(input_dir)
output_dir = f's3://{s3_bucket}/output-dir'
print(output_dir)

df = glueContext.create_dynamic_frame_from_options('s3', {'paths':[input_dir], 'recurse':True, 'groupFiles': 'inPartition', 'groupSize': '1048576'}, format="json")
df.printSchema()
df1 = df.toDF()
indexer = StringIndexer(inputCol="GENDER", outputCol="GENDER_INDEX")
indexed = indexer.fit(df1).transform(df1)
indexed.show()
df = df.apply_mapping([
    ('FIRST', 'string', 'FIRST', 'string'),
    ('LAST', 'string', 'LAST', 'string'),
    ('AGE', 'integer', 'AGE', 'integer'),
    ('GENDER_INDEX', 'integer', 'GENDER', 'integer'),
    ('LATITUDE', 'string', 'LATITUDE', 'string'),
    ('LONGITUDE', 'string', 'LONGITUDE', 'string'),
])
glueContext.write_dynamic_frame.from_options(frame = df, connection_type = "s3", connection_options = {"path": output_dir}, format = "csv")