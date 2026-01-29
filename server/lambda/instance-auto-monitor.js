const {
    EC2Client,
    StopInstancesCommand,
    DescribeInstancesCommand
} = require('@aws-sdk/client-ec2');

const {
    CloudWatchClient,
    GetMetricStatisticsCommand
} = require('@aws-sdk/client-cloudwatch');

/**
 * Lambda function to monitor EC2 instances and auto-stop them when CPU exceeds limits
 * This function is triggered by CloudWatch Events (EventBridge) every 5 minutes
 */
exports.handler = async (event) => {
    console.log('🔍 Auto-shutdown Lambda triggered:', JSON.stringify(event, null, 2));

    // Get configuration from event or environment variables
    const region = event.region || process.env.AWS_REGION || 'us-east-1';
    const instanceLimits = event.instanceLimits || []; // Array of {instanceId, cpuLimit}

    if (!instanceLimits || instanceLimits.length === 0) {
        console.log('⚠️ No instance limits configured');
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'No instances to monitor',
                monitored: 0
            })
        };
    }

    const ec2Client = new EC2Client({ region });
    const cloudWatchClient = new CloudWatchClient({ region });

    const results = [];

    // Process each instance with configured limits
    for (const config of instanceLimits) {
        const { instanceId, cpuLimit, autoShutdown = true } = config;

        try {
            console.log(`\n📊 Checking instance ${instanceId} (CPU limit: ${cpuLimit}%)`);

            // 1. Check if instance is running
            const describeCommand = new DescribeInstancesCommand({
                InstanceIds: [instanceId]
            });

            const describeResponse = await ec2Client.send(describeCommand);
            const instance = describeResponse.Reservations?.[0]?.Instances?.[0];

            if (!instance) {
                console.log(`❌ Instance ${instanceId} not found`);
                results.push({
                    instanceId,
                    status: 'not_found',
                    error: 'Instance not found'
                });
                continue;
            }

            const currentState = instance.State.Name;
            console.log(`   State: ${currentState}`);

            // Skip if not running
            if (currentState !== 'running') {
                console.log(`   ⏭️ Skipping - instance is ${currentState}`);
                results.push({
                    instanceId,
                    status: 'skipped',
                    reason: `Instance is ${currentState}`
                });
                continue;
            }

            // 2. Get CPU metrics from CloudWatch (last 10 minutes average)
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - 10 * 60 * 1000); // 10 minutes ago

            const metricsCommand = new GetMetricStatisticsCommand({
                Namespace: 'AWS/EC2',
                MetricName: 'CPUUtilization',
                Dimensions: [
                    {
                        Name: 'InstanceId',
                        Value: instanceId
                    }
                ],
                StartTime: startTime,
                EndTime: endTime,
                Period: 300, // 5 minutes
                Statistics: ['Average']
            });

            const metricsResponse = await cloudWatchClient.send(metricsCommand);
            const datapoints = metricsResponse.Datapoints || [];

            if (datapoints.length === 0) {
                console.log(`   ⚠️ No CPU metrics available yet`);
                results.push({
                    instanceId,
                    status: 'no_metrics',
                    reason: 'No CloudWatch metrics available'
                });
                continue;
            }

            // Get the most recent CPU usage
            const sortedDatapoints = datapoints.sort((a, b) => b.Timestamp - a.Timestamp);
            const currentCPU = sortedDatapoints[0].Average;

            console.log(`   💻 Current CPU: ${currentCPU.toFixed(2)}%`);

            // 3. Check if CPU exceeds limit
            if (currentCPU > cpuLimit) {
                console.log(`   🚨 CPU EXCEEDED LIMIT! ${currentCPU.toFixed(2)}% > ${cpuLimit}%`);

                if (autoShutdown) {
                    // Stop the instance
                    const stopCommand = new StopInstancesCommand({
                        InstanceIds: [instanceId]
                    });

                    const stopResponse = await ec2Client.send(stopCommand);
                    const stoppingInstance = stopResponse.StoppingInstances?.[0];

                    console.log(`   ✅ Instance ${instanceId} stopped automatically`);
                    console.log(`   Previous state: ${stoppingInstance.PreviousState.Name}`);
                    console.log(`   Current state: ${stoppingInstance.CurrentState.Name}`);

                    results.push({
                        instanceId,
                        status: 'stopped',
                        action: 'auto_shutdown',
                        cpuUsage: currentCPU,
                        cpuLimit: cpuLimit,
                        previousState: stoppingInstance.PreviousState.Name,
                        currentState: stoppingInstance.CurrentState.Name,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    console.log(`   ⚠️ Auto-shutdown disabled - only alerting`);
                    results.push({
                        instanceId,
                        status: 'alert',
                        action: 'alert_only',
                        cpuUsage: currentCPU,
                        cpuLimit: cpuLimit,
                        message: 'CPU limit exceeded but auto-shutdown is disabled'
                    });
                }
            } else {
                console.log(`   ✅ CPU within limits (${currentCPU.toFixed(2)}% <= ${cpuLimit}%)`);
                results.push({
                    instanceId,
                    status: 'ok',
                    cpuUsage: currentCPU,
                    cpuLimit: cpuLimit
                });
            }

        } catch (error) {
            console.error(`   ❌ Error processing instance ${instanceId}:`, error.message);
            results.push({
                instanceId,
                status: 'error',
                error: error.message
            });
        }
    }

    // Summary
    const summary = {
        totalMonitored: instanceLimits.length,
        stopped: results.filter(r => r.status === 'stopped').length,
        alerts: results.filter(r => r.status === 'alert').length,
        ok: results.filter(r => r.status === 'ok').length,
        errors: results.filter(r => r.status === 'error').length
    };

    console.log('\n📈 Summary:', JSON.stringify(summary, null, 2));

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            summary,
            results,
            timestamp: new Date().toISOString()
        })
    };
};
