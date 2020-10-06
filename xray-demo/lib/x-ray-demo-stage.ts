import { Construct, Stage, StageProps } from '@aws-cdk/core';
import { XrayDemoStack } from './xray-demo-stack';

export class XrayDemoStage extends Stage {  
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new XrayDemoStack(this, 'XrayDemoStack');
    
  }
}