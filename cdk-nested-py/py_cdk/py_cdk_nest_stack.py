from aws_cdk import core
import aws_cdk.aws_iam as iam
import aws_cdk.aws_ec2 as ec2


class PyCdkNestStack(core.NestedStack):

    def __init__(self, scope: core.Construct, id: str, vpc: ec2.Vpc, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        eks_security_group = ec2.SecurityGroup(
            self, "EKSSecurityGroup",
            vpc=vpc,
            allow_all_outbound=True
        )
