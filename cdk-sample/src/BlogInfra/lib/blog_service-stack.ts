import cdk = require('@aws-cdk/cdk');
import widget_service = require('../lib/blog_service');


export class BlogServiceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new widget_service.WidgetService(this, 'Widgets');
  }
}
