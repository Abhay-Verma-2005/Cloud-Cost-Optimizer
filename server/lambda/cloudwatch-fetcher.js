
const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const https = require('https');
const cloudwatchClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });

async function getInstanceMetrics(instanceId) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (24 * 60 * 60 * 1000)); // Last 24 hours

    const command = new GetMetricStatisticsCommand({
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
        Period: 3600, // 1 hour intervals
        Statistics: ['Average', 'Maximum']
    });

    try {
        const response = await cloudwatchClient.send(command);
        
        if (response.Datapoints && response.Datapoints.length > 0) {
            const avgCpu = response.Datapoints.reduce((sum, dp) => sum + dp.Average, 0) / response.Datapoints.length;
            const maxCpu = Math.max(...response.Datapoints.map(dp => dp.Maximum));
            
            return {
                instanceId,
                avgCpu: avgCpu.toFixed(2),
                maxCpu: maxCpu.toFixed(2),
                datapoints: response.Datapoints.length,
                underutilized: avgCpu < 10
            };
        }
        
        return { instanceId, avgCpu: 0, maxCpu: 0, datapoints: 0, underutilized: false };
    } catch (error) {
        console.error(`Error fetching metrics for ${instanceId}:`, error);
        return { instanceId, error: error.message };
    }
}


async function getRunningInstances() {
    const command = new DescribeInstancesCommand({
        Filters: [
            {
                Name: 'instance-state-name',
                Values: ['running']
            }
        ]
    });

    try {
        const response = await ec2Client.send(command);
        const instances = [];

        for (const reservation of response.Reservations || []) {
            for (const instance of reservation.Instances || []) {
                instances.push({
                    id: instance.InstanceId,
                    type: instance.InstanceType,
                    launchTime: instance.LaunchTime,
                    state: instance.State.Name,
                    tags: instance.Tags || []
                });
            }
        }

        return instances;
    } catch (error) {
        console.error('Error fetching EC2 instances:', error);
        throw error;
    }
}

function sendToBackend(data) {
    return new Promise((resolve, reject) => {
        const apiEndpoint = process.env.API_ENDPOINT;
        const apiKey = process.env.API_KEY;

        if (!apiEndpoint) {
            console.log('No API_ENDPOINT configured, skipping backend push');
            resolve({ skipped: true });
            return;
        }

        const url = new URL(apiEndpoint);
        const postData = JSON.stringify(data);

        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': `Bearer ${apiKey}`
            }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, status: res.statusCode, body: responseBody });
                } else {
                    reject(new Error(`API returned ${res.statusCode}: ${responseBody}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

exports.handler = async function(event, context) {
    console.log('CloudWatch Metrics Fetcher Lambda started');
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        console.log('Fetching running EC2 instances...');
        const instances = await getRunningInstances();
        console.log(`Found ${instances.length} running instances`);

        if (instances.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'No running instances found',
                    timestamp: new Date().toISOString()
                })
            };
        }

        const metricsPromises = instances.slice(0, 10).map(instance => 
            getInstanceMetrics(instance.id)
        );
        
        const metrics = await Promise.all(metricsPromises);
        
        const underutilizedInstances = metrics.filter(m => m.underutilized && !m.error);
        const totalInstanceCount = instances.length;
        const analyzedCount = metrics.length;

        const summary = {
            timestamp: new Date().toISOString(),
            totalInstances: totalInstanceCount,
            analyzedInstances: analyzedCount,
            underutilizedCount: underutilizedInstances.length,
            underutilizedInstances: underutilizedInstances.map(m => ({
                instanceId: m.instanceId,
                avgCpu: `${m.avgCpu}%`,
                maxCpu: `${m.maxCpu}%`
            })),
            allMetrics: metrics
        };

        console.log('Analysis Summary:', JSON.stringify(summary, null, 2));

        let backendResult = null;
        try {
            backendResult = await sendToBackend(summary);
            console.log('Backend push result:', backendResult);
        } catch (error) {
            console.error('Failed to send to backend:', error.message);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Metrics fetched successfully',
                summary,
                backendPushed: backendResult?.success || false
            })
        };

    } catch (error) {
        console.error('Lambda execution error:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};

if (require.main === module) {
    exports.handler({}, {})
        .then(result => {
            console.log('Result:', JSON.stringify(result, null, 2));
        })
        .catch(error => {
            console.error('Error:', error);
        });
}




/**
 * AWS Lambda Function: CloudWatch Metrics Fetcher
 * 
 * This Lambda function fetches CloudWatch metrics for cost optimization analysis.
 * It can be triggered by CloudWatch Events (EventBridge) on a schedule.
 * 
 * Setup Instructions:
 * 1. Create Lambda function with Node.js 18.x runtime
 * 2. Attach IAM role with permissions: cloudwatch:GetMetricStatistics, ec2:DescribeInstances
 * 3. Set up EventBridge rule to trigger every hour
 * 4. Configure environment variables: API_ENDPOINT, API_KEY
 * 
 * Required Environment Variables:
 * - API_ENDPOINT: Your backend API URL
 * - API_KEY: Authentication key for your backend
 */
