import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BlockPublicAccess, Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { Distribution, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import path = require('path');
import { AnyPrincipal, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class StaticSiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'Bucket', {
      accessControl: BucketAccessControl.PRIVATE,
      autoDeleteObjects: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: '404.html',
    });

    bucket.addToResourcePolicy(new PolicyStatement({
      effect: Effect.DENY,
      actions: ['s3:*'],
      resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
      principals: [new AnyPrincipal()],
      conditions: {
        Bool: {
          'aws:SecureTransport': 'false'
        }
      }
    }));

    bucket.addLifecycleRule({
      expiration: cdk.Duration.days(30),
    })

    const distribution = new Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        compress: true,
        origin: S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: '/404.html'
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html'
        },
        {
          httpStatus: 500,
          responseHttpStatus: 500,
          responsePagePath: '/500.html'
        }
      ]
    });

    new BucketDeployment(this, 'BucketDeployment', {
      destinationBucket: bucket,
      distribution: distribution,
      distributionPaths: ['/*'],
      sources: [Source.asset(path.join(__dirname, '../../web/dist'))],
    });

    new cdk.CfnOutput(this, 'CfnOutCloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: "The CloudFront URL",
    })
  }
}
