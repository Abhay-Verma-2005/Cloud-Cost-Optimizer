const { EC2Client, StopInstancesCommand, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
exports.handler = async (event) => {
    console.log('🛑 Auto-shutdown Lambda triggered:', JSON.stringify(event, null, 2));
    const { instanceId, reason, region, cpuUsage, limit } = event;
    if (!instanceId || !region) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing instanceId or region' })
        };
    }
    try {
        const ec2Client = new EC2Client({ region });
        const describeCommand = new DescribeInstancesCommand({
            InstanceIds: [instanceId]
        });
        const describeResponse = await ec2Client.send(describeCommand);
        const instance = describeResponse.Reservations?.[0]?.Instances?.[0];
        if (!instance) {
            throw new Error(`Instance ${instanceId} not found`);
        }
        const currentState = instance.State.Name;
        console.log(`Instance ${instanceId} current state: ${currentState}`);
        if (currentState === 'stopped' || currentState === 'stopping') {
            console.log(`Instance ${instanceId} already ${currentState}`);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: `Instance ${instanceId} is already ${currentState}`,
                    instanceId,
                    previousState: currentState,
                    action: 'none'
                })
            };
        }
        const stopCommand = new StopInstancesCommand({
            InstanceIds: [instanceId]
        });
        const stopResponse = await ec2Client.send(stopCommand);
        const stoppingInstance = stopResponse.StoppingInstances?.[0];
        console.log(`✅ Instance ${instanceId} shutdown initiated`);
        console.log(`Previous state: ${stoppingInstance.PreviousState.Name}`);
        console.log(`Current state: ${stoppingInstance.CurrentState.Name}`);
        console.log(`Reason: ${reason}`);
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Instance ${instanceId} automatically stopped`,
                instanceId,
                previousState: stoppingInstance.PreviousState.Name,
                currentState: stoppingInstance.CurrentState.Name,
                reason,
                cpuUsage,
                limit,
                timestamp: new Date().toISOString()
            })
        };
    } catch (error) {
        console.error('❌ Error stopping instance:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message,
                instanceId
            })
        };
    }
};
