#!/usr/bin/env python3

from aws_cdk import core

from py_cdk.py_cdk_stack import PyCdkStack
from py_cdk.py_cdk_nest_stack import PyCdkNestStack


app = core.App()
mainStack = PyCdkStack(app, "py-cdk")
PyCdkNestStack(mainStack, "py-cdk-nest", mainStack.eks_vpc)

app.synth()
